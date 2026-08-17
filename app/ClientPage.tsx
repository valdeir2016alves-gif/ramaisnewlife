'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';

import { submitReport } from './actions';

export default function ClientPage({ initialContacts, lastUpdated }: { initialContacts: Contact[], lastUpdated: string }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('sao_gabriel');
  const [theme, setTheme] = useState('dark');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportRamal, setReportRamal] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    const result = await submitReport(reportName, reportRamal, reportMessage);
    setIsSubmittingReport(false);
    if (result.success) {
      alert('Relato enviado com sucesso! A equipe responsável irá verificar.');
      setShowReportModal(false);
      setReportName('');
      setReportRamal('');
      setReportMessage('');
    } else {
      alert('Erro ao enviar o relato. Tente novamente mais tarde.');
    }
  };

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
            width={320} 
            height={126} 
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
            onClick={() => setShowInstructions(true)} 
            className={styles.instructionsButton}
            title="Instruções de Uso"
          >
            ❓ Instruções
          </button>
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
          Object.entries(groupedContacts).map(([department, deptContacts]) => {
            const isImoveis = department.toLowerCase().includes('imóveis') || department.toLowerCase().includes('imobiliária');
            return (
            <div key={department} className={`${styles.departmentSection} ${isImoveis ? styles.departmentSectionImoveis : ''}`}>
              <div className={styles.departmentHeader}>
                <div className={styles.departmentHeaderLeft}>
                  <span className={styles.departmentSubtitle}>{department}</span>
                  <h2 className={styles.departmentTitle}>Colaborador(a) e Ramais</h2>
                </div>
                {isImoveis && (
                  <div className={styles.departmentLogo}>
                    <Image 
                      src="/logo-imoveis.png" 
                      alt="New Life Imóveis" 
                      width={80} 
                      height={60} 
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
              
              <div className={deptContacts.length > 6 ? styles.contactListMulti : styles.contactList}>
                {deptContacts.map((contact) => {
                  const isFullWidth = contact.name.toLowerCase().includes('whatsapp') || 
                                     contact.name.toLowerCase().includes('filtro') || 
                                     contact.name.toLowerCase().includes('empresarial') || 
                                     [9005, 9006, 9007].includes(contact.id);
                  
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const isWhatsAppNumber = onlyNumbers.length >= 10;
                  const whatsappLink = isWhatsAppNumber ? `https://wa.me/55${onlyNumbers}` : null;

                  return (
                    <div 
                      key={contact.id} 
                      className={styles.contactItem}
                      style={isFullWidth ? { gridColumn: '1 / -1' } : {}}
                    >
                      <span className={styles.chevron}>›</span>
                      <span className={styles.contactName}>{contact.name}</span>
                      {isWhatsAppNumber ? (
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
            );
          })
        )}
      </section>

      <footer className={styles.footer}>
        <p>Atualizado em: {lastUpdated}</p>
        <button onClick={() => setShowReportModal(true)} className={styles.reportLinkBtn}>
          Encontrou um ramal errado? Avise aqui!
        </button>
      </footer>

      {showInstructions && (
        <div className={styles.modalOverlay} onClick={() => setShowInstructions(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Instruções de Atendimento</h3>
              <button className={styles.closeButton} onClick={() => setShowInstructions(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>📞</div>
                <div>
                  <strong>Puxar Ligação:</strong>
                  <p>Digite <span>*8</span> e aguarde a ligação ser puxada.</p>
                </div>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>🔄</div>
                <div>
                  <strong>Transferir Ligação:</strong>
                  <p>Digite <span>*2</span>, aguarde a voz automática falar "transferir", digite o ramal desejado e aguarde.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Reportar Ramal Errado</h3>
              <button className={styles.closeButton} onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <form onSubmit={handleReportSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Seu Nome / Setor (Opcional)</label>
                <input 
                  type="text" 
                  value={reportName} 
                  onChange={(e) => setReportName(e.target.value)} 
                  className={styles.modalInput}
                  placeholder="Ex: João (Suporte)"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Qual ramal está com problema?</label>
                <input 
                  type="text" 
                  value={reportRamal} 
                  onChange={(e) => setReportRamal(e.target.value)} 
                  className={styles.modalInput}
                  placeholder="Ex: Ramal 4050 do TI"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>O que está errado?</label>
                <textarea 
                  value={reportMessage} 
                  onChange={(e) => setReportMessage(e.target.value)} 
                  className={styles.modalInput}
                  placeholder="Ex: O ramal não chama, ou está na mesa errada..."
                  rows={3}
                  required
                />
              </div>
              <button type="submit" className={styles.btnPrimary} disabled={isSubmittingReport}>
                {isSubmittingReport ? 'Enviando...' : 'Enviar Relato'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
