const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

function validFavorite(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const url = typeof body?.url === 'string' ? body.url.trim() : '';
  if (!title || title.length > 120) return { error: 'Título inválido.' };
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    return { error: 'URL inválida.' };
  }
  return { title, url };
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, url, sort_order, created_at, updated_at
       FROM personal_favorites WHERE user_id = $1 ORDER BY sort_order, id`,
      [req.user.id]
    );
    res.json({ success: true, favorites: rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  const value = validFavorite(req.body);
  if (value.error) return res.status(400).json({ success: false, error: value.error });
  try {
    const { rows } = await pool.query(
      `INSERT INTO personal_favorites (user_id, title, url, sort_order)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM personal_favorites WHERE user_id = $1), 0))
       RETURNING id, title, url, sort_order, created_at, updated_at`,
      [req.user.id, value.title, value.url]
    );
    res.status(201).json({ success: true, favorite: rows[0] });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  const value = validFavorite(req.body);
  if (value.error) return res.status(400).json({ success: false, error: value.error });
  try {
    const { rows } = await pool.query(
      `UPDATE personal_favorites SET title = $1, url = $2, updated_at = now()
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, url, sort_order, created_at, updated_at`,
      [value.title, value.url, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Favorito não encontrado.' });
    res.json({ success: true, favorite: rows[0] });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM personal_favorites WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ success: false, error: 'Favorito não encontrado.' });
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.put('/order/all', async (req, res, next) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(Number(id)))) {
    return res.status(400).json({ success: false, error: 'Ordem inválida.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id FROM personal_favorites WHERE user_id = $1 ORDER BY id', [req.user.id]);
    const owned = rows.map((row) => row.id).sort((a, b) => a - b);
    const requested = [...new Set(ids.map(Number))].sort((a, b) => a - b);
    if (JSON.stringify(owned) !== JSON.stringify(requested)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'A ordem deve conter somente todos os seus favoritos.' });
    }
    for (let index = 0; index < ids.length; index++) {
      await client.query('UPDATE personal_favorites SET sort_order = $1, updated_at = now() WHERE id = $2 AND user_id = $3', [index, ids[index], req.user.id]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally { client.release(); }
});

module.exports = router;
