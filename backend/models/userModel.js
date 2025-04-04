const client = require('../config/db');

async function logUserAction(user_id, user_name, action) {
  try {
    await client.query(
      'INSERT INTO user_audit (user_id, user_name, action) VALUES ($1, $2, $3)',
      [user_id, user_name, action]
    );
  } catch (err) {
    console.error('Audit logging failed:', err.message);
  }
}

module.exports = { logUserAction };