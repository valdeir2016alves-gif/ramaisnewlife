const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getAnalytics());
});

router.post('/visit', async (req, res) => {
  res.json(await db.registerVisit());
});

module.exports = router;
