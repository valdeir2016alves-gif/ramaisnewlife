const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const dbPath = fs.existsSync(dataDir) 
  ? path.join(dataDir, 'ramais.json') 
  : path.join(process.cwd(), 'ramais.json');

let contacts = [];
if (fs.existsSync(dbPath)) {
  contacts = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

// 1. Convert existing Contatos Regionais to global ('all')
contacts.forEach(c => {
  if (c.department === 'Contatos Regionais e Externos') {
    c.city = 'all';
  } else if (!c.city) {
    c.city = 'sao_gabriel'; // set default
  }
});

// Calculate new id based on max
let maxId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) : 0;
const getId = () => ++maxId;

// 2. Add WhatsApp contacts (São Gabriel only)
const waContacts = [
  { name: "WhatsApp NOC", phone: "(55) 9672-2575", department: "NOC", ip: "", city: "sao_gabriel" },
  { name: "Suporte (Filtro)", phone: "(55) 9669-6951", department: "Suporte Técnico", ip: "", city: "sao_gabriel" },
  { name: "Plantão (Empresarial)", phone: "(55) 9996-4340", department: "Suporte Técnico", ip: "", city: "sao_gabriel" }
];

// 3. Add Bagé contacts
const bageContacts = [
  { name: "Thaissa", phone: "6011", department: "Comercial", ip: "", city: "bage" },
  { name: "Leandro", phone: "6012", department: "Gerência", ip: "", city: "bage" },
  { name: "Júlia", phone: "6014", department: "Caixa", ip: "", city: "bage" },
  { name: "Alex", phone: "6013", department: "Estoque", ip: "", city: "bage" }
];

// 4. Add Passo Fundo contacts
const passoContacts = [
  { name: "Anne", phone: "2020", department: "Financeiro", ip: "", city: "passo_fundo" },
  { name: "Felipe", phone: "2029", department: "Estoque", ip: "", city: "passo_fundo" },
  { name: "Jam", phone: "2030", department: "Comercial", ip: "", city: "passo_fundo" }
];

const allNew = [...waContacts, ...bageContacts, ...passoContacts];

allNew.forEach(nc => {
  // Check if it already exists by name, phone and department
  const exists = contacts.find(c => c.name === nc.name && c.phone === nc.phone && c.department === nc.department);
  if (!exists) {
    nc.id = getId();
    contacts.push(nc);
    console.log(`Added: ${nc.name} - ${nc.city}`);
  }
});

fs.writeFileSync(dbPath, JSON.stringify(contacts, null, 2), 'utf-8');
console.log('Migration completed successfully.');
