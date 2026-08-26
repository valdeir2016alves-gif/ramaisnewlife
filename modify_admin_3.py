import os

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "onMove: (id: number, direction: 'up' | 'down') => Promise<void>;",
    "onMove: (id: number, direction: 'up' | 'down') => Promise<void>;\n    onToggleVisibility: (id: number, hidden: boolean) => Promise<void>;"
)

content = content.replace(
    "onMove,\n    canEdit",
    "onMove,\n    onToggleVisibility,\n    canEdit"
)

content = content.replace(
    "className={styles.tableActions}>",
    "className={styles.tableActions}>\n              <button \n                onClick={async () => {\n                  setLoading(true);\n                  await onToggleVisibility(contact.id, !contact.hidden);\n                  setLoading(false);\n                }}\n                className={styles.btnSecondary}\n                style={{ color: contact.hidden ? 'gray' : 'inherit' }}\n                title={contact.hidden ? 'Mostrar no site' : 'Ocultar do site'}\n              >\n                {contact.hidden ? 'Oculto' : 'Visível'}\n              </button>"
)

content = content.replace(
    "const handleDeleteRow = async (id: number) => {",
    "const handleToggleVisibility = async (id: number, hidden: boolean) => {\n    setLoading(true);\n    await toggleContactVisibility(id, hidden);\n    await loadContacts();\n    setLoading(false);\n  };\n\n  const handleDeleteRow = async (id: number) => {"
)

content = content.replace(
    "onMove={handleMoveRow}",
    "onMove={handleMoveRow}\n                        onToggleVisibility={handleToggleVisibility}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
