const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ramais.db');
const db = new Database(dbPath);

console.log('Criando tabela de contatos...');
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL
  );
`);

console.log('Limpando dados antigos...');
db.exec(`DELETE FROM contacts;`);

const initialData = [
  // Contatos Regionais e Externos
  { department: 'Contatos Regionais e Externos', name: 'WhatsApp Central', phone: '0800 647 6190' },
  { department: 'Contatos Regionais e Externos', name: 'São Gabriel – RS', phone: '(55) 3112-0041' },
  { department: 'Contatos Regionais e Externos', name: 'Bagé – RS', phone: '(53) 2018-1566' },
  { department: 'Contatos Regionais e Externos', name: 'Passo Fundo – RS', phone: '(54) 3310-1008' },
  { department: 'Contatos Regionais e Externos', name: 'Imobiliária SG (Fixo)', phone: '(55) 3237-2626' },

  // Caixa
  { department: 'Caixa', name: 'Alice', phone: '4021' },

  // Cancelamento
  { department: 'Cancelamento', name: 'Deise', phone: '4059' },
  { department: 'Cancelamento', name: 'Gessiane', phone: '4023' },

  // Comercial
  { department: 'Comercial', name: 'Rhayssa', phone: '4052' },
  { department: 'Comercial', name: 'Claiton', phone: '4054' },
  { department: 'Comercial', name: 'Camila', phone: '4025' },
  { department: 'Comercial', name: 'Ingridy', phone: '4053' }, // Ampliação / Troca de endereço
  { department: 'Comercial', name: 'Laiz', phone: '4022' },   // Ampliação / Troca de endereço
  { department: 'Comercial', name: 'Max', phone: '4055' },    // Gerência

  // SAC
  { department: 'SAC', name: 'Victória', phone: '4032' },
  { department: 'SAC', name: 'Leandra', phone: '4033' },
  { department: 'SAC', name: 'Milanni', phone: '4031' },
  { department: 'SAC', name: 'Pâmela', phone: '4038' },
  { department: 'SAC', name: 'Yasmin', phone: '4039' },
  { department: 'SAC', name: 'Kailany', phone: '4058' },
  { department: 'SAC', name: 'Julia Marcon', phone: '4037' },
  { department: 'SAC', name: 'Deise', phone: '4059' },
  { department: 'SAC', name: 'Luane/Gessiane', phone: '4023' },
  { department: 'SAC', name: 'Ellen', phone: '4057' },

  // Estoque
  { department: 'Estoque', name: 'Cristian', phone: '4026' },

  // Suporte Técnico
  { department: 'Suporte Técnico', name: 'André (Coordenador)', phone: '4049' },
  { department: 'Suporte Técnico', name: 'Matheus', phone: '4041' },
  { department: 'Suporte Técnico', name: 'Marco', phone: '4042' },
  { department: 'Suporte Técnico', name: 'Otávio', phone: '4043' },
  { department: 'Suporte Técnico', name: 'Eliel', phone: '4044' },
  { department: 'Suporte Técnico', name: 'João', phone: '4045' },
  { department: 'Suporte Técnico', name: 'Luiz', phone: '4065' },
  { department: 'Suporte Técnico', name: 'Erick', phone: '4046' },
  { department: 'Suporte Técnico', name: 'Vinícius', phone: '4047' },
  { department: 'Suporte Técnico', name: 'Eniton', phone: '4048' },
  { department: 'Suporte Técnico', name: 'Paulo', phone: '4050' },
  { department: 'Suporte Técnico', name: 'Pedro', phone: '4061' },
  { department: 'Suporte Técnico', name: 'Guilherme', phone: '4062' },

  // Renovações
  { department: 'Renovações', name: 'Luana', phone: '4027' },
  { department: 'Renovações', name: 'Lisiane', phone: '4029' },
  { department: 'Renovações', name: 'Marcielli', phone: '4067' },

  // Recuperação de Crédito
  { department: 'Recuperação de Crédito', name: 'Mayara', phone: '4024' },

  // Financeiro / RH
  { department: 'Financeiro', name: 'Mayara', phone: '4030' },
  { department: 'Financeiro', name: 'Jessica', phone: '4035' },
  { department: 'Financeiro', name: 'Litiele', phone: '4056' },
  { department: 'Financeiro', name: 'Charlize', phone: '4028' },
  { department: 'RH', name: 'Lucinha', phone: '4034' },

  // NOC
  { department: 'NOC', name: 'Jhonatan / Bruno / Valdeir', phone: '4001' },

  // Imobiliária
  { department: 'Imobiliária', name: 'Giovana', phone: '4060' },
  { department: 'Imobiliária', name: 'WhatsApp/Telefone', phone: '(55) 3237-2626' },
  { department: 'Imobiliária', name: 'WhatsApp/Celular', phone: '(55) 99650-5008' },
];

console.log('Inserindo ramais...');
const insert = db.prepare('INSERT INTO contacts (name, phone, department) VALUES (@name, @phone, @department)');

const insertMany = db.transaction((contacts) => {
  for (const contact of contacts) {
    insert.run(contact);
  }
});

insertMany(initialData);

console.log('Pronto! Banco de dados populado com sucesso.');
