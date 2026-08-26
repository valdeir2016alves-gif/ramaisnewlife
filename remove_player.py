import os

filepath = 'app/ClientPage.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import RadioPlayer from './RadioPlayer';\n", "")
content = content.replace("      <RadioPlayer />\n", "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

if os.path.exists('app/RadioPlayer.tsx'):
    os.remove('app/RadioPlayer.tsx')

print('Done removing player')
