import os

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# 1. Update imports
content = content.replace('getAnalytics, DailyStats, reorderContact', 'getAnalytics, DailyStats, reorderContact, toggleContactVisibility')

# 2. Add handleToggleVisibility function
handle_toggle_func = '''
  const handleToggleVisibility = async (id: number, hidden: boolean) => {
    setLoading(true);
    await toggleContactVisibility(id, hidden);
    await loadContacts();
  };

  const handleEditRow = (c: Contact) => {
'''
content = content.replace('  const handleEditRow = (c: Contact) => {', handle_toggle_func)

# 3. Add the button in the Actions column
old_buttons = '''
                            <button onClick={() => handleEditRow(c)} className={styles.btnSecondary}>Editar</button>
                            <button onClick={() => handleDeleteRow(c.id)} className={styles.btnDanger}>Excluir</button>
'''
new_buttons = '''
                            <button onClick={() => handleToggleVisibility(c.id, !c.hidden)} className={styles.btnSecondary} title={c.hidden ? "Mostrar no site principal" : "Ocultar do site principal"} style={{ color: c.hidden ? 'gray' : 'inherit' }}>
                              {c.hidden ? 'Mostrar' : 'Ocultar'}
                            </button>
                            <button onClick={() => handleEditRow(c)} className={styles.btnSecondary}>Editar</button>
                            <button onClick={() => handleDeleteRow(c.id)} className={styles.btnDanger}>Excluir</button>
'''
content = content.replace(old_buttons, new_buttons)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
