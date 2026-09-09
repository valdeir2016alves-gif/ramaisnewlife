const express = require('express');
const pool = require('../db/pool');
const {
  requireSectorFeature,
  requireSectorManagement,
  requireSectorView,
} = require('../authorization/sectors');

const router = express.Router({ mergeParams: true });
const featureEnabled = requireSectorFeature('schedule');
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  if (!datePattern.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isoUtc(date) { return date.toISOString().slice(0, 10); }
function todayInBusinessTimezone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

router.get('/summary', requireSectorView, featureEnabled, async (req, res, next) => {
  const reference = req.query.from || todayInBusinessTimezone();
  if (!validDate(reference)) return res.status(400).json({ success: false, error: 'Data de referência inválida.' });
  const current = new Date(`${reference}T00:00:00Z`);
  const sunday = new Date(current);
  sunday.setUTCDate(sunday.getUTCDate() + ((7 - sunday.getUTCDay()) % 7));
  const monday = new Date(current);
  const weekday = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - weekday + 1);
  const weekEnd = new Date(monday);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  try {
    const { rows: nextHolidayRows } = await pool.query(
      `SELECT h.id, h.date, h.name, h.city FROM holidays h
       WHERE h.date >= $1 AND (h.city IS NULL OR EXISTS (
         SELECT 1 FROM schedule_members sm WHERE sm.sector_id = $2 AND sm.active = true AND sm.city = h.city
       )) ORDER BY h.date, h.city NULLS FIRST LIMIT 1`,
      [reference, req.sectorId]
    );
    const nextHoliday = nextHolidayRows[0] || null;
    const [{ rows: sundayPeople }, { rows: daysOff }, holidayPeopleResult] = await Promise.all([
      pool.query(
        `SELECT sm.id, sm.name, sm.city FROM schedule_entries se
         JOIN schedule_members sm ON sm.id = se.member_id
         WHERE sm.sector_id = $1 AND sm.active = true AND se.date = $2 AND se.status = 'PLANTAO'
         ORDER BY sm.sort_order, sm.name`,
        [req.sectorId, isoUtc(sunday)]
      ),
      pool.query(
        `SELECT sm.id AS member_id, sm.name, sm.city, se.date, se.note FROM schedule_entries se
         JOIN schedule_members sm ON sm.id = se.member_id
         WHERE sm.sector_id = $1 AND sm.active = true AND se.date BETWEEN $2 AND $3 AND se.status = 'FOLGA'
         ORDER BY se.date, sm.sort_order, sm.name`,
        [req.sectorId, isoUtc(monday), isoUtc(weekEnd)]
      ),
      nextHoliday
        ? pool.query(
          `SELECT sm.id, sm.name, sm.city FROM schedule_entries se
           JOIN schedule_members sm ON sm.id = se.member_id
           WHERE sm.sector_id = $1 AND sm.active = true AND se.date = $2 AND se.status = 'PLANTAO'
             AND ($3::text IS NULL OR sm.city = $3)
           ORDER BY sm.sort_order, sm.name`,
          [req.sectorId, nextHoliday.date, nextHoliday.city]
        )
        : Promise.resolve({ rows: [] }),
    ]);
    res.json({
      success: true,
      next_sunday: { date: isoUtc(sunday), people: sundayPeople },
      next_holiday: nextHoliday ? { ...nextHoliday, people: holidayPeopleResult.rows } : null,
      week: { from: isoUtc(monday), to: isoUtc(weekEnd), days_off: daysOff },
    });
  } catch (error) { next(error); }
});

router.get('/', requireSectorView, featureEnabled, async (req, res, next) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!validDate(from) || !validDate(to) || from > to) {
    return res.status(400).json({ success: false, error: 'Intervalo de datas inválido.' });
  }
  try {
    const [{ rows: members }, { rows: entries }, { rows: holidays }] = await Promise.all([
      pool.query(
        `SELECT id, name, city, active, sort_order FROM schedule_members
         WHERE sector_id = $1 ORDER BY active DESC, sort_order, id`,
        [req.sectorId]
      ),
      pool.query(
        `SELECT se.id, se.member_id, se.date, se.status, se.note
         FROM schedule_entries se JOIN schedule_members sm ON sm.id = se.member_id
         WHERE sm.sector_id = $1 AND se.date BETWEEN $2 AND $3 ORDER BY se.date, sm.sort_order`,
        [req.sectorId, from, to]
      ),
      pool.query(
        `SELECT id, date, name, city FROM holidays WHERE date BETWEEN $1 AND $2 ORDER BY date, city NULLS FIRST`,
        [from, to]
      ),
    ]);
    res.json({ success: true, members, entries, holidays });
  } catch (error) { next(error); }
});

