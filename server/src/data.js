const bcrypt = require('bcryptjs');
const pool = require('./db/pool');

function rowToContact(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    department: row.department,
    ip: row.ip,
    city: row.city,
    phoneModel: row.phone_model,
    hidden: row.hidden,
  };
}

async function getLastUpdated() {
  const { rows } = await pool.query('SELECT MAX(updated_at) AS last_updated FROM contacts');
  const lastUpdated = rows[0].last_updated;
  return (lastUpdated ? new Date(lastUpdated) : new Date()).toLocaleDateString('pt-BR');
}

async function getContacts(query) {
  let result;
  if (query) {
    const q = `%${query}%`;
    result = await pool.query(
      `SELECT * FROM contacts WHERE name ILIKE $1 OR phone ILIKE $1 OR department ILIKE $1 ORDER BY sort_order`,
      [q]
    );
  } else {
    result = await pool.query('SELECT * FROM contacts ORDER BY sort_order');
  }
  return result.rows.map(rowToContact);
}

async function addContact(name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') {
  const { rows } = await pool.query(
    `INSERT INTO contacts (id, name, phone, department, ip, city, phone_model, sort_order)
     VALUES (
       COALESCE((SELECT MAX(id) FROM contacts), 0) + 1,
       $1, $2, $3, $4, $5, $6,
       COALESCE((SELECT MAX(sort_order) FROM contacts), -1) + 1
     )
     RETURNING *`,
    [name, phone, department, ip, city, phoneModel]
  );
  return { success: true, contact: rowToContact(rows[0]) };
}

async function toggleContactVisibility(id, hidden) {
  const result = await pool.query(
    'UPDATE contacts SET hidden = $1, updated_at = now() WHERE id = $2',
    [hidden, id]
  );
  if (result.rowCount === 0) return { success: false, error: 'Contato não encontrado' };
  return { success: true };
}

async function deleteContact(id) {
  await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
  return { success: true };
}

async function updateContact(id, name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') {
  await pool.query(
    `UPDATE contacts
     SET name = $1, phone = $2, department = $3, ip = $4, city = $5, phone_model = $6, updated_at = now()
     WHERE id = $7`,
    [name, phone, department, ip, city, phoneModel, id]
  );
  return { success: true };
}

async function reorderContact(id, direction) {
  const { rows } = await pool.query('SELECT id, sort_order FROM contacts ORDER BY sort_order');
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return { success: false, error: 'Contact not found' };

  const swapWith = direction === 'up' ? index - 1 : direction === 'down' ? index + 1 : -1;
  if (swapWith < 0 || swapWith >= rows.length) return { success: true };

  const current = rows[index];
  const neighbor = rows[swapWith];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE contacts SET sort_order = $1 WHERE id = $2', [neighbor.sort_order, current.id]);
    await client.query('UPDATE contacts SET sort_order = $1 WHERE id = $2', [current.sort_order, neighbor.id]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return { success: true };
}

async function renameDepartment(oldDepartment, newDepartment) {
  await pool.query(
    'UPDATE contacts SET department = $1, updated_at = now() WHERE department = $2',
    [newDepartment, oldDepartment]
  );
  return { success: true };
}

async function submitReport(name, ramal, message) {
  await pool.query(
    'INSERT INTO reports (name, ramal, message) VALUES ($1, $2, $3)',
    [name, ramal, message]
  );

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (telegramToken && telegramChatId) {
    try {
      const text = `🚨 *Novo Relato de Ramal Errado*\n\n*Nome/Setor:* ${name || 'Não informado'}\n*Ramal com problema:* ${ramal}\n*O que está errado:* ${message}`;
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error('Erro ao enviar notificação para o Telegram:', e);
    }
  }

  return { success: true };
}

async function getReports() {
  const { rows } = await pool.query('SELECT * FROM reports ORDER BY date DESC');
  return rows.map((r) => ({ id: r.id, date: r.date.toISOString(), name: r.name, ramal: r.ramal, message: r.message }));
}

async function deleteReport(id) {
  await pool.query('DELETE FROM reports WHERE id = $1', [id]);
  return { success: true };
}

async function submitNocTicket(name, department, subject, description) {
  await pool.query(
    'INSERT INTO noc_tickets (name, department, subject, description) VALUES ($1, $2, $3, $4)',
    [name, department, subject, description]
  );

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (telegramToken && telegramChatId) {
    try {
      const text = `🛠️ *Novo Chamado NOC*\n\n*Nome:* ${name}\n*Setor:* ${department}\n*Assunto:* ${subject}\n*Descrição:* ${description}`;
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error('Erro ao enviar chamado do NOC para o Telegram:', e);
    }
  }

  return { success: true };
}

async function getNocTickets() {
  const { rows } = await pool.query('SELECT * FROM noc_tickets ORDER BY date DESC');
  return rows.map((r) => ({ id: r.id, date: r.date.toISOString(), name: r.name, department: r.department, subject: r.subject, description: r.description }));
}

async function deleteNocTicket(id) {
  await pool.query('DELETE FROM noc_tickets WHERE id = $1', [id]);
  return { success: true };
}

async function authenticateUser(username, password) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (user && bcrypt.compareSync(password, user.password_hash)) {
    return { success: true, user: { id: user.id, username: user.username, role: user.role } };
  }
  return { success: false, error: 'Usuário ou senha incorretos.' };
}

