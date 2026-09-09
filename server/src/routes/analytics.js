const express = require('express');
const db = require('../data');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  res.json(await db.getAnalytics());
});

router.post('/visit', async (req, res) => {
  res.json(await db.registerVisit());
});

module.exports = router;
