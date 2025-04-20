const express = require('express');
const { registerUser, confirmRegistration } = require('../controllers/authController');
const { loginUser } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.get('/confirm/:token', confirmRegistration);
router.post('/login', loginUser);
router.get('/tournaments', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
        const dataQuery = 'SELECT * FROM tournaments ORDER BY start_date DESC LIMIT $1 OFFSET $2';
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
        console.error('Error fetching paginated tournaments:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách.' });
    }
});
router.post('/tournaments', async (req, res) => {
    const { name, code, start_date, end_date } = req.body;

    if (!name || !code || !start_date || !end_date) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
    }

    try {
        const query = `
            INSERT INTO tournaments (name, code, start_date, end_date)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await client.query(query, [name, code, start_date, end_date]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ message: 'Lỗi khi tạo giải đấu.' });
    }
});
router.put('/tournaments/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, start_date, end_date } = req.body;

    try {
        const query = `
            UPDATE tournaments
            SET name = $1, code = $2, start_date = $3, end_date = $4
            WHERE id = $5
        `;
        await client.query(query, [name, code, start_date, end_date, id]);
        res.json({ message: 'Cập nhật thành công.' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật.' });
    }
});
router.delete('/tournaments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await client.query('DELETE FROM tournaments WHERE id = $1', [id]);
        res.json({ message: 'Đã xoá giải đấu.' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Lỗi khi xoá.' });
    }
});

module.exports = router;
