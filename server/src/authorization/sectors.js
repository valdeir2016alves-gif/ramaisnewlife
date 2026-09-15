const pool = require('../db/pool');
const { USER_ROLES } = require('../users/roles');
const { SECTOR_FEATURES } = require('../sectors/service');

function sectorIdOf(sector) {
  const value = typeof sector === 'object' && sector !== null ? sector.id : sector;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function canViewSector(user, sector, client = pool) {
  const sectorId = sectorIdOf(sector);
  if (!user?.id || !sectorId) return false;

  if (user.role === USER_ROLES.ADMIN) {
    const { rows } = await client.query('SELECT EXISTS (SELECT 1 FROM sectors WHERE id = $1) AS allowed', [sectorId]);
    return rows[0].allowed;
  }

  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM user_sectors us
       JOIN sectors s ON s.id = us.sector_id
       WHERE us.user_id = $1 AND us.sector_id = $2 AND s.active = true
     ) AS allowed`,
    [user.id, sectorId]
  );
  return rows[0].allowed;
}

async function canManageSector(user, sector, client = pool) {
  const sectorId = sectorIdOf(sector);
  if (!user?.id || !sectorId) return false;

  if (user.role === USER_ROLES.ADMIN) {
    const { rows } = await client.query('SELECT EXISTS (SELECT 1 FROM sectors WHERE id = $1) AS allowed', [sectorId]);
    return rows[0].allowed;
  }
  if (user.role !== USER_ROLES.EDITOR) return false;

  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM sector_managers sm
       JOIN sectors s ON s.id = sm.sector_id
       WHERE sm.user_id = $1 AND sm.sector_id = $2 AND s.active = true
     ) AS allowed`,
    [user.id, sectorId]
  );
  return rows[0].allowed;
}

async function sectorHasFeature(sector, feature, client = pool) {
  const sectorId = sectorIdOf(sector);
  if (!sectorId || !SECTOR_FEATURES.has(feature)) return false;
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM sector_features sf
       JOIN sectors s ON s.id = sf.sector_id
       WHERE sf.sector_id = $1 AND sf.feature_key = $2
         AND sf.enabled = true AND s.active = true
     ) AS enabled`,
    [sectorId, feature]
  );
  return rows[0].enabled;
}

function permissionMiddleware(check, errorMessage) {
  return async (req, res, next) => {
    try {
      const sectorId = sectorIdOf(req.params.sectorId);
      if (!sectorId) return res.status(400).json({ success: false, error: 'Setor inválido.' });
      if (!(await check(req.user, sectorId))) {
        return res.status(403).json({ success: false, error: errorMessage });
      }
      req.sectorId = sectorId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

const requireSectorView = permissionMiddleware(canViewSector, 'Sem acesso a este setor.');
const requireSectorManagement = permissionMiddleware(canManageSector, 'Sem permissão para gerenciar este setor.');

function requireSectorFeature(feature) {
  if (!SECTOR_FEATURES.has(feature)) throw new Error(`Feature setorial inválida: ${feature}`);
  return async (req, res, next) => {
    try {
      const sectorId = sectorIdOf(req.params.sectorId);
      if (!sectorId) return res.status(400).json({ success: false, error: 'Setor inválido.' });
      if (!(await sectorHasFeature(sectorId, feature))) {
        return res.status(403).json({ success: false, error: 'Feature não habilitada para este setor.' });
      }
      req.sectorId = sectorId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  canManageSector,
  canViewSector,
  requireSectorFeature,
  requireSectorManagement,
  requireSectorView,
  sectorHasFeature,
};
