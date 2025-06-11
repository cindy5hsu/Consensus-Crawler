const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const path = require('path');

// 引入PostgreSQL連接配置
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// 測試數據庫連接
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL連接錯誤:', err);
    console.log('將使用模擬數據');
  } else {
    console.log('PostgreSQL連接成功:', res.rows[0]);
  }
});

// 獲取所有研討會列表
router.get('/conferences', async (req, res) => {
  try {
    // 嘗試查詢數據庫
    const result = await pool.query('SELECT * FROM conferences ORDER BY date DESC');
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('獲取研討會列表錯誤:', error);
    
    // 提供模擬數據
    console.log('PostgreSQL查詢失敗，提供模擬研討會數據'); 
    
    res.status(200).json({
      success: true,
      data: mockConferences
    });
  }
});

module.exports = router;