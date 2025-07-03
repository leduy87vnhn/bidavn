const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainPageController');

router.get('/logos', controller.getLogos);
router.get('/events', controller.getTopEvents);
router.get('/news', controller.getNews);
router.get('/videos', controller.getVideos);

module.exports = router;