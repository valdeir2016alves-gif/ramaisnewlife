const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getDepartmentDescriptions());
});

router.put('/', async (req, res) => {
  const { department, description } = req.body;
  res.json(await db.updateDepartmentDescription(department, description));
});

module.exports = router;
