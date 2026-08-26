import os
import re

filepath = 'app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

state_old = "const [systemUsers, setSystemUsers] = useState<Omit<User, 'password'>[]>([]);"
state_new = state_old + "\n  const [collapsedDeps, setCollapsedDeps] = useState<Record<string, boolean>>({});\n\n  const toggleCollapse = (dep: string) => {\n    setCollapsedDeps(prev => ({ ...prev, [dep]: !prev[dep] }));\n  };"
content = content.replace(state_old, state_new)

title_old = '''              <h3 className={styles.departmentTitle}>
                {getEmoji(department)} {department}'''
title_new = '''              <h3 className={styles.departmentTitle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => toggleCollapse(department)}>
                <span style={{ marginRight: '8px', fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsedDeps[department] ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
                {getEmoji(department)} {department}'''
content = content.replace(title_old, title_new)

btn_old = '''<button 
                    onClick={() => handleRenameDepartment(department)}'''
btn_new = '''<button 
                    onClick={(e) => { e.stopPropagation(); handleRenameDepartment(department); }}'''
content = content.replace(btn_old, btn_new)

table_old = '''</h3>
              <div className={styles.tableContainer}>
                <table className={styles.table}>'''
table_new = '''</h3>
              {!collapsedDeps[department] && <div className={styles.tableContainer}>
                <table className={styles.table}>'''
content = content.replace(table_old, table_new)

close_old = '''              </div>
            </div>
          ))
        )}'''
close_new = '''              </div>}
            </div>
          ))
        )}'''
content = content.replace(close_old, close_new, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