async function getUsers() {
  const { rows } = await pool.query('SELECT id, username, role FROM users ORDER BY id');
  return rows;
}

async function addUser(username, password, role) {
  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows.length > 0) {
    return { success: false, error: 'Usuário já existe.' };
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
    [username, passwordHash, role]
  );
  return { success: true };
}

async function updateUser(id, username, password, role) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  const existing = rows[0];
  if (!existing) return { success: false, error: 'Usuário não encontrado.' };

  if (username !== existing.username) {
    const { rows: clash } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (clash.length > 0) return { success: false, error: 'Usuário já existe.' };
  }

  const passwordHash = password ? bcrypt.hashSync(password, 10) : existing.password_hash;
  await pool.query(
    'UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4',
    [username, passwordHash, role || existing.role, id]
  );
  return { success: true };
}

async function deleteUser(id) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (rows[0].count <= 1) return { success: false, error: 'Não é possível deletar o último usuário do sistema.' };
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return { success: true };
}

async function registerVisit() {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO analytics (date, visits) VALUES ($1, 1)
       ON CONFLICT (date) DO UPDATE SET visits = analytics.visits + 1`,
      [today]
    );
    await pool.query(
      `DELETE FROM analytics WHERE date NOT IN (SELECT date FROM analytics ORDER BY date DESC LIMIT 30)`
    );
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

async function getAnalytics() {
  const { rows } = await pool.query('SELECT * FROM analytics ORDER BY date');
  return rows.map((r) => ({ date: r.date.toISOString().split('T')[0], visits: r.visits }));
}

async function getDepartmentDescriptions() {
  const { rows } = await pool.query('SELECT department_key, description FROM descriptions');
  const result = {};
  for (const row of rows) {
    result[row.department_key] = row.description;
  }
  return result;
}

async function updateDepartmentDescription(department, description) {
  try {
    const normalized = department.toLowerCase().replace(/–/g, '-').trim();

    if (description.trim() === '') {
      await pool.query('DELETE FROM descriptions WHERE department_key = $1', [normalized]);
    } else {
      await pool.query(
        `INSERT INTO descriptions (department_key, description) VALUES ($1, $2)
         ON CONFLICT (department_key) DO UPDATE SET description = $2`,
        [normalized, description]
      );
    }
    return { success: true };
  } catch (e) {
    console.error('Failed to update description', e);
    return { success: false, error: 'Falha ao salvar a descrição' };
  }
}

async function getTeamsContacts() {
  const { rows } = await pool.query('SELECT * FROM teams_contacts ORDER BY department, sort_order');
  return rows;
}

async function getTeamsContactsByDepartment(department) {
  const { rows } = await pool.query(
    'SELECT * FROM teams_contacts WHERE department = $1 ORDER BY sort_order',
    [department]
  );
  return rows;
}

async function addTeamsContact(department, name, email) {
  const { rows } = await pool.query(
    `INSERT INTO teams_contacts (department, name, email, sort_order)
     VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) FROM teams_contacts WHERE department = $1), -1) + 1)
     RETURNING *`,
    [department, name, email]
  );
  return { success: true, contact: rows[0] };
}

async function updateTeamsContact(id, department, name, email) {
  const result = await pool.query(
    'UPDATE teams_contacts SET department = $1, name = $2, email = $3 WHERE id = $4',
    [department, name, email, id]
  );
  if (result.rowCount === 0) return { success: false, error: 'Contato Teams não encontrado' };
  return { success: true };
}

async function deleteTeamsContact(id) {
  await pool.query('DELETE FROM teams_contacts WHERE id = $1', [id]);
  return { success: true };
}

function rowToAta(row) {
  return {
    id: row.id,
    name: row.name,
    ip: row.ip,
    model: row.model,
    city: row.city,
    department: row.department,
    ramais: row.ramais,
    notes: row.notes,
    status: row.status,
    latencyMs: row.latency_ms,
    lastChecked: row.last_checked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAtas(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    conditions.push(`(name ILIKE $${params.length} OR ip ILIKE $${params.length} OR ramais ILIKE $${params.length} OR department ILIKE $${params.length})`);
  }

  if (filters.status && filters.status !== 'all') {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.city && filters.city !== 'all') {
    params.push(filters.city);
    conditions.push(`city = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM atas ${whereClause} ORDER BY id ASC`, params);
  return rows.map(rowToAta);
}

async function getAtaById(id) {
  const { rows } = await pool.query('SELECT * FROM atas WHERE id = $1', [id]);
  return rows.length > 0 ? rowToAta(rows[0]) : null;
}

async function addAta({ name, ip, model = 'Intelbras ATA 200', city = 'sao_gabriel', department = '', ramais = '', notes = '' }) {
  const cleanIp = (ip || '').trim();
  const cleanName = (name || '').trim();
  const cleanModel = (model || 'Intelbras ATA 200').trim();

  if (!cleanName || !cleanIp) {
    return { success: false, error: 'Nome e IP são obrigatórios' };
  }

  const { rows } = await pool.query(
    `INSERT INTO atas (name, ip, model, city, department, ramais, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'unknown')
     RETURNING *`,
    [cleanName, cleanIp, cleanModel, city || 'sao_gabriel', department || '', ramais || '', notes || '']
  );
  return { success: true, ata: rowToAta(rows[0]) };
}

async function updateAta(id, { name, ip, model, city, department, ramais, notes }) {
  const cleanIp = (ip || '').trim();
  const cleanName = (name || '').trim();
  const cleanModel = (model || 'Intelbras ATA 200').trim();

  if (!cleanName || !cleanIp) {
    return { success: false, error: 'Nome e IP são obrigatórios' };
  }

  const result = await pool.query(
    `UPDATE atas
     SET name = $1, ip = $2, model = $3, city = $4, department = $5, ramais = $6, notes = $7, updated_at = now()
     WHERE id = $8
     RETURNING *`,
    [cleanName, cleanIp, cleanModel, city || 'sao_gabriel', department || '', ramais || '', notes || '', id]
  );

  if (result.rowCount === 0) {
    return { success: false, error: 'Equipamento ATA não encontrado' };
  }
  return { success: true, ata: rowToAta(result.rows[0]) };
}

async function deleteAta(id) {
  const result = await pool.query('DELETE FROM atas WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    return { success: false, error: 'Equipamento ATA não encontrado' };
  }
  return { success: true };
}

async function updateAtaPingResult(id, status, latencyMs = null) {
  const { rows } = await pool.query(
    `UPDATE atas
     SET status = $1, latency_ms = $2, last_checked = now(), updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [status, latencyMs, id]
  );
  return rows.length > 0 ? rowToAta(rows[0]) : null;
}

