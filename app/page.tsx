'use client';

import { useState, useEffect, useMemo } from 'react';
import { getContacts, Contact } from './actions';
import styles from './page.module.css';

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

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getContacts();
      setContacts(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleCopy = (phone: string, id: number) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtragem no cliente para ser super rápida
  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const lowerSearch = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.phone.toLowerCase().includes(lowerSearch) ||
        c.department.toLowerCase().includes(lowerSearch)
    );
  }, [contacts, search]);

  // Agrupar por departamento
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    filteredContacts.forEach((c) => {
      if (!groups[c.department]) {
        groups[c.department] = [];
      }
      groups[c.department].push(c);
    });
    return groups;
  }, [filteredContacts]);

  return (
    <main className={styles.main}>
      <header className={`${styles.header} glass`}>
        <div className={styles.logoContainer}>
          {/* Logo simulada com texto */}
          <h1 className={styles.logoText}>
            <span className={styles.logoBold}>new</span> life
          </h1>
          <p className={styles.subtitle}>Lista de Ramais</p>
        </div>
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por nome, setor ou número..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <section className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando ramais...</div>
        ) : Object.keys(groupedContacts).length === 0 ? (
          <div className={styles.noResults}>Nenhum ramal encontrado.</div>
        ) : (
          Object.entries(groupedContacts)
            .sort(([deptA], [deptB]) => {
              // Fixar 'Contatos Regionais e Externos' em primeiro
              if (deptA === 'Contatos Regionais e Externos') return -1;
              if (deptB === 'Contatos Regionais e Externos') return 1;
              return deptA.localeCompare(deptB); // Ordena o restante alfabeticamente
            })
            .map(([department, deptContacts]) => (
            <div key={department} className={styles.departmentSection}>
              <h2 className={styles.departmentTitle}>{getEmoji(department)} {department}</h2>
              <div className={styles.grid}>
                {deptContacts.map((contact) => {
                  const isWhatsApp = contact.name.toLowerCase().includes('whatsapp');
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const whatsappLink = isWhatsApp ? `https://wa.me/55${onlyNumbers}` : null;

                  return (
                  <div key={contact.id} className={`${styles.card} glass`}>
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardName}>{contact.name}</h3>
                      {isWhatsApp ? (
                        <a href={whatsappLink!} target="_blank" rel="noopener noreferrer" className={`${styles.cardNumber} ${styles.whatsappLink}`}>
                          {contact.phone}
                        </a>
                      ) : (
                        <p className={styles.cardNumber}>{contact.phone}</p>
                      )}
                    </div>
                    <button
                      className={`${styles.copyButton} ${copiedId === contact.id ? styles.copied : ''}`}
                      onClick={() => handleCopy(contact.phone, contact.id)}
                      title="Copiar número"
                    >
                      {copiedId === contact.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
