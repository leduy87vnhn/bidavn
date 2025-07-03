const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainPageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if not exist
const logoDir = path.join(__dirname, '../uploads/logos');
const eventDir = path.join(__dirname, '../uploads/events');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });
if (!fs.existsSync(eventDir)) fs.mkdirSync(eventDir, { recursive: true });

const storageLogo = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const storageEvent = multer.diskStorage({
  destination: (req, file, cb) => cb(null, eventDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const uploadLogo = multer({ storage: storageLogo });
const uploadEvent = multer({ storage: storageEvent });

// Logo routes
router.get('/logos', controller.getLogos);
router.post('/create-logo', controller.createLogo);
router.post('/update-logo', controller.updateLogo);
router.delete('/delete-logo/:settings_item', controller.deleteLogo);

// Event routes
router.get('/events-full', controller.getEvents);
router.post('/create-event', controller.createEvent);
router.post('/update-event', controller.updateEvent);
router.delete('/delete-event/:id', controller.deleteEvent);

// Upload endpoints
router.post('/upload-logo', uploadLogo.single('image'), (req, res) => {
  res.json({ filePath: '/uploads/logos/' + req.file.filename });
});

router.post('/upload-event', uploadEvent.single('image'), (req, res) => {
  res.json({ filePath: '/uploads/events/' + req.file.filename });
});

module.exports = router;