router.post('/members', requireSectorManagement, featureEnabled, async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const city = req.body?.city ? String(req.body.city).trim() : null;
  if (!name || name.length > 160 || (city && city.length > 120)) {
    return res.status(400).json({ success: false, error: 'Dados do membro inválidos.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO schedule_members (sector_id, name, city, sort_order)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM schedule_members WHERE sector_id = $1), 0))
       RETURNING id, name, city, active, sort_order`,
      [req.sectorId, name, city]
    );
    res.status(201).json({ success: true, member: rows[0] });
  } catch (error) { next(error); }
});

router.patch('/members/:memberId', requireSectorManagement, featureEnabled, async (req, res, next) => {
  try {
    const { rows: currentRows } = await pool.query('SELECT * FROM schedule_members WHERE id = $1 AND sector_id = $2', [req.params.memberId, req.sectorId]);
    const current = currentRows[0];
    if (!current) return res.status(404).json({ success: false, error: 'Membro não encontrado.' });
    const name = req.body.name === undefined ? current.name : String(req.body.name).trim();
    const city = req.body.city === undefined ? current.city : (req.body.city ? String(req.body.city).trim() : null);
    const active = req.body.active === undefined ? current.active : req.body.active;
    const sortOrder = req.body.sort_order === undefined ? current.sort_order : Number(req.body.sort_order);
    if (!name || name.length > 160 || typeof active !== 'boolean' || !Number.isInteger(sortOrder)) {
      return res.status(400).json({ success: false, error: 'Dados do membro inválidos.' });
    }
    const { rows } = await pool.query(
      `UPDATE schedule_members SET name = $1, city = $2, active = $3, sort_order = $4, updated_at = now()
       WHERE id = $5 AND sector_id = $6 RETURNING id, name, city, active, sort_order`,
      [name, city, active, sortOrder, req.params.memberId, req.sectorId]
    );
    res.json({ success: true, member: rows[0] });
  } catch (error) { next(error); }
});

router.put('/entries', requireSectorManagement, featureEnabled, async (req, res, next) => {
  const entries = req.body?.entries;
  if (!Array.isArray(entries) || entries.length > 1000) {
    return res.status(400).json({ success: false, error: 'Lote de escala inválido.' });
  }
  const normalized = [];
  for (const entry of entries) {
    const memberId = Number(entry.member_id);
    const status = entry.status === null || entry.status === 'NORMAL' ? null : entry.status;
    const note = entry.note ? String(entry.note).trim().slice(0, 1000) : null;
    if (!Number.isInteger(memberId) || !validDate(entry.date) || (status && !['PLANTAO', 'FOLGA'].includes(status))) {
      return res.status(400).json({ success: false, error: 'Lançamento de escala inválido.' });
    }
    normalized.push({ memberId, date: entry.date, status, note });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const memberIds = [...new Set(normalized.map((entry) => entry.memberId))];
    if (memberIds.length) {
      const { rows } = await client.query('SELECT id FROM schedule_members WHERE sector_id = $1 AND id = ANY($2::int[])', [req.sectorId, memberIds]);
      if (rows.length !== memberIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Membro não pertence ao setor.' });
      }
    }
    for (const entry of normalized) {
      if (!entry.status) {
        await client.query('DELETE FROM schedule_entries WHERE member_id = $1 AND date = $2', [entry.memberId, entry.date]);
      } else {
        await client.query(
          `INSERT INTO schedule_entries (member_id, date, status, note) VALUES ($1, $2, $3, $4)
           ON CONFLICT (member_id, date) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, updated_at = now()`,
          [entry.memberId, entry.date, entry.status, entry.note]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK'); next(error);
  } finally { client.release(); }
});

module.exports = router;
