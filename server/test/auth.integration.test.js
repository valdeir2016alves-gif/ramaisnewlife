const assert = require('node:assert/strict');
const test = require('node:test');
const bcrypt = require('bcryptjs');

const databaseUrl = process.env.TEST_DATABASE_URL;

test('secure authentication lifecycle and API access', { skip: !databaseUrl }, async (t) => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  const migrate = require('../src/db/migrate');
  const pool = require('../src/db/pool');
  const db = require('../src/data');
  const { app } = require('../src/index');
  const {
    canManageSector,
    canViewSector,
    requireSectorFeature,
    requireSectorManagement,
    sectorHasFeature,
  } = require('../src/authorization/sectors');

  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
  await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, 'admin'), ($3, $4, 'readonly'), ($5, $6, 'Comercial')`,
    [
      'admin', bcrypt.hashSync('newlife33', 10),
      'viewer-test', bcrypt.hashSync('viewer-password', 10),
      'legacy-sector-test', bcrypt.hashSync('legacy-password', 10),
    ]
  );
  await migrate();
  await migrate();
  assert.deepEqual(
    (await pool.query('SELECT username, role FROM users ORDER BY id')).rows,
    [
      { username: 'admin', role: 'admin' },
      { username: 'viewer-test', role: 'viewer' },
      { username: 'legacy-sector-test', role: 'viewer' },
    ]
  );
  assert.equal((await db.addUser('editor-test', 'editor-password', 'editor')).success, true);
  await assert.rejects(
    pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ('invalid-db-role', 'hash', 'owner')"
    ),
    (error) => error.code === '23514'
  );

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  });

  async function request(path, options = {}, cookie = '') {
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers,
      },
    });
  }

  async function login(username, password, extra = {}) {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, ...extra }),
    });
    return { response, cookie: response.headers.get('set-cookie') };
  }

  await t.test('rejects unauthenticated API access and invalid credentials', async () => {
    assert.equal((await request('/api/contacts')).status, 401);
    const invalid = await login('admin', 'incorrect');
    assert.equal(invalid.response.status, 401);
    assert.equal(invalid.cookie, null);
  });

  let adminCookie;
  await t.test('logs in, exposes the current backend identity and serves Ramais', async () => {
    const result = await login('admin', 'newlife33');
    assert.equal(result.response.status, 200);
    assert.match(result.cookie, /HttpOnly/i);
    assert.match(result.cookie, /SameSite=Lax/i);
    adminCookie = result.cookie.split(';', 1)[0];

    const me = await request('/api/auth/me', {}, adminCookie);
    assert.equal(me.status, 200);
    assert.deepEqual((await me.json()).user, { id: 1, username: 'admin', role: 'admin' });
    assert.equal((await request('/api/contacts', {}, adminCookie)).status, 200);
    assert.equal((await request('/api/users', {}, adminCookie)).status, 200);
    const invalidRole = await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username: 'invalid-api-role', password: 'password', role: 'owner' }),
    }, adminCookie);
    assert.equal(invalidRole.status, 400);

    const demoteLastAdmin = await request('/api/users/1', {
      method: 'PUT',
      body: JSON.stringify({ username: 'admin', role: 'viewer' }),
    }, adminCookie);
    assert.equal(demoteLastAdmin.status, 400);
    assert.equal((await request('/api/users/1', { method: 'DELETE' }, adminCookie)).status, 400);
  });

  await t.test('enforces viewer and editor backend roles', async () => {
    for (const account of [
      { username: 'viewer-test', password: 'viewer-password', role: 'viewer' },
      { username: 'editor-test', password: 'editor-password', role: 'editor' },
    ]) {
      const result = await login(account.username, account.password, { role: 'admin', user_id: 1 });
      const cookie = result.cookie.split(';', 1)[0];
      const me = await request('/api/auth/me', {}, cookie);
      assert.equal((await me.json()).user.role, account.role);
      assert.equal((await request('/api/contacts', {}, cookie)).status, 200);
      assert.equal((await request('/api/users', {}, cookie)).status, 403);
      assert.equal((await request('/api/reports', {}, cookie)).status, 403);
      assert.equal((await request('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Blocked', phone: '0000', department: 'Test' }),
      }, cookie)).status, 403);
    }
  });

  await t.test('admin configures sector memberships, managers and features', async () => {
    const createResponse = await request('/api/admin/sectors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Comercial', city: 'sao_gabriel' }),
    }, adminCookie);
    assert.equal(createResponse.status, 201);
    const commercial = (await createResponse.json()).sector;
    assert.equal(commercial.slug, 'comercial');

    const editor = (await pool.query("SELECT id FROM users WHERE username = 'editor-test'")).rows[0];
    const viewer = (await pool.query("SELECT id FROM users WHERE username = 'viewer-test'")).rows[0];
    const editorLogin = await login('editor-test', 'editor-password');
    const editorCookie = editorLogin.cookie.split(';', 1)[0];
    assert.equal((await request('/api/admin/sectors', {}, editorCookie)).status, 403);

    assert.equal((await request(`/api/admin/sectors/${commercial.id}/members/${viewer.id}`, {
      method: 'PUT',
    }, adminCookie)).status, 200);
    assert.equal((await request(`/api/admin/sectors/${commercial.id}/managers/${viewer.id}`, {
      method: 'PUT',
    }, adminCookie)).status, 400);

    assert.equal((await request(`/api/admin/sectors/${commercial.id}/members/${editor.id}`, {
      method: 'PUT',
    }, adminCookie)).status, 200);
    assert.equal((await request(`/api/admin/sectors/${commercial.id}/managers/${editor.id}`, {
      method: 'PUT',
    }, adminCookie)).status, 200);
    assert.equal((await request(`/api/admin/sectors/${commercial.id}/features/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: true }),
    }, adminCookie)).status, 200);
    assert.equal((await request(`/api/admin/sectors/${commercial.id}/features/unknown`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: true }),
    }, adminCookie)).status, 400);

    const updateResponse = await request(`/api/admin/sectors/${commercial.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Comercial e Vendas' }),
    }, adminCookie);
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).sector.slug, 'comercial');

    const listResponse = await request('/api/admin/sectors', {}, adminCookie);
    const listed = (await listResponse.json()).sectors[0];
    assert.equal(listed.name, 'Comercial e Vendas');
    assert.equal(listed.members.length, 2);
    assert.equal(listed.managers[0].role, 'editor');
    assert.deepEqual(listed.features, { schedule: true });
  });

  await t.test('central sector authorization enforces the complete role matrix', async () => {
    async function createSector(name) {
      const response = await request('/api/admin/sectors', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }, adminCookie);
      assert.equal(response.status, 201);
      return (await response.json()).sector;
    }

    const commercial = (await pool.query("SELECT id FROM sectors WHERE slug = 'comercial'")).rows[0];
    const finance = await createSector('Financeiro');
    const technical = await createSector('Técnico');
    const users = Object.fromEntries(
      (await pool.query('SELECT id, username, role FROM users')).rows.map((user) => [user.username, user])
    );

    for (const [sectorId, userId] of [
      [finance.id, users['editor-test'].id],
      [finance.id, users['legacy-sector-test'].id],
    ]) {
      assert.equal((await request(`/api/admin/sectors/${sectorId}/members/${userId}`, {
        method: 'PUT',
      }, adminCookie)).status, 200);
    }

    assert.equal(await canViewSector(users.admin, technical.id), true);
    assert.equal(await canManageSector(users.admin, technical.id), true);
    assert.equal(await canViewSector(users['editor-test'], commercial.id), true);
    assert.equal(await canManageSector(users['editor-test'], commercial.id), true);
    assert.equal(await canViewSector(users['editor-test'], finance.id), true);
    assert.equal(await canManageSector(users['editor-test'], finance.id), false);
    assert.equal(await canViewSector(users['viewer-test'], commercial.id), true);
    assert.equal(await canManageSector(users['viewer-test'], commercial.id), false);
    assert.equal(await canViewSector(users['viewer-test'], finance.id), false);
    assert.equal(await canViewSector(users['editor-test'], technical.id), false);
    assert.equal(await sectorHasFeature(commercial.id, 'schedule'), true);
    assert.equal(await sectorHasFeature(finance.id, 'schedule'), false);
    assert.equal(await sectorHasFeature(commercial.id, 'unknown'), false);

    const editorLogin = await login('editor-test', 'editor-password');
    const editorCookie = editorLogin.cookie.split(';', 1)[0];
    const viewerLogin = await login('viewer-test', 'viewer-password');
    const viewerCookie = viewerLogin.cookie.split(';', 1)[0];

    const editorSectors = await request('/api/sectors', {}, editorCookie);
    const editorBody = await editorSectors.json();
    assert.deepEqual(editorBody.sectors.map((sector) => sector.slug).sort(), ['comercial', 'financeiro']);
    assert.equal(editorBody.sectors.find((sector) => sector.slug === 'comercial').permissions.canManage, true);
    assert.equal(editorBody.sectors.find((sector) => sector.slug === 'financeiro').permissions.canManage, false);

    const viewerSectors = await request('/api/sectors', {}, viewerCookie);
    assert.deepEqual((await viewerSectors.json()).sectors.map((sector) => sector.slug), ['comercial']);
    assert.equal((await request(`/api/sectors/${finance.id}`, {}, viewerCookie)).status, 403);
    assert.equal((await request(`/api/sectors/${commercial.id}`, {}, viewerCookie)).status, 200);
    assert.equal((await request('/api/sectors', {}, adminCookie).then((response) => response.json())).sectors.length, 3);

    async function invoke(middleware, user, sectorId) {
      return new Promise((resolve, reject) => {
        const req = { user, params: { sectorId: String(sectorId) } };
        const res = {
          statusCode: 200,
          status(code) { this.statusCode = code; return this; },
          json(body) { resolve({ status: this.statusCode, body }); },
        };
        middleware(req, res, (error) => error ? reject(error) : resolve({ next: true, req }));
      });
    }

    assert.equal((await invoke(requireSectorManagement, users['editor-test'], commercial.id)).next, true);
    assert.equal((await invoke(requireSectorManagement, users['editor-test'], finance.id)).status, 403);
    assert.equal((await invoke(requireSectorManagement, users['viewer-test'], commercial.id)).status, 403);
    assert.equal((await invoke(requireSectorFeature('schedule'), users['viewer-test'], commercial.id)).next, true);
    assert.equal((await invoke(requireSectorFeature('schedule'), users.admin, finance.id)).status, 403);
  });

  await t.test('invalidates logout and expired sessions', async () => {
    const logout = await request('/api/auth/logout', { method: 'POST' }, adminCookie);
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
    assert.equal((await request('/api/auth/me', {}, adminCookie)).status, 401);

    const result = await login('admin', 'newlife33');
    const expiringCookie = result.cookie.split(';', 1)[0];
    await pool.query("UPDATE user_sessions SET expires_at = now() - interval '1 second' WHERE user_id = 1");
    assert.equal((await request('/api/auth/me', {}, expiringCookie)).status, 401);
  });
});
