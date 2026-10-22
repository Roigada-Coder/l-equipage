@echo off
chcp 65001 >nul
title Bot L'Equipage
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Telecharge la version LTS sur https://nodejs.org puis relance ce fichier.
  pause
  exit /b
)

rem Fichier mal nomme par Windows : .env.txt devient .env
if not exist .env if exist .env.txt ren .env.txt .env

if not exist .env (
  copy /y .env.example .env >nul
  echo.
  echo  Le fichier .env vient d'etre cree et s'ouvre dans le Bloc-notes.
  echo  1. Colle ton token apres DISCORD_TOKEN=
  echo  2. Colle l'Application ID apres CLIENT_ID=
  echo  3. Colle l'identifiant du serveur apres GUILD_ID=
  echo  4. Enregistre avec Ctrl+S et ferme le Bloc-notes.
  echo.
  start /wait notepad .env
)

if not exist node_modules (
  echo Premiere installation, ca prend une minute...
  call npm install
  if errorlevel 1 (
    echo L'installation a echoue. Verifie ta connexion internet puis relance ce fichier.
    pause
    exit /b
  )
)

if not exist .commande-installee (
  echo Installation de la commande /soiree sur le serveur...
  node deploy-commands.cjs && echo ok> .commande-installee
  if not exist .commande-installee (
    echo.
    echo Corrige le fichier .env comme indique ci-dessus, enregistre, puis relance ce fichier.
    pause
    exit /b
  )
)

node bot.cjs
pause
