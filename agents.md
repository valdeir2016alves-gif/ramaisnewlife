# Documentação do Aplicativo - Ramais New Life

Este documento detalha o funcionamento, arquitetura e stack tecnológico do aplicativo **Ramais New Life**, que atua como um diretório de contatos internos com painel de administração.

## Visão Geral

O projeto foi migrado de uma arquitetura Next.js/React legada para uma stack moderna de **Vue 3 (Vite) + Node.js (Express)** com banco de dados **PostgreSQL**. A aplicação permite que funcionários consultem ramais internos, filtrem por departamentos, e que administradores gerenciem (criem, editem, deletem) esses ramais através de um painel de controle. 

Também há funcionalidades avançadas de monitoramento, como relatórios de uso e estatísticas com gráficos, alertas de IPs e notificações pelo Telegram.

## Arquitetura e Stack

A estrutura principal do repositório é dividida em:

### Frontend (`client/`)
Uma SPA (Single Page Application) construída em Vue 3.
- **Framework & Build:** Vue 3 e Vite (rapidez no desenvolvimento e build otimizado).
- **Roteamento:** `vue-router` para navegação do lado do cliente.
- **Visualização de Dados:** Utiliza `chart.js` e `vue-chartjs` para gráficos e estatísticas.
- **Integração:** Durante o desenvolvimento, o Vite faz proxy de requisições iniciadas em `/api/*` diretamente para o backend. Em produção, os arquivos estáticos gerados em `client/dist` são servidos pelo próprio Express em `server/public`.

### Backend (`server/`)
Uma API RESTful implementada em Node.js com Express.
- **Framework:** Express.js.
- **Banco de Dados:** PostgreSQL (via módulo `pg`).
- **Autenticação e Segurança:** Uso de `bcryptjs` para o armazenamento e verificação segura das senhas dos usuários do painel.
- **Migração Automática:** O script `server/src/db/migrate.js` é executado no boot e é idempotente. Ele lê os arquivos legados JSON (`ramais.json`, `users.json`, etc) da pasta `data/` e popula o banco de dados na primeira execução (caso as tabelas estejam vazias).
- **Monitoramento:** Há um script em segundo plano (`monitor.js`) sendo rodado junto com o index, usado para verificar alertas de uso, registrar logs e interagir com o Telegram.

### Dados Históricos e Mídia (`data/` e MinIO)
- **JSON Legados:** Arquivos persistentes (`ramais.json`, `users.json`, `reports.json`, `descriptions.json`, `analytics.json`) que foram extraídos da arquitetura original e agora servem apenas como **semente** para o PostgreSQL.
- **MinIO:** Serviço de Storage Object (compatível com S3) está configurado no `docker-compose.yml` (bucket `ramais-media`). Está reservado para futura infraestrutura de armazenamento das imagens e fotos dos colaboradores/sedes.

## Variáveis de Ambiente e Integrações

Variáveis importantes para execução e configuração de recursos adicionais:
- `DATABASE_URL`: String de conexão do PostgreSQL (Ex: `postgresql://ramais:<senha>@localhost:5432/ramais`).
- `PORT`: Porta do Express (padrão é 3000).
- `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`: Integrações opcionais para enviar notificações de ramais relatados incorretos ou alertas do sistema de monitoramento de IP diretamente para grupos do Telegram.

## Execução

**Em desenvolvimento (Local):**
```bash
# 1. Instalar dependências de ambos os projetos (Client e Server)
npm run install:all

# 2. Iniciar o PostgreSQL usando Docker
docker compose up postgres -d

# 3. Executar API e Vite (Hot Reload) simultaneamente
npm run dev
```

**Em produção (Docker):**
O arquivo `docker-compose.yml` subirá o serviço MinIO, o PostgreSQL e uma única imagem do Node.js, contendo tanto os recursos estáticos gerados por `npm run build` quanto a API.

```bash
docker compose up -d --build
```

## Padrões de Conteúdo (Content Guide)
O aplicativo impõe rigorosos padrões de conteúdo para manutenção da qualidade dos dados:
- Títulos de departamento sempre usam formatação "Sentence Case" (exceto siglas, como TI, RH).
- Ramais sempre adotam um padrão de 4 dígitos (ex: 4040).
- Números externos exigem formato completo com DDD (ex: (55) 99999-9999).
- Registros vazios ou lixos visuais não devem ser mantidos e devem ser fisicamente excluídos do banco de dados ao invés de ocultados.
