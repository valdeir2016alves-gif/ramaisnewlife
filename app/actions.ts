'use server';

import fs from 'fs';
import path from 'path';

export interface Contact {
  id: number;
  name: string;
  phone: string;
  department: string;
  ip: string;
  city?: string;
  phoneModel?: string;
  hidden?: boolean;
}

const getDbPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  return fs.existsSync(dataDir) 
    ? path.join(dataDir, 'ramais.json') 
    : path.join(process.cwd(), 'ramais.json');
};

const getSeedPath = () => path.join(process.cwd(), 'ramais.json.seed');

export async function getLastUpdated(): Promise<string> {
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

const ensureDefaultContacts = (contacts: Contact[]): boolean => {
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
};

const readData = (): Contact[] => {
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
    const parsed = JSON.parse(content) as Contact[];
    const changed = ensureDefaultContacts(parsed);
    if (changed) {
      // save injected right away to persist them
      fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (error) {
    console.error('Erro ao ler ramais.json:', error);
    return [];
  }
};

const writeData = (data: Contact[]) => {
  const dbPath = getDbPath();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export async function getContacts(query?: string): Promise<Contact[]> {
  try {
    const contacts = readData();
    if (query) {
      const q = query.toLowerCase();
      return contacts.filter(
        c => c.name.toLowerCase().includes(q) || 
             c.phone.toLowerCase().includes(q) || 
             c.department.toLowerCase().includes(q)
      );
    }
    return contacts;
  } catch (error: any) {
    console.error('Failed to fetch contacts:', error);
    throw new Error('Database Error: ' + error.message);
  }
}

export async function addContact(name: string, phone: string, department: string, ip: string = '', city: string = 'sao_gabriel', phoneModel: string = '') {
  try {
    const contacts = readData();
    const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
    const newContact: Contact = { id: newId, name, phone, department, ip, city, phoneModel };
    contacts.push(newContact);
    writeData(contacts);
    return { success: true, contact: newContact };
  } catch (error: any) {
    console.error('Failed to add contact:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleContactVisibility(id: number, hidden: boolean) {
  try {
    const contacts = readData();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index].hidden = hidden;
      writeData(contacts);
      return { success: true };
    }
    return { success: false, error: 'Contato não encontrado' };
  } catch (error: any) {
    console.error('Failed to toggle visibility:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteContact(id: number) {
  try {
    const contacts = readData();
    const newContacts = contacts.filter(c => c.id !== id);
    writeData(newContacts);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete contact:', error);
    return { success: false, error: error.message };
  }
}

export async function updateContact(id: number, name: string, phone: string, department: string, ip: string = '', city: string = 'sao_gabriel', phoneModel: string = '') {
  try {
    const contacts = readData();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = { id, name, phone, department, ip, city, phoneModel };
      writeData(contacts);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update contact:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderContact(id: number, direction: 'up' | 'down') {
  try {
    const contacts = readData();
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) return { success: false, error: 'Contact not found' };
    
    if (direction === 'up' && index > 0) {
      const temp = contacts[index - 1];
      contacts[index - 1] = contacts[index];
      contacts[index] = temp;
      writeData(contacts);
    } else if (direction === 'down' && index < contacts.length - 1) {
      const temp = contacts[index + 1];
      contacts[index + 1] = contacts[index];
      contacts[index] = temp;
      writeData(contacts);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reorder contact:', error);
    return { success: false, error: error.message };
  }
}

export async function renameDepartment(oldDepartment: string, newDepartment: string) {
  try {
    const contacts = readData();
    let updated = false;
    contacts.forEach(c => {
      if (c.department === oldDepartment) {
        c.department = newDepartment;
        updated = true;
      }
    });
    if (updated) {
      writeData(contacts);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to rename department:', error);
    return { success: false, error: error.message };
  }
}

export interface Report {
  id: number;
  date: string;
  name: string;
  ramal: string;
  message: string;
}

const getReportsPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  return fs.existsSync(dataDir) 
    ? path.join(dataDir, 'reports.json') 
    : path.join(process.cwd(), 'reports.json');
};

const readReports = (): Report[] => {
  const dbPath = getReportsPath();
  if (!fs.existsSync(dbPath)) return [];
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content) as Report[];
  } catch (error) {
    console.error('Erro ao ler reports.json:', error);
    return [];
  }
};

const writeReports = (data: Report[]) => {
  const dbPath = getReportsPath();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export async function submitReport(name: string, ramal: string, message: string) {
  try {
    const reports = readReports();
    const newId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
    const newReport: Report = {
      id: newId,
      date: new Date().toISOString(),
      name,
      ramal,
      message
    };
    reports.push(newReport);
    writeReports(reports);

    // Opcional: Enviar notificação via Telegram
    // Requer as variáveis TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID
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
  } catch (error: any) {
    console.error('Failed to submit report:', error);
    return { success: false, error: error.message };
  }
}

export async function getReports(): Promise<Report[]> {
  try {
    return readReports();
  } catch (error: any) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
}

export async function deleteReport(id: number) {
  try {
    const reports = readReports();
    const newReports = reports.filter(r => r.id !== id);
    writeReports(newReports);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete report:', error);
    return { success: false, error: error.message };
  }
}


export interface User {
  id: number;
  username: string;
  password?: string;
  role: 'admin' | 'readonly';
}

const getUsersPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  return fs.existsSync(dataDir) 
    ? path.join(dataDir, 'users.json') 
    : path.join(process.cwd(), 'users.json');
};

const ensureDefaultUser = (users: User[]): boolean => {
  if (users.length === 0) {
    users.push({
      id: 1,
      username: 'admin',
      password: 'Nl!#@2026Admin',
      role: 'admin'
    });
    return true;
  }
  return false;
};

const readUsers = (): User[] => {
  const dbPath = getUsersPath();
  let users: User[] = [];
  if (fs.existsSync(dbPath)) {
    try {
      const content = fs.readFileSync(dbPath, 'utf-8');
      users = JSON.parse(content) as User[];
    } catch (error) {
      console.error('Erro ao ler users.json:', error);
    }
  }
  
  if (ensureDefaultUser(users)) {
    writeUsers(users);
  }
  return users;
};

const writeUsers = (data: User[]) => {
  const dbPath = getUsersPath();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password'>; error?: string }> {
  try {
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, error: 'Usuário ou senha incorretos.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
  try {
    const users = readUsers();
    return users.map(({ password, ...u }) => u);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

export async function addUser(username: string, password: string, role: 'admin' | 'readonly') {
  try {
    const users = readUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Usuário já existe.' };
    }
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({ id: newId, username, password, role });
    writeUsers(users);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUser(id: number, username: string, password?: string, role?: 'admin' | 'readonly') {
  try {
    const users = readUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, error: 'Usuário não encontrado.' };
    
    // Check if new username conflicts
    if (username !== users[index].username && users.find(u => u.username === username)) {
      return { success: false, error: 'Usuário já existe.' };
    }

    users[index].username = username;
    if (password) users[index].password = password;
    if (role) users[index].role = role;
    
    writeUsers(users);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: number) {
  try {
    const users = readUsers();
    if (users.length <= 1) return { success: false, error: 'Não é possível deletar o último usuário do sistema.' };
    const newUsers = users.filter(u => u.id !== id);
    writeUsers(newUsers);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface DailyStats {
  date: string;
  visits: number;
}

const ANALYTICS_FILE = path.join(process.cwd(), 'data', 'analytics.json');

function getAnalyticsFilePath() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return ANALYTICS_FILE;
}

function readAnalytics(): DailyStats[] {
  try {
    const filePath = getAnalyticsFilePath();
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

function writeAnalytics(data: DailyStats[]) {
  try {
    const filePath = getAnalyticsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing analytics:', error);
  }
}

export async function registerVisit() {
  try {
    const stats = readAnalytics();
    const today = new Date().toISOString().split('T')[0];
    
    const todayStat = stats.find(s => s.date === today);
    if (todayStat) {
      todayStat.visits += 1;
    } else {
      stats.push({ date: today, visits: 1 });
    }
    
    // Keep only last 30 days
    if (stats.length > 30) {
      stats.shift();
    }
    
    writeAnalytics(stats);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getAnalytics() {
  return readAnalytics();
}

