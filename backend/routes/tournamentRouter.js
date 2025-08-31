const express = require('express');
const router = express.Router();
const client = require('../config/db');
const multer = require('multer');
const path = require('path');
const tournamentController = require('../controllers/tournamentController');

// Configure multer
// Multer config cho ảnh nền
const backgroundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/backgrounds');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadBackground = multer({ storage: backgroundStorage });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadLogo = multer({ storage: logoStorage });

// Multer config cho QR code
const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/qr'); // ✅ CHỈNH THƯ MỤC LƯU QR
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadQR = multer({ storage: qrStorage });

// Route upload background
router.post('/:id/upload-background', uploadBackground.single('background'), tournamentController.uploadBackground);

router.post('/:id/upload-bankqr', uploadQR.single('bank_qr'), tournamentController.uploadBankQr);


router.post('/upload-logo', uploadLogo.single('logo'), async (req, res) => {
  try {
    const fileName = req.file.filename;
    const fs = require('fs');
    fs.writeFileSync('uploads/logos/logo_config.json', JSON.stringify({ filename: fileName }));
    res.json({ message: 'Upload logo thành công', filename: fileName });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Lỗi khi upload logo' });
  }
});

router.get('/logo', async (req, res) => {
  try {
    const fs = require('fs');
    const path = 'uploads/logos/logo_config.json';
    if (fs.existsSync(path)) {
      const config = JSON.parse(fs.readFileSync(path));
      res.json({ filename: config.filename });
    } else {
      res.json({ filename: null });
    }
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy logo' });
  }
});

// List tournament_events (paginated)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    let condition = '';
    let dataParams = [limit, offset];
    let countParams = [];

    if (status === 'upcoming') {
        condition = `WHERE t.start_date > (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
    } else if (status === 'ongoing') {
        condition = `WHERE t.start_date <= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') AND t.end_date >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
    } else if (status === 'ended') {
        condition = `WHERE t.end_date < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
    } else if (status === 'not_ended') {
        condition = `WHERE t.end_date >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
    }

    const dataQuery = `
      SELECT 
        t.*, 
        tg.tournament_name AS group_name,
        tg.start_date AS group_start_date,
        tg.end_date AS group_end_date,
        tg.regulations AS group_regulations,
        (
          SELECT COUNT(*)
          FROM registration_form rf
          LEFT JOIN competitors c ON c.registration_form_id = rf.id
          LEFT JOIN players p ON c.player_id = p.id
          WHERE rf.tournament_id = t.id AND rf.status = 1 AND p.id IS NOT NULL
        ) AS approved_competitors_count
      FROM tournament_events t
      LEFT JOIN tournament_group tg ON t.group_id = tg.id
      ${condition}
      ORDER BY t.start_date ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM tournament_events t
      ${condition}
    `;

    try {
        let dataResult, countResult;

        if (status === 'all') {
          dataResult = await client.query(`
            SELECT 
              t.*, 
              tg.tournament_name AS group_name,
              tg.start_date AS group_start_date,
              tg.end_date AS group_end_date,
              tg.regulations AS group_regulations,
              (
                SELECT COUNT(*)
                FROM registration_form rf
                LEFT JOIN competitors c ON c.registration_form_id = rf.id
                LEFT JOIN players p ON c.player_id = p.id
                WHERE rf.tournament_id = t.id AND rf.status = '1' AND p.id IS NOT NULL
              ) AS approved_competitors_count
            FROM tournament_events t
            LEFT JOIN tournament_group tg ON t.group_id = tg.id
            ORDER BY t.start_date ASC
            LIMIT $1 OFFSET $2
          `, [limit, offset]);

            countResult = await client.query('SELECT COUNT(*) FROM tournament_events');
        } else {
            dataResult = await client.query(dataQuery, [limit, offset]);
            countResult = await client.query(countQuery);
        }

        res.json({
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        });
    } catch (error) {
        console.error('Error fetching tournament_events:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách giải đấu.' });
    }
});

