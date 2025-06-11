const { Pool } = require('pg');

// 創建數據庫連接池
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// 檢查 date 列是否存在
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'conferences' AND column_name = 'date'", (err, res) => {
  if (err) {
    console.error('查詢錯誤:', err);
    pool.end();
    return;
  }
  
  if (res.rows.length > 0) {
    console.log('date 列已存在');
  } else {
    console.log('date 列不存在');
    // 如果 date 列不存在，再次嘗試添加
    pool.query("ALTER TABLE conferences ADD COLUMN date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP", (err, res) => {
      if (err) {
        console.error('添加 date 列錯誤:', err);
      } else {
        console.log('成功添加 date 列到 conferences 表');
      }
      pool.end();
    });
    return;
  }
  
  pool.end();
});