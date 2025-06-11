# 研討會摘要生成與顯示系統

## 概述

本系統使用Gemini API自動分析研討會逐字稿，生成結構化摘要，並將摘要數據存儲在PostgreSQL數據庫中。前端頁面顯示研討會的「主要觀點」、「關鍵點」和「結論」等摘要內容。

## 功能特點

- **自動摘要生成**：使用Google Gemini API分析研討會逐字稿，提取主要觀點、關鍵點和結論
- **數據庫存儲**：將摘要數據存儲在`conference_summary`表中，與原有的`conferences`表關聯
- **前端顯示**：在研討會詳情頁面顯示結構化摘要內容

## 系統架構

- **分析模塊**：使用Gemini API處理transcript文本
- **存儲模塊**：PostgreSQL新表設計
- **顯示模塊**：前端渲染摘要數據

## 安裝與設置

### 1. 安裝依賴

```bash
npm install @google/generative-ai dotenv pg
```

### 2. 設置Gemini API密鑰

在項目根目錄創建或編輯`.env`文件，添加以下內容：

```
GEMINI_API_KEY=your_gemini_api_key_here
```

請將`your_gemini_api_key_here`替換為您的實際Gemini API密鑰。

### 3. 創建數據庫表

運行以下命令創建`conference_summary`表：

```bash
node createConferenceSummaryTable.js
```

## 使用方法

### 1. 生成研討會摘要

運行以下命令，使用Gemini API生成研討會摘要並存儲到數據庫：

```bash
node generateSummariesWithGemini.js
```

此腳本會：
- 從`conferences`表中讀取尚未處理的研討會數據
- 使用Gemini API分析逐字稿
- 將生成的摘要存儲到`conference_summary`表中

### 2. 啟動服務器

```bash
node server.js
```

服務器將在http://localhost:3000運行。

### 3. 查看摘要

訪問http://localhost:3000即可查看研討會列表和摘要。

## API端點

- **GET /api/summary/conferences-with-summaries**：獲取所有研討會及其摘要
- **GET /api/summary/conference-summary/:id**：獲取指定研討會的摘要

## 數據庫結構

### conferences表（現有）

- `id`: 字符串，主鍵
- `title`: 文本，研討會標題
- `speaker`: 文本，講者姓名
- `category`: 文本，研討會分類
- `transcript`: 文本，研討會逐字稿或URL
- `main_idea`: 文本，主要觀點
- `points`: 文本，重點摘要
- `reading_time`: 整數，閱讀時間
- `created_at`: 時間戳，創建時間
- `updated_at`: 時間戳，更新時間

### conference_summary表（新增）

- `id`: 整數，自增主鍵
- `conference_id`: 字符串，外鍵，關聯conferences表的id
- `main_idea`: 文本，主要觀點
- `key_points`: JSONB，關鍵點列表
- `conclusion`: 文本，結論
- `created_at`: 時間戳，創建時間
- `updated_at`: 時間戳，更新時間

## 故障排除

### 數據庫連接問題

如果遇到數據庫連接問題，請檢查：

1. PostgreSQL服務是否運行
2. `.env`文件中的數據庫配置是否正確
3. 運行`node checkDbStructure.js`檢查數據庫結構

### Gemini API問題

如果遇到Gemini API問題，請檢查：

1. API密鑰是否正確設置在`.env`文件中
2. 網絡連接是否正常
3. API使用配額是否已用完

## 開發者說明

### 自定義摘要生成

您可以修改`generateSummariesWithGemini.js`文件中的`prompt`變量，自定義Gemini API的提示，以獲取不同風格或格式的摘要。

### 擴展功能

- **批量處理**：可以添加批量處理功能，一次處理多個研討會
- **定時更新**：可以設置定時任務，定期更新摘要
- **多語言支持**：可以添加多語言支持，生成不同語言的摘要

## 授權

此專案採用MIT授權。