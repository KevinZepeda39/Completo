@echo off
echo 🚀 Iniciando ambos servidores simultáneamente...
echo.

echo 📱 === SERVIDOR APP MÓVIL ===
echo 🌐 Puerto: 3000
echo 📁 Directorio: %~dp0
echo.

echo 🌐 === SERVIDOR PLATAFORMA WEB ===
echo 🌐 Puerto: 3001
echo 📁 Directorio: C:\WebTwo\Web\Plataforma
echo.

echo ✅ URLs disponibles:
echo 📱 App Móvil: http://localhost:3000
echo 🌐 Plataforma Web: http://localhost:3001
echo.

echo 🔍 Iniciando servidores... Presiona Ctrl+C para detener ambos.
echo.

REM Iniciar servidor de la App Móvil en una nueva ventana
start "App Móvil - Puerto 3000" cmd /k "cd /d %~dp0 && node server.js"

REM Esperar un poco
timeout /t 3 /nobreak >nul

REM Iniciar servidor de la Plataforma Web en otra ventana
start "Plataforma Web - Puerto 3001" cmd /k "cd /d C:\WebTwo\Web\Plataforma && node server.js"

echo.
echo ✅ Ambos servidores iniciados en ventanas separadas.
echo 🔍 Monitorea los logs en cada ventana.
echo 🛑 Para detener, cierra las ventanas o presiona Ctrl+C en cada una.
echo.

pause
