// File: backend/routes/registrationRouter.js

const express = require('express');
const router = express.Router();
const client = require('../config/db'); // giả sử bạn đã có client kết nối PostgreSQL

// 1. Tạo bản đăng ký mới
router.post('/', async (req, res) => {
  const { user_id, registered_phone, tournament_id } = req.body;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    const result = await client.query(
      `INSERT INTO registration_form (user_id, registered_phone, tournament_id, status, created_date, modified_date)
       VALUES ($1, $2, $3, 0, $4, $4) RETURNING id`,
      [user_id, registered_phone, tournament_id, now]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error creating registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Thêm competitor vào bản đăng ký, với player_id đã được xác định trước
router.post('/competitors', async (req, res) => {
  const { registration_form_id, player_id, nick_name, club, selected_date, uniform_size } = req.body;

  if (!registration_form_id || !player_id) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    // Lấy tournament_id từ registration_form
    const formRes = await client.query(
      `SELECT tournament_id FROM registration_form WHERE id = $1`,
      [registration_form_id]
    );
    if (formRes.rows.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy bản đăng ký' });
    }
    const tournament_id = formRes.rows[0].tournament_id;

    // Lấy thông tin giải đấu
    const tourRes = await client.query(
      `SELECT content, attendance_fee_common, attendance_fee_rank1, attendance_fee_rank2, attendance_fee_rank3,
              rank1, rank2, rank3
       FROM tournament_event
       WHERE id = $1`,
      [tournament_id]
    );
    if (tourRes.rows.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy giải đấu' });
    }
    const tournament = tourRes.rows[0];

    // Lấy thông tin player
    const playerRes = await client.query(
      `SELECT ranking, pool_ranking FROM players WHERE id = $1`,
      [player_id]
    );

    let attendance_fee = tournament.attendance_fee_common;

    const isCarom = (tournament.content || '').toLowerCase().includes('carom');
    const isPool = (tournament.content || '').toLowerCase().includes('poo');

    const player = playerRes.rows[0] || {};
    const r = isCarom ? player.ranking : player.pool_ranking;
    const r1 = tournament.rank1;
    const r2 = tournament.rank2;
    const r3 = tournament.rank3;

    const fee1 = tournament.attendance_fee_rank1;
    const fee2 = tournament.attendance_fee_rank2;
    const fee3 = tournament.attendance_fee_rank3;

    const hasRanking = r !== null && r !== 0;

    if (!hasRanking || !r1 || !fee1) {
      attendance_fee = tournament.attendance_fee_common;
    } else {
      if (r >= r1) {
        attendance_fee = fee1;
      } else if (r2 && fee2 && r >= r2) {
        attendance_fee = fee2;
      } else if (r3 && fee3 && r >= r3) {
        attendance_fee = fee3;
      } else {
        attendance_fee = tournament.attendance_fee_common;
      }
    }

    await client.query(
      `INSERT INTO competitors
        (registration_form_id, player_id, nick_name, club, selected_date, uniform_size, attendance_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        registration_form_id,
        player_id,
        nick_name || '',
        club || '',
        selected_date || null,
        uniform_size || 'L',
        attendance_fee
      ]
    );

    res.json({ message: 'Success', attendance_fee });
  } catch (err) {
    console.error('❌ Lỗi khi thêm competitor:', err.stack || err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// GET all competitors of a tournament
// ✅ Chỉ lấy competitors của giải đấu với registration_form đã được duyệt
router.get('/by-tournament/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const result = await client.query(`
      SELECT 
        c.*, 
        p.name, p.phone, 
        rf.status 
      FROM competitors c
      JOIN players p ON c.player_id = p.id
      JOIN registration_form rf ON c.registration_form_id = rf.id
      WHERE rf.tournament_id = $1
      ORDER BY 
        CASE WHEN c.selected_date IS NULL THEN 1 ELSE 0 END,
        c.selected_date ASC,
        c.id ASC
    `, [tournamentId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Lỗi khi lấy competitors theo giải:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// 3. Phê duyệt hoặc từ chối đăng ký
router.patch('/:id/approve', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  //const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const now = new Date();

  if (![1, 2].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    await client.query(
      `UPDATE registration_form SET status = $1, modified_date = $2 WHERE id = $3`,
      [status, now, id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Lấy background của giải đấu từ tournamentId
router.get('/background/:tournamentId', async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const result = await client.query(
      'SELECT background_image FROM tournament_events WHERE id = $1',
      [tournamentId]
    );
    if (result.rows.length === 0 || !result.rows[0].background_image) {
      return res.json({ filename: null });
    }
    res.json({ filename: result.rows[0].background_image });
  } catch (err) {
    console.error('Error fetching background:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. API tìm kiếm player theo từ khoá
router.get('/search-player', async (req, res) => {
  const keyword = req.query.q;
  try {
    const result = await client.query(
      `SELECT id, name, phone FROM players WHERE id ILIKE $1 OR name ILIKE $1 LIMIT 10`,
      [`%${keyword}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching player:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. Danh sách đơn đăng ký (dành cho admin)
router.get('/', async (req, res) => {
  const { tournament, phone, user_name, club, status, athlete_name } = req.query;

  try {
    const result = await client.query(
      `
      SELECT 
        rf.id AS registration_id,
        t.name AS tournament_name,
        rf.registered_phone,
        u.name AS user_name,
        rf.status,
        rf.created_date,
        (
          SELECT c.club
          FROM competitors c
          WHERE c.registration_form_id = rf.id
          LIMIT 1
        ) AS club,
        (
          SELECT STRING_AGG(p.name, ', ')
          FROM competitors c
          JOIN players p ON c.player_id = p.id
          WHERE c.registration_form_id = rf.id
        ) AS athlete_names
      FROM registration_form rf
      JOIN tournament_event t ON rf.tournament_id = t.id
      JOIN users u ON rf.user_id = u.id
      WHERE
        ($1::text IS NULL OR LOWER(t.name) LIKE LOWER('%' || $1 || '%')) AND
        ($2::text IS NULL OR LOWER(rf.registered_phone) LIKE LOWER('%' || $2 || '%')) AND
        ($3::text IS NULL OR LOWER(u.name) LIKE LOWER('%' || $3 || '%')) AND
        ($4::text IS NULL OR EXISTS (
          SELECT 1 FROM competitors c
          WHERE c.registration_form_id = rf.id AND LOWER(c.club) LIKE LOWER('%' || $4 || '%')
        )) AND
        ($5::text IS NULL OR rf.status::text = $5::text) AND
        ($6::text IS NULL OR EXISTS (
          SELECT 1 FROM competitors c
          JOIN players p ON c.player_id = p.id
          WHERE c.registration_form_id = rf.id AND LOWER(p.name) LIKE LOWER('%' || $6 || '%')
        ))
      ORDER BY rf.id DESC
      `,
      [tournament || null, phone || null, user_name || null, club || null, status || null, athlete_name || null]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đăng ký.' });
  }
});

// GET danh sách VĐV theo registration_id
router.get('/:id/competitors', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(`
      SELECT c.*, c.player_id, p.name, p.phone
      FROM competitors c
      JOIN players p ON c.player_id = p.id
      WHERE c.registration_form_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error loading competitors:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách VĐV' });
  }
});


// ✅ API: Tính số slot còn lại theo từng ngày thi đấu
router.get('/slots', async (req, res) => {
  const { tournament_id } = req.query;

  if (!tournament_id) {
    return res.status(400).json({ message: 'Thiếu tournament_id' });
  }

  try {
    // Lấy thông tin giải đấu
    const tourRes = await client.query(
      'SELECT registerable_date_start, registerable_date_end, competitors_per_day FROM tournament_events WHERE id = $1',
      [parseInt(tournament_id)]
    );

    if (tourRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giải đấu' });
    }

    const {
      registerable_date_start,
      registerable_date_end,
      competitors_per_day
    } = tourRes.rows[0];

    console.log('🎯 DATA FROM TOURNAMENT:', {
      registerable_date_start,
      registerable_date_end,
      competitors_per_day
    });

    if (!registerable_date_start || !registerable_date_end || competitors_per_day == null) {
      return res.status(400).json({ message: 'Thiếu dữ liệu thời gian hoặc số lượng' });
    }

    // Đếm số lượng đã đăng ký cho từng ngày
    const compRes = await client.query(`
      SELECT c.selected_date, COUNT(*) AS count
      FROM competitors c
      JOIN registration_form rf ON c.registration_form_id = rf.id
      WHERE rf.tournament_id = $1 AND (rf.status = 0 OR rf.status = 1) AND c.selected_date IS NOT NULL
      GROUP BY c.selected_date
    `, [parseInt(tournament_id)]);

    const usedMap = {};
    compRes.rows.forEach(row => {
      const date = row.selected_date?.toISOString?.().slice(0, 10) ?? row.selected_date?.toString()?.slice(0, 10);
      usedMap[date] = parseInt(row.count);
    });

    // Tính toán danh sách ngày và số slot còn lại
    const dates = [];
    const start = new Date(registerable_date_start);
    const end = new Date(registerable_date_end);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const used = usedMap[dateStr] || 0;
      const remaining = competitors_per_day - used;

      dates.push({
        value: dateStr,
        display: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
        remaining
      });
    }

    res.json({ available_dates: dates });
  } catch (err) {
    console.error('❌ Lỗi khi tính slot:', err.stack || err);
    res.status(500).json({ message: 'Lỗi server khi tính số slot còn lại' });
  }
});

// Cuối file registrationRouter.js
router.get('/count', async (req, res) => {
  const { tournament_id } = req.query;
  try {
    const result = await client.query(
      `SELECT COUNT(*) FROM registration_form f
       JOIN competitors c ON f.id = c.registration_form_id
       WHERE f.tournament_id = $1 AND f.status IN (0, 1)`,
      [tournament_id]
    );
    res.json({ total: Number(result.rows[0].count) });
  } catch (err) {
    console.error('Lỗi khi đếm số lượng VĐV:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/clubs', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT DISTINCT TRIM(club) as club
      FROM competitors
      WHERE club IS NOT NULL AND TRIM(club) <> ''
    `);
    res.json(result.rows.map(row => row.club));
  } catch (err) {
    console.error('Lỗi lấy danh sách CLB:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/by-phone', async (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ message: 'Thiếu số điện thoại' });
  }
  try {
    const result = await client.query(
      'SELECT id, name, phone FROM players WHERE phone = $1 LIMIT 1',
      [phone]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy VĐV với số điện thoại này' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Lỗi tìm VĐV theo SĐT:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/registration_form/:id
// ✅ API: Lấy chi tiết 1 bản đăng ký theo ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      `SELECT * FROM registration_form WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bản đăng ký' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching registration form:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/update-competitors', async (req, res) => {
  const { id } = req.params;
  const { competitors } = req.body;

  if (!Array.isArray(competitors)) {
    return res.status(400).json({ message: 'Danh sách competitors không hợp lệ' });
  }

  try {
    // Xoá toàn bộ VĐV cũ
    await client.query(
      `DELETE FROM competitors WHERE registration_form_id = $1`,
      [id]
    );

    // Thêm lại từng VĐV mới
    for (const c of competitors) {
      if (!c.player_id) {
        throw new Error('Thiếu thông tin bắt buộc: player_id hoặc selected_date');
      }

      await client.query(
        `INSERT INTO competitors (registration_form_id, player_id, nick_name, club, selected_date, uniform_size)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, c.player_id, c.nick_name || '', c.club || '', c.selected_date || null, c.uniform_size || 'L']
      );
    }

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật competitors:', err);
    res.status(500).json({ message: 'Lỗi server', detail: err.message });
  }
});

// ✅ Xử lý tìm hoặc tạo player phù hợp dựa vào name + phone
router.post('/resolve-player', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ status: 'error', message: 'Thiếu tên hoặc số điện thoại' });
  }

  try {
    // (1) Nếu name + phone trùng
    const existing = await client.query(
      `SELECT id FROM players WHERE name = $1 AND phone = $2 LIMIT 1`,
      [name, phone]
    );
    if (existing.rows.length > 0) {
      return res.json({ status: 'ok', player_id: existing.rows[0].id });
    }

    // (2) Nếu name trùng nhưng phone null hoặc rỗng => cập nhật
    const nameMatch = await client.query(
      `SELECT id, phone FROM players WHERE name = $1 LIMIT 1`,
      [name]
    );
    if (nameMatch.rows.length > 0) {
      const player = nameMatch.rows[0];
      if (!player.phone || player.phone.toLowerCase() === 'unknown' || player.phone === '') {
        await client.query(`UPDATE players SET phone = $1 WHERE id = $2`, [phone, player.id]);
        return res.json({ status: 'ok', player_id: player.id });
      } else {
        // (3) Nếu phone khác => tạo mới
        const newId = await getNextPlayerId();
        await client.query(
          `INSERT INTO players (id, name, phone) VALUES ($1, $2, $3)`,
          [newId, name, phone]
        );
        return res.json({ status: 'ok', player_id: newId });
      }
    }

    // (4) Nếu phone đã tồn tại với name khác => lỗi
    const phoneMatch = await client.query(
      `SELECT name FROM players WHERE phone = $1 LIMIT 1`,
      [phone]
    );
    if (phoneMatch.rows.length > 0 && phoneMatch.rows[0].name !== name) {
      return res.status(400).json({ status: 'error', message: 'SĐT đã tồn tại với VĐV khác.' });
    }

    // (5) Tạo mới hoàn toàn
    const newId = await getNextPlayerId();
    await client.query(
      `INSERT INTO players (id, name, phone) VALUES ($1, $2, $3)`,
      [newId, name, phone]
    );
    return res.json({ status: 'ok', player_id: newId });

  } catch (err) {
    console.error('❌ Lỗi resolve-player:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi xử lý VĐV' });
  }
});

// 🔧 Tạo ID mới dạng H00001, H00002,...
async function getNextPlayerId() {
  const prefix = 'H';
  const result = await client.query(
    `SELECT id FROM players WHERE id ~ '^H\\d+$' ORDER BY CAST(SUBSTRING(id FROM 2) AS INTEGER) DESC LIMIT 1`
  );
  if (result.rows.length === 0) return prefix + '00001';

  const lastId = result.rows[0].id;
  const nextNumber = parseInt(lastId.slice(prefix.length)) + 1;
  return prefix + nextNumber.toString().padStart(5, '0');
}


module.exports = router;