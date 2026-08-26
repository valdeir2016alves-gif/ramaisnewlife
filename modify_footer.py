import os

filepath = 'app/ClientPage.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'import RadioPlayer from' not in content:
    content = content.replace("import UnderlineText from './UnderlineText';", "import UnderlineText from './UnderlineText';\nimport RadioPlayer from './RadioPlayer';")

# Add RadioPlayer to footer
footer_str = '''      <footer className={styles.footer}>
        <div style={{ marginBottom: '1.5rem' }}>
          <RadioPlayer />
        </div>'''

content = content.replace('      <footer className={styles.footer}>', footer_str)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
