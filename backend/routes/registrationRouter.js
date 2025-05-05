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

// 2. Thêm competitor vào bản đăng ký
router.post('/competitors', async (req, res) => {
  let { registration_form_id, player_id, nick_name, club, selected_date, name, phone } = req.body;

  try {
    // Nếu không có player_id thì cần tạo mới player dựa vào name và phone (yêu cầu cả hai phải có)
    if (!player_id && name && phone) {
      const prefix = 'H';
      const result = await client.query("SELECT id FROM players WHERE id LIKE $1 ORDER BY id DESC LIMIT 1", [`${prefix}%`]);

      let nextId = prefix + '10001';
      console.log('🚀 Competitor Received:', {
        registration_form_id, player_id, nick_name, club, selected_date, name, phone
      });
      if (result.rows.length > 0) {
        const lastId = result.rows[0].id;
        const number = parseInt(lastId.slice(prefix.length)) + 1;
        nextId = prefix + number.toString();
      }

      player_id = nextId;
      await client.query(
        `INSERT INTO players (id, name, phone) VALUES ($1, $2, $3)`,
        [player_id, name, phone]
      );
    }

    await client.query(
      `INSERT INTO competitors (registration_form_id, player_id, nick_name, club, selected_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [registration_form_id, player_id, nick_name, club, selected_date]
    );
    res.json({ message: 'Success' });
  } catch (err) {
    console.error('❌ Lỗi khi thêm competitor:', err.message);
    console.error(err.stack);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// 3. Phê duyệt hoặc từ chối đăng ký
router.patch('/:id/approve', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
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
      'SELECT background_image FROM tournaments WHERE id = $1',
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
  const { tournament, phone, user_name, club } = req.query;

  try {
    const result = await client.query(
      `
      SELECT 
        rf.id AS registration_id,
        t.name AS tournament_name,
        rf.registered_phone,
        u.name AS user_name,
        rf.status,
        (
          SELECT c.club
          FROM competitors c
          WHERE c.registration_form_id = rf.id
          LIMIT 1
        ) AS club,
        (
          SELECT STRING_AGG(c.nick_name, ', ')
          FROM competitors c
          WHERE c.registration_form_id = rf.id
        ) AS athlete_names
      FROM registration_form rf
      JOIN tournaments t ON rf.tournament_id = t.id
      JOIN users u ON rf.user_id = u.id
      WHERE
        ($1::text IS NULL OR LOWER(t.name) LIKE LOWER('%' || $1 || '%')) AND
        ($2::text IS NULL OR LOWER(rf.registered_phone) LIKE LOWER('%' || $2 || '%')) AND
        ($3::text IS NULL OR LOWER(u.name) LIKE LOWER('%' || $3 || '%')) AND
        ($4::text IS NULL OR EXISTS (
          SELECT 1 FROM competitors c
          WHERE c.registration_form_id = rf.id AND LOWER(c.club) LIKE LOWER('%' || $4 || '%')
        ))
      ORDER BY rf.id DESC
      `,
      [tournament || null, phone || null, user_name || null, club || null]
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
      SELECT c.*, p.name, p.phone_number
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


module.exports = router;