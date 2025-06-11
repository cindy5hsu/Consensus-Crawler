/**
 * 資料上傳腳本 - 將現有研討會資料上傳到 PostgreSQL
 */

require('dotenv').config();
const dataLoader = require('./data_loader');
const textProcessor = require('./text_processor');
const speechSummaryGenerator = require('./speechSummaryGenerator');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const fs = require('fs');
const pool = require('./db/pgConfig');

// API 設定
const API_URL = 'http://localhost:3000/api/conference';

/**
 * 將研討會資料上傳到 PostgreSQL
 */
async function uploadConference(conference, content) {
  try {
    // 使用專業研討會摘要生成器處理逐字稿
    const processedData = speechSummaryGenerator.generateSummary(content, conference.id, {
      title: conference.title,
      speaker: conference.speaker
    });
    
    // 準備資料庫資料
    const conferenceData = {
      id: conference.id,
      title: conference.title,
      speaker: conference.speaker,
      category: conference.category,
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
    console.log(`成功上傳 ${conference.id} 到 PostgreSQL 資料庫`);
    return { success: true, id: conference.id };
  } catch (error) {
    console.error(`上傳 ${conference.id} 失敗:`, error.message);
    return { success: false, id: conference.id, error: error.message };
  }
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
 * 主函數 - 加載並上傳所有研討會資料
 */
const fs = require('fs');
const path = require('path');
const pool = require('./db/pgConfig');

// 在 main 函数中调用 updateVideoUrls
async function main() {
  try {
    console.log('開始上傳研討會資料到 PostgreSQL...');

    // 確保資料表存在
    await ensureTableExists();

    // 加載研討會列表
    const conferences = await dataLoader.loadConferenceList();
    console.log(`找到 ${conferences.length} 個研討會資料`);

    // 讀取並上傳每個研討會資料
    const results = [];
    for (const conf of conferences) {
      try {
        console.log(`處理 ${conf.id}: ${conf.title}`);

        // 讀取文本內容
        const content = await fs.readFile(path.join('consensus_txt', conf.fileName), 'utf8');

        // 上傳到資料庫
        const result = await uploadConference(conf, content);
        results.push(result);
      } catch (error) {
        console.error(`處理 ${conf.id} 時發生錯誤:`, error);
        results.push({ success: false, id: conf.id, error: error.message });
      }
    }

    // 更新 video_url
    await updateVideoUrls();

    // 顯示結果統計
    const successCount = results.filter(r => r.success).length;
    console.log(`\n上傳完成: ${successCount}/${conferences.length} 個研討會資料成功上傳`);

    if (successCount < conferences.length) {
      console.log('\n失敗的上傳:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.id}: ${r.error}`);
      });
    }

    // 關閉資料庫連接
    await pool.end();
  } catch (error) {
    console.error('上傳過程中發生錯誤:', error);
    await pool.end();
  }
}

main().catch(console.error);

async function updateVideoUrls() {
  const csvData = fs.readFileSync('c:\\Users\\許雅婷\\Desktop\\Consensus_5_12\\csv1.csv', 'utf8');
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  const titleIndex = headers.indexOf('Title');
  const linkIndex = headers.indexOf('Link');

  const client = await pool.connect();

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    const title = columns[titleIndex];
    const link = columns[linkIndex];

    if (title && link) {
      await client.query(
        "UPDATE conferences SET video_url = $1 WHERE title = $2",
        [link, title]
      );
    }
  }

  client.release();
}

updateVideoUrls().catch(console.error);