const { Pool } = require('pg');

// 創建數據庫連接池
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// 檢查數據庫連接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('數據庫連接錯誤:', err);
    pool.end();
    return;
  }
  console.log('數據庫連接成功:', res.rows[0]);
  
  // 添加 date 列到 conferences 表
  pool.query("ALTER TABLE conferences ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP", (err, res) => {
    if (err) {
      console.error('添加 date 列錯誤:', err);
      pool.end();
      return;
    }
    console.log('成功添加 date 列到 conferences 表');
    
    // 確認表結構
    pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conferences'", (err, res) => {
      if (err) {
        console.error('查詢表結構錯誤:', err);
        pool.end();
        return;
      }
      console.log('更新後的 conferences 表結構:');
      console.log(res.rows);
      pool.end();
    });
  });
});