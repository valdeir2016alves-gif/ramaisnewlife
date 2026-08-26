import os

def manual_replace(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Create mapping of mojibake to correct characters
    mapping = {
        'Ã¡': 'á',
        'Ã¢': 'â',
        'Ã£': 'ã',
        'Ã§': 'ç',
        'Ã©': 'é',
        'Ãª': 'ê',
        'Ã­': 'í',
        'Ã³': 'ó',
        'Ã´': 'ô',
        'Ãµ': 'õ',
        'Ãº': 'ú',
        'Ã\xad': 'í',
        'SÃ£o': 'São',
        'BagÃ©': 'Bagé',
        'RelatÃ³rios': 'Relatórios',
        'UsuÃ¡rios': 'Usuários',
        'AÃ§Ãµes': 'Ações',
        'TÃ©cnico': 'Técnico',
        'NÃºmero': 'Número',
        'JoÃ£o': 'João',
        'InstruÃ§Ãµes': 'Instruções',
        'excluÃ­do': 'excluído',
        'UsuÃ¡rio': 'Usuário',
        'MÃ¡rcio': 'Márcio',
        '': 'ç' # Sometimes seen as replacement char, we'll avoid blind replacing this
    }

    original = text
    # Let's replace whole words first to avoid substring bugs
    words = {
        'SÃ£o': 'São',
        'BagÃ©': 'Bagé',
        'RelatÃ³rios': 'Relatórios',
        'UsuÃ¡rios': 'Usuários',
        'UsuÃ¡rio': 'Usuário',
        'AÃ§Ãµes': 'Ações',
        'TÃ©cnico': 'Técnico',
        'NÃºmero': 'Número',
        'JoÃ£o': 'João',
        'InstruÃ§Ãµes': 'Instruções',
        'excluÃ­do': 'excluído',
        'MÃ¡rcio': 'Márcio',
        'PadrÃ£o': 'Padrão'
    }
    
    for bad, good in words.items():
        text = text.replace(bad, good)
        
    # Then generic replacements
    for bad, good in mapping.items():
        text = text.replace(bad, good)

    if original != text:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed mojibake in {filepath}")

for root, dirs, files in os.walk('app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts') or f.endswith('.css'):
            manual_replace(os.path.join(root, f))
