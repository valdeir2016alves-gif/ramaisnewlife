import os

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
    
    try:
        text = content.decode('utf-8')
    except:
        return

    # Check if the text looks double encoded
    if 'Ã³' in text or 'Ã£' in text or 'Ã©' in text or 'Ã¡' in text or 'Ã§' in text or 'Ãµ' in text or 'Ãº' in text or 'Ã' in text or 'Ã­' in text:
        print(f"Fixing {filepath} (simple double encode detection)")
        try:
            # Revert the double encoding:
            # text is currently a UTF-8 string that contains mojibake.
            # Convert the mojibake chars to their original bytes (latin1), 
            # then decode those bytes back to UTF-8 properly.
            fixed_text = text.encode('latin1').decode('utf-8')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            print(f"Fixed {filepath} via latin1!")
        except Exception as e:
            print(f"Failed to fix {filepath} via latin1: {e}")
            
for root, dirs, files in os.walk('app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.css'):
            fix_file(os.path.join(root, f))
