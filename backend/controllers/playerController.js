const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadFolder = path.join(__dirname, '../uploads/players');

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const filename = req.body.filename || file.originalname;
    cb(null, filename);
  }
});

const upload = multer({ storage });

const uploadSinglePlayerPhoto = upload.single('file');

const handleUploadPlayerPhoto = (req, res) => {
  try {
    const filename = req.file.filename;
    const filePath = `uploads/players/${filename}`;
    res.json({ filePath });
  } catch (err) {
    console.error('❌ Lỗi upload ảnh:', err);
    res.status(500).json({ message: 'Upload thất bại' });
  }
};

module.exports = {
  uploadSinglePlayerPhoto,
  handleUploadPlayerPhoto
};