// 載入 .env 檔案中的環境變數，例如 API 金鑰與資料庫設定
require('dotenv').config();

// 引入 PostgreSQL 客戶端模組
const { Pool } = require('pg');

// 引入 Gemini API 模組
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 讀取 CLI 參數，確認是否為強制重跑模式（加入 --force）
const forceMode = process.argv.includes('--force');

// 建立 PostgreSQL 資料庫連線池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 初始化 Gemini 模型（使用 gemini-1.5-pro）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

/**
 * 從 Gemini 回傳的 Markdown 擷取摘要內容
 * @param {string} markdown - 生成的 Markdown 內容
 * @returns {Object} 含 mainIdea, keyPoints, conclusion 的摘要物件
 */
function extractSections(markdown) {
  const mainIdeaMatch = markdown.match(/## 核心觀點\s+([\s\S]*?)## 詳細內容/);
  const detailsMatch = markdown.match(/## 詳細內容\s+([\s\S]*?)## 重要結論/);
  const conclusionMatch = markdown.match(/## 重要結論\s+([\s\S]*)/);

  return {
    mainIdea: mainIdeaMatch ? mainIdeaMatch[1].trim() : '',
    keyPoints: detailsMatch ? [{ content: detailsMatch[1].trim() }] : [],
    conclusion: conclusionMatch ? conclusionMatch[1].trim() : ''
  };
}

/**
 * 呼叫 Gemini API，傳入逐字稿與會議標題，生成 Markdown 摘要
 * @param {string} transcript - 逐字稿內容
 * @param {string} title - 會議標題
 * @param {string} url - 影片連結（可選）
 * @returns {string|null} Markdown 格式的摘要
 */
async function generateSummary(transcript, title, url = '') {
  const prompt = `
請遵循以下步驟處理提供的會議逐字稿：

1. 校正簡體為繁體、錯字修正，忠於原意（不輸出）。
2. 基於內容撰寫下列結構的 markdown 總結：

# ${title}
[會議影片連結](${url})
${title}

## 核心觀點
...

## 詳細內容
...

## 重要結論
...

請輸出繁體中文 markdown 純文字，不加程式區塊。
逐字稿：
${transcript.substring(0, 15000)}
  `;

  try {
    const result = await model.generateContent(prompt); // 呼叫 Gemini API
    return result.response.text(); // 取得回傳純文字
  } catch (err) {
    console.error(`❌ Gemini 生成錯誤: ${err.message}`);
    return null;
  }
}

/**
 * 主邏輯：從 DB 取得會議，呼叫 Gemini 生成摘要，寫回 DB
 */
async function processAllConferences() {
  const client = await pool.connect(); // 建立資料庫連線

  try {
    // 根據 force 模式切換 SQL 查詢語法
    const query = forceMode
      ? `SELECT id, title, transcript, video_url FROM conferences WHERE LENGTH(transcript) > 50`
      : `SELECT c.id, c.title, c.transcript, c.video_url
         FROM conferences c
         LEFT JOIN conference_summary cs ON c.id = cs.conference_id
         WHERE cs.id IS NULL AND LENGTH(c.transcript) > 50`;

    const result = await client.query(query); // 執行 SQL 查詢
    const conferences = result.rows;

    console.log(`🔍 需要處理的研討會數量: ${conferences.length}`);
    if (conferences.length === 0) {
      console.log('✅ 無需處理，資料已完整或無逐字稿。');
      return;
    }

    // 處理每一場會議
    for (const conf of conferences) {
      console.log(`📝 產生摘要: ${conf.title}`);

      const markdown = await generateSummary(conf.transcript, conf.title, conf.video_url || '');
      if (!markdown) {
        console.log(`❌ 無法產生摘要: ${conf.title}`);
        continue;
      }

      console.log("🔍 Gemini 回傳摘要 markdown：\n", markdown);

      // 擷取摘要段落
      const { mainIdea, keyPoints, conclusion } = extractSections(markdown);

      // 若擷取不到任何摘要，跳過該筆
      if (!mainIdea && keyPoints.length === 0 && !conclusion) {
        console.log(`⚠️ 空內容，跳過 "${conf.title}"`);
        continue;
      }

      // 若為強制模式，先刪除原有摘要
      if (forceMode) {
        await client.query(`DELETE FROM conference_summary WHERE conference_id = $1`, [conf.id]);
      }

      // 寫入新摘要
      await client.query(`
        INSERT INTO conference_summary (conference_id, main_idea, key_points, conclusion, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        conf.id,
        mainIdea,
        JSON.stringify(keyPoints),
        conclusion
      ]);

      console.log(`✅ 已儲存 "${conf.title}" 摘要`);
    }

  } catch (err) {
    console.error('❌ 發生錯誤:', err.message);
  } finally {
    client.release(); // 關閉 DB 連線
    await pool.end(); // 關閉連線池
  }
}

// 啟動執行
processAllConferences();
