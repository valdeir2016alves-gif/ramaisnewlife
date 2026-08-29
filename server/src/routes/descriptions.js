const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.getDepartmentDescriptions());
});

router.put('/', (req, res) => {
  const { department, description } = req.body;
  res.json(db.updateDepartmentDescription(department, description));
});

module.exports = router;
