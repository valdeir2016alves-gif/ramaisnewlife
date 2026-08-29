# Ramais - New Life

Diretório de contatos internos, com painel de administração. Migrado de Next.js/React para **Vue 3 (Vite) + Express**.

## Estrutura

- `client/` — frontend em Vue 3 + Vite (SPA).
- `server/` — backend em Express, expõe a API em `/api/*` e, em produção, também serve os arquivos estáticos do frontend.
- `data/` — arquivos JSON com os dados (contatos, usuários, relatórios, descrições, estatísticas de acesso). Em produção é um volume Docker persistente.

## Rodando em desenvolvimento

Instale as dependências do backend e do frontend:

```bash
npm run install:all
```

Suba os dois serviços em paralelo (backend na porta 3000, frontend com hot-reload na porta 5173, com proxy de `/api` para o backend):

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

## Build de produção

```bash
npm run build
npm start
```

Isso gera o build do Vue em `client/dist`, copia para `server/public`, e sobe o Express (porta 3000, configurável via `PORT`) servindo tudo — API e frontend — num único processo.

## Docker

```bash
docker compose up -d --build
```

O `docker-compose.yml` mantém o mesmo volume nomeado `ramais_data` montado em `/app/data`, usado nas versões anteriores do projeto — os dados existentes não são perdidos.

## Variáveis de ambiente opcionais

- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — habilitam notificações no Telegram para relatos de contato incorreto e alertas do monitor de IP.
