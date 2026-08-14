'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';

export default function ClientPage({ initialContacts }: { initialContacts: Contact[] }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('sao_gabriel');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const groupedContacts = useMemo(() => {
    const filtered = initialContacts.filter((c) => {
      const cCity = c.city || 'sao_gabriel';
      // If contact is global, it appears in all cities
      if (cCity === 'all') return true;
      return cCity === city;
    }).filter(
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
            style={{ objectFit: 'contain', filter: 'var(--logo-filter)' }}
          />
        </div>
        <div className={styles.headerText}>
          Diretório de Ramais internos das Unidades <strong>São Gabriel, Bagé e Passo Fundo</strong>
        </div>
        <div className={styles.headerRight}>
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
          <button 
            onClick={toggleTheme} 
            className={styles.themeToggle}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
            {search.trim() !== '' || city !== 'passo_fundo' 
              ? 'Nenhum ramal encontrado.' 
              : 'Em breve'}
          </div>
        ) : (
          Object.entries(groupedContacts).map(([department, deptContacts]) => (
            <div key={department} className={styles.departmentSection}>
              <span className={styles.departmentSubtitle}>{department}</span>
              <h2 className={styles.departmentTitle}>Colaborador(a) e Ramais</h2>
              
              <div className={deptContacts.length > 6 ? styles.contactListMulti : styles.contactList}>
                {deptContacts.map((contact) => {
                  const isWhatsApp = contact.name.toLowerCase().includes('whatsapp') || 
                                     contact.name.toLowerCase().includes('filtro') || 
                                     contact.name.toLowerCase().includes('empresarial') || 
                                     [9005, 9006, 9007].includes(contact.id);
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const whatsappLink = isWhatsApp ? `https://wa.me/55${onlyNumbers}` : null;

                  return (
                    <div 
                      key={contact.id} 
                      className={styles.contactItem}
                      style={isWhatsApp ? { gridColumn: '1 / -1' } : {}}
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
