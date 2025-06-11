const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// 建立資料庫連線池
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

// 取得所有研討會資料與摘要
router.get('/conferences-with-summaries', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, c.title, c.speaker, c.category, c.transcript, c.video_url,
        cs.main_idea, cs.key_points, cs.conclusion
      FROM conferences c
      LEFT JOIN conference_summary cs ON c.id = cs.conference_id
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query);

    const conferences = result.rows.map(row => {
      const conference = {
        id: row.id,
        title: row.title,
        speaker: row.speaker,
        category: row.category,
        transcript: row.transcript,
        video_url: row.video_url
      };

      // 安全解析 key_points 為 JSON 陣列
      if (row.main_idea || row.key_points || row.conclusion) {
        let keyPoints = [];
        try {
          keyPoints = Array.isArray(row.key_points)
            ? row.key_points
            : JSON.parse(row.key_points || '[]');
        } catch (e) {
          console.warn('無法解析 key_points 為 JSON:', e.message);
        }

        conference.summary = {
          mainIdea: row.main_idea,
          keyPoints,
          conclusion: row.conclusion
        };
      }

      return conference;
    });

    res.status(200).json({ success: true, data: conferences });
  } catch (error) {
    console.error('獲取摘要錯誤:', error);
    res.status(500).json({ success: false, error: '獲取研討會摘要資料失敗' });
  }
});

module.exports = router;
