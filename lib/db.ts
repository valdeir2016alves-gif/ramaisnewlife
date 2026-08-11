import Database from 'better-sqlite3';
import path from 'path';

// Em ambiente de desenvolvimento, queremos manter a conexão singleton para evitar "Too many open files" 
// por causa do HMR do Next.js
const dbPath = path.join(process.cwd(), 'ramais.db');

let db: Database.Database;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._db) {
    (global as any)._db = new Database(dbPath);
  }
  db = (global as any)._db;
} else {
  db = new Database(dbPath);
}

// Configura o banco para ser mais rápido (WAL mode)
db.pragma('journal_mode = WAL');

export default db;
