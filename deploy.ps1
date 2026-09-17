Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Atualizando Ramais New Life no Servidor " -ForegroundColor Cyan
Write-Host "  Destino: 177.72.80.16 (/root/ramaisnewlife)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n[1/4] Enviando frontend (client/src)..." -ForegroundColor Yellow
scp -r client\src root@177.72.80.16:/root/ramaisnewlife/client/

Write-Host "`n[2/4] Enviando backend (server/src)..." -ForegroundColor Yellow
scp -r server\src root@177.72.80.16:/root/ramaisnewlife/server/

Write-Host "`n[3/4] Enviando Dockerfile atualizado..." -ForegroundColor Yellow
scp Dockerfile root@177.72.80.16:/root/ramaisnewlife/Dockerfile

Write-Host "`n[4/4] Reconstruindo containers Docker no servidor..." -ForegroundColor Yellow
ssh root@177.72.80.16 "cd /root/ramaisnewlife && docker compose up -d --build"

Write-Host "`n✔ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "Acesse o site e o admin (/admin) para testar o novo painel de ATAs." -ForegroundColor Green
