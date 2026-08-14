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
}

const getDbPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  return fs.existsSync(dataDir) 
    ? path.join(dataDir, 'ramais.json') 
    : path.join(process.cwd(), 'ramais.json');
};

const getSeedPath = () => path.join(process.cwd(), 'ramais.json.seed');

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

  let maxId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) : 0;
  const getId = () => ++maxId;

  const defaultContacts = [
    { name: "WhatsApp NOC", phone: "(55) 9672-2575", department: "NOC", ip: "", city: "sao_gabriel" },
    { name: "Suporte (Filtro)", phone: "(55) 9669-6951", department: "Suporte Técnico", ip: "", city: "sao_gabriel" },
    { name: "Plantão (Empresarial)", phone: "(55) 9996-4340", department: "Suporte Técnico", ip: "", city: "sao_gabriel" },
    { name: "Thaissa", phone: "6011", department: "Comercial", ip: "", city: "bage" },
    { name: "Leandro", phone: "6012", department: "Gerência", ip: "", city: "bage" },
    { name: "Júlia", phone: "6014", department: "Caixa", ip: "", city: "bage" },
    { name: "Alex", phone: "6013", department: "Estoque", ip: "", city: "bage" },
    { name: "Anne", phone: "2020", department: "Financeiro", ip: "", city: "passo_fundo" },
    { name: "Felipe", phone: "2029", department: "Estoque", ip: "", city: "passo_fundo" },
    { name: "Jam", phone: "2030", department: "Comercial", ip: "", city: "passo_fundo" }
  ];

  defaultContacts.forEach(dc => {
    const exists = contacts.find(c => c.name === dc.name && c.department === dc.department);
    if (!exists) {
      contacts.push({ ...dc, id: getId() });
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

export async function addContact(name: string, phone: string, department: string, ip: string = '', city: string = 'sao_gabriel') {
  try {
    const contacts = readData();
    const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
    const newContact: Contact = { id: newId, name, phone, department, ip, city };
    contacts.push(newContact);
    writeData(contacts);
    return { success: true, contact: newContact };
  } catch (error: any) {
    console.error('Failed to add contact:', error);
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

export async function updateContact(id: number, name: string, phone: string, department: string, ip: string = '', city: string = 'sao_gabriel') {
  try {
    const contacts = readData();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = { id, name, phone, department, ip, city };
      writeData(contacts);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update contact:', error);
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
