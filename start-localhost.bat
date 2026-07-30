@echo off
cd /d "%~dp0"
echo Starting Vaelon Space website...
echo.
echo Open this link in your browser:
echo http://localhost:8020
echo.
echo Keep this window open while using the website.
echo Press Ctrl+C to stop the server.
echo.
set PORT=8020
node server.js
pause
