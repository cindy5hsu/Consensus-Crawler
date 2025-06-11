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
  
  // 查詢所有表
  pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", (err, res) => {
    if (err) {
      console.error('查詢表錯誤:', err);
      pool.end();
      return;
    }
    console.log('數據庫表列表:');
    console.log(res.rows);
    
    // 檢查 conferences 表是否存在
    const tables = res.rows.map(row => row.table_name);
    if (tables.includes('conferences')) {
      // 查詢 conferences 表結構
      pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conferences'", (err, res) => {
        if (err) {
          console.error('查詢表結構錯誤:', err);
          pool.end();
          return;
        }
        console.log('conferences 表結構:');
        console.log(res.rows);
        pool.end();
      });
    } else {
      console.log('conferences 表不存在');
      pool.end();
    }
  });
});