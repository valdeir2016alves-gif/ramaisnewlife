const crypto = require('crypto');
const pool = require('../db/pool');

const COOKIE_NAME = 'ramais_session';
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000;

function sessionTtlMs() {
  const configured = Number(process.env.AUTH_SESSION_TTL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TTL_MS;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator === -1) return cookies;
    const key = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function cookieOptions(maxAgeSeconds) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts;
}

function setSessionCookie(res, token, ttlMs) {
  const parts = cookieOptions(Math.ceil(ttlMs / 1000));
  parts[0] = `${COOKIE_NAME}=${encodeURIComponent(token)}`;
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const parts = cookieOptions(0);
  parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function tokenFromRequest(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME] || null;
}

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const ttlMs = sessionTtlMs();
  const expiresAt = new Date(Date.now() + ttlMs);

  await pool.query('DELETE FROM user_sessions WHERE expires_at <= now()');
  await pool.query(
    'INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, userId, expiresAt]
  );
  setSessionCookie(res, token, ttlMs);
}

async function getSessionUser(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.role
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash]
  );

  if (rows.length === 0) {
    await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
    return null;
  }

  await pool.query('UPDATE user_sessions SET last_seen_at = now() WHERE token_hash = $1', [tokenHash]);
  return rows[0];
}

async function destroySession(req, res) {
  const token = tokenFromRequest(req);
  if (token) {
    await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [hashToken(token)]);
  }
  clearSessionCookie(res);
}

module.exports = {
  COOKIE_NAME,
  createSession,
  destroySession,
  getSessionUser,
};
