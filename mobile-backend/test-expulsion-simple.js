// test-expulsion-simple.js - Script simple para probar expulsión
const http = require('http');

const HOST = '192.168.1.13';
const PORT = 3000;

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testExpulsionSimple() {
  console.log('🧪 === PRUEBA SIMPLE DE EXPULSIÓN ===\n');
  
  try {
    // 1. Verificar servidor
    console.log('1️⃣ Verificando servidor...');
    const testResponse = await makeRequest('/api/test');
    if (testResponse.status !== 200) {
      throw new Error('Servidor no responde');
    }
    console.log('✅ Servidor funcionando\n');

    // 2. Probar expulsión (usar IDs reales de tu base de datos)
    console.log('2️⃣ Probando expulsión...');
    
    // CAMBIA ESTOS IDs POR UNOS REALES DE TU BASE DE DATOS
    const creatorUserId = 143; // Usuario creador
    const targetUserId = 156;  // Usuario a expulsar
    const communityId = 71;    // ID de comunidad
    
    console.log(`👤 Creador: ${creatorUserId}`);
    console.log(`🚫 Expulsar: ${targetUserId}`);
    console.log(`🏘️ Comunidad: ${communityId}`);
    
    const expelResponse = await makeRequest(
      `/api/communities/${communityId}/expel`,
      'POST',
      { 'x-user-id': creatorUserId.toString() },
      { userIdToExpel: targetUserId }
    );
    
    console.log('📋 Respuesta expulsión:', expelResponse.status, expelResponse.data);
    
    if (expelResponse.status === 200) {
      console.log('✅ Expulsión exitosa\n');
      
      // 3. Verificar que no puede re-unirse
      console.log('3️⃣ Verificando prevención de re-unión...');
      
      const joinResponse = await makeRequest(
        '/api/communities/action',
        'POST',
        { 'x-user-id': targetUserId.toString() },
        { action: 'join', communityId: communityId }
      );
      
      console.log('📋 Respuesta intento de unión:', joinResponse.status, joinResponse.data);
      
      if (joinResponse.status === 400 && joinResponse.data.error && joinResponse.data.error.includes('expulsado')) {
        console.log('✅ Prevención funcionando correctamente');
      } else {
        console.log('❌ Prevención no funcionando');
      }
      
    } else {
      console.log('❌ Error en expulsión');
    }
    
    console.log('\n🎉 === PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar prueba
testExpulsionSimple();
