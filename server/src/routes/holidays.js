const express = require('express');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try { res.json({ success: true, holidays: (await pool.query('SELECT id, date, name, city FROM holidays ORDER BY date')).rows }); }
  catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  const date = req.body?.date;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const city = req.body?.city ? String(req.body.city).trim() : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !name) return res.status(400).json({ success: false, error: 'Feriado inválido.' });
  try {
    const { rows } = await pool.query('INSERT INTO holidays (date, name, city) VALUES ($1, $2, $3) RETURNING id, date, name, city', [date, name, city]);
    res.status(201).json({ success: true, holiday: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, error: 'Feriado já cadastrado para essa data e cidade.' });
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Feriado não encontrado.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
