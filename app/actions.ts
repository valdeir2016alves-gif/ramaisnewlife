'use server';

import fs from 'fs';
import path from 'path';

export interface Contact {
  id: number;
  name: string;
  phone: string;
  department: string;
  ip: string;
}

const getDbPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  return fs.existsSync(dataDir) 
    ? path.join(dataDir, 'ramais.json') 
    : path.join(process.cwd(), 'ramais.json');
};

const getSeedPath = () => path.join(process.cwd(), 'ramais.json.seed');

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
    return JSON.parse(content) as Contact[];
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

export async function addContact(name: string, phone: string, department: string, ip: string = '') {
  try {
    const contacts = readData();
    const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
    contacts.push({ id: newId, name, phone, department, ip });
    writeData(contacts);
    return { success: true };
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

export async function updateContact(id: number, name: string, phone: string, department: string, ip: string = '') {
  try {
    const contacts = readData();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index] = { id, name, phone, department, ip };
      writeData(contacts);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update contact:', error);
    return { success: false, error: error.message };
  }
}
