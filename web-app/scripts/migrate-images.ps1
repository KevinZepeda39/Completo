# ========================================
# MIGRACION DE IMAGENES A DIRECTORIO COMPARTIDO
# ========================================

Write-Host "🔍 Verificando directorio de origen..." -ForegroundColor Yellow
$sourceDir = "public\uploads\reportes"
$destDir = "C:\ImagenesCompartidas\uploads\reportes"

if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Directorio de origen no encontrado: $sourceDir" -ForegroundColor Red
    Write-Host "✅ No hay imagenes que migrar" -ForegroundColor Green
    Read-Host "Presiona Enter para continuar"
    exit
}

Write-Host "🔍 Verificando directorio de destino..." -ForegroundColor Yellow
if (-not (Test-Path $destDir)) {
    Write-Host "📁 Creando directorio de destino..." -ForegroundColor Blue
    try {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Write-Host "✅ Directorio creado exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error creando directorio de destino: $($_.Exception.Message)" -ForegroundColor Red
        Read-Host "Presiona Enter para continuar"
        exit 1
    }
}

Write-Host "📋 Copiando imagenes existentes..." -ForegroundColor Yellow
try {
    Copy-Item -Path "$sourceDir\*" -Destination $destDir -Recurse -Force
    Write-Host "✅ Imagenes migradas exitosamente" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error copiando imagenes: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar"
    exit 1
}

Write-Host ""
Write-Host "📊 Resumen de la migracion:" -ForegroundColor Cyan
Write-Host "   - Origen: $sourceDir" -ForegroundColor White
Write-Host "   - Destino: $destDir" -ForegroundColor White
Write-Host ""
Write-Host "💡 Ahora puedes eliminar el directorio $sourceDir si lo deseas" -ForegroundColor Yellow
Write-Host "   (las imagenes ya estan en el directorio compartido)" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para continuar"
