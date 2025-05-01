const pool = require('../config/db');

// Upload background image
exports.uploadBackground = async (req, res) => {
    const tournamentId = req.params.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }

    try {
        const fileName = file.filename;

        await pool.query(
            'UPDATE tournaments SET background_image = $1 WHERE id = $2',
            [fileName, tournamentId]
        );

        res.status(200).json({ message: 'Cập nhật hình nền thành công', filename: fileName });
    } catch (error) {
        console.error('Lỗi khi cập nhật hình nền:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật hình nền' });
    }
};