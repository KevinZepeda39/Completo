@echo off
echo ========================================
echo MIGRACION DE IMAGENES A DIRECTORIO COMPARTIDO
echo ========================================
echo.

echo 🔍 Verificando directorio de origen...
if not exist "public\uploads\reportes" (
    echo ❌ Directorio de origen no encontrado: public\uploads\reportes
    echo ✅ No hay imagenes que migrar
    pause
    exit /b
)

echo 🔍 Verificando directorio de destino...
if not exist "C:\ImagenesCompartidas\uploads\reportes" (
    echo 📁 Creando directorio de destino...
    mkdir "C:\ImagenesCompartidas\uploads\reportes" /s
    if errorlevel 1 (
        echo ❌ Error creando directorio de destino
        pause
        exit /b 1
    )
    echo ✅ Directorio creado exitosamente
)

echo 📋 Copiando imagenes existentes...
xcopy "public\uploads\reportes\*" "C:\ImagenesCompartidas\uploads\reportes\" /s /y

if errorlevel 1 (
    echo ❌ Error copiando imagenes
    pause
    exit /b 1
)

echo ✅ Imagenes migradas exitosamente
echo.
echo 📊 Resumen de la migracion:
echo    - Origen: public\uploads\reportes\
echo    - Destino: C:\ImagenesCompartidas\uploads\reportes\
echo.
echo 💡 Ahora puedes eliminar el directorio public\uploads\reportes\ si lo deseas
echo    (las imagenes ya estan en el directorio compartido)
echo.
pause
