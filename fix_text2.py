import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

replacements_admin = [
    ('\n            Ramais\n', '\n            Contatos\n')
]

replace_in_file('app/admin/page.tsx', replacements_admin)

print('Done')
