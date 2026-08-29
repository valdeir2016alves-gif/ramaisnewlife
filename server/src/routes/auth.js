const express = require('express');
const db = require('../data');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  res.json(await db.authenticateUser(username, password));
});

module.exports = router;
