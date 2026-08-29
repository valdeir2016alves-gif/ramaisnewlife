const express = require('express');
const db = require('../data');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  res.json(db.authenticateUser(username, password));
});

module.exports = router;
