## REGRA GLOBAL PARA TODOS OS PROMPTS

Estamos trabalhando no repositório `ramaisnewlife`.

Regras obrigatórias durante toda a implementação:

* nunca desenvolver diretamente na branch `main`;
* nunca fazer merge automático;
* nunca usar `force push`;
* antes de alterar arquivos, confirmar a branch com `git branch --show-current`;
* se a branch atual for `main`, parar imediatamente antes de escrever qualquer arquivo;
* migrations devem ser preferencialmente aditivas e seguras para banco existente;
* nenhuma funcionalidade existente de Ramais pode ser removida;
* rodar build e testes antes de cada commit;
* commits devem ser pequenos e semanticamente isolados;
* não fazer alterações fora do escopo da etapa atual;
* não fazer merge ao terminar;
* push somente da branch de feature.

Branch de trabalho:

`feature/portal-notes-scale`

---

# PROMPT 1 — AUDITORIA COMPLETA

Não altere nenhum arquivo ainda.

Analise a arquitetura atual:

* Vue 3 + Vite;
* Express;
* PostgreSQL;
* autenticação;
* modelo de usuários;
* Admin.vue;
* Home.vue;
* API;
* banco;
* permissões existentes.

Estamos planejando uma nova Central New Life contendo futuramente:

* nova Home;
* favoritos pessoais;
* atalhos/favoritos de setor;
* notas pessoais;
* notas de setor;
* setores;
* permissões;
* escala para determinados setores;
* editor de escala em formato parecido com planilha;
* plantões de domingos e feriados;
* folgas durante a semana.

Também precisamos refatorar os usuários para três papéis globais:

### ADMIN

Possui controle completo da aplicação.

Pode:

* gerenciar usuários;
* criar/editar setores;
* associar usuários a setores;
* definir responsáveis por setores;
* habilitar/desabilitar funcionalidades;
* gerenciar qualquer escala;
* gerenciar notas de qualquer setor;
* gerenciar atalhos/favoritos de qualquer setor;
* acessar Admin;
* visualizar todo o sistema.

### EDITOR

Não é administrador global.

Pode:

* alterar seus próprios favoritos;
* alterar suas próprias notas pessoais;
* visualizar os setores aos quais pertence;
* gerenciar somente os setores pelos quais foi explicitamente definido como responsável;
* gerenciar notas desses setores;
* gerenciar atalhos/favoritos desses setores;
* gerenciar escala desses setores quando a feature de escala estiver habilitada.

Não pode:

* criar usuários;
* editar roles;
* gerenciar setores pelos quais não é responsável;
* alterar configurações globais;
* obter acesso de admin.

### VIEWER

Usuário comum.

Pode:

* visualizar conteúdo ao qual possui acesso;
* alterar somente seus próprios favoritos;
* criar/editar/excluir somente suas próprias notas pessoais.

Não pode:

* alterar notas de setor;
* editar escala;
* gerenciar setor;
* editar outros usuários;
* alterar configurações globais.

Importante:

Não confunda:

* role global;
* participação em setor;
* responsabilidade administrativa por setor.

Um editor pode participar de três setores e ser responsável por apenas um.

Um viewer pode participar de múltiplos setores sem poder gerenciá-los.

Analise e proponha:

1. novo modelo de usuários;
2. estrutura de setores;
3. relacionamento usuário/setor;
4. relacionamento responsável/setor;
5. modelo de autorização;
6. alterações necessárias na autenticação;
7. migrations;
8. APIs;
9. refactors necessários;
10. riscos de segurança.

Não programe.
Não crie branch.
Não faça commit.

Entregue apenas o plano técnico.

---

# PROMPT 2 — CRIAR BRANCH E BASELINE

Antes de qualquer alteração:

1. atualize referências remotas;
2. confirme que a `main` local não possui alterações pendentes;
3. crie `feature/portal-notes-scale` a partir de `origin/main`;
4. confirme com:

`git branch --show-current`

