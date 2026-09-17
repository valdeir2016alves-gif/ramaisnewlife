const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getNocTickets());
});

router.post('/', async (req, res) => {
  const { name, department, subject, description } = req.body;
  res.json(await db.submitNocTicket(name, department, subject, description));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  res.json(await db.deleteNocTicket(id));
});

module.exports = router;
