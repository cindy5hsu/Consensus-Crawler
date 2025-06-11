/**
 * 創建 conference_summary 表
 * 此腳本用於創建存儲研討會摘要的新表
 */

const { Pool } = require('pg');

// 創建數據庫連接池
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// 創建 conference_summary 表
async function createConferenceSummaryTable() {
  try {
    console.log('===== 創建 conference_summary 表 =====');
    
    // 檢查數據庫連接
    console.log('正在連接到PostgreSQL資料庫...');
    const client = await pool.connect();
    console.log('✓ 資料庫連接成功');
    
    // 創建 conference_summary 表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS conference_summary (
        id SERIAL PRIMARY KEY,
        conference_id VARCHAR(255) NOT NULL,
        main_idea TEXT NOT NULL,
        key_points JSONB NOT NULL,
        conclusion TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
      )
    `;
    
    await client.query(createTableQuery);
    console.log('✓ conference_summary 表創建成功');
    
    // 檢查表結構
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conference_summary'
    `;
    
    const result = await client.query(tableStructureQuery);
    console.log('conference_summary 表結構:');
    console.table(result.rows);
    
    client.release();
    console.log('===== 完成 =====');
  } catch (error) {
    console.error('創建 conference_summary 表失敗:', error);
  } finally {
    await pool.end();
  }
}

// 執行創建表操作
createConferenceSummaryTable();