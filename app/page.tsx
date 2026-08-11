'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
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
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

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

  const groupedContacts = useMemo(() => {
    const filtered = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        c.department.toLowerCase().includes(search.toLowerCase())
    );

    const groups: Record<string, Contact[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.department]) {
        groups[c.department] = [];
      }
      groups[c.department].push(c);
    });

    return groups;
  }, [contacts, search]);

  const handleCopy = (phone: string, id: number) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className={styles.main}>
      <header className={`${styles.header} glass`}>
        <div className={styles.logoContainer}>
          <Image 
            src="/logo.png" 
            alt="New Life" 
            width={180} 
            height={70} 
            priority
            style={{ objectFit: 'contain', marginBottom: '0.5rem' }}
          />
          <p className={styles.subtitle}>Lista de Ramais</p>
        </div>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Pesquisar por nome, setor ou número..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </header>

      <section className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando ramais...</div>
        ) : Object.keys(groupedContacts).length === 0 ? (
          <div className={styles.noResults}>Nenhum ramal encontrado.</div>
        ) : (
          Object.entries(groupedContacts).map(([department, deptContacts]) => (
            <div key={department} className={styles.departmentSection}>
              <h2 className={styles.departmentTitle}>{getEmoji(department)} {department}</h2>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {department === 'Contatos Regionais e Externos' ? (
                        <>
                          <th>Localidade / Canal</th>
                          <th>Número</th>
                        </>
                      ) : department === 'Suporte Técnico' ? (
                        <>
                          <th>Ramal</th>
                          <th>Colaborador(a)</th>
                          <th>Ramal</th>
                          <th>Colaborador(a)</th>
                        </>
                      ) : (
                        <>
                          <th>Ramal</th>
                          <th>Colaborador(a)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {department === 'Suporte Técnico' ? (
                      Array.from({ length: Math.ceil(deptContacts.length / 2) }).map((_, i) => {
                        const left = deptContacts[i];
                        const right = deptContacts[i + Math.ceil(deptContacts.length / 2)];
                        
                        return (
                          <tr key={i}>
                            <td>{left?.phone || '-'}</td>
                            <td>{left?.name || '-'}</td>
                            <td>{right?.phone || '-'}</td>
                            <td>{right?.name || '-'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      deptContacts.map((contact) => {
                        const isWhatsApp = contact.name.toLowerCase().includes('whatsapp');
                        const onlyNumbers = contact.phone.replace(/\D/g, '');
                        const whatsappLink = isWhatsApp ? `https://wa.me/55${onlyNumbers}` : null;
                        
                        return (
                          <tr key={contact.id}>
                            {department === 'Contatos Regionais e Externos' ? (
                              <>
                                <td>{contact.name}</td>
                                <td>
                                  {isWhatsApp ? (
                                    <a href={whatsappLink!} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                                      {contact.phone}
                                    </a>
                                  ) : (
                                    contact.phone
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{contact.phone}</td>
                                <td>{contact.name}</td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
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
