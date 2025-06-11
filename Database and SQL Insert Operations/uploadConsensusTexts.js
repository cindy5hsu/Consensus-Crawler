/**
 * 將consensus_txt目錄中的所有文本文件內容插入到PostgreSQL資料庫
 * 並確保與csv1.csv中的資料對應
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const pool = require('./db/pgConfig');
const textProcessor = require('./text_processor');
const speechSummaryGenerator = require('./speechSummaryGenerator');
const csv = require('csv-parser');
const fsSync = require('fs');

// 文本文件目錄與CSV文件路徑
const TEXT_DIR = path.join(__dirname, 'consensus_txt');
const CSV_FILE = path.join(__dirname, 'csv1.csv');

/**
 * 從CSV文件讀取資料
 */
async function readCsvData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fsSync.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * 確保資料表存在
 */
async function ensureTableExists() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS conferences (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        speaker TEXT NOT NULL,
        category TEXT NOT NULL,
        transcript TEXT NOT NULL,
        main_idea TEXT NOT NULL,
        points TEXT NOT NULL,
        reading_time INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP
      )
    `;
    
    await pool.query(query);
    console.log('確認資料表已存在或已創建');
  } catch (error) {
    console.error('創建資料表失敗:', error);
    throw error;
  }
}

/**
 * 從文件名生成會議ID
 */
function generateConferenceId(filename) {
  // 移除副檔名並將空格替換為下劃線
  return path.basename(filename, '.txt')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

/**
 * 從文件名生成會議標題
 */
function generateTitle(filename) {
  // 移除副檔名並返回標題
  return path.basename(filename, '.txt');
}

/**
 * 將研討會資料上傳到 PostgreSQL
 */
async function uploadConference(filename, content) {
  try {
    const id = generateConferenceId(filename);
    const title = generateTitle(filename);
    
    // 使用專業研討會摘要生成器處理逐字稿
    const processedData = speechSummaryGenerator.generateSummary(content, id, {
      title: title,
      speaker: '研討會講者' // 預設值，可以後續更新
    });
    
    // 準備資料庫資料
    const conferenceData = {
      id: id,
      title: title,
      speaker: '研討會講者', // 預設值，可以後續更新
      category: '未分類',  // 預設值，可以後續更新
      transcript: content,
      main_idea: processedData.mainIdea,
      points: JSON.stringify(processedData.points),
      reading_time: processedData.readingTime,
      created_at: new Date()
    };
    
    // 直接插入到 PostgreSQL 資料庫
    const query = `
      INSERT INTO conferences 
      (id, title, speaker, category, transcript, main_idea, points, reading_time, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
      title = $2, speaker = $3, category = $4, transcript = $5, 
      main_idea = $6, points = $7, reading_time = $8
      RETURNING id
    `;
    
    const values = [
      conferenceData.id,
      conferenceData.title,
      conferenceData.speaker,
      conferenceData.category,
      conferenceData.transcript,
      conferenceData.main_idea,
      conferenceData.points,
      conferenceData.reading_time,
      conferenceData.created_at
    ];
    
    const result = await pool.query(query, values);
    console.log(`成功上傳 ${filename} 到 PostgreSQL 資料庫`);
    return { success: true, id: id, filename: filename };
  } catch (error) {
    console.error(`上傳 ${filename} 失敗:`, error.message);
    return { success: false, id: generateConferenceId(filename), filename: filename, error: error.message };
  }
}

/**
 * 確保CSV資料已匯入資料庫
 */
async function ensureCsvDataImported(csvData) {
  try {
    console.log('\n正在確保CSV資料已匯入資料庫...');
    let importedCount = 0;

    for (const row of csvData) {
      const title = row.Title;
      const category = row.Tags || '無標籤';
      const url = row.Link || '';

      // 檢查是否存在相同標題的記錄
      const checkResult = await pool.query(
        'SELECT id FROM conferences WHERE title = $1',
        [title]
      );

      if (checkResult.rows.length === 0) {
        // 生成ID
        const id = title
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .toLowerCase();

        // 插入新記錄
        await pool.query(
          'INSERT INTO conferences (id, title, category, video_url, speaker, main_idea, points, reading_time, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [id, title, category, url, '待定', '待定', '[]', 5, new Date()]
        );
        importedCount++;
      }
    }

    console.log(`✓ 已匯入 ${importedCount} 筆新的CSV資料`);
  } catch (error) {
    console.error('匯入CSV資料錯誤:', error);
  }
}

/**
 * 主函數 - 讀取並上傳所有文本文件
 */
async function main() {
  try {
    console.log('開始上傳consensus_txt目錄中的所有文本文件到PostgreSQL...');
    
    // 確保資料表存在
    await ensureTableExists();
    
    // 讀取CSV資料
    console.log('\n正在讀取CSV資料...');
    const csvData = await readCsvData();
    console.log(`✓ 已讀取 ${csvData.length} 筆CSV資料`);
    
    // 確保CSV資料已匯入資料庫
    await ensureCsvDataImported(csvData);
    
    // 讀取目錄中的所有文件
    const files = await fs.readdir(TEXT_DIR);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    console.log(`找到 ${textFiles.length} 個文本文件`);
    
    // 讀取並上傳每個文件
    const results = [];
    for (const file of textFiles) {
      try {
        console.log(`處理文件: ${file}`);
        
        // 讀取文本內容
        const content = await fs.readFile(path.join(TEXT_DIR, file), 'utf8');
        
        // 獲取不帶副檔名的文件名作為標題
        const title = path.basename(file, '.txt');
        
        // 檢查資料庫中是否已有此標題的記錄
        const checkResult = await pool.query(
          'SELECT id FROM conferences WHERE title = $1',
          [title]
        );
        
        if (checkResult.rows.length > 0) {
          // 如果找到記錄，則更新transcript欄位
          await pool.query(
            'UPDATE conferences SET transcript = $1 WHERE title = $2',
            [content, title]
          );
          console.log(`✓ 已更新記錄: ${title}`);
          results.push({ success: true, id: checkResult.rows[0].id, filename: file });
        } else {
          // 如果沒有找到記錄，則使用原有方法上傳
          const result = await uploadConference(file, content);
          results.push(result);
        }
      } catch (error) {
        console.error(`處理 ${file} 時發生錯誤:`, error);
        results.push({ success: false, filename: file, error: error.message });
      }
    }
    
    // 顯示結果統計
    const successCount = results.filter(r => r.success).length;
    console.log(`\n上傳完成: ${successCount}/${textFiles.length} 個文件成功上傳`);
    
    if (successCount < textFiles.length) {
      console.log('\n失敗的上傳:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.filename}: ${r.error}`);
      });
    }
    
    // 關閉資料庫連接
    await pool.end();
  } catch (error) {
    console.error('上傳過程中發生錯誤:', error);
    await pool.end();
  }
}

// 執行主函數
main().catch(console.error);