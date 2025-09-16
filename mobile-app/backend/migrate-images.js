// migrate-images.js - Script para migrar imágenes al directorio compartido
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando migración de imágenes al directorio compartido...\n');

// Directorios de origen
const appMobileDir = path.join(__dirname, 'uploads/reportes');
const platformWebDir = 'C:/WebTwo/Web/Plataforma/public/uploads/reportes';

// Directorio de destino compartido
const sharedDir = 'C:/ImagenesCompartidas/uploads/reportes';

// Crear directorio compartido si no existe
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
  console.log('✅ Directorio compartido creado:', sharedDir);
}

// Función para copiar archivos
function copyFiles(sourceDir, targetDir, sourceName) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️ Directorio ${sourceName} no existe:`, sourceDir);
    return 0;
  }

  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.statSync(sourcePath).isFile()) {
      try {
        // Solo copiar si no existe en el destino
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`📁 Copiado: ${file} desde ${sourceName}`);
          copiedCount++;
        } else {
          console.log(`⚠️ Ya existe: ${file} (saltando)`);
        }
      } catch (error) {
        console.error(`❌ Error copiando ${file}:`, error.message);
      }
    }
  });

  return copiedCount;
}

// Función para listar archivos en un directorio
function listFiles(dir, dirName) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ Directorio ${dirName} no existe:`, dir);
    return [];
  }

  const files = fs.readdirSync(dir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  return imageFiles;
}

console.log('📋 === INVENTARIO DE IMÁGENES ===\n');

// Listar imágenes en la app móvil
const appMobileImages = listFiles(appMobileDir, 'App Móvil');
console.log(`📱 App Móvil: ${appMobileImages.length} imágenes`);
appMobileImages.forEach(img => console.log(`   - ${img}`));

console.log('');

// Listar imágenes en la plataforma web
const platformWebImages = listFiles(platformWebDir, 'Plataforma Web');
console.log(`🌐 Plataforma Web: ${platformWebImages.length} imágenes`);
platformWebImages.forEach(img => console.log(`   - ${img}`));

console.log('');

// Listar imágenes en el directorio compartido
const sharedImages = listFiles(sharedDir, 'Directorio Compartido');
console.log(`📁 Directorio Compartido: ${sharedImages.length} imágenes`);
sharedImages.forEach(img => console.log(`   - ${img}`));

console.log('\n🔄 === INICIANDO MIGRACIÓN ===\n');

// Migrar imágenes de la app móvil
console.log('📱 Migrando imágenes de la App Móvil...');
const appMobileCopied = copyFiles(appMobileDir, sharedDir, 'App Móvil');
console.log(`✅ ${appMobileCopied} imágenes copiadas desde App Móvil\n`);

// Migrar imágenes de la plataforma web
console.log('🌐 Migrando imágenes de la Plataforma Web...');
const platformWebCopied = copyFiles(platformWebDir, sharedDir, 'Plataforma Web');
console.log(`✅ ${platformWebCopied} imágenes copiadas desde Plataforma Web\n`);

// Resumen final
const totalImages = listFiles(sharedDir, 'Directorio Compartido');
console.log('🎉 === MIGRACIÓN COMPLETADA ===');
console.log(`📊 Total de imágenes en directorio compartido: ${totalImages.length}`);
console.log(`📱 Imágenes migradas desde App Móvil: ${appMobileCopied}`);
console.log(`🌐 Imágenes migradas desde Plataforma Web: ${platformWebCopied}`);
console.log(`📁 Directorio compartido: ${sharedDir}`);

console.log('\n💡 === PRÓXIMOS PASOS ===');
console.log('1. ✅ Reiniciar el servidor de la app móvil');
console.log('2. ✅ Reiniciar el servidor de la plataforma web');
console.log('3. ✅ Verificar que las imágenes se muestren en ambos sistemas');
console.log('4. ✅ Las nuevas imágenes se guardarán automáticamente en el directorio compartido');

console.log('\n🔧 === CONFIGURACIÓN RECOMENDADA ===');
console.log('Para la plataforma web, actualizar la configuración de multer para usar:');
console.log(`   destination: '${sharedDir}'`);
console.log('Esto asegurará que todas las nuevas imágenes se guarden en el mismo lugar.');