Se a branch atual for `main`, pare imediatamente.

Depois:

* instale dependências se necessário;
* execute o build atual;
* execute testes existentes;
* verifique inicialização do backend;
* registre problemas preexistentes.

Ainda não implemente funcionalidades.

Não faça commit na main.
Não faça merge.

---

# PROMPT 3 — REFATORAR AUTENTICAÇÃO

Refatore a autenticação antes de implementar permissões.

Objetivos:

* retirar autenticação de dentro do Home.vue dos Ramais;
* criar uma camada global de autenticação;
* permitir que Portal, Ramais e Admin saibam quem é o usuário atual;
* backend deve identificar o usuário autenticado de forma confiável;
* não confiar em `user_id`, `role` ou `sector_id` enviados pelo frontend.

Avalie e substitua, quando necessário, o modelo atual baseado apenas em sessionStorage.

Preferir autenticação com:

* sessão segura;
  ou
* token armazenado em cookie HttpOnly.

Requisitos:

* senha nunca armazenada no navegador;
* role deve vir do backend;
* permissões devem ser conferidas no backend;
* logout deve invalidar autenticação;
* sessão expirada deve ser tratada;
* Ramais deve continuar funcionando.

Ainda NÃO implemente setores, notas ou escala.

Teste:

* login;
* logout;
* sessão expirada;
* acesso sem autenticação;
* Admin;
* Ramais.

Commit sugerido:

`refactor(auth): centralize secure user session`

---

# PROMPT 4 — REFATORAR MODELO DE USUÁRIOS

Agora refatore o modelo de usuários.

Roles globais obrigatórias:

* `admin`
* `editor`
* `viewer`

Não use nomes de setores como roles.

O campo role deve definir somente o nível global de autorização.

Regras:

### admin

Controle completo.

### editor

Pode administrar recursos somente dos setores pelos quais é responsável.

### viewer

Somente utilização normal, favoritos pessoais e notas pessoais.

Atualize:

* banco;
* API;
* autenticação;
* Admin;
* validações.

Garanta que roles desconhecidas sejam rejeitadas.

Se usuários legados possuírem roles antigas, implemente uma migration segura e documentada.

Adicione middleware ou funções reutilizáveis como conceito:

* `requireAuth`
* `requireRole`
* `requireAdmin`

Evite lógica como:

`if (user.role === ...)`

espalhada por dezenas de rotas.

Centralize autorização.

Teste todos os roles.

Commit:

`refactor(users): introduce admin editor and viewer roles`

---

# PROMPT 5 — SETORES E RESPONSABILIDADES

Implemente setores de forma independente dos roles.

Precisamos representar:

* setor;
* membros do setor;
* responsáveis pelo setor;
* features habilitadas por setor.

Sugestão conceitual:

`sectors`

`user_sectors`

`sector_managers`

`sector_features`

Não é obrigatório usar exatamente esses nomes se houver modelagem melhor.

Regras:

* admin pode administrar qualquer setor;
* editor só administra setor se estiver cadastrado como responsável;
* viewer nunca administra setor;
* ser membro de um setor NÃO significa ser responsável;
* ser editor NÃO concede automaticamente responsabilidade sobre todos os setores.

Um usuário pode:

* pertencer a vários setores;
* ser responsável por zero, um ou vários setores.

Feature inicial:

`schedule`

Crie APIs administrativas para:

* criar/editar setor;
* listar setores;
* associar usuário a setor;
* remover usuário de setor;
* definir responsável;
* remover responsável;
* habilitar/desabilitar feature.

Somente Admin pode configurar essa estrutura globalmente.

Commit:

`feat(sectors): add memberships managers and feature permissions`

---

# PROMPT 6 — MOTOR CENTRAL DE AUTORIZAÇÃO

Antes de implementar funcionalidades, crie uma camada de autorização reutilizável.

Precisamos responder consistentemente:

* este usuário é admin?
* este usuário pertence ao setor?
* este usuário gerencia o setor?
* este setor possui determinada feature?

