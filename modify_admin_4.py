import os
import re

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Render datalist in AdminPage
datalist_str = '''      <datalist id="departments-list">
        {Object.keys(groupedContacts).map(dep => <option key={dep} value={dep} />)}
      </datalist>
      <header'''
content = content.replace('      <header', datalist_str, 1)

# 2. Modify EditableRow department input
content = re.sub(
    r'(<input\s+type="text"\s+value=\{department\}\s+onChange=\{\(e\) => setDepartment\(e\.target\.value\)\}\s+className=\{styles\.inputInline\}\s+placeholder="Setor")',
    r'<input type="text" list="departments-list" value={department} onChange={(e) => setDepartment(e.target.value)} className={styles.inputInline} placeholder="Setor"',
    content
)

# 3. Modify Add Contact department input
content = re.sub(
    r'(<input\s+type="text"\s+placeholder="Setor[^"]*"\s+value=\{department\}\s+onChange=\{\(e\) => setDepartment\(e\.target\.value\)\}\s+className=\{styles\.input\})',
    r'<input type="text" list="departments-list" placeholder="Setor (ex: Suporte Técnico)" value={department} onChange={(e) => setDepartment(e.target.value)} className={styles.input}',
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
