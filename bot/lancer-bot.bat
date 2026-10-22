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

if not exist .env (
  echo Il manque le fichier .env : copie .env.example en .env et remplis-le ^(voir README^).
  pause
  exit /b
)

if not exist node_modules (
  echo Premiere installation, ca prend une minute...
  call npm install
  echo Installation de la commande /soiree sur le serveur...
  call npm run deploy
)

node bot.js
pause
