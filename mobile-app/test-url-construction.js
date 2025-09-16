// test-url-construction.js - Testing rápido de construcción de URLs
console.log('🧪 === TESTING DE CONSTRUCCIÓN DE URLs ===\n');

// Función getImageUrl copiada del ReportDetailScreen
function getImageUrl(imagePath) {
  if (!imagePath) {
    console.log('❌ [URL] No hay ruta de imagen proporcionada');
    return null;
  }
  
  try {
    console.log('🔍 [URL] Procesando ruta de imagen:', imagePath);
    
    // PASO 1: Si ya es una URL completa, usarla directamente
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('🖼️ [URL] URL completa detectada, usando directamente:', imagePath);
      return imagePath;
    }
    
    // PASO 2: Si la ruta ya incluye IP, limpiarla
    let cleanPath = imagePath;
    
    // Remover IP si ya está incluida en la ruta
    if (cleanPath.includes('192.168.1.13:3000')) {
      cleanPath = cleanPath.replace('192.168.1.13:3000', '');
      console.log('🖼️ [URL] IP removida de la ruta:', cleanPath);
    }
    
    if (cleanPath.includes('192.168.1.4:3000')) {
      cleanPath = cleanPath.replace('192.168.1.4:3000', '');
      console.log('🖼️ [URL] IP removida de la ruta:', cleanPath);
    }
    
    // PASO 3: Normalizar la ruta para carpeta compartida
    // Remover / inicial si existe
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
      console.log('🖼️ [URL] Ruta normalizada (removido / inicial):', cleanPath);
    }
    
    // PASO 4: Asegurar que empiece con uploads/reportes/
    if (!cleanPath.startsWith('uploads/reportes/')) {
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = `uploads/reportes/${cleanPath.substring(8)}`;
      } else if (cleanPath.startsWith('reportes/')) {
        cleanPath = `uploads/${cleanPath}`;
      } else {
        cleanPath = `uploads/reportes/${cleanPath}`;
      }
      console.log('🖼️ [URL] Ruta convertida a carpeta compartida:', cleanPath);
    }
    
    // PASO 5: Construir URL final
    const serverIP = '192.168.1.13:3000';
    const fullUrl = `http://${serverIP}/${cleanPath}`;
    
    console.log('🖼️ [URL] URL final construida:', fullUrl);
    console.log('🖼️ [URL] Ruta en carpeta compartida: C:\\ImagenesCompartidas\\' + cleanPath);
    
    return fullUrl;
    
  } catch (error) {
    console.error('❌ [URL] Error construyendo URL de imagen:', error);
    return null;
  }
}

// Casos de prueba
const testCases = [
  '192.168.1.13:3000/uploads/reporte-1756678113750-275502244.jpeg',
  '/uploads/reportes/reporte-1756678113750-275502244.jpeg',
  'uploads/reportes/reporte-1756678113750-275502244.jpeg',
  'reporte-1756678113750-275502244.jpeg',
  'http://192.168.1.13:3000/uploads/reporte-1756678113750-275502244.jpeg',
  'uploads/reportes/test-image.jpg'
];

console.log('📋 CASOS DE PRUEBA:\n');

testCases.forEach((testCase, index) => {
  console.log(`🔍 PRUEBA ${index + 1}:`);
  console.log(`   Entrada: ${testCase}`);
  
  const result = getImageUrl(testCase);
  
  console.log(`   Resultado: ${result}`);
  console.log(`   ✅ URL válida: ${result && result.startsWith('http://') ? 'SÍ' : 'NO'}`);
  console.log(`   ✅ Sin duplicación: ${result && !result.includes('192.168.1.13:3000/192.168.1.13:3000') ? 'SÍ' : 'NO'}`);
  console.log('');
});

console.log('🧪 === FIN DEL TESTING ===');
