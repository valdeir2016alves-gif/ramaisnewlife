const fs = require('fs');

const code = fs.readFileSync('app/admin/page.tsx', 'utf8');

const descriptionRowComponent = `
function DescriptionRow({ department, initialDescription, onSave }: { department: string; initialDescription: string; onSave: (dept: string, desc: string) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(initialDescription);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(department, desc);
    setIsEditing(false);
    setLoading(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td style={{ fontWeight: 'bold' }}>{department}</td>
        <td>
          <textarea 
            className={styles.input} 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            rows={3} 
            style={{ width: '100%', resize: 'vertical' }}
          />
        </td>
        <td>
          <div className={styles.tableActions}>
            <button onClick={handleSave} className={styles.btnPrimary} disabled={loading}>Salvar</button>
            <button onClick={() => { setIsEditing(false); setDesc(initialDescription); }} className={styles.btnSecondary} disabled={loading}>Cancelar</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ fontWeight: 'bold' }}>{department}</td>
      <td style={{ whiteSpace: 'pre-wrap', color: desc ? 'inherit' : '#888' }}>{desc || '(Sem descrição)'}</td>
      <td>
        <button onClick={() => setIsEditing(true)} className={styles.btnSecondary}>Editar</button>
      </td>
    </tr>
  );
}
`;

let newCode = code.replace("function EditableRow", descriptionRowComponent + "\nfunction EditableRow");

const descriptionsBlock = `
      ) : activeTab === 'descriptions' && canEdit ? (
        <section className={styles.listSection}>
          <h2>Balões de Informação</h2>
          <p style={{ marginBottom: '1rem', color: '#ccc' }}>Edite os textos exibidos nos balões de informação de cada setor. Deixe em branco para ocultar o balão.</p>
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Setor</th>
                  <th style={{ width: '60%' }}>Texto do Balão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(contacts.map(c => c.department))).map(dep => {
                  const normalized = dep.toLowerCase().replace(/–/g, '-').trim();
                  const desc = descriptions[normalized] || '';
                  return (
                    <DescriptionRow 
                      key={dep} 
                      department={dep} 
                      initialDescription={desc} 
                      onSave={async (d, newDesc) => {
                        setLoading(true);
                        const result = await updateDepartmentDescription(d, newDesc);
                        if (result.success) {
                          await loadContacts();
                        } else {
                          alert('Erro: ' + (result.error || 'Falha ao salvar'));
                        }
                        setLoading(false);
                      }} 
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : activeTab === 'users' && canEdit ? (
`;

newCode = newCode.replace(") : activeTab === 'users' && canEdit ? (", descriptionsBlock);

fs.writeFileSync('app/admin/page.tsx', newCode);
