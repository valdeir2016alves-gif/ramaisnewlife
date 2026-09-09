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
