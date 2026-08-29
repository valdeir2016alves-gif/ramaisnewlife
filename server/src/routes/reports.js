const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.getReports());
});

router.post('/', async (req, res) => {
  const { name, ramal, message } = req.body;
  res.json(await db.submitReport(name, ramal, message));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  res.json(db.deleteReport(id));
});

module.exports = router;
