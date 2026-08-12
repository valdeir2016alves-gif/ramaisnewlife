const Database = require('better-sqlite3');
const db = new Database('ramais.db');

db.exec('DELETE FROM contacts');

const insert = db.prepare('INSERT INTO contacts (name, phone, department, ip) VALUES (?, ?, ?, ?)');

const data = [
  // Contatos Regionais e Externos
  ['WhatsApp Central', '0800 647 6190', 'Contatos Regionais e Externos', ''],
  ['São Gabriel – RS', '(55) 3112-0041', 'Contatos Regionais e Externos', ''],
  ['Bagé – RS', '(53) 2018-1566', 'Contatos Regionais e Externos', ''],
  ['Passo Fundo – RS', '(54) 3310-1008', 'Contatos Regionais e Externos', ''],
  ['Imobiliária SG (Fixo)', '(55) 3237-2626', 'Contatos Regionais e Externos', ''],

  // Estoque
  ['Cristian', '4026', 'Estoque', ''],

  // Suporte Técnico
  ['André (Coordenador)', '4049', 'Suporte Técnico', ''],
  ['Erick', '4046', 'Suporte Técnico', ''],
  ['Matheus', '4041', 'Suporte Técnico', ''],
  ['Vinicius', '4047', 'Suporte Técnico', ''],
  ['Marco', '4042', 'Suporte Técnico', ''],
  ['Eniton', '4048', 'Suporte Técnico', ''],
  ['Otávio', '4043', 'Suporte Técnico', ''],
  ['Paulo', '4050', 'Suporte Técnico', ''],
  ['Eliel', '4044', 'Suporte Técnico', ''],
  ['Pedro', '4061', 'Suporte Técnico', ''],
  ['João', '4045', 'Suporte Técnico', ''],
  ['Guilherme', '4062', 'Suporte Técnico', ''],
  ['Luiz', '4065', 'Suporte Técnico', ''],
  ['-', '4040', 'Suporte Técnico', ''],

  // Caixa
  ['Alice', '4021', 'Caixa', ''],

  // Cancelamento
  ['Deise', '4059', 'Cancelamento', ''],
  ['Gessiane', '4023', 'Cancelamento', ''],

  // Renovações
  ['Luana', '4027', 'Renovações', ''],
  ['Lisiane', '4029', 'Renovações', ''],
  ['Marcielli', '4067', 'Renovações', ''],

  // Comercial
  ['Rhayssa (Vendas)', '4052', 'Comercial', ''],
  ['Claiton (Vendas)', '4054', 'Comercial', ''],
  ['Camila (Agendamento)', '4025', 'Comercial', ''],
  ['Ingridy (Ampliação / Troca)', '4053', 'Comercial', ''],
  ['Laiz (Ampliação / Troca)', '4022', 'Comercial', ''],
  ['Max (Gerência)', '4055', 'Comercial', ''],

  // Recuperação de Crédito
  ['Mayara', '4024', 'Recuperação de Crédito', ''],

  // Financeiro / RH
  ['Mayara (Financeiro)', '4030', 'Financeiro / RH', ''],
  ['Jessica (Financeiro)', '4035', 'Financeiro / RH', ''],
  ['Litiele (Financeiro)', '4056', 'Financeiro / RH', ''],
  ['Charlize (Financeiro)', '4028', 'Financeiro / RH', ''],
  ['Lucinha (RH)', '4034', 'Financeiro / RH', ''],

  // SAC
  ['Victória', '4032', 'SAC', ''],
  ['Kailany', '4058', 'SAC', ''],
  ['Leandra', '4033', 'SAC', ''],
  ['Julia Marcon', '4037', 'SAC', ''],
  ['Milanni', '4031', 'SAC', ''],
  ['Deise', '4059', 'SAC', ''],
  ['Pâmela', '4038', 'SAC', ''],
  ['Luane/Gessiane', '4023', 'SAC', ''],
  ['Yasmin', '4039', 'SAC', ''],
  ['Ellen', '4057', 'SAC', ''],

  // NOC
  ['Jhonatan / Bruno / Valdeir', '4001', 'NOC', ''],

  // Imobiliária
  ['-', '4060', 'Imobiliária', ''],
  ['Giovana', '(55) 3237-2626', 'Imobiliária', ''],
  ['Giovana', '(55) 99650-5008', 'Imobiliária', ''],
];

const transaction = db.transaction(() => {
  for (const row of data) {
    insert.run(row);
  }
});

transaction();
console.log('Database seeded with ' + data.length + ' extensions.');
