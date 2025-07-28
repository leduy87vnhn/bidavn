const client = require('../config/db');

exports.getAll = async (req, res) => {
  const result = await client.query('SELECT * FROM club_members ORDER BY id ASC');
  res.json(result.rows);
};

exports.create = async (req, res) => {
  const { club, address, info } = req.body;
  const idResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM club_members');
  const id = idResult.rows[0].id;

  await client.query(
    'INSERT INTO club_members (id, club, address, info) VALUES ($1, $2, $3, $4)',
    [id, club, address, info]
  );
  res.json({ success: true });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { club, address, info } = req.body;
  const logo = req.file?.filename;

  if (logo) {
    await client.query(
      'UPDATE club_members SET club=$1, address=$2, info=$3, logo=$4 WHERE id=$5',
      [club, address, info, logo, id]
    );
  } else {
    await client.query(
      'UPDATE club_members SET club=$1, address=$2, info=$3 WHERE id=$4',
      [club, address, info, id]
    );
  }

  res.json({ success: true });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  await client.query('DELETE FROM club_members WHERE id = $1', [id]);
  res.json({ success: true });
};