Crie funções/middlewares equivalentes conceitualmente a:

`canViewSector(user, sector)`

`canManageSector(user, sector)`

`sectorHasFeature(sector, feature)`

Regras:

`canManageSector` deve retornar true quando:

* usuário é admin;
  ou
* usuário é editor e está cadastrado como responsável pelo setor.

Viewer nunca pode gerenciar setor.

Não confie no frontend para bloquear acesso.

Toda API futura deve verificar autorização no backend.

Adicione testes unitários ou de integração para essa matriz.

Commit:

`feat(authz): centralize role and sector authorization`

---

# PROMPT 7 — FAVORITOS

Implemente favoritos diferenciando claramente:

## Favoritos pessoais

Pertencem ao usuário.

Admin, editor e viewer podem:

* adicionar;
* remover;
* ordenar;

somente os seus próprios favoritos.

## Atalhos/favoritos promovidos pelo setor

Pertencem ao setor.

Podem ser gerenciados por:

* admin;
* editor responsável pelo setor.

Viewer apenas visualiza.

Um editor que não seja responsável pelo setor também apenas visualiza.

Nunca aceite `user_id` do frontend para determinar dono de favorito pessoal.

Commit:

`feat(favorites): add personal and sector shortcuts`

---

# PROMPT 8 — NOTAS PESSOAIS

Implemente notas pessoais.

Todos os roles:

* admin;
* editor;
* viewer;

podem gerenciar somente suas próprias notas pessoais.

Backend determina proprietário pela sessão.

Campos mínimos:

* id
* user_id
* content
* pinned
* completed
* created_at
* updated_at

Nunca permitir consulta de notas de outro usuário manipulando IDs.

Widget:

`Minhas notas`

Funções:

* criar;
* editar;
* concluir;
* fixar;
* excluir.

Teste isolamento entre usuários.

Commit:

`feat(notes): add private personal notes`

---

# PROMPT 9 — NOTAS DE SETOR

Implemente notas de setor.

Visualização:

* membros do setor podem visualizar;
* admin pode visualizar qualquer setor.

Edição:

* admin pode gerenciar;
* editor responsável pelo setor pode gerenciar;
* editor sem responsabilidade apenas visualiza;
* viewer apenas visualiza.

Campos:

* id
* sector_id
* author_user_id
* title opcional
* content
* pinned
* expires_at opcional
* created_at
* updated_at

O backend deve verificar permissões.

Um usuário do Setor A não pode acessar notas do Setor B simplesmente alterando a URL.

Widget:

`Notas do setor`

Commit:

`feat(notes): add managed sector notes`

---

# PROMPT 10 — MODELO DA ESCALA

Agora implemente somente modelo e API da Escala.

A escala deve existir apenas para setores com:

`schedule = enabled`

Gerenciamento permitido somente para:

* admin;
* editor responsável pelo setor.

Viewer:

* pode visualizar escala do seu setor;
* não pode editar.

Editor não responsável:

* pode visualizar se pertencer ao setor;
* não pode editar.

Precisamos representar:

* membros da escala;
* setor;
* cidade/unidade opcional;
* data;
* status;
* observação;
* feriados.

Status mínimos:

* `PLANTAO`
* `FOLGA`

Ausência de registro:

* expediente normal.

Não obrigue membro da escala a possuir Ramal.

Sugestão:

`schedule_members`

`schedule_entries`

`holidays`

Campos conceituais:

schedule_members:

* id
* sector_id
* name
* city
* active
* sort_order

schedule_entries:

* id
* member_id
* date
* status
* note

Constraint:

`unique(member_id, date)`

holidays:

* id
* date
* name
* city opcional

Feriados municipais devem poder ser diferenciados por cidade.

Ainda não implemente editor visual.

Commit:

`feat(schedule): add schedule domain and API`

---

# PROMPT 11 — EDITOR DA ESCALA TIPO PLANILHA

Implemente a interface de edição da escala.

