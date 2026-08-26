import os

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const [collapsedDeps, setCollapsedDeps] = useState<Record<string, boolean>>({});', 'const [expandedDeps, setExpandedDeps] = useState<Record<string, boolean>>({});')
content = content.replace('setCollapsedDeps(prev => ({ ...prev, [dep]: !prev[dep] }));', 'setExpandedDeps(prev => ({ ...prev, [dep]: !prev[dep] }));')
content = content.replace("transform: collapsedDeps[department] ? 'rotate(-90deg)' : 'rotate(0)'", "transform: expandedDeps[department] ? 'rotate(0)' : 'rotate(-90deg)'")
content = content.replace('{!collapsedDeps[department] && <div className={styles.tableContainer}>', '{expandedDeps[department] && <div className={styles.tableContainer}>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done collapsing by default')
