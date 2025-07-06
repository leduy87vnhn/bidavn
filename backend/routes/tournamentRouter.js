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

// List tournaments (paginated)
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
        (
          SELECT COUNT(*)
          FROM registration_form rf
          LEFT JOIN competitors c ON c.registration_form_id = rf.id
          LEFT JOIN players p ON c.player_id = p.id
          WHERE rf.tournament_id = t.id AND rf.status = '1' AND p.id IS NOT NULL
        ) AS approved_competitors_count
      FROM tournaments t
      LEFT JOIN tournament_group tg ON t.group_id = tg.id
      ${condition}
      ORDER BY t.start_date ASC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM tournaments t
      ${condition}
    `;

    try {
        let dataResult, countResult;

        if (status === 'all') {
            dataResult = await client.query(`
              SELECT 
                t.*, 
                tg.tournament_name AS group_name,
                (
                  SELECT COUNT(*)
                  FROM registration_form rf
                  LEFT JOIN competitors c ON c.registration_form_id = rf.id
                  LEFT JOIN players p ON c.player_id = p.id
                  WHERE rf.tournament_id = t.id AND rf.status = '1' AND p.id IS NOT NULL
                ) AS approved_competitors_count
              FROM tournaments t
              LEFT JOIN tournament_group tg ON t.group_id = tg.id
              ORDER BY t.start_date ASC
              LIMIT $1 OFFSET $2
            `, [limit, offset]);

            countResult = await client.query('SELECT COUNT(*) FROM tournaments');
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
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách giải đấu.' });
    }
});

// Add tournament
router.post('/', async (req, res) => {
    const { name, code, attendance_price, start_date, end_date } = req.body;

    if (!name || !code || !start_date || !end_date) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
    }

    try {
        const query = `
            INSERT INTO tournaments (name, code, attendance_price, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await client.query(query, [name, code, attendance_price, start_date, end_date]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo giải đấu.' });
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name,
        code,
        attendance_price,
        start_date,
        end_date,
        location,
        content,
        prize,
        registerable_date_start,
        registerable_date_end,
        description,
        competitors_per_day,
        maximum_competitors,
        bank_name,
        bank_number,
        bank_acc_name,
        conditions,
        registration_method,
        rules,
        uniform,
        registration_deadline,
        nickname_enabled,
        uniform_enabled,
        cue_reg_enabled
      } = req.body;

    try {
        const query = `
            UPDATE tournaments
            SET name = $1,
                code = $2,
                attendance_price = $3,
                start_date = $4,
                end_date = $5,
                location = $6,
                content = $7,
                prize = $8,
                registerable_date_start = $9,
                registerable_date_end = $10,
                description = $11,
                competitors_per_day = $12,
                maximum_competitors=$13,
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
                cue_reg_enabled = $24
            WHERE id = $25
        `;
        await client.query(query, [
            name, code, attendance_price, start_date, end_date,
            location, content, prize, registerable_date_start,
            registerable_date_end, description, competitors_per_day, maximum_competitors,
            bank_name, bank_number, bank_acc_name, conditions, registration_method, rules, uniform,
            registration_deadline, nickname_enabled, uniform_enabled, cue_reg_enabled,
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
        await client.query('DELETE FROM tournaments WHERE id = $1', [id]);
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

// GET group info và list tournaments theo group_id
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
      `SELECT * FROM tournaments WHERE group_id = $1 ORDER BY start_date ASC`, [groupId]
    );

    res.json({
      group: groupResult.rows[0],
      tournaments: tournamentResult.rows
    });
  } catch (error) {
    console.error('Lỗi lấy group:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy group' });
  }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.query('SELECT * FROM tournaments WHERE id = $1', [id]);
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