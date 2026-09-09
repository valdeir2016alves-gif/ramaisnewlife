const pool = require('../db/pool');
const { USER_ROLES } = require('../users/roles');

const SECTOR_FEATURES = new Set(['schedule']);

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSectorInput(input = {}, existing = null) {
  const name = typeof input.name === 'string' ? input.name.trim() : existing?.name;
  const requestedSlug = input.slug === undefined ? existing?.slug || name : input.slug;
  const slug = normalizeSlug(requestedSlug);
  const cityValue = input.city === undefined ? existing?.city : input.city;
  const city = cityValue === null || cityValue === '' ? null : String(cityValue).trim();
  const active = input.active === undefined ? existing?.active ?? true : input.active;

  if (!name || name.length > 120) return { error: 'Nome do setor é obrigatório e deve ter até 120 caracteres.' };
  if (!slug || slug.length > 120) return { error: 'Slug do setor é inválido.' };
  if (city && city.length > 120) return { error: 'Cidade deve ter até 120 caracteres.' };
  if (typeof active !== 'boolean') return { error: 'O campo active deve ser booleano.' };
  return { value: { name, slug, city, active } };
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function databaseError(error) {
  if (error.code === '23505') return { success: false, status: 409, error: 'Já existe um setor com esse identificador.' };
  if (error.code === '23503') return { success: false, status: 404, error: 'Usuário ou setor não encontrado.' };
  throw error;
}

async function sectorDetails(client, sectorId = null) {
  const params = sectorId ? [sectorId] : [];
  const where = sectorId ? 'WHERE s.id = $1' : '';
  const { rows: sectors } = await client.query(
    `SELECT s.id, s.name, s.slug, s.city, s.active, s.created_at, s.updated_at
     FROM sectors s ${where} ORDER BY s.name`,
    params
  );
  if (sectors.length === 0) return [];

  const ids = sectors.map((sector) => sector.id);
  const [{ rows: members }, { rows: managers }, { rows: features }] = await Promise.all([
    client.query(
      `SELECT us.sector_id, u.id, u.username, u.role
       FROM user_sectors us JOIN users u ON u.id = us.user_id
       WHERE us.sector_id = ANY($1::int[]) ORDER BY u.username`,
      [ids]
    ),
    client.query(
      `SELECT sm.sector_id, u.id, u.username, u.role
       FROM sector_managers sm JOIN users u ON u.id = sm.user_id
       WHERE sm.sector_id = ANY($1::int[]) ORDER BY u.username`,
      [ids]
    ),
    client.query(
      `SELECT sector_id, feature_key, enabled FROM sector_features
       WHERE sector_id = ANY($1::int[]) ORDER BY feature_key`,
      [ids]
    ),
  ]);

  return sectors.map((sector) => ({
    ...sector,
    members: members.filter((item) => item.sector_id === sector.id).map(({ sector_id, ...item }) => item),
    managers: managers.filter((item) => item.sector_id === sector.id).map(({ sector_id, ...item }) => item),
    features: Object.fromEntries(
      features.filter((item) => item.sector_id === sector.id).map((item) => [item.feature_key, item.enabled])
    ),
  }));
}

async function listSectors() {
  return sectorDetails(pool);
}

async function createSector(input) {
  const normalized = normalizeSectorInput(input);
  if (normalized.error) return { success: false, status: 400, error: normalized.error };
  const { name, slug, city, active } = normalized.value;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sectors (name, slug, city, active) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, slug, city, active]
    );
    return { success: true, status: 201, sector: (await sectorDetails(pool, rows[0].id))[0] };
  } catch (error) {
    return databaseError(error);
  }
}

