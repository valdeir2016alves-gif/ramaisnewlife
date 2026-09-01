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
};
