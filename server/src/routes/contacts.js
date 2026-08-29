const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  res.json(await db.getContacts(q));
});

router.post('/', async (req, res) => {
  const { name, phone, department, ip, city, phoneModel } = req.body;
  res.json(await db.addContact(name, phone, department, ip, city, phoneModel));
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, department, ip, city, phoneModel } = req.body;
  res.json(await db.updateContact(id, name, phone, department, ip, city, phoneModel));
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  res.json(await db.deleteContact(id));
});

router.patch('/:id/visibility', async (req, res) => {
  const id = Number(req.params.id);
  const { hidden } = req.body;
  res.json(await db.toggleContactVisibility(id, hidden));
});

router.patch('/:id/reorder', async (req, res) => {
  const id = Number(req.params.id);
  const { direction } = req.body;
  res.json(await db.reorderContact(id, direction));
});

router.patch('/department/rename', async (req, res) => {
  const { oldDepartment, newDepartment } = req.body;
  res.json(await db.renameDepartment(oldDepartment, newDepartment));
});

router.get('/last-updated', async (req, res) => {
  res.json({ lastUpdated: await db.getLastUpdated() });
});

module.exports = router;
