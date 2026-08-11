const db = require('better-sqlite3')('ramais.db');
db.prepare("UPDATE contacts SET department = 'Gerência' WHERE name = 'Max' AND phone = '4055'").run();
console.log('Updated Max to Gerência');
