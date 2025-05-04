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

const getTournamentById = async (req, res) => {
    const tournamentId = req.params.id;
    try {
      const query = `
        SELECT id, name, start_date, end_date, location, content
        FROM tournaments
        WHERE id = $1
      `;
      const result = await req.client.query(query, [tournamentId]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy giải đấu' });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Lỗi khi lấy giải đấu:', err);
      res.status(500).json({ message: 'Lỗi server khi lấy giải đấu' });
    }
  };
  
  module.exports = {
    getTournamentById,
    uploadBackground
  };