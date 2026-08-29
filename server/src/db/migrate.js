const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

// Mirrors the legacy file locations from the JSON-based server/src/data.js,
// which this migration reads from once to seed Postgres.
const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

function readJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Erro ao ler ${filePath}:`, e);
    return null;
  }
}

function readLegacyContacts() {
  return readJson(path.join(DATA_DIR, 'ramais.json')) || readJson(path.join(ROOT_DIR, 'ramais.json')) || [];
}

function readLegacyDescriptions() {
  return readJson(path.join(DATA_DIR, 'descriptions.json')) || readJson(path.join(ROOT_DIR, 'descriptions.json')) || {};
}

function readLegacyUsers() {
  return readJson(path.join(DATA_DIR, 'users.json')) || [];
}

function readLegacyReports() {
  return readJson(path.join(DATA_DIR, 'reports.json')) || [];
}

function readLegacyAnalytics() {
  return readJson(path.join(DATA_DIR, 'analytics.json')) || [];
}

async function createSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT 'sao_gabriel',
      phone_model TEXT NOT NULL DEFAULT '',
      hidden BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      date TIMESTAMPTZ NOT NULL DEFAULT now(),
      name TEXT,
      ramal TEXT NOT NULL,
      message TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS descriptions (
      department_key TEXT PRIMARY KEY,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics (
      date DATE PRIMARY KEY,
      visits INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function normalizeCity(contact) {
  if (contact.department === 'Contatos Regionais e Externos') return 'all';
  return contact.city || 'sao_gabriel';
}

async function importContacts(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM contacts');
  if (rows[0].count > 0) return;

  const contacts = readLegacyContacts();
  if (contacts.length === 0) return;

  let maxId = 0;
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i];
    maxId = Math.max(maxId, c.id);
    await client.query(
      `INSERT INTO contacts (id, name, phone, department, ip, city, phone_model, hidden, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.phone, c.department, c.ip || '', normalizeCity(c), c.phoneModel || '', !!c.hidden, i]
    );
  }
  await client.query(`SELECT setval(pg_get_serial_sequence('contacts', 'id'), $1)`, [maxId]);
  console.log(`[migrate] Importados ${contacts.length} contatos do JSON legado.`);
}

async function importUsers(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM users');
  if (rows[0].count > 0) return;

  const users = readLegacyUsers();

  if (users.length === 0) {
    const passwordHash = bcrypt.hashSync('newlife33', 10);
    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)`,
      ['admin', passwordHash, 'admin']
    );
    console.log('[migrate] Nenhum usuário legado encontrado; criado admin padrão.');
    return;
  }

  let maxId = 0;
  for (const u of users) {
    maxId = Math.max(maxId, u.id);
    const passwordHash = bcrypt.hashSync(u.password, 10);
    await client.query(
      `INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.username, passwordHash, u.role]
    );
  }
  await client.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), $1)`, [maxId]);
  console.log(`[migrate] Importados ${users.length} usuários do JSON legado (senhas hasheadas).`);
}

async function importReports(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM reports');
  if (rows[0].count > 0) return;

  const reports = readLegacyReports();
  if (reports.length === 0) return;

  let maxId = 0;
  for (const r of reports) {
    maxId = Math.max(maxId, r.id);
    await client.query(
      `INSERT INTO reports (id, date, name, ramal, message) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.date, r.name || '', r.ramal, r.message]
    );
  }
  await client.query(`SELECT setval(pg_get_serial_sequence('reports', 'id'), $1)`, [maxId]);
  console.log(`[migrate] Importados ${reports.length} relatos do JSON legado.`);
}

async function importDescriptions(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM descriptions');
  if (rows[0].count > 0) return;

  const descriptions = readLegacyDescriptions();
  const entries = Object.entries(descriptions);
  if (entries.length === 0) return;

  for (const [key, text] of entries) {
    await client.query(
      `INSERT INTO descriptions (department_key, description) VALUES ($1, $2)
       ON CONFLICT (department_key) DO NOTHING`,
      [key, text]
    );
  }
  console.log(`[migrate] Importadas ${entries.length} descrições do JSON legado.`);
}

async function importAnalytics(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM analytics');
  if (rows[0].count > 0) return;

  const analytics = readLegacyAnalytics();
  if (analytics.length === 0) return;

  for (const a of analytics) {
    await client.query(
      `INSERT INTO analytics (date, visits) VALUES ($1, $2)
       ON CONFLICT (date) DO NOTHING`,
      [a.date, a.visits]
    );
  }
  console.log(`[migrate] Importados ${analytics.length} dias de analytics do JSON legado.`);
}

async function migrate() {
  const client = await pool.connect();
  try {
    await createSchema(client);
    await importContacts(client);
    await importUsers(client);
    await importReports(client);
    await importDescriptions(client);
    await importAnalytics(client);
  } finally {
    client.release();
  }
}

module.exports = migrate;
