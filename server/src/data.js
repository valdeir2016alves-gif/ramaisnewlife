const fs = require('fs');
const path = require('path');

// IMPORTANT: paths and filenames below are kept identical to the previous
// Next.js version (app/actions.ts) so the existing production Docker volume
// (mounted at /app/data) keeps working without any migration step.

const ROOT_DIR = path.join(__dirname, '..', '..');

const getDataDir = () => path.join(ROOT_DIR, 'data');

const getDbPath = () => {
  const dataDir = getDataDir();
  return fs.existsSync(dataDir)
    ? path.join(dataDir, 'ramais.json')
    : path.join(ROOT_DIR, 'ramais.json');
};

const getDescriptionsPath = () => {
  const dataDir = getDataDir();
  return fs.existsSync(dataDir)
    ? path.join(dataDir, 'descriptions.json')
    : path.join(ROOT_DIR, 'descriptions.json');
};

const getSeedPath = () => path.join(ROOT_DIR, 'ramais.json.seed');

const getReportsPath = () => {
  const dataDir = getDataDir();
  return fs.existsSync(dataDir)
    ? path.join(dataDir, 'reports.json')
    : path.join(ROOT_DIR, 'reports.json');
};

const getUsersPath = () => {
  const dataDir = getDataDir();
  return fs.existsSync(dataDir)
    ? path.join(dataDir, 'users.json')
    : path.join(ROOT_DIR, 'users.json');
};

const getAnalyticsPath = () => {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'analytics.json');
};

function getLastUpdated() {
  try {
    const dbPath = getDbPath();
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      return stats.mtime.toLocaleDateString('pt-BR');
    }
    return new Date().toLocaleDateString('pt-BR');
  } catch (e) {
    return new Date().toLocaleDateString('pt-BR');
  }
}

function ensureDefaultContacts(contacts) {
  let changed = false;
  contacts.forEach(c => {
    if (c.department === 'Contatos Regionais e Externos' && c.city !== 'all') {
      c.city = 'all';
      changed = true;
    } else if (!c.city) {
      c.city = 'sao_gabriel';
      changed = true;
    }
  });
  return changed;
}

function readContacts() {
  const dbPath = getDbPath();

  if (!fs.existsSync(dbPath)) {
    const seedPath = getSeedPath();
    if (fs.existsSync(seedPath)) {
      console.log('Restaurando json a partir do seed...');
      fs.copyFileSync(seedPath, dbPath);
    } else {
      return [];
    }
  }

  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(content);
    const changed = ensureDefaultContacts(parsed);
    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (error) {
    console.error('Erro ao ler ramais.json:', error);
    return [];
  }
}

function writeContacts(data) {
  fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2), 'utf-8');
}

function getContacts(query) {
  const contacts = readContacts();
  if (query) {
    const q = query.toLowerCase();
    return contacts.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.phone.toLowerCase().includes(q) ||
           c.department.toLowerCase().includes(q)
    );
  }
  return contacts;
}

function addContact(name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') {
  const contacts = readContacts();
  const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
  const newContact = { id: newId, name, phone, department, ip, city, phoneModel };
  contacts.push(newContact);
  writeContacts(contacts);
  return { success: true, contact: newContact };
}

function toggleContactVisibility(id, hidden) {
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index].hidden = hidden;
    writeContacts(contacts);
    return { success: true };
  }
  return { success: false, error: 'Contato não encontrado' };
}

function deleteContact(id) {
  const contacts = readContacts();
  const newContacts = contacts.filter(c => c.id !== id);
  writeContacts(newContacts);
  return { success: true };
}

function updateContact(id, name, phone, department, ip = '', city = 'sao_gabriel', phoneModel = '') {
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index] = { id, name, phone, department, ip, city, phoneModel };
    writeContacts(contacts);
  }
  return { success: true };
}

function reorderContact(id, direction) {
  const contacts = readContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return { success: false, error: 'Contact not found' };

  if (direction === 'up' && index > 0) {
    const temp = contacts[index - 1];
    contacts[index - 1] = contacts[index];
    contacts[index] = temp;
    writeContacts(contacts);
  } else if (direction === 'down' && index < contacts.length - 1) {
    const temp = contacts[index + 1];
    contacts[index + 1] = contacts[index];
    contacts[index] = temp;
    writeContacts(contacts);
  }
  return { success: true };
}

