const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await db.getTeamsContacts());
});

router.get('/:department', async (req, res) => {
  res.json(await db.getTeamsContactsByDepartment(req.params.department));
});

router.post('/', async (req, res) => {
  const { department, name, email } = req.body;
  res.json(await db.addTeamsContact(department, name, email));
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { department, name, email } = req.body;
  res.json(await db.updateTeamsContact(id, department, name, email));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  res.json(await db.deleteTeamsContact(id));
});

module.exports = router;
