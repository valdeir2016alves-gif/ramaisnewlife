const express = require('express');
const sectors = require('../sectors/service');
const {
  canManageSector,
  canViewSector,
  requireSectorView,
  sectorHasFeature,
} = require('../authorization/sectors');

const router = express.Router();

async function portalSector(sector, user) {
  return {
    id: sector.id,
    name: sector.name,
    slug: sector.slug,
    city: sector.city,
    active: sector.active,
    features: {
      schedule: await sectorHasFeature(sector.id, 'schedule'),
    },
    permissions: {
      canManage: await canManageSector(user, sector.id),
    },
  };
}

router.get('/', async (req, res, next) => {
  try {
    const allSectors = await sectors.listSectors();
    const visibility = await Promise.all(
      allSectors.map((sector) => canViewSector(req.user, sector.id))
    );
    const visible = allSectors.filter((sector, index) => visibility[index]);
    res.json({
      success: true,
      sectors: await Promise.all(visible.map((sector) => portalSector(sector, req.user))),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:sectorId', requireSectorView, async (req, res, next) => {
  try {
    const sector = await sectors.getSector(req.sectorId);
    res.json({ success: true, sector: await portalSector(sector, req.user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
