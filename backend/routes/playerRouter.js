const express = require('express');
const router = express.Router();
const client = require('../config/db');

// Lấy danh sách tất cả players
router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM players ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách VĐV' });
    }
});

// Thêm 1 player
router.post('/', async (req, res) => {
    const { id, name, phone, ranking, points, created_date, modified_date } = req.body;
    try {
        await client.query(
            `INSERT INTO players (id, name, phone, ranking, points, created_date, modified_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, name, phone || 'unknown', ranking, points, created_date, modified_date]
        );
        res.json({ message: 'Đã thêm VĐV' });
    } catch (err) {
        console.error('Error adding player:', err);
        res.status(500).json({ message: 'Lỗi khi thêm VĐV' });
    }
});

// Xoá 1 player
router.delete('/:id', async (req, res) => {
    try {
        await client.query('DELETE FROM players WHERE id = $1', [req.params.id]);
        res.json({ message: 'Đã xoá VĐV' });
    } catch (err) {
        console.error('Error deleting player:', err);
        res.status(500).json({ message: 'Lỗi khi xoá VĐV' });
    }
});

// Import nhiều player từ Excel
router.post('/import', async (req, res) => {
    const players = req.body;

    try {
        for (let p of players) {
            const now = new Date().toISOString();

            await client.query(`
                INSERT INTO players (id, name, phone, ranking, points, created_date, modified_date)
                VALUES ($1, $2, $3, $4, $5, $6, $6)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    ranking = EXCLUDED.ranking,
                    points = EXCLUDED.points,
                    modified_date = EXCLUDED.modified_date
            `, [
                p.id,
                p.name,
                p.phone || 'unknown',
                p.ranking,
                p.points,
                now // dùng chung cho cả created_date và modified_date
            ]);
        }

        res.json({ message: 'Đã import danh sách VĐV' });
    } catch (err) {
        console.error('Error importing players:', err);
        res.status(500).json({ message: 'Import thất bại' });
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.query;
  
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Thiếu từ khoá tìm kiếm' });
    }
  
    try {
      const result = await client.query(`
        SELECT id, name, phone, nickname, club
        FROM players
        WHERE CAST(id AS TEXT) ILIKE $1 OR name ILIKE $1
        LIMIT 10
      `, [`%${query}%`]);
  
      res.json(result.rows);
    } catch (err) {
      console.error('Lỗi tìm kiếm VĐV:', err);
      res.status(500).json({ message: 'Lỗi server khi tìm kiếm VĐV' });
    }
  });

module.exports = router;
