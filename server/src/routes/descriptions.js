const express = require('express');
const db = require('../data');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getDepartmentDescriptions());
});

router.put('/', requireAdmin, async (req, res) => {
  const { department, description } = req.body;
  res.json(await db.updateDepartmentDescription(department, description));
});

module.exports = router;
