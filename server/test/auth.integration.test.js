const assert = require('node:assert/strict');
const test = require('node:test');

const databaseUrl = process.env.TEST_DATABASE_URL;

test('secure authentication lifecycle and API access', { skip: !databaseUrl }, async (t) => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  const migrate = require('../src/db/migrate');
  const pool = require('../src/db/pool');
  const db = require('../src/data');
  const { app } = require('../src/index');

  await migrate();
  await db.addUser('viewer-test', 'viewer-password', 'readonly');

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
  });

  await t.test('enforces backend role checks', async () => {
    const result = await login('viewer-test', 'viewer-password', { role: 'admin', user_id: 1 });
    const viewerCookie = result.cookie.split(';', 1)[0];
    const me = await request('/api/auth/me', {}, viewerCookie);
    assert.equal((await me.json()).user.role, 'readonly');
    assert.equal((await request('/api/contacts', {}, viewerCookie)).status, 200);
    assert.equal((await request('/api/users', {}, viewerCookie)).status, 403);
    assert.equal((await request('/api/reports', {}, viewerCookie)).status, 403);
    assert.equal((await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Blocked', phone: '0000', department: 'Test' }),
    }, viewerCookie)).status, 403);
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
