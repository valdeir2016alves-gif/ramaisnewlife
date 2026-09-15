const express = require('express');
const db = require('../data');
const { createSession, destroySession } = require('../auth/session');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    }

    const result = await db.authenticateUser(username, password);
    if (!result.success) return res.status(401).json(result);

    await createSession(result.user.id, res);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Falha ao iniciar a sessão.' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
