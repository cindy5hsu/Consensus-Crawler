const express = require('express');
const path = require('path');
const conferenceRoutes = require('./routes/conferenceRoutes');
const summaryRoutes = require('./routes/summaryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件設置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api', conferenceRoutes);
app.use('/api/summary', summaryRoutes);

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 啟動服務器並連接到PostgreSQL數據庫
app.listen(PORT, () => {
  console.log(`服務器運行於 http://localhost:${PORT}`);
  console.log('使用PostgreSQL數據庫連接');
});

// 處理未捕獲的異常
process.on('unhandledRejection', (err) => {
  console.error('未處理的 Promise 拒絕:', err);
});