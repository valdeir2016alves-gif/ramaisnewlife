const { getSessionUser } = require('../auth/session');
const { isValidUserRole, USER_ROLES } = require('../users/roles');

async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req);
    if (!user || !isValidUserRole(user.role)) {
      return res.status(401).json({ success: false, error: 'Autenticação necessária.' });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...roles) {
  if (roles.some((role) => !isValidUserRole(role))) {
    throw new Error(`Middleware configurado com role inválida: ${roles.join(', ')}`);
  }
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acesso não autorizado.' });
    }
    next();
  };
}

const requireAdmin = requireRole(USER_ROLES.ADMIN);

module.exports = { requireAuth, requireRole, requireAdmin };
