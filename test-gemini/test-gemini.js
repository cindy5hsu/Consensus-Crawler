/**
 * Gemini API 測試腳本
 * 此腳本用於測試 Gemini API 的連接和基本功能
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 初始化 Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 測試函數
async function testGeminiAPI() {
  try {
    console.log('===== 開始測試 Gemini API =====');
    console.log('API 密鑰:', GEMINI_API_KEY ? '已設置' : '未設置');
    
    if (!GEMINI_API_KEY) {
      console.error('錯誤: 未設置 GEMINI_API_KEY 環境變量。請在 .env 文件中設置。');
      return;
    }
    
    // 初始化 Gemini 模型
    console.log('初始化 Gemini 模型...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // 構建簡單的 prompt
    const prompt = `
    請生成一個關於區塊鏈技術的簡短摘要，包含以下部分：
    1. 主要觀點（100字以內）
    2. 3個關鍵點（每點50字以內）
    3. 結論（100字以內）
    `;
    
    console.log('發送請求到 Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\n===== Gemini API 響應 =====');
    console.log(text);
    console.log('\n===== 測試完成 =====');
    console.log('Gemini API 連接成功！');
  } catch (error) {
    console.error('測試 Gemini API 失敗:', error);
    console.error('請檢查您的 API 密鑰是否正確，以及網絡連接是否正常。');
  }
}

// 執行測試
testGeminiAPI();