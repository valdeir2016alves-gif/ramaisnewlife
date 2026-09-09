const assert = require('node:assert/strict');
const test = require('node:test');
const {
  USER_ROLES,
  isValidUserRole,
  normalizeLegacyRole,
} = require('../src/users/roles');

test('accepts only the three global user roles', () => {
  assert.equal(isValidUserRole(USER_ROLES.ADMIN), true);
  assert.equal(isValidUserRole(USER_ROLES.EDITOR), true);
  assert.equal(isValidUserRole(USER_ROLES.VIEWER), true);
  assert.equal(isValidUserRole('readonly'), false);
  assert.equal(isValidUserRole('Comercial'), false);
  assert.equal(isValidUserRole('owner'), false);
});

test('normalizes known legacy roles without granting privileges', () => {
  assert.deepEqual(normalizeLegacyRole(' ADMIN '), { role: 'admin', recognized: true });
  assert.deepEqual(normalizeLegacyRole('readonly'), { role: 'viewer', recognized: true });
  assert.deepEqual(normalizeLegacyRole('Somente Leitura'), { role: 'viewer', recognized: true });
  assert.deepEqual(normalizeLegacyRole('Comercial'), { role: 'viewer', recognized: false });
  assert.deepEqual(normalizeLegacyRole(null), { role: 'viewer', recognized: false });
});