function renameDepartment(oldDepartment, newDepartment) {
  const contacts = readContacts();
  let updated = false;
  contacts.forEach(c => {
    if (c.department === oldDepartment) {
      c.department = newDepartment;
      updated = true;
    }
  });
  if (updated) {
    writeContacts(contacts);
  }
  return { success: true };
}

function readReports() {
  const dbPath = getReportsPath();
  if (!fs.existsSync(dbPath)) return [];
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao ler reports.json:', error);
    return [];
  }
}

function writeReports(data) {
  fs.writeFileSync(getReportsPath(), JSON.stringify(data, null, 2), 'utf-8');
}

async function submitReport(name, ramal, message) {
  const reports = readReports();
  const newId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
  const newReport = {
    id: newId,
    date: new Date().toISOString(),
    name,
    ramal,
    message
  };
  reports.push(newReport);
  writeReports(reports);

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

function getReports() {
  return readReports();
}

function deleteReport(id) {
  const reports = readReports();
  const newReports = reports.filter(r => r.id !== id);
  writeReports(newReports);
  return { success: true };
}

function ensureDefaultUser(users) {
  if (users.length === 0) {
    users.push({
      id: 1,
      username: 'admin',
      password: 'newlife33',
      role: 'admin'
    });
    return true;
  }
  return false;
}

function readUsers() {
  const dbPath = getUsersPath();
  let users = [];
  if (fs.existsSync(dbPath)) {
    try {
      const content = fs.readFileSync(dbPath, 'utf-8');
      users = JSON.parse(content);
    } catch (error) {
      console.error('Erro ao ler users.json:', error);
    }
  }

  if (ensureDefaultUser(users)) {
    writeUsers(users);
  }
  return users;
}

function writeUsers(data) {
  fs.writeFileSync(getUsersPath(), JSON.stringify(data, null, 2), 'utf-8');
}

function authenticateUser(username, password) {
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const { password: _pw, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }
  return { success: false, error: 'Usuário ou senha incorretos.' };
}

function getUsers() {
  const users = readUsers();
  return users.map(({ password, ...u }) => u);
}

function addUser(username, password, role) {
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return { success: false, error: 'Usuário já existe.' };
  }
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  users.push({ id: newId, username, password, role });
  writeUsers(users);
  return { success: true };
}

function updateUser(id, username, password, role) {
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return { success: false, error: 'Usuário não encontrado.' };

  if (username !== users[index].username && users.find(u => u.username === username)) {
    return { success: false, error: 'Usuário já existe.' };
  }

  users[index].username = username;
  if (password) users[index].password = password;
  if (role) users[index].role = role;

  writeUsers(users);
  return { success: true };
}

function deleteUser(id) {
  const users = readUsers();
  if (users.length <= 1) return { success: false, error: 'Não é possível deletar o último usuário do sistema.' };
  const newUsers = users.filter(u => u.id !== id);
  writeUsers(newUsers);
  return { success: true };
}

function readAnalytics() {
  try {
    const filePath = getAnalyticsPath();
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading analytics:', error);
    return [];
  }
}

function writeAnalytics(data) {
  try {
    fs.writeFileSync(getAnalyticsPath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing analytics:', error);
  }
}

function registerVisit() {
  try {
    const stats = readAnalytics();
    const today = new Date().toISOString().split('T')[0];

    const todayStat = stats.find(s => s.date === today);
    if (todayStat) {
      todayStat.visits += 1;
    } else {
      stats.push({ date: today, visits: 1 });
    }

    if (stats.length > 30) {
      stats.shift();
    }

    writeAnalytics(stats);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

function getAnalytics() {
  return readAnalytics();
}

function getDepartmentDescriptions() {
  try {
    const dbPath = getDescriptionsPath();
    const seedPath = path.join(ROOT_DIR, 'descriptions.json');

    if (!fs.existsSync(dbPath) && fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, dbPath);
    }

    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read descriptions.json', e);
  }
  return {};
}

function updateDepartmentDescription(department, description) {
  try {
    const dbPath = getDescriptionsPath();
    let data = {};
    if (fs.existsSync(dbPath)) {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    const normalized = department.toLowerCase().replace(/–/g, '-').trim();

    if (description.trim() === '') {
      delete data[normalized];
    } else {
      data[normalized] = description;
    }

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    console.error('Failed to update description', e);
    return { success: false, error: 'Falha ao salvar a descrição' };
  }
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
};
