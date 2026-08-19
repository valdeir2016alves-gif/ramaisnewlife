# Guia de Padrões de Conteúdo - Diretório de Ramais

Este documento define os padrões para adicionar ou editar contatos no diretório de ramais.

## 1. Nomes e Funções
- **Formato:** `Nome (Função)`
- **Exemplo Correto:** `João (Coordenador)`
- **Exemplo Incorreto:** `João - (Coord)` ou `João - Coord`
- Nunca misture siglas soltas com o nome sem usar parênteses.

## 2. Departamentos (Títulos dos Cards)
- **Formato:** Sentence Case (Apenas as primeiras letras em maiúsculo).
- **Exemplo Correto:** `Comercial (Fideliza)`
- **Exemplo Incorreto:** `COMERCIAL - (FIDELIZA)`
- Siglas reconhecidas devem ser mantidas em maiúsculo (ex: `SAC`, `NOC`, `TI`, `RH`).

## 3. Formatação de Números
- **Ramais Internos:** Usar apenas os 4 dígitos (ex: `4040`).
- **Números Externos/Celulares:** Incluir o DDD e o hífen (ex: `(55) 99999-9999` ou `(55) 3232-3232`).
- Contatos de WhatsApp devem ter o número formatado para que o link gerado funcione perfeitamente.

## 4. Evitar Dados Vazios ou Lixo
- Não salve registros com o nome vazio ou contendo apenas `-`.
- Caso um ramal esteja desativado ou não tenha colaborador atribuído, o registro deve ser removido do banco de dados, em vez de mantido com nome vazio.
