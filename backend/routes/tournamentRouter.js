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


// List tournaments (paginated)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T'); // ✅ đúng giờ VN
 // Chuẩn ISO để so sánh timestamp
    console.log('[DEBUG] Thời gian hiện tại (giờ VN):', now);

    let condition = '';
    let params = [limit, offset];

    if (status === 'upcoming') {
        condition = 'WHERE start_date > CAST($3 AS date)';
        params.push(now);
    } else if (status === 'ongoing') {
        condition = 'WHERE start_date <= CAST($3 AS date) AND end_date >= CAST($3 AS date)';
        params.push(now);
    } else if (status === 'ended') {
        condition = 'WHERE end_date < CAST($3 AS date)';
        params.push(now);
    }

    const dataQuery = `
        SELECT * FROM tournaments
        ${condition}
        ORDER BY start_date ASC
        LIMIT $1 OFFSET $2
    `;

    const countQuery = `
        SELECT COUNT(*) FROM tournaments
        ${condition}
    `;

    try {
        let dataResult, countResult;

        if (status === 'all') {
            dataResult = await client.query(
                'SELECT * FROM tournaments ORDER BY start_date ASC LIMIT $1 OFFSET $2',
                [limit, offset]
            );
            countResult = await client.query('SELECT COUNT(*) FROM tournaments');
        } else {
            // 💡 TÁCH params: vì count không cần limit/offset
            const filterParams = [now];
            const dataParams = [limit, offset, now];

            dataResult = await client.query(dataQuery, dataParams);
            countResult = await client.query(countQuery, filterParams);
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
        bank_name,
        bank_number,
        bank_acc_name,
        conditions,
        registration_method,
        rules,
        uniform
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
                bank_name = $13,
                bank_number = $14,
                bank_acc_name = $15,
                conditions = $16,
                registration_method = $17,
                rules = $18,
                uniform = $19
            WHERE id = $20
        `;
        await client.query(query, [
            name, code, attendance_price, start_date, end_date,
            location, content, prize, registerable_date_start,
            registerable_date_end, description, competitors_per_day,
            bank_name, bank_number, bank_acc_name, conditions, registration_method, rules, uniform,
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