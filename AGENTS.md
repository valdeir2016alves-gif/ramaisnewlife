# Ramais New Life

Migrado de Next.js/React para **Vue 3 (Vite) + Express**. Ver [README.md](README.md) para como rodar.

- `client/` — SPA em Vue 3 + Vite. Fala com o backend via `/api/*` (proxy do Vite em dev, mesmo servidor em produção).
- `server/` — API Express. Toda a persistência é feita em arquivos JSON dentro de `data/` (`ramais.json`, `users.json`, `reports.json`, `descriptions.json`, `analytics.json`) — não há banco SQL real em uso, apesar do nome do volume Docker (`ramais_data`). Em produção esse diretório é um volume Docker nomeado; não apagar nem recriar.
- Em produção, o Express serve tanto a API quanto os arquivos estáticos do build do Vue (pasta `server/public`, gerada por `npm run build`), num único container.
