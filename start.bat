@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   Lumina Host - Iniciando ambiente (Docker)
echo ============================================
echo.

REM --- 1. Verificar se o Docker Desktop esta rodando ---
echo [1/4] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker nao esta rodando. Tentando abrir o Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando o Docker iniciar ^(isso pode levar 1-2 minutos^)...
    :waitdocker
    timeout /t 5 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto waitdocker
    echo Docker esta pronto.
) else (
    echo Docker ja esta rodando.
)
echo.

REM --- 2. Subir tudo (Postgres + Backend + Frontend) num unico comando ---
echo [2/4] Construindo e subindo os containers (Postgres + Backend + Frontend)...
docker compose up -d --build
if errorlevel 1 (
    echo ERRO: falha ao subir o docker compose. Veja a mensagem acima.
    pause
    exit /b 1
)
echo.

REM --- 3. Esperar o backend ficar saudavel (ja implica Postgres + schema prontos) ---
echo [3/4] Aguardando o backend ficar saudavel...
set /a tries=0
:waitbackend
docker inspect --format="{{.State.Health.Status}}" lumina-backend 2>nul | findstr /i "healthy" >nul
if errorlevel 1 (
    set /a tries+=1
    if !tries! GEQ 60 (
        echo ERRO: backend nao ficou saudavel a tempo. Veja os logs com: docker compose logs backend
        pause
        exit /b 1
    )
    timeout /t 2 >nul
    goto waitbackend
)
echo Backend esta saudavel.
echo.

REM --- 4. Popular dados de teste (idempotente - so cria o que ainda nao existe) ---
echo [4/4] Aplicando dados de teste (seed)...
docker compose exec -T backend npm run db:seed
echo.

echo ============================================
echo   Tudo pronto!
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:3003
echo ============================================
echo.
echo Credenciais de teste:
echo   Super Admin: superadmin@lumina.com / super123
echo   Admin:       admin@lumina.com / admin123
echo   Staff:       staff@lumina.com / staff123
echo.
echo Tudo roda em containers Docker (um unico terminal, sem janelas extras).
echo Os containers continuam rodando em segundo plano mesmo se voce fechar esta janela.
echo.
echo Para parar tudo:            docker compose down
echo Para acompanhar os logs:    docker compose logs -f
echo.
echo Pressione qualquer tecla para acompanhar os logs ao vivo (Ctrl+C so encerra a visualizacao, nao os containers)...
pause >nul
docker compose logs -f
