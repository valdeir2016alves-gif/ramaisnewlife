const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const sectors = require('../sectors/service');

const router = express.Router();
router.use(requireAdmin);

function send(res, result) {
  const { status = 200, ...body } = result;
  res.status(status).json(body);
}

router.get('/', async (req, res, next) => {
  try {
    res.json({ success: true, sectors: await sectors.listSectors() });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    send(res, await sectors.createSector(req.body));
  } catch (error) {
    next(error);
  }
});

router.put('/:sectorId', async (req, res, next) => {
  try {
    send(res, await sectors.updateSector(req.params.sectorId, req.body));
  } catch (error) {
    next(error);
  }
});

router.put('/:sectorId/members/:userId', async (req, res, next) => {
  try {
    send(res, await sectors.addMember(req.params.sectorId, req.params.userId));
  } catch (error) {
    next(error);
  }
});

router.delete('/:sectorId/members/:userId', async (req, res, next) => {
  try {
    send(res, await sectors.removeMember(req.params.sectorId, req.params.userId));
  } catch (error) {
    next(error);
  }
});

router.put('/:sectorId/managers/:userId', async (req, res, next) => {
  try {
    send(res, await sectors.addManager(req.params.sectorId, req.params.userId, req.user.id));
  } catch (error) {
    next(error);
  }
});

router.delete('/:sectorId/managers/:userId', async (req, res, next) => {
  try {
    send(res, await sectors.removeManager(req.params.sectorId, req.params.userId));
  } catch (error) {
    next(error);
  }
});

router.put('/:sectorId/features/:feature', async (req, res, next) => {
  try {
    send(res, await sectors.setFeature(req.params.sectorId, req.params.feature, req.body?.enabled));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
