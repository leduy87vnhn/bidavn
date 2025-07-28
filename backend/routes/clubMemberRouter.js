const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/clubMemberController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/clubs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `club_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', upload.single('logo'), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;