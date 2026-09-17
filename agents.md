# Ramais New Life

Migrado de Next.js/React para **Vue 3 (Vite) + Express**. Ver [README.md](README.md) para como rodar.

- `client/` — SPA em Vue 3 + Vite. Fala com o backend via `/api/*` (proxy do Vite em dev, mesmo servidor em produção).
- `server/` — API Express. Persistência em **PostgreSQL** (`server/src/db/pool.js`), schema criado e populado automaticamente no boot por `server/src/db/migrate.js` (idempotente — só importa dados do JSON legado se as tabelas estiverem vazias). Requer a env var `DATABASE_URL`.
  - Os arquivos JSON antigos (`ramais.json`, `users.json`, `reports.json`, `descriptions.json`, `analytics.json`) em `data/` (volume Docker `ramais_data`) são usados **só como fonte de importação única** na primeira subida após a migração; depois disso ficam sem uso. Não apagar o volume até confirmar que os dados foram importados corretamente pro Postgres.
  - MinIO está no `docker-compose.yml` como infraestrutura reservada para features futuras de imagem (foto da sede, do colaborador, do modelo de telefone etc.) — hoje nenhuma rota usa; bucket padrão `ramais-media`, console em `:9001`.
- Em produção, o Express serve tanto a API quanto os arquivos estáticos do build do Vue (pasta `server/public`, gerada por `npm run build`), num único container. `docker-compose.yml` sobe esse container junto com `postgres` e `minio`.
- Dev local (`npm run dev`, fora do Docker) também precisa de um Postgres acessível: suba só o banco com `docker compose up postgres -d` e aponte `DATABASE_URL=postgresql://ramais:<senha>@localhost:5432/ramais` no ambiente do `server/`.
