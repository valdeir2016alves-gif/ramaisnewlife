const path = require('path');
const express = require('express');
const cors = require('cors');

const contactsRouter = require('./routes/contacts');
const reportsRouter = require('./routes/reports');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const analyticsRouter = require('./routes/analytics');
const descriptionsRouter = require('./routes/descriptions');

const app = express();
// Note: uses SERVER_PORT (not PORT) so it doesn't collide with a PORT env
// var that a dev/preview tool might set for a different process on the
// same machine (e.g. the Vite dev server).
const PORT = process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/contacts', contactsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/descriptions', descriptionsRouter);

const clientDist = path.join(__dirname, '..', 'public');
app.use(express.static(clientDist));

// SPA fallback: any non-API route serves the Vue app (vue-router history mode)
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
