const express = require('express');
const db = require('../data');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res) => {
  res.json(await db.getUsers());
});

router.post('/', async (req, res) => {
  const { username, password, role } = req.body;
  const result = await db.addUser(username, password, role);
  res.status(result.success ? 201 : 400).json(result);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { username, password, role } = req.body;
  const result = await db.updateUser(id, username, password, role);
  res.status(result.success ? 200 : 400).json(result);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await db.deleteUser(id);
  res.status(result.success ? 200 : 400).json(result);
});

module.exports = router;
