// backend/test-image-access.js - Script para probar acceso a imágenes
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuración
const SERVER_IP = '192.168.1.13';
const SERVER_PORT = 3000;
const SHARED_FOLDER = 'C:\\ImagenesCompartidas\\uploads\\reportes\\';
const LOCAL_FOLDER = './uploads/reportes/';

console.log('🧪 === TESTING DE ACCESO A IMÁGENES ===\n');

// Función para verificar si existe un archivo
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Función para obtener lista de archivos en una carpeta
function getFilesInFolder(folderPath) {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    return fs.readdirSync(folderPath);
  } catch (error) {
    console.error(`❌ Error leyendo carpeta ${folderPath}:`, error.message);
    return [];
  }
}

// Función para probar acceso HTTP a una imagen
function testImageAccess(imagePath) {
  return new Promise((resolve) => {
    const url = `http://${SERVER_IP}:${SERVER_PORT}${imagePath}`;
    
    const req = http.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve({
          success: true,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: res.headers['content-length']
        });
      } else {
        resolve({
          success: false,
          statusCode: res.statusCode,
          error: `HTTP ${res.statusCode}`
        });
      }
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout de 5 segundos'
      });
    });
  });
}

// Función principal de testing
async function runImageTests() {
  console.log('📁 Verificando carpetas de imágenes...\n');

  // 1. Verificar carpeta compartida
  console.log('1️⃣ CARPETA COMPARTIDA:');
  console.log(`   Ruta: ${SHARED_FOLDER}`);
  const sharedExists = fileExists(SHARED_FOLDER);
  console.log(`   Existe: ${sharedExists ? '✅ SÍ' : '❌ NO'}`);
  
  if (sharedExists) {
    const sharedFiles = getFilesInFolder(SHARED_FOLDER);
    console.log(`   Archivos encontrados: ${sharedFiles.length}`);
    if (sharedFiles.length > 0) {
      console.log(`   Primeros 5 archivos: ${sharedFiles.slice(0, 5).join(', ')}`);
    }
  }
  console.log('');

  // 2. Verificar carpeta local
  console.log('2️⃣ CARPETA LOCAL:');
  console.log(`   Ruta: ${LOCAL_FOLDER}`);
  const localExists = fileExists(LOCAL_FOLDER);
  console.log(`   Existe: ${localExists ? '✅ SÍ' : '❌ NO'}`);
  
  if (localExists) {
    const localFiles = getFilesInFolder(LOCAL_FOLDER);
    console.log(`   Archivos encontrados: ${localFiles.length}`);
    if (localFiles.length > 0) {
      console.log(`   Primeros 5 archivos: ${localFiles.slice(0, 5).join(', ')}`);
    }
  }
  console.log('');

  // 3. Probar acceso HTTP a imágenes
  console.log('3️⃣ TESTING DE ACCESO HTTP:\n');

  const testImages = [
    '/uploads/reportes/reporte-1756678113750-275502244.jpeg',
    '/uploads/reportes/test-image.jpg',
    '/uploads/reportes/sample.jpg'
  ];

  for (const imagePath of testImages) {
    console.log(`🔍 Probando: ${imagePath}`);
    
    const result = await testImageAccess(imagePath);
    
    if (result.success) {
      console.log(`   ✅ ÉXITO - Status: ${result.statusCode}`);
      console.log(`      Tipo: ${result.contentType}`);
      console.log(`      Tamaño: ${result.contentLength} bytes`);
    } else {
      console.log(`   ❌ ERROR - ${result.error || `Status: ${result.statusCode}`}`);
    }
    console.log('');
  }

  // 4. Verificar configuración del servidor
  console.log('4️⃣ CONFIGURACIÓN DEL SERVIDOR:');
  console.log(`   IP: ${SERVER_IP}`);
  console.log(`   Puerto: ${SERVER_PORT}`);
  console.log(`   URL Base: http://${SERVER_IP}:${SERVER_PORT}`);
  console.log('');

  // 5. Recomendaciones
  console.log('5️⃣ RECOMENDACIONES:');
  
  if (!sharedExists) {
    console.log('   ❌ Crear carpeta compartida:');
    console.log(`      mkdir "C:\\ImagenesCompartidas\\uploads\\reportes"`);
  }
  
  if (!localExists) {
    console.log('   ❌ Crear carpeta local:');
    console.log(`      mkdir "uploads\\reportes"`);
  }
  
  console.log('   ✅ Verificar que el servidor esté corriendo en puerto 3000');
  console.log('   ✅ Verificar que las rutas de imágenes estén configuradas correctamente');
  console.log('   ✅ Verificar permisos de acceso a las carpetas');
  console.log('');

  console.log('🧪 === FIN DEL TESTING ===');
}

// Ejecutar tests
runImageTests().catch(console.error);
