@echo off
:: -----------------------------------------------------------------
:: Script de Inicializacao Local - Bar do Morcego (ERP - Grupo 1)
::
:: O que este script faz (Versao Robusta e Automatica):
:: 1. Garante que TODAS as dependencias (npm install) estao instaladas.
:: 2. Cria o .env com as chaves publicas (se nao existir).
:: 3. Garante que o Tailwind CSS esta inicializado (tailwind.config.js).
:: 4. Inicia o servidor de desenvolvimento (npm run dev).
:: -----------------------------------------------------------------

:: Define o titulo da janela do console
TITLE Servidor - Bar do Morcego (ERP - Grupo 1)
COLOR 0F
CLS

echo ==================================================================
echo  SCRIPT DE INICIALIZACAO LOCAL - BAR DO MORCEGO (GRUPO 1)
echo ==================================================================
echo.
echo Este script ira preparar e iniciar o ambiente de desenvolvimento.
echo.
echo Pressione qualquer tecla para iniciar...
pause > nul
GOTO :CHECK_DEPENDENCIES

:CHECK_DEPENDENCIES
CLS
echo [PASSO 1/4] Verificando dependencias (pasta node_modules)...
echo.
IF EXIST "node_modules" (
    echo   Dependencias ja estao instaladas. Pulando passo.
    GOTO :CHECK_ENV
)

echo   Pasta "node_modules" nao encontrada.
echo   Iniciando instalacao de TODAS as dependencias (npm install)...
echo   (Isso inclui React, Tailwind, lovable-tagger, etc.)
echo   (Isso pode levar alguns minutos...)
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha no 'npm install'. Verifique sua conexao ou o 'package.json'.
    GOTO :END
)
echo.
echo   Instalacao concluida.
GOTO :CHECK_ENV

:CHECK_ENV
CLS
echo [PASSO 2/4] Verificando arquivo de ambiente (.env)...
echo.
IF EXIST ".env" (
    echo   Arquivo .env ja existe. Pulando criacao.
    GOTO :CHECK_TAILWIND_CONFIG
)

echo   Arquivo .env nao encontrado.
echo   Criando arquivo .env com as chaves publicas do Supabase...

echo   Arquivo .env criado com sucesso.
GOTO :CHECK_TAILWIND_CONFIG

:CHECK_TAILWIND_CONFIG
CLS
echo [PASSO 3/4] Verificando configuracao do Tailwind CSS...
echo.
:: Verifica se o .js ou o .ts existe
IF EXIST "tailwind.config.js" GOTO :START_SERVER
IF EXIST "tailwind.config.ts" GOTO :START_SERVER

echo   Arquivo 'tailwind.config.js' ou '.ts' nao encontrado.
echo   Este e um passo de configuracao unico.
echo   Inicializando Tailwind (npx tailwindcss init -p)...
call npx tailwindcss init -p
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao inicializar o Tailwind.
    GOTO :END
)
echo   Configuracao do Tailwind criada.
GOTO :START_SERVER

:START_SERVER
CLS
echo [PASSO 4/4] Iniciando o servidor de desenvolvimento (npm run dev)...
echo.
echo *****************************************************************
echo   O servidor sera iniciado agora.
echo.
echo   Acesse o app no seu navegador (geralmente):
echo   http://localhost:8080 (ou a porta que aparecer abaixo)
echo.
echo   Para PARAR o servidor, pressione CTRL+C nesta janela.
echo *****************************************************************
echo.
call npm run dev

:END
echo.
echo [FINALIZADO] O servidor foi parado.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul