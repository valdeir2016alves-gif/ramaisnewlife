Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Atualizando Ramais New Life no Servidor " -ForegroundColor Cyan
Write-Host "  Destino: 177.72.80.17 (/root/ramaisnewlife)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/5] Compilando frontend localmente..." -ForegroundColor Yellow
npm run build --prefix client
if (-not (Test-Path "server\public")) { New-Item -ItemType Directory -Path "server\public" -Force | Out-Null }
Copy-Item -Path "client\dist\*" -Destination "server\public\" -Recurse -Force

Write-Host "`n[2/5] Enviando frontend (código e arquivos compilados)..." -ForegroundColor Yellow
scp -r client\src\* root@177.72.80.17:/root/ramaisnewlife/client/src/
scp -r client\public\* root@177.72.80.17:/root/ramaisnewlife/client/public/
scp client\package.json root@177.72.80.17:/root/ramaisnewlife/client/
scp client\package-lock.json root@177.72.80.17:/root/ramaisnewlife/client/
scp -r server\public\* root@177.72.80.17:/root/ramaisnewlife/server/public/

Write-Host "`n[3/5] Enviando backend (server/src)..." -ForegroundColor Yellow
scp -r server\src\* root@177.72.80.17:/root/ramaisnewlife/server/src/

Write-Host "`n[4/5] Enviando Dockerfile atualizado..." -ForegroundColor Yellow
scp Dockerfile root@177.72.80.17:/root/ramaisnewlife/Dockerfile

Write-Host "`n[5/5] Reconstruindo containers Docker SEM CACHE no servidor..." -ForegroundColor Yellow
ssh root@177.72.80.17 "cd /root/ramaisnewlife && docker compose build --no-cache web && docker compose up -d --force-recreate web && docker cp /root/ramaisnewlife/server/public/. ramais-new-life:/app/server/public/ 2>/dev/null || true"

Write-Host "`n✔ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "Dica: Pressione Ctrl + F5 no navegador para atualizar o cache da página." -ForegroundColor Green