async function updateSector(sectorId, input) {
  const id = validId(sectorId);
  if (!id) return { success: false, status: 400, error: 'Setor inválido.' };
  const current = (await sectorDetails(pool, id))[0];
  if (!current) return { success: false, status: 404, error: 'Setor não encontrado.' };
  const normalized = normalizeSectorInput(input, current);
  if (normalized.error) return { success: false, status: 400, error: normalized.error };
  const { name, slug, city, active } = normalized.value;
  try {
    await pool.query(
      `UPDATE sectors SET name = $1, slug = $2, city = $3, active = $4, updated_at = now() WHERE id = $5`,
      [name, slug, city, active, id]
    );
    return { success: true, status: 200, sector: (await sectorDetails(pool, id))[0] };
  } catch (error) {
    return databaseError(error);
  }
}

async function addMember(sectorId, userId) {
  const sector = validId(sectorId);
  const user = validId(userId);
  if (!sector || !user) return { success: false, status: 400, error: 'Usuário ou setor inválido.' };
  try {
    await pool.query(
      `INSERT INTO user_sectors (user_id, sector_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [user, sector]
    );
    return { success: true, status: 200 };
  } catch (error) {
    return databaseError(error);
  }
}

async function removeMember(sectorId, userId) {
  const sector = validId(sectorId);
  const user = validId(userId);
  if (!sector || !user) return { success: false, status: 400, error: 'Usuário ou setor inválido.' };
  const result = await pool.query(
    'DELETE FROM user_sectors WHERE user_id = $1 AND sector_id = $2',
    [user, sector]
  );
  return result.rowCount
    ? { success: true, status: 200 }
    : { success: false, status: 404, error: 'Participação não encontrada.' };
}

async function addManager(sectorId, userId, createdByUserId) {
  const sector = validId(sectorId);
  const user = validId(userId);
  if (!sector || !user) return { success: false, status: 400, error: 'Usuário ou setor inválido.' };
  const { rows } = await pool.query(
    `SELECT u.role, EXISTS (
       SELECT 1 FROM user_sectors us WHERE us.user_id = u.id AND us.sector_id = $2
     ) AS is_member
     FROM users u WHERE u.id = $1`,
    [user, sector]
  );
  if (!rows[0]) return { success: false, status: 404, error: 'Usuário não encontrado.' };
  if (rows[0].role !== USER_ROLES.EDITOR) {
    return { success: false, status: 400, error: 'Somente usuários editor podem ser responsáveis por setor.' };
  }
  if (!rows[0].is_member) {
    return { success: false, status: 400, error: 'O responsável deve primeiro ser membro do setor.' };
  }
  try {
    await pool.query(
      `INSERT INTO sector_managers (user_id, sector_id, created_by_user_id)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [user, sector, createdByUserId]
    );
    return { success: true, status: 200 };
  } catch (error) {
    return databaseError(error);
  }
}

async function removeManager(sectorId, userId) {
  const sector = validId(sectorId);
  const user = validId(userId);
  if (!sector || !user) return { success: false, status: 400, error: 'Usuário ou setor inválido.' };
  const result = await pool.query(
    'DELETE FROM sector_managers WHERE user_id = $1 AND sector_id = $2',
    [user, sector]
  );
  return result.rowCount
    ? { success: true, status: 200 }
    : { success: false, status: 404, error: 'Responsabilidade não encontrada.' };
}

async function setFeature(sectorId, feature, enabled) {
  const sector = validId(sectorId);
  if (!sector) return { success: false, status: 400, error: 'Setor inválido.' };
  if (!SECTOR_FEATURES.has(feature)) return { success: false, status: 400, error: 'Feature desconhecida.' };
  if (typeof enabled !== 'boolean') return { success: false, status: 400, error: 'O campo enabled deve ser booleano.' };
  try {
    await pool.query(
      `INSERT INTO sector_features (sector_id, feature_key, enabled) VALUES ($1, $2, $3)
       ON CONFLICT (sector_id, feature_key)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()`,
      [sector, feature, enabled]
    );
    return { success: true, status: 200 };
  } catch (error) {
    return databaseError(error);
  }
}

module.exports = {
  SECTOR_FEATURES,
  addManager,
  addMember,
  createSector,
  listSectors,
  normalizeSlug,
  removeManager,
  removeMember,
  setFeature,
  updateSector,
};
