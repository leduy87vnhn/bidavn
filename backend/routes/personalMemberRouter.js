const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/personalMemberController');


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/players'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `player_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const multiUpload = upload.fields([
  { name: 'citizen_id_front_photo', maxCount: 1 },
  { name: 'citizen_id_back_photo', maxCount: 1 },
  { name: 'face_photo', maxCount: 1 }
]);

router.get('/me', controller.getByPhone);
router.put('/update-player', multiUpload, controller.updatePlayer);
router.post('/register-member', controller.registerMember);

module.exports = router;