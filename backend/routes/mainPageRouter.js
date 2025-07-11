const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainPageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

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
router.get('/tournament-groups-info', controller.getTournamentGroupsWithInfo);

// Upload endpoints
router.post('/upload-logo', uploadLogo.single('image'), (req, res) => {
  res.json({ filePath: '~/billard/bidavn/backend/uploads/logos/' + req.file.filename });
});

router.post('/upload-event', uploadEvent.single('image'), (req, res) => {
  res.json({ filePath: '~/billard/bidavn/backend/uploads/events/' + req.file.filename });
});

router.get('/events', async (req, res) => {
  try {
    const result = await controller.getEventsInternal(); // tái sử dụng logic
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/news', async (req, res) => {
  try {
    const result = await controller.getEventsInternal(); // internal helper
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/videos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM mainpage_event_settings 
      WHERE TRIM(COALESCE(event_video, '')) <> ''
      ORDER BY event_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Video fetch error:', err); // ← in chi tiết
    res.status(500).json({ error: err.message });
  }
});

router.get('/tournament-group-by-name', controller.getTournamentGroupByName);


module.exports = router;