const db = require('better-sqlite3')('ramais.db');
try {
  db.prepare('ALTER TABLE contacts ADD COLUMN ip TEXT DEFAULT ""').run();
  console.log('Column IP added successfully');
} catch (e) {
  console.error('Error (maybe column exists):', e.message);
}
