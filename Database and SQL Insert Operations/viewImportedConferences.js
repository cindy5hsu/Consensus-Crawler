/**
 * 查看已匯入的研討會資料
 * 此腳本用於檢視剛匯入到conferences資料表的研討會資料
 */

require('dotenv').config();
const pool = require('./db/pgConfig');

async function viewImportedConferences() {
  try {
    console.log('===== 查看已匯入的研討會資料 =====');
    
    // 檢查資料庫連接
    console.log('正在連接到PostgreSQL資料庫...');
    const client = await pool.connect();
    console.log('✓ 資料庫連接成功');
    
    // 查詢最近匯入的研討會資料
    console.log('\n最近匯入的研討會資料:');
    const result = await client.query(`
      SELECT id, title, category, transcript, created_at 
      FROM conferences 
      ORDER BY created_at DESC 
      LIMIT 20;
    `);
    
    if (result.rows.length === 0) {
      console.log('沒有找到任何研討會資料');
    } else {
      console.log(`找到 ${result.rows.length} 筆研討會資料:`);
      console.log('-----------------------------------');
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`標題: ${row.title}`);
        console.log(`分類: ${row.category}`);
        console.log(`URL: ${row.transcript}`);
        console.log(`建立時間: ${row.created_at}`);
        console.log('-----------------------------------');
      });
    }
    
    // 檢查資料表中的資料數量
    const countResult = await client.query('SELECT COUNT(*) FROM conferences;');
    console.log(`\n資料表中共有 ${countResult.rows[0].count} 筆資料`);
    
    client.release();
    await pool.end();
    console.log('\n===== 查詢完成 =====');
  } catch (error) {
    console.error('查詢過程中發生錯誤:', error);
    await pool.end();
  }
}

// 執行查詢
viewImportedConferences().catch(console.error);