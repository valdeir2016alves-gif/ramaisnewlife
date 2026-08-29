const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getUsers());
});

router.post('/', async (req, res) => {
  const { username, password, role } = req.body;
  res.json(await db.addUser(username, password, role));
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { username, password, role } = req.body;
  res.json(await db.updateUser(id, username, password, role));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  res.json(await db.deleteUser(id));
});

module.exports = router;
