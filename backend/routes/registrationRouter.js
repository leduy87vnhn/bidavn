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
  const { registration_form_id, player_id, nick_name, club, selected_date } = req.body;

  if (!registration_form_id || !player_id) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    await client.query(
      `INSERT INTO competitors (registration_form_id, player_id, nick_name, club, selected_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [registration_form_id, player_id, nick_name || '', club || '', selected_date]
    );
    res.json({ message: 'Success' });
  } catch (err) {
    console.error('❌ Lỗi khi thêm competitor:', err.message);
    res.status(500).json({ message: 'Server error', detail: err.message });
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
      SELECT c.*, p.name, p.phone
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

// ✅ Cập nhật danh sách competitors theo registration_form_id
router.post('/:id/update-competitors', async (req, res) => {
  const { id } = req.params;
  const { competitors } = req.body;

  if (!Array.isArray(competitors)) {
    return res.status(400).json({ message: 'Danh sách competitors không hợp lệ' });
  }

  const client = require('../config/db'); // Đảm bảo đã khai báo

  const clientConnection = await client.connect();

  try {
    await clientConnection.query('BEGIN');

    // Xoá toàn bộ VĐV cũ
    await clientConnection.query(
      `DELETE FROM competitors WHERE registration_form_id = $1`,
      [id]
    );

    // Thêm lại từng VĐV mới
    for (const c of competitors) {
      if (!c.player_id || !c.selected_date) {
        throw new Error('Thiếu thông tin bắt buộc: player_id hoặc selected_date');
      }

      await clientConnection.query(
        `INSERT INTO competitors (registration_form_id, player_id, nick_name, club, selected_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, c.player_id, c.nick_name || '', c.club || '', c.selected_date]
      );
    }

    await clientConnection.query('COMMIT');
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    await clientConnection.query('ROLLBACK');
    console.error('❌ Lỗi khi cập nhật competitors:', err);
    res.status(500).json({ message: 'Lỗi server', detail: err.message });
  } finally {
    clientConnection.release();
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
      if (!player.phone) {
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
    `SELECT id FROM players WHERE id ~ '^H\\d+$' ORDER BY id DESC LIMIT 1`
  );
  if (result.rows.length === 0) return prefix + '00001';

  const lastId = result.rows[0].id;
  const nextNumber = parseInt(lastId.slice(prefix.length)) + 1;
  return prefix + nextNumber.toString().padStart(5, '0');
}

module.exports = router;