// Add tournament
router.post('/', async (req, res) => {
    const { name, code, attendance_fee_common, start_date, end_date, group_id } = req.body;

    console.log('📥 Dữ liệu nhận được:', req.body);

    if (!name || !code || !start_date || !end_date) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
    }

    try {
        const query = `
            INSERT INTO tournament_events (name, code, attendance_fee_common, start_date, end_date, group_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const result = await client.query(query, [
            name,
            code,
            attendance_fee_common !== '' ? parseInt(attendance_fee_common) : null,
            start_date,
            end_date,
            group_id || null
        ]);

        console.log('✅ Giải đã được tạo:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Lỗi khi tạo giải:', error.message);
        res.status(500).json({ message: 'Lỗi server khi tạo giải đấu.', error: error.message });
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
      name, code, attendance_fee_common, start_date, end_date,
      location, content, prize, registerable_date_start,
      registerable_date_end, description, competitors_per_day, maximum_competitors,
      bank_name, bank_number, bank_acc_name, conditions, registration_method,
      rules, uniform, registration_deadline, nickname_enabled, uniform_enabled, cue_reg_enabled,
      group_id, // ✅ Thêm dòng này
      rank1, rank2, rank3,
      attendance_fee_rank1, attendance_fee_rank2, attendance_fee_rank3
    } = req.body;

    try {
        const query = `
          UPDATE tournament_events
          SET name = $1,
              code = $2,
              attendance_fee_common = $3,
              start_date = $4,
              end_date = $5,
              location = $6,
              content = $7,
              prize = $8,
              registerable_date_start = $9,
              registerable_date_end = $10,
              description = $11,
              competitors_per_day = $12,
              maximum_competitors = $13,
              bank_name = $14,
              bank_number = $15,
              bank_acc_name = $16,
              conditions = $17,
              registration_method = $18,
              rules = $19,
              uniform = $20,
              registration_deadline = $21,
              nickname_enabled = $22,
              uniform_enabled = $23,
              cue_reg_enabled = $24,
              group_id = $25,
              rank1 = $26,
              rank2 = $27,
              rank3 = $28,
              attendance_fee_rank1 = $29,
              attendance_fee_rank2 = $30,
              attendance_fee_rank3 = $31,
              fee_label_rank1 = $32,
              fee_label_rank2 = $33,
              fee_label_rank3 = $34
          WHERE id = $35
        `;
        await client.query(query, [
          name, code, attendance_fee_common, start_date, end_date,
          location, content, prize, registerable_date_start,
          registerable_date_end, description, competitors_per_day, maximum_competitors,
          bank_name, bank_number, bank_acc_name, conditions, registration_method, rules, uniform,
          registration_deadline, nickname_enabled, uniform_enabled, cue_reg_enabled,
          group_id, rank1, rank2, rank3,
          attendance_fee_rank1, attendance_fee_rank2, attendance_fee_rank3,
          fee_label_rank1, fee_label_rank2, fee_label_rank3,
          id
        ]);
        res.json({ message: 'Cập nhật thành công.' });
    } catch (error) {
        console.error('Update tournament error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật.' });
    }
});

// Delete tournament
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await client.query('DELETE FROM tournament_events WHERE id = $1', [id]);
        res.json({ message: 'Đã xoá giải đấu.' });
    } catch (error) {
        console.error('Delete tournament error:', error);
        res.status(500).json({ message: 'Lỗi khi xoá giải đấu.' });
    }
});

router.post('/upload-list-background', uploadBackground.single('background'), async (req, res) => {
    try {
        const fileName = req.file.filename;

        // Lưu tên file vào file config JSON đơn giản
        const fs = require('fs');
        fs.writeFileSync('uploads/backgrounds/list_background_config.json', JSON.stringify({ filename: fileName }));

        res.json({ message: 'Upload thành công', filename: fileName });
    } catch (error) {
        console.error('Error uploading list background:', error);
        res.status(500).json({ message: 'Lỗi khi upload hình nền' });
    }
});

// Get current list background image
router.get('/list-background', async (req, res) => {
    try {
        const fs = require('fs');
        const path = 'uploads/backgrounds/list_background_config.json';
        if (fs.existsSync(path)) {
            const content = fs.readFileSync(path);
            const config = JSON.parse(content);
            res.json({ filename: config.filename });
        } else {
            res.json({ filename: null });
        }
    } catch (error) {
        console.error('Error reading list background config:', error);
        res.status(500).json({ message: 'Lỗi khi đọc cấu hình hình nền' });
    }
});

router.get('/groups', async (req, res) => {
  const search = req.query.search || '';
  try {
    const result = await client.query(
      `SELECT id, tournament_name FROM tournament_group WHERE tournament_name ILIKE $1 ORDER BY tournament_name ASC`,
      [`%${search}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách nhóm giải' });
  }
});

// GET group info và list tournament_events theo group_id
router.get('/group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    // Lấy group info
    const groupResult = await client.query(
      `SELECT * FROM tournament_group WHERE id = $1`, [groupId]
    );
    if (groupResult.rows.length === 0)
      return res.status(404).json({ message: 'Không tìm thấy group' });

    // Lấy danh sách tournament con
    const tournamentResult = await client.query(
      `SELECT * FROM tournament_events WHERE group_id = $1 ORDER BY start_date ASC`, [groupId]
    );

    res.json({
      group: groupResult.rows[0],
      tournament_events: tournamentResult.rows
    });
  } catch (error) {
    console.error('Lỗi lấy group:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy group' });
  }
});

