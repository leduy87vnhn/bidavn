const client = require('../config/db');

exports.getByPhone = async (req, res) => {
  const { phone } = req.query;
  const result = await client.query('SELECT * FROM players WHERE phone = $1 LIMIT 1', [phone]);
  res.json(result.rows[0]);
};

exports.updatePlayer = async (req, res) => {
  const { id, name, address, citizen_id_passport } = req.body;
  const front = req.files?.citizen_id_front_photo?.[0]?.filename;
  const back = req.files?.citizen_id_back_photo?.[0]?.filename;
  const face = req.files?.face_photo?.[0]?.filename;

  let sql = 'UPDATE players SET name=$1, address=$2, citizen_id_passport=$3';
  const values = [name, address, citizen_id_passport];
  let idx = 4;

  if (front) {
    sql += `, citizen_id_front_photo=$${idx++}`;
    values.push(front);
  }
  if (back) {
    sql += `, citizen_id_back_photo=$${idx++}`;
    values.push(back);
  }
  if (face) {
    sql += `, face_photo=$${idx++}`;
    values.push(face);
  }

  sql += ` WHERE id=$${idx}`;
  values.push(id);

  await client.query(sql, values);
  res.json({ success: true });
};

exports.registerMember = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu player ID' });

  await client.query('UPDATE players SET member_status = 1 WHERE id = $1', [id]);
  res.json({ success: true });
};