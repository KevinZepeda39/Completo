// test-expulsion-notifications.js
// Script para probar los endpoints de notificaciones de expulsión

const http = require('http');

const API_URL = 'http://192.168.1.13:3000';

// Función para hacer peticiones HTTP
const makeRequest = (path, method = 'GET', headers = {}, data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '192.168.1.13',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Función principal de pruebas
const runTests = async () => {
  console.log('🧪 === PRUEBAS DE NOTIFICACIONES DE EXPULSIÓN ===\n');

  try {
    // 1. Probar endpoint de notificaciones de expulsión (sin autenticación)
    console.log('1️⃣ Probando endpoint sin autenticación...');
    try {
      const response = await makeRequest('/api/notifications/user-expelled');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 2. Probar endpoint con usuario autenticado (ID 1)
    console.log('\n2️⃣ Probando endpoint con usuario ID 1...');
    try {
      const response = await makeRequest('/api/notifications/user-expelled', 'GET', {
        'x-user-id': '1'
      });
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 3. Probar endpoint con usuario autenticado (ID 2)
    console.log('\n3️⃣ Probando endpoint con usuario ID 2...');
    try {
      const response = await makeRequest('/api/notifications/user-expelled', 'GET', {
        'x-user-id': '2'
      });
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 4. Probar endpoint de notificaciones no leídas (sin autenticación)
    console.log('\n4️⃣ Probando endpoint de notificaciones no leídas sin autenticación...');
    try {
      const response = await makeRequest('/api/notifications/unread');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 5. Probar endpoint de notificaciones no leídas con usuario ID 1
    console.log('\n5️⃣ Probando endpoint de notificaciones no leídas con usuario ID 1...');
    try {
      const response = await makeRequest('/api/notifications/unread', 'GET', {
        'x-user-id': '1'
      });
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 6. Probar endpoint de marcar como leída (debe estar deshabilitado)
    console.log('\n6️⃣ Probando endpoint de marcar como leída (debe estar deshabilitado)...');
    try {
      const response = await makeRequest('/api/notifications/1/read', 'PUT', {
        'x-user-id': '1'
      });
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    console.log('\n✅ === PRUEBAS COMPLETADAS ===');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
};

// Ejecutar pruebas
runTests();