Formato:

linhas = pessoas

colunas = dias

células = situação

Exemplo:

```
          SEG TER QUA QUI SEX SAB DOM
```

João           -   F   -   -   -   -   P
Maria          -   -   -   F   -   -   -
Carlos         -   -   -   -   -   -   P

Legenda:

* `P` = Plantão
* `F` = Folga
* `-` = normal

Funções:

* navegar por semana;
* navegar por mês;
* destacar domingos;
* destacar feriados;
* clicar em célula;
* alternar Normal / Plantão / Folga;
* observação opcional;
* indicar alterações não salvas;
* salvar em lote quando fizer sentido.

Permissão de edição:

* Admin: qualquer setor;
* Editor responsável: seus setores;
* Editor comum: somente leitura;
* Viewer: somente leitura.

Se `schedule` não estiver habilitado para o setor, não mostrar editor.

Backend continua sendo responsável pela autorização.

Commit:

`feat(schedule): add spreadsheet-style schedule editor`

---

# PROMPT 12 — RESUMO DA ESCALA NA HOME

Implemente widget de escala.

Ele aparece somente quando:

* usuário pertence a setor com feature `schedule`;
  ou
* admin selecionou setor.

Mostrar:

### Próximo domingo

Quem estará de plantão.

### Próximo feriado

* nome;
* data;
* pessoas de plantão.

### Folgas da semana

Exemplo:

João — terça-feira

Maria — quinta-feira

Regras:

* respeitar setor;
* respeitar cidade para feriados municipais;
* usuário comum não vê outro setor;
* não baixar toda a escala para gerar o resumo;
* criar endpoint resumido.

A visualização deve ser permitida a membros do setor.

Edição continua restrita aos administradores e editores responsáveis.

Commit:

`feat(schedule): add portal schedule summary`

---

# PROMPT 13 — ADMINISTRAÇÃO DE USUÁRIOS

Refatore a tela de administração de usuários.

Admin deve conseguir visualizar algo semelhante a:

Usuário:
`João Silva`

Role:
`Editor`

Setores:

* Comercial
* Atendimento

Responsável por:

* Atendimento

Permissões resultantes:

* notas pessoais: sim;
* favoritos pessoais: sim;
* visualizar Comercial: sim;
* gerenciar Comercial: não;
* visualizar Atendimento: sim;
* gerenciar Atendimento: sim;
* gerenciar escala Atendimento: sim, se feature habilitada.

Admin deve conseguir:

* criar usuário;
* alterar role;
* associar setores;
* definir responsabilidades.

Editor NÃO deve acessar essa administração global.

Viewer NÃO deve acessar.

Evite criar dezenas de checkboxes de permissões individuais neste momento.

Permissões devem ser derivadas principalmente de:

* role;
* participação;
* responsabilidade;
* features do setor.

Commit:

`feat(admin): add user roles memberships and responsibilities`

---

# PROMPT 14 — INTEGRAR NOVA HOME

Integre na Central New Life:

Área pessoal:

* favoritos pessoais;
* minhas notas.

Área do setor:

* favoritos/atalhos do setor;
* notas do setor;
* escala, caso habilitada.

Área geral:

* sistemas;
* ERP;
* plataforma de atendimento;
* DownDetector;
* demais widgets existentes.

O layout deve reagir às permissões.

Exemplo:

Viewer de setor sem escala:

* não mostrar espaço vazio reservado para escala.

Editor responsável:

* mostrar controles administrativos discretos nos widgets gerenciáveis.

Admin:

* pode acessar gerenciamento completo.

Não transformar a Home em painel administrativo.

A Home deve continuar sendo prioritariamente uma área de consumo rápido de informação.

Commit:

`feat(portal): integrate role-aware portal widgets`

---

# PROMPT 15 — AUDITORIA DE PERMISSÕES

Não implemente novas funcionalidades.

Crie estes usuários de teste:

### Usuário A

Role:
Editor

Setores:

* Comercial
* Financeiro

