import sys

def modify_client_page():
    with open('app/ClientPage.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove the headerText
    header_text_block = '''        <div className={styles.headerText}>
          Diretório de Ramais internos das Unidades <strong>São Gabriel, Bagé e Passo Fundo</strong>
        </div>'''
    
    if header_text_block in content:
        content = content.replace(header_text_block, '')
    else:
        print('Header text block not found!')

    # 2. Add hero section right after </header>
    hero_section = '''
      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Diretório de Ramais internos das Unidades <span style={{ color: 'var(--primary-color)' }}>São Gabriel, Bagé e Passo Fundo</span>
          </h1>
        </div>
        <div className={styles.heroRight}>
          {groupedContacts['Contatos Regionais e Externos'] && (
            <div className={styles.departmentSection} style={{ marginBottom: 0, height: '100%' }}>
              <div className={styles.departmentHeader}>
                <div className={styles.departmentHeaderLeft}>
                  <span className={styles.departmentSubtitle}>Contatos Regionais e Externos</span>
                  <h2 className={styles.departmentTitle}>Colaborador(a) e Ramais</h2>
                </div>
              </div>
              <div className={styles.contactList}>
                {groupedContacts['Contatos Regionais e Externos'].map((contact) => {
                  const onlyNumbers = contact.phone.replace(/\\D/g, '');
                  const isWhatsAppNumber = onlyNumbers.length >= 11 || 
                                         (onlyNumbers.length === 10 && onlyNumbers[2] === '9') || 
                                         contact.name.toLowerCase().includes('whatsapp') ||
                                         contact.name.toLowerCase().includes('whats');
                  const whatsappLink = isWhatsAppNumber ? https://wa.me/55 : null;
                  
                  return (
                    <div key={contact.id} className={styles.contactItem}>
                      <span className={styles.chevron}>
                        {isWhatsAppNumber ? (
                          <img src="/whatsapp-icon.svg" alt="WhatsApp" width="16" height="16" style={{ verticalAlign: 'middle' }} />
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
                        <span className={styles.contactPhone}>{contact.phone}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
'''
    content = content.replace('</header>', '</header>' + hero_section)

    # 3. Modify the grid rendering to ignore "Contatos Regionais e Externos"
    # Wait, the easiest way is to extract otherDepartments before rendering:
    # We can do this by finding the Object.entries(groupedContacts) and filtering it.
    old_map_start = 'Object.entries(groupedContacts).map(([department, deptContacts]) => {'
    new_map_start = 'Object.entries(groupedContacts).filter(([dep]) => dep !== "Contatos Regionais e Externos").map(([department, deptContacts]) => {'
    content = content.replace(old_map_start, new_map_start)

    # Also update the condition checking if there's any result to account for the filtered grid
    old_no_results_check = 'Object.keys(groupedContacts).length === 0'
    new_no_results_check = 'Object.keys(groupedContacts).filter(k => k !== "Contatos Regionais e Externos").length === 0 && (!groupedContacts["Contatos Regionais e Externos"])'
    content = content.replace(old_no_results_check, new_no_results_check)

    with open('app/ClientPage.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done.')

modify_client_page()
