const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL連接錯誤:', err);
  } else {
    console.log('PostgreSQL連接成功:', res.rows[0]);
  }
});

router.get('/conferences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conferences ORDER BY date DESC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('獲取研討會列表錯誤:', error);
    res.status(500).json({ success: false, message: '無法查詢資料' });
  }
});

module.exports = router;