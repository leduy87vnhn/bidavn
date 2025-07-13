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
                INSERT INTO players (id, name, phone, ranking, points, pool_ranking, pool_points, created_date, modified_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    ranking = EXCLUDED.ranking,
                    points = EXCLUDED.points,
                    pool_ranking = EXCLUDED.pool_ranking,
                    pool_points = EXCLUDED.pool_points,
                    modified_date = EXCLUDED.modified_date
            `, [
                p.id,
                p.name,
                p.phone || 'unknown',
                p.ranking,
                p.points,
                p.pool_ranking,
                p.pool_points,
                now
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
        SELECT id, name, phone
        FROM players
        WHERE CAST(id AS TEXT) ILIKE $1 OR name ILIKE $1 OR phone ILIKE $1
        LIMIT 10
      `, [`%${query}%`]);
  
      res.json(result.rows);
    } catch (err) {
      console.error('Lỗi tìm kiếm VĐV:', err);
      res.status(500).json({ message: 'Lỗi server khi tìm kiếm VĐV' });
    }
  });


// CHUẨN HÓA TÊN: update toàn bộ tên thành chữ in hoa
router.put('/normalize-names', async (req, res) => {
    try {
        await client.query(`
            UPDATE players
            SET name = UPPER(name),
                modified_date = NOW()
        `);
        res.json({ message: 'Đã chuẩn hoá toàn bộ tên VĐV' });
    } catch (err) {
        console.error('Lỗi khi chuẩn hoá tên:', err);
        res.status(500).json({ message: 'Lỗi khi chuẩn hoá tên VĐV' });
    }
});

// router.get('/clubs', async (req, res) => {
//   try {
//     const result = await client.query(`
//       SELECT DISTINCT LOWER(TRIM(club)) as club
//       FROM competitors
//       WHERE club IS NOT NULL AND TRIM(club) <> ''
//     `);
//     res.json(result.rows.map(row => row.club));
//   } catch (err) {
//     console.error('Lỗi lấy danh sách CLB:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Cập nhật thông tin 1 player
router.put('/:id', async (req, res) => {
    const { name, phone, ranking, points, pool_ranking, pool_points, modified_date } = req.body;

    try {
        await client.query(
            `UPDATE players
             SET name = $1, phone = $2, ranking = $3, points = $4,
                 pool_ranking = $5, pool_points = $6, modified_date = $7
             WHERE id = $8`,
            [name, phone || 'unknown', ranking, points, pool_ranking, pool_points, modified_date, req.params.id]
        );
        res.json({ message: 'Đã cập nhật VĐV' });
    } catch (err) {
        console.error('Error updating player:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật VĐV' });
    }
});

// ✅ API: Lấy thông tin VĐV theo số điện thoại (để kiểm tra trùng SĐT)
router.get('/by-phone', async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ message: 'Thiếu số điện thoại' });
  }

  try {
    const result = await client.query(
      `SELECT id, name, phone FROM players WHERE phone = $1 LIMIT 1`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy VĐV với SĐT này' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Lỗi khi lấy VĐV theo SĐT:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy VĐV' });
  }
});

router.get('/:id/ranking', async (req, res) => {
  const { id } = req.params;
  const { tournament_id } = req.query;

  console.log(`📥 [ranking API] player_id = ${id}, tournament_id = ${tournament_id}`);

  try {
    const result = await client.query(`SELECT ranking, pool_ranking FROM players WHERE id = $1`, [id]);
    console.log('🔍 Query player result:', result.rows);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy VĐV' });
    }

    const player = result.rows[0];
    const tourRes = await client.query(`SELECT name FROM tournaments WHERE id = $1`, [tournament_id]);
    console.log('📘 Tournament name result:', tourRes.rows);
    const tournament = tourRes.rows[0];
    const name = tournament?.name?.toLowerCase() || '';

    let ranking = null;
    if (name.includes('carom')) {
      ranking = player.ranking;
    } else if (name.includes('pool')) {
      ranking = player.pool_ranking;
    }

    res.json({ ranking });
  } catch (err) {
    console.error('Lỗi khi lấy ranking:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
