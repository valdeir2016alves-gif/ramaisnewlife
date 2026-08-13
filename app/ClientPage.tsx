'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';

export default function ClientPage({ initialContacts }: { initialContacts: Contact[] }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('sao_gabriel');

  const groupedContacts = useMemo(() => {
    let contactsToFilter = initialContacts;

    if (city === 'bage') {
      contactsToFilter = [
        { id: 9001, name: "Tainá", phone: "6010", department: "FINANCEIRO", ip: "" },
        { id: 9002, name: "Eduarda", phone: "6011", department: "FINANCEIRO", ip: "" },
        { id: 9003, name: "Laura", phone: "6012", department: "FINANCEIRO", ip: "" },
        { id: 9004, name: "Alex", phone: "6013", department: "ESTOQUE", ip: "" }
      ];
    } else if (city !== 'sao_gabriel') {
      return {};
    }

    const filtered = contactsToFilter.filter(
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
  }, [initialContacts, search, city]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image 
            src="/logo.png" 
            alt="New Life" 
            width={380} 
            height={150} 
            priority
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div className={styles.headerText}>
          Diretório de Ramais — <strong>Unidade São Gabriel</strong><br />
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>Em breve: Expansão para as unidades de <strong>Bagé</strong> e <strong>Passo Fundo</strong></span>
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

      <div className={styles.cityTabs}>
        <button 
          className={`${styles.cityTab} ${city === 'sao_gabriel' ? styles.cityTabActive : ''}`}
          onClick={() => setCity('sao_gabriel')}
        >
          São Gabriel
        </button>
        <button 
          className={`${styles.cityTab} ${city === 'bage' ? styles.cityTabActive : ''}`}
          onClick={() => setCity('bage')}
        >
          Bagé
        </button>
        <button 
          className={`${styles.cityTab} ${city === 'passo_fundo' ? styles.cityTabActive : ''}`}
          onClick={() => setCity('passo_fundo')}
        >
          Passo Fundo
        </button>
      </div>

      <section className={styles.content}>
        {Object.keys(groupedContacts).length === 0 ? (
          <div className={styles.noResults}>
            {city === 'sao_gabriel' 
              ? 'Nenhum ramal encontrado.' 
              : 'Em breve: ramais desta unidade estarão disponíveis.'}
          </div>
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
