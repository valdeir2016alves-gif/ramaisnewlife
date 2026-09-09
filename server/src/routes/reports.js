const express = require('express');
const db = require('../data');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  res.json(await db.getReports());
});

router.post('/', async (req, res) => {
  const { name, ramal, message } = req.body;
  res.json(await db.submitReport(name, ramal, message));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  res.json(await db.deleteReport(id));
});

module.exports = router;
