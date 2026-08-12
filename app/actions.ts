'use server';

import db from '@/lib/db';

export interface Contact {
  id: number;
  name: string;
  phone: string;
  department: string;
  ip: string;
}

export async function getContacts(query?: string): Promise<Contact[]> {
  try {
    if (query) {
      const stmt = db.prepare(`
        SELECT * FROM contacts 
        WHERE name LIKE @query 
           OR phone LIKE @query 
           OR department LIKE @query
        ORDER BY id ASC
      `);
      return stmt.all({ query: `%${query}%` }) as Contact[];
    } else {
      const stmt = db.prepare('SELECT * FROM contacts ORDER BY id ASC');
      return stmt.all() as Contact[];
    }
  } catch (error: any) {
    console.error('Failed to fetch contacts:', error);
    throw new Error('Database Error: ' + error.message);
  }
}

export async function addContact(name: string, phone: string, department: string, ip: string = '') {
  try {
    const stmt = db.prepare('INSERT INTO contacts (name, phone, department, ip) VALUES (@name, @phone, @department, @ip)');
    stmt.run({ name, phone, department, ip });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to add contact:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteContact(id: number) {
  try {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = @id');
    stmt.run({ id });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete contact:', error);
    return { success: false, error: error.message };
  }
}

export async function updateContact(id: number, name: string, phone: string, department: string, ip: string = '') {
  try {
    const stmt = db.prepare('UPDATE contacts SET name = @name, phone = @phone, department = @department, ip = @ip WHERE id = @id');
    stmt.run({ id, name, phone, department, ip });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update contact:', error);
    return { success: false, error: error.message };
  }
}
