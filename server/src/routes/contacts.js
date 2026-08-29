const express = require('express');
const db = require('../data');

const router = express.Router();

router.get('/', (req, res) => {
  const { q } = req.query;
  res.json(db.getContacts(q));
});

router.post('/', (req, res) => {
  const { name, phone, department, ip, city, phoneModel } = req.body;
  res.json(db.addContact(name, phone, department, ip, city, phoneModel));
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, department, ip, city, phoneModel } = req.body;
  res.json(db.updateContact(id, name, phone, department, ip, city, phoneModel));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  res.json(db.deleteContact(id));
});

router.patch('/:id/visibility', (req, res) => {
  const id = Number(req.params.id);
  const { hidden } = req.body;
  res.json(db.toggleContactVisibility(id, hidden));
});

router.patch('/:id/reorder', (req, res) => {
  const id = Number(req.params.id);
  const { direction } = req.body;
  res.json(db.reorderContact(id, direction));
});

router.patch('/department/rename', (req, res) => {
  const { oldDepartment, newDepartment } = req.body;
  res.json(db.renameDepartment(oldDepartment, newDepartment));
});

router.get('/last-updated', (req, res) => {
  res.json({ lastUpdated: db.getLastUpdated() });
});

module.exports = router;
