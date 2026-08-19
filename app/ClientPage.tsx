'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';

import { submitReport, registerVisit, authenticateUser, User } from './actions';

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

  // Auth states
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const result = await authenticateUser(loginUsername, loginPassword);
    setLoginLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      sessionStorage.setItem('clientAuth', JSON.stringify(result.user));
    } else {
      alert(result.error || 'Credenciais incorretas!');
    }
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('clientAuth');
    if (savedAuth) {
      try {
        setCurrentUser(JSON.parse(savedAuth));
      } catch (e) {
        sessionStorage.removeItem('clientAuth');
      }
    }
    setIsCheckingAuth(false);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    // Register visit only once per session
    if (!sessionStorage.getItem('visited')) {
      registerVisit().catch(console.error);
      sessionStorage.setItem('visited', 'true');
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
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            c.department.toLowerCase().includes(search.toLowerCase()) || 
                            c.phone.includes(search);
      const matchesCity = cCity === city;
      if (cCity === 'all') return matchesSearch;
      return matchesSearch && matchesCity;
    });

    const groups: Record<string, Contact[]> = {};
    filtered.forEach(c => {
      if (!groups[c.department]) groups[c.department] = [];
      groups[c.department].push(c);
    });

    return groups;
  }, [initialContacts, search, city]);

  if (isCheckingAuth) {
    return (
      <main className={styles.main}>
        <div className={styles.skeletonHeader}></div>
        <div className={styles.skeletonTabs}></div>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: '60%', height: '24px', marginBottom: '1.5rem' }}></div>
              {[1, 2, 3].map(j => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div className={styles.skeletonLine} style={{ width: '40%' }}></div>
                  <div className={styles.skeletonLine} style={{ width: '30%' }}></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className={styles.main}>
        <div style={{ maxWidth: '400px', margin: '100px auto', background: 'var(--card-bg)', padding: '2.5rem 2rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Image 
              src="/logo.png" 
              alt="New Life Logo" 
              width={320} 
              height={150} 
              style={{ objectFit: 'contain', filter: 'var(--logo-filter)' }} 
            />
            <h2 style={{ color: 'var(--primary-color)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Acesso Interno</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Diretório de <strong>Ramais</strong> internos das Unidades <strong>São Gabriel</strong>, <strong>Bagé</strong> e <strong>Passo Fundo</strong>
            </p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Usuário" 
              value={loginUsername} 
              onChange={e => setLoginUsername(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-main)' }} 
              required 
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={loginPassword} 
              onChange={e => setLoginPassword(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-main)' }} 
              required 
            />
            <button 
              type="submit" 
              disabled={loginLoading}
              style={{ padding: '0.8rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    );
  }

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
              
              <div className={styles.contactList}>
                {deptContacts.map((contact) => {
                  const onlyNumbers = contact.phone.replace(/\D/g, '');
                  const isWhatsAppNumber = onlyNumbers.length >= 11 || 
                                         (onlyNumbers.length === 10 && onlyNumbers[2] === '9') || 
                                         contact.name.toLowerCase().includes('whatsapp') ||
                                         contact.name.toLowerCase().includes('whats');
                  const whatsappLink = isWhatsAppNumber ? `https://wa.me/55${onlyNumbers}` : null;
                  const telLink = `tel:+55${onlyNumbers}`;
                  
                  const isExternal = onlyNumbers.length >= 10;

                  return (
                    <div 
                      key={contact.id} 
                      className={styles.contactItem}
                    >
                      <span className={styles.chevron}>
                        {isWhatsAppNumber ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="14" height="14" fill="currentColor" style={{ verticalAlign: 'middle', marginTop: '-2px' }}>
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                          </svg>
                        ) : isExternal ? '📱' : '📞'}
                      </span>
                      <span className={styles.contactName}>{contact.name}</span>
                      {isWhatsAppNumber ? (
                        <a href={whatsappLink!} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                          {contact.phone}
                        </a>
                      ) : (
                        <a href={telLink} className={styles.telLink}>
                          {contact.phone}
                        </a>
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
        <p>Atualizado em: {lastUpdated} - NOC</p>
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
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>🚫</div>
                <div>
                  <strong>Atenção:</strong>
                  <p>Os contatos de WhatsApp disponibilizados nesta página são destinados <strong>exclusivamente</strong> à comunicação interna da empresa. O número de WhatsApp de qualquer colaborador somente poderá ser encaminhado a clientes mediante autorização prévia do responsável pelo contato.</p>
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
