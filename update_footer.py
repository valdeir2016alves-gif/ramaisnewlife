import os

filepath = 'app/ClientPage.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_wrapper = '''      <footer className={styles.footer}>
        <div style={{ marginBottom: '1.5rem' }}>
          <RadioPlayer />
        </div>'''

new_wrapper = '''      <RadioPlayer />
      <footer className={styles.footer}>'''

content = content.replace(old_wrapper, new_wrapper)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done modifying footer')
