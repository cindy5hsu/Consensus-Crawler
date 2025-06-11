/**
 * Gemini API 測試腳本 - 輸出到文件
 * 此腳本用於測試 Gemini API 的連接和基本功能，並將結果寫入文件
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// 輸出日誌到文件的函數
function logToFile(message) {
  const logFile = path.join(__dirname, 'gemini-test-log.txt');
  fs.appendFileSync(logFile, message + '\n', 'utf8');
}

// 初始化 Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 測試函數
async function testGeminiAPI() {
  try {
    logToFile('===== 開始測試 Gemini API =====');
    logToFile('API 密鑰: ' + (GEMINI_API_KEY ? '已設置' : '未設置'));
    
    if (!GEMINI_API_KEY) {
      logToFile('錯誤: 未設置 GEMINI_API_KEY 環境變量。請在 .env 文件中設置。');
      return;
    }
    
    // 初始化 Gemini API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // 初始化 Gemini 模型
    logToFile('初始化 Gemini 模型...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // 構建簡單的 prompt
    const prompt = `
    請生成一個關於區塊鏈技術的簡短摘要，包含以下部分：
    1. 主要觀點（100字以內）
    2. 3個關鍵點（每點50字以內）
    3. 結論（100字以內）
    `;
    
    logToFile('發送請求到 Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    logToFile('\n===== Gemini API 響應 =====');
    logToFile(text);
    logToFile('\n===== 測試完成 =====');
    logToFile('Gemini API 連接成功！');
  } catch (error) {
    logToFile('測試 Gemini API 失敗: ' + error.message);
    logToFile('請檢查您的 API 密鑰是否正確，以及網絡連接是否正常。');
  }
}

// 清除之前的日誌文件
const logFile = path.join(__dirname, 'gemini-test-log.txt');
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

// 執行測試
logToFile('開始執行 Gemini API 測試...');
testGeminiAPI().then(() => {
  logToFile('測試腳本執行完畢。');
}).catch(err => {
  logToFile('執行測試腳本時發生錯誤: ' + err.message);
});