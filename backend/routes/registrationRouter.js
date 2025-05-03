// File: backend/routes/registrationRouter.js

const express = require('express');
const router = express.Router();
const client = require('../config/db'); // giả sử bạn đã có client kết nối PostgreSQL

// 1. Tạo bản đăng ký mới
router.post('/', async (req, res) => {
  const { user_id, registered_phone, tournament_id } = req.body;
  const now = new Date();

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
  const { registration_form_id, player_id, nick_name, club, selected_date } = req.body;
  try {
    await client.query(
      `INSERT INTO competitors (registration_form_id, player_id, nick_name, club, selected_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [registration_form_id, player_id, nick_name, club, selected_date]
    );
    res.json({ message: 'Success' });
  } catch (err) {
    console.error('Error inserting competitor:', err);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;
