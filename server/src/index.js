const path = require('path');
const express = require('express');

const migrate = require('./db/migrate');
const contactsRouter = require('./routes/contacts');
const reportsRouter = require('./routes/reports');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const analyticsRouter = require('./routes/analytics');
const descriptionsRouter = require('./routes/descriptions');
const teamsRouter = require('./routes/teams');
const adminSectorsRouter = require('./routes/adminSectors');
const sectorsRouter = require('./routes/sectors');
const favoritesRouter = require('./routes/favorites');
const sectorShortcutsRouter = require('./routes/sectorShortcuts');
const personalNotesRouter = require('./routes/personalNotes');
const sectorNotesRouter = require('./routes/sectorNotes');
const { requireAuth } = require('./middleware/auth');

const app = express();
// Note: uses SERVER_PORT (not PORT) so it doesn't collide with a PORT env
// var that a dev/preview tool might set for a different process on the
// same machine (e.g. the Vite dev server).
const PORT = process.env.SERVER_PORT || 3000;

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
app.use('/api/contacts', contactsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/descriptions', descriptionsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/admin/sectors', adminSectorsRouter);
app.use('/api/sectors', sectorsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/sectors/:sectorId/shortcuts', sectorShortcutsRouter);
app.use('/api/notes', personalNotesRouter);
app.use('/api/sectors/:sectorId/notes', sectorNotesRouter);

const clientDist = path.join(__dirname, '..', 'public');
app.use(express.static(clientDist));

// SPA fallback: any non-API route serves the Vue app (vue-router history mode)
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado na API:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
});

async function start() {
  await migrate();
  return app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Falha ao migrar/conectar no Postgres:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
