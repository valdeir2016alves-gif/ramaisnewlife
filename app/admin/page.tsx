'use client';

import { useState, useEffect, useMemo } from 'react';
import { getContacts, addContact, deleteContact, updateContact, renameDepartment, Contact, getReports, deleteReport, Report, authenticateUser, getUsers as fetchUsers, addUser as createUser, updateUser as editUser, deleteUser as removeUser, User } from '../actions';
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
  onDelete,
  canEdit
}: { 
  contact: Contact; 
  onSave: (id: number, name: string, phone: string, department: string, ip: string, city: string, phoneModel: string) => Promise<void>; 
  onDelete: (id: number) => Promise<void>;
  canEdit: boolean;
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

  if (isEditing && canEdit) {
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
      <td>
        {contact.ip ? (
          <a 
            href={`http://${contact.ip}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            {contact.ip}
          </a>
        ) : (
          '-'
        )}
      </td>
      <td>{contact.phoneModel || '-'}</td>
      {canEdit && (
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
      )}
    </tr>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [ip, setIp] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [newCity, setNewCity] = useState('sao_gabriel');
  const [adminCity, setAdminCity] = useState('sao_gabriel');
  const [activeTab, setActiveTab] = useState<'ramais' | 'reports' | 'users'>('ramais');
  const [reports, setReports] = useState<Report[]>([]);
  const [systemUsers, setSystemUsers] = useState<Omit<User, 'password'>[]>([]);
  
  const [loading, setLoading] = useState(false);

  const canEdit = currentUser?.role === 'admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await authenticateUser(loginUsername, loginPassword);
    setLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      loadContacts();
      if (result.user.role === 'admin') {
        loadUsers();
      }
    } else {
      alert(result.error || 'Credenciais incorretas!');
    }
  };

  const loadUsers = async () => {
    const users = await fetchUsers();
    setSystemUsers(users);
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await getContacts();
      const reportsData = await getReports();
      setContacts(data || []);
      setReports(reportsData || []);
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

  const handleDeleteReportRow = async (id: number) => {
    if (confirm('Marcar este relato como resolvido/excluído?')) {
      const result = await deleteReport(id);
      if (result.success) {
        await loadContacts();
      } else {
        alert('Erro ao excluir relato: ' + result.error);
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

  if (!currentUser) {
    return (
      <main className={styles.container}>
        <div className={`${styles.loginBox} glass`}>
          <h1 className={styles.title}>Admin - Ramais</h1>
          <p className={styles.subtitle}>Digite seu usuário e senha para acessar</p>
          <form onSubmit={handleLogin} className={styles.form}>
            <input
              type="text"
              placeholder="Usuário"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className={activeTab === 'ramais' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setActiveTab('ramais')}
          >
            Ramais
          </button>
          <button 
            className={activeTab === 'reports' ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setActiveTab('reports')}
          >
            Relatórios de Erro {reports.length > 0 && `(${reports.length})`}
          </button>
          {canEdit && (
            <button 
              className={activeTab === 'users' ? styles.btnPrimary : styles.btnSecondary}
              onClick={() => setActiveTab('users')}
            >
              Usuários
            </button>
          )}
          <a href="/" className={styles.link} style={{ marginLeft: '1rem' }}>Voltar ao Site</a>
          <button 
            onClick={() => setCurrentUser(null)} 
            className={styles.btnDanger}
            style={{ marginLeft: 'auto' }}
          >
            Sair ({currentUser.username})
          </button>
        </div>
      </header>

      {activeTab === 'ramais' ? (
        <>
          {canEdit && (
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
      )}

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
                {canEdit && (
                  <button 
                    onClick={() => handleRenameDepartment(department)}
                    className={styles.btnSecondary}
                    style={{ marginLeft: '1rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                    disabled={loading}
                  >
                    ✎ Editar Nome
                  </button>
                )}
              </h3>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Número</th>
                      <th>IP</th>
                      <th>Modelo</th>
                      {canEdit && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {deptContacts.map((contact) => (
                      <EditableRow 
                        key={contact.id} 
                        contact={contact} 
                        onSave={handleUpdateRow} 
                        onDelete={handleDeleteRow} 
                        canEdit={canEdit}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
      </>
      ) : activeTab === 'reports' ? (
        <section className={styles.listSection}>
          <h2>Relatórios de Ramais com Problema</h2>
          {reports.length === 0 ? (
            <p>Nenhum relato encontrado. Tudo certo por aqui!</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Reportado por</th>
                    <th>Ramal</th>
                    <th>Problema</th>
                    {canEdit && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleString('pt-BR')}</td>
                      <td>{r.name || 'Anônimo'}</td>
                      <td>{r.ramal}</td>
                      <td>{r.message}</td>
                      {canEdit && (
                        <td>
                          <button 
                            onClick={() => handleDeleteReportRow(r.id)} 
                            className={styles.btnDanger}
                          >
                            Resolver / Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : activeTab === 'users' && canEdit ? (
        <section className={styles.listSection}>
          <h2>Gerenciar Usuários</h2>
          <div className={`${styles.addSection} glass`} style={{ marginBottom: '2rem' }}>
            <h3>Adicionar Usuário</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const user = (form.elements.namedItem('username') as HTMLInputElement).value;
              const pass = (form.elements.namedItem('password') as HTMLInputElement).value;
              const role = (form.elements.namedItem('role') as HTMLSelectElement).value as 'admin' | 'readonly';
              
              if (!user || !pass) return alert('Preencha os campos!');
              setLoading(true);
              const result = await createUser(user, pass, role);
              setLoading(false);
              if (result.success) {
                alert('Usuário criado!');
                form.reset();
                loadUsers();
              } else {
                alert('Erro: ' + result.error);
              }
            }} className={styles.formRow}>
              <input type="text" name="username" placeholder="Nome de Usuário" className={styles.input} required />
              <input type="password" name="password" placeholder="Senha" className={styles.input} required />
              <select name="role" className={styles.input} required>
                <option value="readonly">Somente Leitura</option>
                <option value="admin">Administrador</option>
              </select>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>Criar</button>
            </form>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Nível de Acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.role === 'admin' ? 'Administrador' : 'Leitura'}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button 
                          onClick={async () => {
                            const newPass = prompt(`Nova senha para ${u.username} (deixe em branco para não alterar):`);
                            if (newPass !== null) {
                              setLoading(true);
                              const res = await editUser(u.id, u.username, newPass || undefined, undefined);
                              setLoading(false);
                              if (res.success) alert('Senha atualizada!');
                              else alert('Erro: ' + res.error);
                            }
                          }}
                          className={styles.btnSecondary}
                          disabled={loading}
                        >
                          Trocar Senha
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`Excluir usuário ${u.username}?`)) {
                              setLoading(true);
                              const res = await removeUser(u.id);
                              setLoading(false);
                              if (res.success) loadUsers();
                              else alert('Erro: ' + res.error);
                            }
                          }} 
                          className={styles.btnDanger}
                          disabled={loading || u.username === currentUser.username}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
