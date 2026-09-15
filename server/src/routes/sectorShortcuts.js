const express = require('express');
const pool = require('../db/pool');
const { requireSectorManagement, requireSectorView } = require('../authorization/sectors');

const router = express.Router({ mergeParams: true });

function parse(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!title || title.length > 120) return null;
  try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) return null; } catch { return null; }
  return { title, url };
}

router.get('/', requireSectorView, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, title, url, sort_order, created_at, updated_at FROM sector_shortcuts WHERE sector_id = $1 ORDER BY sort_order, id', [req.sectorId]);
    res.json({ success: true, shortcuts: rows });
  } catch (error) { next(error); }
});

router.post('/', requireSectorManagement, async (req, res, next) => {
  const value = parse(req.body);
  if (!value) return res.status(400).json({ success: false, error: 'Título ou URL inválido.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO sector_shortcuts (sector_id, title, url, sort_order, created_by_user_id)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM sector_shortcuts WHERE sector_id = $1), 0), $4)
       RETURNING id, title, url, sort_order, created_at, updated_at`,
      [req.sectorId, value.title, value.url, req.user.id]
    );
    res.status(201).json({ success: true, shortcut: rows[0] });
  } catch (error) { next(error); }
});

router.put('/:id', requireSectorManagement, async (req, res, next) => {
  const value = parse(req.body);
  if (!value) return res.status(400).json({ success: false, error: 'Título ou URL inválido.' });
  try {
    const { rows } = await pool.query(
      `UPDATE sector_shortcuts SET title = $1, url = $2, updated_at = now()
       WHERE id = $3 AND sector_id = $4 RETURNING id, title, url, sort_order, created_at, updated_at`,
      [value.title, value.url, req.params.id, req.sectorId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Atalho não encontrado.' });
    res.json({ success: true, shortcut: rows[0] });
  } catch (error) { next(error); }
});

router.delete('/:id', requireSectorManagement, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM sector_shortcuts WHERE id = $1 AND sector_id = $2', [req.params.id, req.sectorId]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Atalho não encontrado.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
