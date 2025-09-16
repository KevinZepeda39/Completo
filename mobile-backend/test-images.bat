@echo off
echo ========================================
echo    TESTING DE ACCESO A IMAGENES
echo ========================================
echo.

echo Ejecutando tests de acceso a imagenes...
echo.

cd /d "%~dp0"
node test-image-access.js

echo.
echo ========================================
echo    FIN DEL TESTING
echo ========================================
echo.
pause
