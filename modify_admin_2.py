import os

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add onToggle visibility prop to EditableRow
prop_old = 'onMove: (id: number, direction: \\'up\\' | \\'down\\') => Promise<void>;'
prop_new = 'onMove: (id: number, direction: \\'up\\' | \\'down\\') => Promise<void>;\\n    onToggleVisibility: (id: number, hidden: boolean) => Promise<void>;'
content = content.replace(prop_old, prop_new)

# 2. Add it to destructuring
dest_old = 'onMove,\\n    canEdit'
dest_new = 'onMove,\\n    onToggleVisibility,\\n    canEdit'
content = content.replace(dest_old, dest_new)

# 3. Add the button in tableActions
actions_old = 'className={styles.tableActions}>'
actions_new = '''className={styles.tableActions}>
              <button 
                onClick={async () => {
                  setLoading(true);
                  await onToggleVisibility(contact.id, !contact.hidden);
                  setLoading(false);
                }}
                className={styles.btnSecondary}
                style={{ color: contact.hidden ? 'gray' : 'inherit' }}
                title={contact.hidden ? "Mostrar no site" : "Ocultar do site"}
              >
                {contact.hidden ? 'Oculto' : 'Visível'}
              </button>'''
content = content.replace(actions_old, actions_new)

# 4. Add handleToggleVisibility to AdminPage and pass to EditableRow
admin_func_old = 'const handleDeleteRow = async (id: number) => {'
admin_func_new = '''const handleToggleVisibility = async (id: number, hidden: boolean) => {
    setLoading(true);
    await toggleContactVisibility(id, hidden);
    await loadContacts();
    setLoading(false);
  };

  const handleDeleteRow = async (id: number) => {'''
content = content.replace(admin_func_old, admin_func_new)

# 5. Pass it to <EditableRow ... />
row_old = 'onMove={handleMoveRow}'
row_new = 'onMove={handleMoveRow}\\n                        onToggleVisibility={handleToggleVisibility}'
content = content.replace(row_old, row_new)

with open(filepath, 'w', encoding='utf-8', newline='\\n') as f:
    f.write(content)
print('Done EditableRow modifications')
