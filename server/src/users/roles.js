const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
});

const VALID_USER_ROLES = new Set(Object.values(USER_ROLES));
const LEGACY_VIEWER_ROLES = new Set([
  'readonly',
  'read-only',
  'read_only',
  'read only',
  'user',
  'somente leitura',
]);

function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : '';
}

function isValidUserRole(role) {
  return VALID_USER_ROLES.has(normalizeRole(role));
}

function normalizeLegacyRole(role) {
  const normalized = normalizeRole(role);
  if (VALID_USER_ROLES.has(normalized)) return { role: normalized, recognized: true };
  if (LEGACY_VIEWER_ROLES.has(normalized)) {
    return { role: USER_ROLES.VIEWER, recognized: true };
  }

  // Unknown and old sector-shaped roles are deliberately downgraded instead
  // of becoming editors, avoiding an accidental privilege escalation.
  return { role: USER_ROLES.VIEWER, recognized: false };
}

module.exports = {
  USER_ROLES,
  VALID_USER_ROLES,
  isValidUserRole,
  normalizeLegacyRole,
  normalizeRole,
};
