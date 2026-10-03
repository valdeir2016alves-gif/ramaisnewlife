@echo off
chcp 65001 > nul
echo ==========================================
echo   Atualizando Ramais New Life no Servidor 
echo   Destino: 177.72.80.17 (/root/ramaisnewlife)
echo ==========================================

echo.
echo [1/5] Compilando frontend localmente...
call npm run build --prefix client
if not exist server\public mkdir server\public
xcopy /E /I /Y client\dist\* server\public\ > nul

echo.
echo [2/5] Enviando frontend (código e arquivos compilados)...
scp -r client\src\* root@177.72.80.17:/root/ramaisnewlife/client/src/
scp -r client\public\* root@177.72.80.17:/root/ramaisnewlife/client/public/
scp client\package.json root@177.72.80.17:/root/ramaisnewlife/client/
scp client\package-lock.json root@177.72.80.17:/root/ramaisnewlife/client/
scp -r server\public\* root@177.72.80.17:/root/ramaisnewlife/server/public/

echo.
echo [3/5] Enviando backend (server/src)...
scp -r server\src\* root@177.72.80.17:/root/ramaisnewlife/server/src/

echo.
echo [4/5] Enviando Dockerfile atualizado...
scp Dockerfile root@177.72.80.17:/root/ramaisnewlife/Dockerfile

echo.
echo [5/5] Reconstruindo containers Docker SEM CACHE no servidor...
ssh root@177.72.80.17 "cd /root/ramaisnewlife && docker compose build --no-cache web && docker compose up -d --force-recreate web && docker cp /root/ramaisnewlife/server/public/. ramais-new-life:/app/server/public/ 2>/dev/null || true"

echo.
echo ==========================================
echo   ✔ Deploy concluído com sucesso!
echo   Dica: Pressione Ctrl + F5 no navegador para atualizar o cache da página.
echo ==========================================
pause
