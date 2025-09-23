const client = require('../config/db');
const bcrypt = require('bcryptjs');

// Lấy toàn bộ users (kèm tìm kiếm)
exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, user_name, name, user_type, birthday, phone_number, email, enable FROM users';
    let values = [];

    if (search) {
      query += ' WHERE user_name ILIKE $1';
      values.push(`%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const result = await client.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách người dùng.' });
  }
};

// Tạo user mới
exports.createUser = async (req, res) => {
  try {
    const { user_name, name, user_type, birthday, phone_number, email, enable, password } = req.body;

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const created_date = new Date();
    const modified_date = created_date;

    const result = await client.query(
      `INSERT INTO users (user_name, name, user_type, birthday, phone_number, email, enable, password, created_date, modified_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [user_name, name, user_type, birthday, phone_number, email, enable, hashedPassword, created_date, modified_date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Lỗi server khi tạo người dùng.' });
  }
};

// Cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, user_type, birthday, phone_number, email, enable, password } = req.body;
    const modified_date = new Date();

    let query = `
      UPDATE users
      SET name = $1, user_type = $2, birthday = $3, phone_number = $4,
          email = $5, enable = $6, modified_date = $7`;
    const values = [name, user_type, birthday, phone_number, email, enable, modified_date];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $8 WHERE id = $9 RETURNING *`;
      values.push(hashedPassword, id);
    } else {
      query += ` WHERE id = $8 RETURNING *`;
      values.push(id);
    }

    const result = await client.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật người dùng.' });
  }
};

// Xoá user
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Lỗi server khi xoá người dùng.' });
  }
};

// Reset mật khẩu về mặc định "123456"
exports.resetPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const hashedPassword = await bcrypt.hash("123456", 10);
    const modified_date = new Date();

    const result = await client.query(
      `UPDATE users 
       SET password = $1, modified_date = $2 
       WHERE id = $3 RETURNING id, user_name, email, phone_number`,
      [hashedPassword, modified_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User không tồn tại." });
    }

    res.json({ success: true, message: "Đã reset mật khẩu về mặc định 123456" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Lỗi server khi reset mật khẩu." });
  }
};