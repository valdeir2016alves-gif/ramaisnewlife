const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, content, pinned, completed, created_at, updated_at
       FROM personal_notes WHERE user_id = $1 ORDER BY pinned DESC, updated_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, notes: rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content || content.length > 10000) return res.status(400).json({ success: false, error: 'Conteúdo inválido.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO personal_notes (user_id, content, pinned, completed)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, pinned, completed, created_at, updated_at`,
      [req.user.id, content, req.body.pinned === true, req.body.completed === true]
    );
    res.status(201).json({ success: true, note: rows[0] });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM personal_notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const current = currentRows[0];
    if (!current) return res.status(404).json({ success: false, error: 'Nota não encontrada.' });
    const content = req.body.content === undefined ? current.content : String(req.body.content).trim();
    const pinned = req.body.pinned === undefined ? current.pinned : req.body.pinned;
    const completed = req.body.completed === undefined ? current.completed : req.body.completed;
    if (!content || content.length > 10000 || typeof pinned !== 'boolean' || typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Dados da nota inválidos.' });
    }
    const { rows } = await pool.query(
      `UPDATE personal_notes SET content = $1, pinned = $2, completed = $3, updated_at = now()
       WHERE id = $4 AND user_id = $5
       RETURNING id, content, pinned, completed, created_at, updated_at`,
      [content, pinned, completed, req.params.id, req.user.id]
    );
    res.json({ success: true, note: rows[0] });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM personal_notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Nota não encontrada.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
