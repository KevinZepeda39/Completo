// test-reports-list.js - Probar que /api/reports devuelva el campo estado
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

function testReportsList() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Probando endpoint /api/reports...');
    console.log('🔗 URL:', `http://${BASE_URL}:${PORT}/api/reports`);
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/reports',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('📡 Status:', res.statusCode);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            
            console.log('✅ Respuesta exitosa');
            console.log('📊 Total de reportes:', result.reportCount || 0);
            
            if (result.reports && result.reports.length > 0) {
              console.log('\n📋 Primeros 3 reportes:');
              
              result.reports.slice(0, 3).forEach((report, index) => {
                console.log(`\n--- Reporte ${index + 1} ---`);
                console.log(`ID: ${report.idReporte || report.id}`);
                console.log(`Título: ${report.titulo || report.title}`);
                console.log(`Estado: ${report.estado || 'NO INCLUIDO'}`);
                console.log(`Categoría: ${report.categoria || report.category}`);
                console.log(`Usuario: ${report.nombreUsuario || 'N/A'}`);
                
                // ✅ VERIFICAR QUE EL CAMPO ESTADO EXISTA
                if (report.estado) {
                  console.log('✅ Campo estado incluido correctamente');
                } else {
                  console.log('❌ Campo estado NO incluido');
                }
              });
              
              // ✅ VERIFICAR QUE TODOS LOS REPORTES TENGAN ESTADO
              const reportsWithoutStatus = result.reports.filter(r => !r.estado);
              if (reportsWithoutStatus.length > 0) {
                console.log(`\n⚠️ ${reportsWithoutStatus.length} reportes sin campo estado`);
              } else {
                console.log('\n🎉 Todos los reportes tienen campo estado');
              }
              
            } else {
              console.log('⚠️ No hay reportes para mostrar');
            }
            
            resolve();
          } else {
            console.error('❌ Error en la respuesta:', res.statusCode);
            console.error('Error:', data);
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Error parseando JSON:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de conexión:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Ejecutar la prueba
testReportsList()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Prueba falló:', error.message);
    process.exit(1);
  });
