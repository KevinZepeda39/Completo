// test-connectivity.js - Prueba simple de conectividad
const fetch = require('node-fetch');

async function testConnectivity() {
  const ips = [
    '192.168.1.13:3000',
    '192.168.1.100:3000',
    '192.168.1.1:3000',
    'localhost:3000',
    '127.0.0.1:3000'
  ];

  console.log('🔍 Probando conectividad del servidor...\n');

  for (const ip of ips) {
    try {
      console.log(`📡 Probando: http://${ip}`);
      
      // Probar endpoint de conectividad simple
      const response = await fetch(`http://${ip}/api/reports/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'x-connectivity-test': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ CONEXIÓN EXITOSA a ${ip}`);
        console.log(`   Respuesta:`, data);
      } else {
        console.log(`❌ Respuesta no exitosa: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error conectando a ${ip}:`, error.message);
    }
    console.log('---');
  }

  console.log('\n🔍 Probando endpoint de health...\n');

  for (const ip of ips) {
    try {
      console.log(`🏥 Probando health: http://${ip}/health`);
      
      const response = await fetch(`http://${ip}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ HEALTH CHECK EXITOSO a ${ip}`);
        console.log(`   Respuesta:`, data);
      } else {
        console.log(`❌ Health check falló: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error en health check a ${ip}:`, error.message);
    }
    console.log('---');
  }
}

// Ejecutar prueba
testConnectivity().catch(console.error);
