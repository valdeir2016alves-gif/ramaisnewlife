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
        { id: 9001, name: "Thaissa", phone: "6011", department: "Comercial", ip: "" },
        { id: 9002, name: "Leandro", phone: "6012", department: "Gerência", ip: "" },
        { id: 9003, name: "Júlia", phone: "6014", department: "Caixa", ip: "" },
        { id: 9004, name: "Alex", phone: "6013", department: "Estoque", ip: "" }
      ];
    } else if (city === 'sao_gabriel') {
      contactsToFilter = [
        ...initialContacts,
        { id: 9005, name: "WhatsApp NOC", phone: "(55) 9672-2575", department: "NOC", ip: "" },
        { id: 9006, name: "WhatsApp Filtro", phone: "(55) 9669-6951", department: "Suporte Técnico", ip: "" }
      ];
    } else {
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
          Diretório de Ramais internos das Unidades <strong>São Gabriel, Bagé e Passo Fundo</strong>
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
              <h2 className={styles.departmentTitle}>Colaborador(a) e Ramais</h2>
              
              <div className={deptContacts.length > 6 ? styles.contactListMulti : styles.contactList}>
                {deptContacts.map((contact) => {
                  const isWhatsApp = contact.name.toLowerCase().includes('whatsapp');
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const whatsappLink = isWhatsApp ? `https://wa.me/55${onlyNumbers}` : null;

                  return (
                    <div 
                      key={contact.id} 
                      className={styles.contactItem}
                      style={contact.name === 'WhatsApp Filtro' ? { gridColumn: '2' } : {}}
                    >
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
