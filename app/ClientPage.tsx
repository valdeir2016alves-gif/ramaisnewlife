'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';

export default function ClientPage({ initialContacts }: { initialContacts: Contact[] }) {
  const [search, setSearch] = useState('');

  const groupedContacts = useMemo(() => {
    const filtered = initialContacts.filter(
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
  }, [initialContacts, search]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image 
            src="/logo.png" 
            alt="New Life" 
            width={280} 
            height={110} 
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Pesquisar ramal, nome ou setor..."
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
        {Object.keys(groupedContacts).length === 0 ? (
          <div className={styles.noResults}>Nenhum ramal encontrado.</div>
        ) : (
          Object.entries(groupedContacts).map(([department, deptContacts]) => (
            <div key={department} className={styles.departmentSection}>
              <span className={styles.departmentSubtitle}>{department}</span>
              <h2 className={styles.departmentTitle}>Contatos e Ramais</h2>
              
              <div className={styles.contactList}>
                {deptContacts.map((contact) => {
                  const isWhatsApp = contact.name.toLowerCase().includes('whatsapp');
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const whatsappLink = isWhatsApp ? `https://wa.me/55${onlyNumbers}` : null;

                  return (
                    <div key={contact.id} className={styles.contactItem}>
                      <span className={styles.chevron}>›</span>
                      <span className={styles.contactName}>{contact.name}</span>
                      {isWhatsApp ? (
                        <a href={whatsappLink!} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                          {contact.phone}
                        </a>
                      ) : (
                        <span className={styles.contactPhone}>{contact.phone}</span>
                      )}
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
