const express = require('express');
const router = express.Router();
const client = require('../config/db');
const multer = require('multer');
const path = require('path');
const tournamentController = require('../controllers/tournament.controller');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/backgrounds');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Route upload background
router.post('/:id/upload-background', upload.single('background'), tournamentController.uploadBackground);

// List tournaments (paginated)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
        const dataQuery = 'SELECT * FROM tournaments ORDER BY start_date ASC LIMIT $1 OFFSET $2';
        const countQuery = 'SELECT COUNT(*) FROM tournaments';

        const dataResult = await client.query(dataQuery, [limit, offset]);
        const countResult = await client.query(countQuery);

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
        description
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
                description = $11
            WHERE id = $12
        `;
        await client.query(query, [
            name, code, attendance_price, start_date, end_date,
            location, content, prize, registerable_date_start,
            registerable_date_end, description, id
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

router.post('/upload-list-background', upload.single('background'), async (req, res) => {
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
        const path = 'uploads/list_background_config.json';
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

module.exports = router;