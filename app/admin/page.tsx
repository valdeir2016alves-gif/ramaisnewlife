'use client';

import { useState, useEffect, useMemo } from 'react';
import { getContacts, addContact, deleteContact, updateContact, renameDepartment, Contact } from '../actions';
import styles from './admin.module.css';

const departmentEmojis: Record<string, string> = {
  'Contatos Regionais e Externos': '📞',
  'Estoque': '📦',
  'Suporte Técnico': '💻',
  'Caixa': '💰',
  'Cancelamento': '🚫',
  'Comercial': '📈',
  'Renovações': '🔄',
  'Recuperação de Crédito': '🛡️',
  'Financeiro': '📊',
  'RH': '🧑‍💼',
  'SAC': '🎧',
  'NOC': '📡',
  'Imobiliária': '🏠',
  'Gerência': '💼'
};

const getEmoji = (dept: string) => departmentEmojis[dept] || '🏢';

function EditableRow({ 
  contact, 
  onSave, 
  onDelete 
}: { 
  contact: Contact; 
  onSave: (id: number, name: string, phone: string, department: string, ip: string, city: string, phoneModel: string) => Promise<void>; 
  onDelete: (id: number) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const [ip, setIp] = useState(contact.ip || '');
  const [department, setDepartment] = useState(contact.department);
  const [city, setCity] = useState(contact.city || 'sao_gabriel');
  const [phoneModel, setPhoneModel] = useState(contact.phoneModel || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !phone || !department) {
      alert('Preencha Nome, Número e Setor!');
      return;
    }
    setLoading(true);
    await onSave(contact.id, name, phone, department, ip, city, phoneModel);
    setLoading(false);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className={styles.inputInline} 
            placeholder="Nome"
          />
          <input 
            type="text" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
            className={styles.inputInline} 
            placeholder="Setor"
            style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={styles.inputInline}
            style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
          >
            <option value="sao_gabriel">São Gabriel</option>
            <option value="bage">Bagé</option>
            <option value="passo_fundo">Passo Fundo</option>
            <option value="all">Global (Todas as Unidades)</option>
          </select>
        </td>
        <td>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className={styles.inputInline} 
            placeholder="Número"
          />
        </td>
        <td>
          <input 
            type="text" 
            value={ip} 
            onChange={(e) => setIp(e.target.value)} 
            className={styles.inputInline} 
            placeholder="IP"
          />
        </td>
        <td>
          <select
            value={phoneModel}
            onChange={(e) => setPhoneModel(e.target.value)}
            className={styles.inputInline}
          >
            <option value="">Selecione o Modelo</option>
            <option value="Intelbras ATA 200">Intelbras ATA 200</option>
            <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
            <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
            <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
          </select>
        </td>
        <td>
          <div className={styles.tableActions}>
            <button onClick={handleSave} className={styles.btnPrimary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={loading}>
              {loading ? '...' : 'Salvar'}
            </button>
            <button onClick={() => {
              setIsEditing(false);
              // Reset values
              setName(contact.name);
              setPhone(contact.phone);
              setDepartment(contact.department);
              setCity(contact.city || 'sao_gabriel');
              setIp(contact.ip || '');
              setPhoneModel(contact.phoneModel || '');
            }} className={styles.btnSecondary} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} disabled={loading}>
              Cancelar
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{contact.name}</td>
      <td>{contact.phone}</td>
      <td>{contact.ip || '-'}</td>
      <td>{contact.phoneModel || '-'}</td>
      <td>
        <div className={styles.tableActions}>
          <button 
            onClick={() => setIsEditing(true)} 
            className={styles.btnSecondary}
            disabled={loading}
          >
            Editar
          </button>
          <button 
            onClick={() => onDelete(contact.id)} 
            className={styles.btnDanger}
            disabled={loading}
          >
            Excluir
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [ip, setIp] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [newCity, setNewCity] = useState('sao_gabriel');
  const [adminCity, setAdminCity] = useState('sao_gabriel');
  
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'srv2504@new') {
      setIsAuthenticated(true);
      loadContacts();
    } else {
      alert('Senha incorreta!');
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getContacts();
      setContacts(data || []);
    } catch (error) {
      console.error("Failed to load contacts", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !department) {
      alert('Preencha os campos obrigatórios (Nome, Número, Setor)!');
      return;
    }
    
    setLoading(true);
    const result = await addContact(name, phone, department, ip, newCity, phoneModel);
    if (result.success) {
      setName('');
      setPhone('');
      setDepartment('');
      setIp('');
      setPhoneModel('');
      await loadContacts();
    } else {
      alert(`Erro ao adicionar ramal: ${result.error || 'Erro desconhecido. Verifique as configurações de proxy ou permissões.'}`);
      console.error(result.error);
    }
    setLoading(false);
  };

  const handleUpdateRow = async (id: number, newName: string, newPhone: string, newDepartment: string, newIp: string, updatedCity: string, updatedPhoneModel: string) => {
    const result = await updateContact(id, newName, newPhone, newDepartment, newIp, updatedCity, updatedPhoneModel);
    if (result.success) {
      await loadContacts();
    } else {
      alert('Erro ao atualizar: ' + result.error);
    }
  };

  const handleDeleteRow = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este ramal?')) {
      const result = await deleteContact(id);
      if (result.success) {
        await loadContacts();
      } else {
        alert('Erro ao excluir: ' + result.error);
      }
    }
  };

  const handleRenameDepartment = async (oldDepartment: string) => {
    const newDepartment = prompt(`Renomear o setor "${oldDepartment}" para:`, oldDepartment);
    if (newDepartment && newDepartment.trim() !== '' && newDepartment !== oldDepartment) {
      setLoading(true);
      const result = await renameDepartment(oldDepartment, newDepartment.trim());
      if (result.success) {
        await loadContacts();
      } else {
        alert('Erro ao renomear setor: ' + result.error);
      }
      setLoading(false);
    }
  };

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    const filtered = contacts.filter(c => {
      const cCity = c.city || 'sao_gabriel';
      if (adminCity === 'all') return cCity === 'all';
      return cCity === adminCity || cCity === 'all';
    });
    
    filtered.forEach((c) => {
      if (!groups[c.department]) {
        groups[c.department] = [];
      }
      groups[c.department].push(c);
    });
    return groups;
  }, [contacts, adminCity]);

  if (!isAuthenticated) {
    return (
      <main className={styles.container}>
        <div className={`${styles.loginBox} glass`}>
          <h1 className={styles.title}>Admin - Ramais</h1>
          <p className={styles.subtitle}>Digite a senha para acessar</p>
          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.btnPrimary}>Entrar</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gerenciar Ramais</h1>
        <a href="/" className={styles.link}>Voltar para o site principal</a>
      </header>

      <section className={`${styles.addSection} glass`}>
        <h2>Adicionar Novo Ramal</h2>
        <form onSubmit={handleAdd} className={styles.formRow}>
          <input 
            type="text" 
            placeholder="Nome (ex: João Silva)" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className={styles.input}
          />
          <input 
            type="text" 
            placeholder="Número (ex: 4050)" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className={styles.input}
          />
          <input 
            type="text" 
            placeholder="Setor (ex: Suporte Técnico)" 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)} 
            className={styles.input}
          />
          <input 
            type="text" 
            placeholder="IP (Opcional)" 
            value={ip} 
            onChange={(e) => setIp(e.target.value)} 
            className={styles.input}
          />
          <select
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            className={styles.input}
          >
            <option value="sao_gabriel">São Gabriel</option>
            <option value="bage">Bagé</option>
            <option value="passo_fundo">Passo Fundo</option>
            <option value="all">Global (Todas as Unidades)</option>
          </select>
          <select
            value={phoneModel}
            onChange={(e) => setPhoneModel(e.target.value)}
            className={styles.input}
          >
            <option value="">Selecione o Modelo</option>
            <option value="Intelbras ATA 200">Intelbras ATA 200</option>
            <option value="Telefone IP Intelbras TIP 125i">Telefone IP Intelbras TIP 125i</option>
            <option value="Telefone IP Intelbras TIP 200">Telefone IP Intelbras TIP 200</option>
            <option value="Telefone Sem Fio TS 2510">Telefone Sem Fio TS 2510</option>
          </select>
          <div className={styles.actionButtons}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.listSection}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            className={adminCity === 'sao_gabriel' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setAdminCity('sao_gabriel')}
          >São Gabriel</button>
          <button 
            className={adminCity === 'bage' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setAdminCity('bage')}
          >Bagé</button>
          <button 
            className={adminCity === 'passo_fundo' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setAdminCity('passo_fundo')}
          >Passo Fundo</button>
          <button 
            className={adminCity === 'all' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setAdminCity('all')}
          >Global</button>
        </div>
        <h2>Ramais Cadastrados</h2>
        {Object.keys(groupedContacts).length === 0 ? (
          <p>Nenhum ramal cadastrado.</p>
        ) : (
          Object.entries(groupedContacts)
            .map(([department, deptContacts]) => (
            <div key={department} className={styles.departmentGroup}>
              <h3 className={styles.departmentTitle}>
                {getEmoji(department)} {department}
                <button 
                  onClick={() => handleRenameDepartment(department)}
                  className={styles.btnSecondary}
                  style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                  disabled={loading}
                >
                  ✎ Editar Nome
                </button>
              </h3>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Número</th>
                      <th>IP</th>
                      <th>Modelo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptContacts.map((contact) => (
                      <EditableRow 
                        key={contact.id} 
                        contact={contact} 
                        onSave={handleUpdateRow} 
                        onDelete={handleDeleteRow} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
