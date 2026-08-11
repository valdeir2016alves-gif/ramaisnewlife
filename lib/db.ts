import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Em ambiente de desenvolvimento, queremos manter a conexão singleton para evitar "Too many open files" 
// por causa do HMR do Next.js
const dataDir = path.join(process.cwd(), 'data');
const dbPath = fs.existsSync(dataDir) 
  ? path.join(dataDir, 'ramais.db') 
  : path.join(process.cwd(), 'ramais.db');

let db: Database.Database;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._db) {
    (global as any)._db = new Database(dbPath);
  }
  db = (global as any)._db;
} else {
  db = new Database(dbPath);
}

// Verificar se é um banco de dados vazio (ex: usuário montou um volume vazio no Docker)
let tableExists = false;
try {
  tableExists = !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contacts'").get();
} catch (e) {}

let shouldRestore = false;
if (!tableExists) {
  shouldRestore = true;
} else {
  try {
    const rowCount = db.prepare("SELECT COUNT(*) as c FROM contacts").get() as { c: number };
    if (rowCount.c === 0) {
      shouldRestore = true;
    }
  } catch(e) {}
}

if (shouldRestore) {
  db.close();
  const seedPath = path.join(process.cwd(), 'ramais.db.seed');
  if (fs.existsSync(seedPath)) {
    console.log('Restaurando banco de dados original (seed) sobre o banco vazio...');
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    fs.copyFileSync(seedPath, dbPath);
  } else {
    // Se não tiver seed, pelo menos cria a tabela para não dar erro
    const newDb = new Database(dbPath);
    newDb.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        department TEXT NOT NULL,
        ip TEXT
      )
    `);
    newDb.close();
  }
  db = new Database(dbPath);
}

// Configura o banco para usar o modo de log padrão (evita segmentation fault no Docker desktop/WSL2)
db.pragma('journal_mode = DELETE');

export default db;