// Multer config cho background group
const groupBackgroundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/backgrounds/groups');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadGroupBackground = multer({ storage: groupBackgroundStorage });

// API tạo nhóm giải (tournament_group)
router.post('/tournament-group', async (req, res) => {
  const { tournament_name, description, start_date, end_date } = req.body;
  if (!tournament_name) {
    return res.status(400).json({ message: 'Tên nhóm không được để trống' });
  }
  try {
    const result = await client.query(
      `INSERT INTO tournament_group (tournament_name, description, start_date, end_date, created_date, modified_date)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [tournament_name, description || null, start_date || null, end_date || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Lỗi khi tạo nhóm giải' });
  }
});

// API upload background cho group
router.post('/group/:groupId/upload-background', uploadGroupBackground.single('background'), async (req, res) => {
  const { groupId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Không có file nào được tải lên.' });
  try {
    await client.query(
      'UPDATE tournament_group SET background_image = $1 WHERE id = $2',
      [file.filename, groupId]
    );
    res.json({ message: 'Cập nhật hình nền group thành công', filename: file.filename });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật background group' });
  }
});

const fs = require('fs');

// Multer config cho điều lệ
const regulationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/regulations'); // Thư mục đã tồn tại
  },
  filename: async (req, file, cb) => {
    const groupId = req.params.groupId;

    try {
      const result = await client.query(`SELECT tournament_name FROM tournament_group WHERE id = $1`, [groupId]);
      if (result.rows.length === 0) return cb(new Error('Group not found'), '');

      const name = result.rows[0].tournament_name.replace(/\s+/g, '');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const newName = `${name}_${dateStr}_ĐiềuLệ.pdf`;

      cb(null, newName);
    } catch (err) {
      cb(err, '');
    }
  }
});
const uploadRegulation = multer({ storage: regulationStorage });

router.post('/group/:groupId/upload-regulation', uploadRegulation.single('regulation'), async (req, res) => {
  const { groupId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Không có file nào được tải lên.' });

  try {
    await client.query(
      `UPDATE tournament_group SET regulations = $1, modified_date = NOW() WHERE id = $2`,
      [file.filename, groupId]
    );
    res.json({ message: '✅ Đã cập nhật điều lệ giải', filename: file.filename });
  } catch (err) {
    console.error('Lỗi cập nhật regulations:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật điều lệ' });
  }
});

router.delete('/tournament-group/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    // Kiểm tra tồn tại
    const check = await client.query('SELECT id FROM tournament_group WHERE id = $1', [groupId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Nhóm không tồn tại' });
    }

    // Xóa
    await client.query('DELETE FROM tournament_group WHERE id = $1', [groupId]);
    res.json({ message: 'Đã xoá nhóm giải.' });
  } catch (err) {
    console.error('Lỗi xoá nhóm:', err);
    res.status(500).json({ message: 'Lỗi server khi xoá nhóm' });
  }
});

router.put('/tournament-group/:id', async (req, res) => {
  const { id } = req.params;
  const {
    tournament_name,
    description,
    start_date,
    end_date,
    display,
  } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (tournament_name !== undefined) {
      fields.push(`tournament_name = $${idx++}`);
      values.push(tournament_name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (start_date !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(start_date);
    }
    if (end_date !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(end_date);
    }
    if (display !== undefined) {
      fields.push(`display = $${idx++}`);
      values.push(display);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Không có trường nào để cập nhật.' });
    }

    fields.push(`modified_date = NOW()`);

    const query = `
      UPDATE tournament_group SET ${fields.join(', ')} WHERE id = $${idx}
    `;
    values.push(id);

    await client.query(query, values);
    res.json({ message: 'Đã cập nhật nhóm giải.' });
  } catch (error) {
    console.error('Lỗi khi cập nhật tournament_group:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// ✅ Route lấy 3 group sắp tới + địa chỉ event đầu tiên
router.get('/upcoming-groups', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT g.id, g.tournament_name, g.start_date, g.end_date, g.display,
        (
          SELECT location
          FROM tournament_events e
          WHERE e.group_id = g.id
          ORDER BY e.start_date ASC
          LIMIT 1
        ) AS event_location,
        g.regulations
      FROM tournament_group g
      WHERE g.start_date IS NOT NULL
      ORDER BY g.start_date ASC
      LIMIT 3
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi khi lấy nhóm giải sắp tới:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy nhóm giải.' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(`
      SELECT t.*, g.tournament_name AS group_name
      FROM tournament_events t
      LEFT JOIN tournament_group g ON t.group_id = g.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Không tìm thấy giải đấu' });
    }
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;