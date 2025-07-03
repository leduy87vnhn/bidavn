const db = require('../config/db');

exports.getLogos = async (req, res) => {
  try {
    const result = await db.query("SELECT settings_item, settings_value FROM mainpage_logo_settings");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

exports.getTopEvents = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT event_name, event_photo, event_content
       FROM mainpage_event_settings
       ORDER BY event_date DESC
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT event_name, event_photo, event_date
       FROM mainpage_event_settings
       ORDER BY event_date DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT event_name, event_video
       FROM mainpage_event_settings
       WHERE event_video IS NOT NULL AND event_video != ''
       ORDER BY event_date DESC
       LIMIT 2`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};