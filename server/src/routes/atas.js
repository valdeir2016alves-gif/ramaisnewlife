const express = require('express');
const db = require('../data');
const { pingDevice } = require('../utils/ping');

const router = express.Router();

// List ATAs with optional filters
router.get('/', async (req, res) => {
  try {
    const { q, status, city } = req.query;
    const atas = await db.getAtas({ q, status, city });
    res.json(atas);
  } catch (error) {
    console.error('Erro ao buscar ATAs:', error);
    res.status(500).json({ error: 'Erro interno ao buscar ATAs' });
  }
});

// Get single ATA
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ata = await db.getAtaById(id);
    if (!ata) return res.status(404).json({ error: 'ATA não encontrado' });
    res.json(ata);
  } catch (error) {
    console.error('Erro ao buscar ATA:', error);
    res.status(500).json({ error: 'Erro interno ao buscar ATA' });
  }
});

// Create new ATA
router.post('/', async (req, res) => {
  try {
    const { name, ip, model, city, department, ramais, notes } = req.body;
    const result = await db.addAta({ name, ip, model, city, department, ramais, notes });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao cadastrar ATA:', error);
    res.status(500).json({ error: 'Erro interno ao cadastrar ATA' });
  }
});

// Update ATA
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, ip, model, city, department, ramais, notes } = req.body;
    const result = await db.updateAta(id, { name, ip, model, city, department, ramais, notes });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar ATA:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar ATA' });
  }
});

// Delete ATA
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.deleteAta(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Erro ao excluir ATA:', error);
    res.status(500).json({ error: 'Erro interno ao excluir ATA' });
  }
});

// Ping single ATA
router.post('/:id/ping', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ata = await db.getAtaById(id);
    if (!ata) {
      return res.status(404).json({ error: 'ATA não encontrado' });
    }

    const pingRes = await pingDevice(ata.ip);
    const newStatus = pingRes.online ? 'online' : 'offline';
    const updatedAta = await db.updateAtaPingResult(id, newStatus, pingRes.latencyMs);

    res.json({
      success: true,
      ata: updatedAta,
      ping: pingRes,
    });
  } catch (error) {
    console.error('Erro ao executar ping no ATA:', error);
    res.status(500).json({ error: 'Erro ao executar ping no equipamento' });
  }
});

// Ping all registered ATAs
router.post('/ping-all', async (req, res) => {
  try {
    const atas = await db.getAtas({});

    // Run in parallel with concurrency limit (e.g. 10 at a time)
    const chunkSize = 10;
    const results = [];

    for (let i = 0; i < atas.length; i += chunkSize) {
      const chunk = atas.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (ata) => {
        const pingRes = await pingDevice(ata.ip);
        const status = pingRes.online ? 'online' : 'offline';
        const updated = await db.updateAtaPingResult(ata.id, status, pingRes.latencyMs);
        return updated;
      });
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    res.json({
      success: true,
      total: results.length,
      onlineCount: results.filter((a) => a.status === 'online').length,
      offlineCount: results.filter((a) => a.status === 'offline').length,
      atas: results,
    });
  } catch (error) {
    console.error('Erro ao pingar todos os ATAs:', error);
    res.status(500).json({ error: 'Erro ao verificar pings em lote' });
  }
});

// Import ATAs from contacts table
router.post('/import-contacts', async (req, res) => {
  try {
    const result = await db.importAtasFromContacts();
    const updatedList = await db.getAtas({});
    res.json({ ...result, atas: updatedList });
  } catch (error) {
    console.error('Erro ao importar contatos para ATAs:', error);
    res.status(500).json({ error: 'Erro ao importar contatos' });
  }
});

module.exports = router;