Responsável:

* Comercial

### Usuário B

Role:
Viewer

Setor:

* Comercial

### Usuário C

Role:
Editor

Setor:

* Técnico

Responsável:

* Técnico

### Usuário D

Role:
Viewer

Setor:

* Financeiro

### Admin

Role:
Admin

Teste:

## Usuário A

Pode:

* editar favoritos pessoais;
* editar notas pessoais;
* visualizar Comercial;
* visualizar Financeiro;
* gerenciar Comercial;
* alterar notas Comercial;
* alterar atalhos Comercial;
* editar escala Comercial se habilitada.

Não pode:

* gerenciar Financeiro;
* alterar escala Financeiro;
* alterar usuários.

## Usuário B

Pode:

* favoritos pessoais;
* notas pessoais;
* visualizar conteúdo Comercial;
* visualizar escala Comercial se habilitada.

Não pode:

* alterar notas do setor;
* editar escala;
* gerenciar favoritos do setor.

## Usuário C

Pode gerenciar Técnico.

Não pode gerenciar Comercial.

## Usuário D

Apenas consumo do Financeiro + recursos pessoais.

## Admin

Pode tudo.

Teste também acesso direto às APIs.

Exemplos de ataques:

* Viewer tentando PUT em nota de setor;
* Viewer tentando editar escala;
* Editor tentando editar setor não gerenciado;
* usuário tentando ler notas pessoais de outro;
* frontend enviando role falso;
* frontend enviando sector_id de outro setor;
* tentativa de promover a própria conta para admin.

Corrija qualquer falha encontrada.

Commit:

`test(authz): harden role and sector permissions`

---

# PROMPT 16 — REVISÃO DE BANCO

Revise todas as migrations.

Verifique:

* nenhuma tabela importante removida;
* nenhum dado existente sobrescrito;
* roles antigos migrados corretamente;
* foreign keys;
* índices;
* unique constraints;
* cascades perigosos;
* instalação nova;
* upgrade de banco existente.

Atenção especial para exclusão de setor e usuário.

Evite que apagar um setor acidentalmente destrua histórico relevante de escala/notas sem decisão explícita.

Teste migration usando uma cópia de banco de homologação, nunca produção.

---

# PROMPT 17 — VALIDAÇÃO FINAL

NÃO faça merge.

Execute:

* instalação;
* build frontend;
* backend;
* migrations;
* login/logout;
* Ramais;
* Admin;
* roles;
* setores;
* responsabilidades;
* favoritos pessoais;
* favoritos do setor;
* notas pessoais;
* notas do setor;
* escala;
* domingos;
* feriados;
* folgas;
* dark/light;
* responsividade;
* proteção das APIs.

Confirme novamente:

`git branch --show-current`

Deve retornar:

`feature/portal-notes-scale`

Compare com `origin/main`.

Apresente:

1. commits realizados;
2. arquivos alterados;
3. migrations;
4. endpoints novos;
5. matriz de permissões;
6. testes executados;
7. riscos conhecidos;
8. passos de homologação.

Se tudo estiver correto:

* faça push somente da feature branch;
* não faça merge;
* não altere main.

---

# PROMPT 18 — PULL REQUEST

Crie Pull Request:

`feature/portal-notes-scale`

para:

`main`

NÃO faça merge.

Título:

`feat: central com roles, notas, favoritos e escala por setor`

Descrição deve explicar:

## Usuários

Roles:

* Admin
* Editor
* Viewer

## Autorização

Diferença entre:

* role;
* participação em setor;
* responsabilidade pelo setor.

## Funcionalidades

* favoritos pessoais;
* atalhos de setor;
* notas pessoais;
* notas de setor;
* escala;
* plantões;
* feriados;
* folgas.

## Banco

Listar migrations.

## Segurança

Explicar controles de backend.

## Homologação

Checklist completo.

## Rollback

Explicar como voltar ao estado anterior caso a homologação falhe.

Não habilite auto-merge.
