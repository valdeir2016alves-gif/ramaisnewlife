import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

replacements_client = [
    ('Diretório de Ramais', 'Diretório de Contatos'),
    ('Pesquisar ramal', 'Pesquisar contato'),
    ('Colaborador(a) e Ramais', 'Colaborador(a) e Contatos'),
    ('Nenhum ramal encontrado', 'Nenhum contato encontrado'),
    ('Reportar Ramal Errado', 'Reportar Contato Errado'),
    ('Qual ramal está com problema?', 'Qual contato está com problema?'),
    ('Encontrou um ramal errado?', 'Encontrou um contato errado?'),
    ('Ex: Ramal 4050 do TI', 'Ex: Contato 4050 do TI'),
    ('O ramal não chama', 'O contato não chama')
]

replacements_admin = [
    ('Admin - Ramais', 'Admin - Contatos'),
    ('Adicionar Novo Ramal', 'Adicionar Novo Contato'),
    ('Ramais Cadastrados', 'Contatos Cadastrados'),
    ('Nenhum ramal cadastrado', 'Nenhum contato cadastrado'),
    ('Relatórios de Ramais com Problema', 'Relatórios de Contatos com Problema'),
    ('Excluir este ramal', 'Excluir este contato'),
    ('Erro ao adicionar ramal', 'Erro ao adicionar contato')
]

replace_in_file('app/ClientPage.tsx', replacements_client)
replace_in_file('app/admin/page.tsx', replacements_admin)

print('Done')
