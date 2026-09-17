@echo off
chcp 65001 > nul
echo ==========================================
echo   Atualizando Ramais New Life no Servidor 
echo   Destino: 177.72.80.16 (/root/ramaisnewlife)
echo ==========================================

echo.
echo [1/4] Enviando frontend (client/src)...
scp -r client\src root@177.72.80.16:/root/ramaisnewlife/client/

echo.
echo [2/4] Enviando backend (server/src)...
scp -r server\src root@177.72.80.16:/root/ramaisnewlife/server/

echo.
echo [3/4] Enviando Dockerfile atualizado...
scp Dockerfile root@177.72.80.16:/root/ramaisnewlife/Dockerfile

echo.
echo [4/4] Reconstruindo containers Docker no servidor...
ssh root@177.72.80.16 "cd /root/ramaisnewlife && docker compose up -d --build"

echo.
echo ==========================================
echo   ✔ Deploy concluído com sucesso!
echo ==========================================
pause