async function importAtasFromContacts() {
  const { rows: contactRows } = await pool.query(
    "SELECT name, phone, department, ip, city, phone_model FROM contacts WHERE ip <> '' OR phone_model ILIKE '%ATA%'"
  );

  const { rows: existingAtas } = await pool.query("SELECT ip FROM atas");
  const existingIps = new Set(existingAtas.map(a => a.ip.trim()));

  let importedCount = 0;
  for (const c of contactRows) {
    const ip = (c.ip || '').trim();
    if (!ip || existingIps.has(ip)) continue;

    const model = (c.phone_model && c.phone_model.trim() !== '') ? c.phone_model : 'Intelbras ATA 200';
    await pool.query(
      `INSERT INTO atas (name, ip, model, city, department, ramais, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'unknown')`,
      [
        `ATA - ${c.name}`,
        ip,
        model,
        c.city || 'sao_gabriel',
        c.department || '',
        c.phone || '',
        'Importado automaticamente dos Contatos'
      ]
    );
    existingIps.add(ip);
    importedCount++;
  }

  return { success: true, importedCount };
}

module.exports = {
  getLastUpdated,
  getContacts,
  addContact,
  toggleContactVisibility,
  deleteContact,
  updateContact,
  reorderContact,
  renameDepartment,
  submitReport,
  getReports,
  deleteReport,
  authenticateUser,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  registerVisit,
  getAnalytics,
  getDepartmentDescriptions,
  updateDepartmentDescription,
  getTeamsContacts,
  getTeamsContactsByDepartment,
  addTeamsContact,
  updateTeamsContact,
  deleteTeamsContact,
  getAtas,
  getAtaById,
  addAta,
  updateAta,
  deleteAta,
  updateAtaPingResult,
  importAtasFromContacts,
  submitNocTicket,
  getNocTickets,
  deleteNocTicket,
};

