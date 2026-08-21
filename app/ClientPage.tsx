'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Contact } from './actions';
import styles from './page.module.css';
import GlowCard from './GlowCard';

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
      alert('Relato enviado com sucesso! A equipe responsável foi notificada.');
      
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
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Image 
              src="/logo.png" 
              alt="New Life Logo" 
              width={380} 
              height={150} 
              style={{ objectFit: 'contain', filter: 'var(--logo-filter)', maxWidth: '100%', height: 'auto' }} 
            />
          </div>
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
          <a href="https://minhanewlife.com.br/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
            <Image 
              src="/logo.png" 
              alt="New Life" 
              width={240} 
              height={95} 
              priority
              style={{ objectFit: 'contain', filter: 'var(--logo-filter)', maxWidth: '100%', height: 'auto' }}
            />
          </a>
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
                    <a href="https://www.newlifeimoveis.imb.br/" target="_blank" rel="noopener noreferrer">
                      <Image 
                        src="/logo-imoveis.png" 
                        alt="New Life Imóveis" 
                        width={80} 
                        height={60} 
                        style={{ objectFit: 'contain' }}
                      />
                    </a>
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
                          <img src="/whatsapp-icon.svg" alt="WhatsApp" width="16" height="16" style={{ verticalAlign: 'middle', marginTop: '-2px' }} />
                        ) : (
                          '📞'
                        )}
                      </span>
                      <span className={styles.contactName}>{contact.name}</span>
                      {isWhatsAppNumber ? (
                        <a href={whatsappLink!} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                          {contact.phone}
                        </a>
                      ) : (
                        <span className={styles.contactPhone}>
                          {contact.phone}
                        </span>
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
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Atualizado em: {lastUpdated} - NOC
        </p>
        <button onClick={() => setShowReportModal(true)} className={styles.reportLinkBtn}>
          Encontrou um ramal errado? Avise aqui!
        </button>
      </footer>

      {showInstructions && (
        <div className={styles.modalOverlay} onClick={() => setShowInstructions(false)}>
          <div className={styles.modalContent} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Instruções de Atendimento</h3>
              <button className={styles.closeButton} onClick={() => setShowInstructions(false)}>✕</button>
            </div>
            <div className={styles.modalBody} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <GlowCard>
                <div className={styles.instructionItem} style={{ flexDirection: 'column', gap: '0.75rem' }}>
                  <div className={styles.instructionIcon}>📞</div>
                  <div>
                    <strong>Puxar Ligação</strong>
                    <p style={{ marginTop: '0.5rem' }}>Digite <span>*8</span> e aguarde a ligação ser puxada.</p>
                  </div>
                </div>
              </GlowCard>
              <GlowCard>
                <div className={styles.instructionItem} style={{ flexDirection: 'column', gap: '0.75rem' }}>
                  <div className={styles.instructionIcon}>🔄</div>
                  <div>
                    <strong>Transferir Ligação</strong>
                    <p style={{ marginTop: '0.5rem' }}>Digite <span>*2</span>, aguarde a voz automática falar "transferir", digite o ramal desejado e aguarde.</p>
                  </div>
                </div>
              </GlowCard>
              <GlowCard className="md-col-span-2" style={{ gridColumn: '1 / -1' } as any}>
                <div className={styles.instructionItem} style={{ flexDirection: 'column', gap: '0.75rem' }}>
                  <div className={styles.instructionIcon}>🚫</div>
                  <div>
                    <strong>Atenção</strong>
                    <p style={{ marginTop: '0.5rem' }}>Os contatos de WhatsApp disponibilizados nesta página são destinados <strong>exclusivamente</strong> à comunicação interna da empresa. O número de WhatsApp de qualquer colaborador somente poderá ser encaminhado a clientes mediante autorização prévia do responsável pelo contato.</p>
                  </div>
                </div>
              </GlowCard>
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
