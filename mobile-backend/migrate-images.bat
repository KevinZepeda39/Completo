@echo off
echo 🚀 MIGRACIÓN DE IMÁGENES AL DIRECTORIO COMPARTIDO
echo ================================================
echo.

echo 📋 Este script migrará todas las imágenes existentes
echo    desde la app móvil y la plataforma web hacia
echo    un directorio compartido.
echo.

echo 📁 Directorio compartido: C:\ImagenesCompartidas\uploads\reportes
echo.

echo ⚠️  IMPORTANTE: Asegúrate de que ambos servidores estén detenidos
echo    antes de ejecutar este script para evitar conflictos.
echo.

pause

echo.
echo 🔄 Ejecutando migración...
echo.

node migrate-images.js

echo.
echo ✅ Migración completada!
echo.
echo 💡 Próximos pasos:
echo    1. Reiniciar el servidor de la app móvil
echo    2. Reiniciar el servidor de la plataforma web
echo    3. Verificar que las imágenes se muestren en ambos sistemas
echo.

pause
