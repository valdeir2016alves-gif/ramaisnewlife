import os

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        content = f.read()
    
    try:
        text = content.decode('utf-8')
    except:
        print(f"{filepath} is not valid utf-8")
        return

    # Check if the text looks double encoded
    if 'Ã³' in text or 'Ã£' in text or 'Ã©' in text or 'Ã¡' in text or 'Ã§' in text or 'Ãµ' in text or 'Ãº' in text or 'Ã' in text:
        print(f"Fixing {filepath} (simple double encode detection)")
        # This means the original text was utf-8, then read as cp1252/latin1, then saved as utf-8.
        # To reverse: encode to latin1, decode as utf-8
        try:
            fixed_text = text.encode('cp1252').decode('utf-8')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_text)
            print(f"Fixed {filepath}")
        except Exception as e:
            print(f"Failed to fix {filepath} via cp1252: {e}")
            
            # fallback string replace
            fixed = text.replace('Ã£', 'ã').replace('Ã©', 'é').replace('Ã¡', 'á').replace('Ã³', 'ó')
            fixed = fixed.replace('Ã§', 'ç').replace('Ãµ', 'õ').replace('Ãº', 'ú').replace('Ã', 'í')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print("Fixed via string replace fallback.")
    else:
        # Check for weird terminal replacement chars like 'ǟ' 
        # In PowerShell, reading UTF-8 as ANSI sometimes produces other garbage.
        pass

for root, dirs, files in os.walk('app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.css'):
            fix_file(os.path.join(root, f))
