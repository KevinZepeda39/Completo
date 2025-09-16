// test-images.js - Script para probar la funcionalidad de imágenes
const http = require('http');

const testImageEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/uploads/reportes/reporte-1756575999027-282225069.jpeg',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('📷 Respuesta del servidor de imágenes:');
    console.log('  Status:', res.statusCode);
    console.log('  Headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ Imagen encontrada y accesible');
    } else {
      console.log('❌ Error accediendo a la imagen');
    }
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });

  req.end();
};

const testReportsEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('📋 Respuesta del endpoint de reportes:');
        console.log('  Success:', result.success);
        console.log('  Total reportes:', result.reportCount);
        
        if (result.reports && result.reports.length > 0) {
          console.log('📊 Primeros reportes:');
          result.reports.slice(0, 3).forEach((report, index) => {
            console.log(`  [${index + 1}] ID: ${report.idReporte}, Título: "${report.titulo}"`);
            console.log(`      HasImage: ${report.hasImage}, ImageUrl: ${report.imageUrl || 'null'}`);
            console.log(`      Imagen: ${report.imagen || 'null'}`);
          });
        }
      } catch (error) {
        console.error('❌ Error parseando respuesta:', error.message);
        console.log('📄 Respuesta raw:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });

  req.end();
};

console.log('🧪 Iniciando pruebas de imágenes...\n');

console.log('1️⃣ Probando endpoint de imágenes...');
testImageEndpoint();

setTimeout(() => {
  console.log('\n2️⃣ Probando endpoint de reportes...');
  testReportsEndpoint();
}, 1000);
