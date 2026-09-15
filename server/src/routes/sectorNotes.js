const express = require('express');
const pool = require('../db/pool');
const { requireSectorManagement, requireSectorView } = require('../authorization/sectors');

const router = express.Router({ mergeParams: true });

function values(body = {}, current = {}) {
  const titleValue = body.title === undefined ? current.title : body.title;
  const title = titleValue === null || titleValue === '' ? null : String(titleValue).trim();
  const content = body.content === undefined ? current.content : String(body.content).trim();
  const pinned = body.pinned === undefined ? current.pinned ?? false : body.pinned;
  const expiryValue = body.expires_at === undefined ? current.expires_at : body.expires_at;
  let expiresAt = null;
  if (expiryValue) {
    expiresAt = new Date(expiryValue);
    if (Number.isNaN(expiresAt.getTime())) return { error: 'Data de expiração inválida.' };
  }
  if (title && title.length > 160) return { error: 'Título deve ter até 160 caracteres.' };
  if (!content || content.length > 20000) return { error: 'Conteúdo inválido.' };
  if (typeof pinned !== 'boolean') return { error: 'O campo pinned deve ser booleano.' };
  return { title, content, pinned, expiresAt };
}

const columns = `id, sector_id, author_user_id, title, content, pinned, expires_at, created_at, updated_at`;

router.get('/', requireSectorView, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${columns} FROM sector_notes WHERE sector_id = $1
       AND (expires_at IS NULL OR expires_at > now()) ORDER BY pinned DESC, updated_at DESC`,
      [req.sectorId]
    );
    res.json({ success: true, notes: rows });
  } catch (error) { next(error); }
});

router.post('/', requireSectorManagement, async (req, res, next) => {
  const value = values(req.body);
  if (value.error) return res.status(400).json({ success: false, error: value.error });
  try {
    const { rows } = await pool.query(
      `INSERT INTO sector_notes (sector_id, author_user_id, title, content, pinned, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${columns}`,
      [req.sectorId, req.user.id, value.title, value.content, value.pinned, value.expiresAt]
    );
    res.status(201).json({ success: true, note: rows[0] });
  } catch (error) { next(error); }
});

router.patch('/:id', requireSectorManagement, async (req, res, next) => {
  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM sector_notes WHERE id = $1 AND sector_id = $2', [req.params.id, req.sectorId]);
    if (!currentRows[0]) return res.status(404).json({ success: false, error: 'Nota não encontrada.' });
    const value = values(req.body, currentRows[0]);
    if (value.error) return res.status(400).json({ success: false, error: value.error });
    const { rows } = await pool.query(
      `UPDATE sector_notes SET title = $1, content = $2, pinned = $3, expires_at = $4, updated_at = now()
       WHERE id = $5 AND sector_id = $6 RETURNING ${columns}`,
      [value.title, value.content, value.pinned, value.expiresAt, req.params.id, req.sectorId]
    );
    res.json({ success: true, note: rows[0] });
  } catch (error) { next(error); }
});

router.delete('/:id', requireSectorManagement, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM sector_notes WHERE id = $1 AND sector_id = $2', [req.params.id, req.sectorId]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Nota não encontrada.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
