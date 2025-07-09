const db = require('../config/db');

// Logo CRUD
exports.getLogos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mainpage_logo_settings');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logos' });
  }
};

exports.createLogo = async (req, res) => {
  const { settings_item, settings_value } = req.body;
  try {
    await db.query('INSERT INTO mainpage_logo_settings (settings_item, settings_value) VALUES ($1, $2)', [settings_item, settings_value]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create logo' });
  }
};

exports.updateLogo = async (req, res) => {
  const { settings_item, settings_value } = req.body;
  try {
    await db.query('UPDATE mainpage_logo_settings SET settings_value = $2 WHERE settings_item = $1', [settings_item, settings_value]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update logo' });
  }
};

exports.deleteLogo = async (req, res) => {
  const { settings_item } = req.params;
  try {
    await db.query('DELETE FROM mainpage_logo_settings WHERE settings_item = $1', [settings_item]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete logo' });
  }
};

// Event CRUD
exports.getEvents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mainpage_event_settings ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

exports.createEvent = async (req, res) => {
  const { id, event_name, event_photo, event_video, event_content, event_date } = req.body;
  try {
    await db.query(
      'INSERT INTO mainpage_event_settings (id, event_name, event_photo, event_video, event_content, event_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, event_name, event_photo, event_video, event_content, event_date]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

exports.updateEvent = async (req, res) => {
  const { id, event_name, event_photo, event_video, event_content, event_date } = req.body;
  try {
    await db.query(
      'UPDATE mainpage_event_settings SET event_name=$2, event_photo=$3, event_video=$4, event_content=$5, event_date=$6 WHERE id=$1',
      [id, event_name, event_photo, event_video, event_content, event_date]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM mainpage_event_settings WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

exports.getEventsInternal = async () => {
  try {
    const result = await db.query('SELECT * FROM mainpage_event_settings ORDER BY event_date DESC');
    return result.rows;
  } catch (err) {
    console.error('getEventsInternal error:', err);
    return [];
  }
};

exports.getTournamentGroupByName = async (req, res) => {
  const { name } = req.query;
  try {
    const result = await db.query('SELECT id FROM tournament_group WHERE TRIM(tournament_name) ILIKE TRIM($1)', [name]);
    if (result.rows.length) {
      res.json({ group_id: result.rows[0].id });
    } else {
      res.json({ group_id: null });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group ID' });
  }
};