const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.getUsers());
});

router.post('/', (req, res) => {
  const { username, password, role } = req.body;
  res.json(db.addUser(username, password, role));
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { username, password, role } = req.body;
  res.json(db.updateUser(id, username, password, role));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  res.json(db.deleteUser(id));
});

module.exports = router;
