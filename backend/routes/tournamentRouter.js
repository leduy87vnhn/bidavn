const express = require('express');
const router = express.Router();
const client = require('../config/db');

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
    const { name, code, cost, start_date, end_date } = req.body;

    if (!name || !code || !start_date || !end_date) {
        return res.status(400).json({ message: 'Thiếu thông tin.' });
    }

    try {
        const query = `
            INSERT INTO tournaments (name, code, cost, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await client.query(query, [name, code, cost, start_date, end_date]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo giải đấu.' });
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, cost, start_date, end_date } = req.body;

    try {
        const query = `
            UPDATE tournaments
            SET name = $1, code = $2, cost = $3, start_date = $4, end_date = $5
            WHERE id = $6
        `;
        await client.query(query, [name, code, cost, start_date, end_date, id]);
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

module.exports = router;