const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.getAnalytics());
});

router.post('/visit', (req, res) => {
  res.json(db.registerVisit());
});

module.exports = router;
