// test-expulsion.js - Script para probar la funcionalidad de expulsión
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

async function testExpulsion() {
  console.log('🧪 === PROBANDO FUNCIONALIDAD DE EXPULSIÓN ===\n');
  
  try {
    // 1. Verificar que el servidor esté corriendo
    console.log('1️⃣ Verificando que el servidor esté corriendo...');
    const testResponse = await makeRequest('/api/test');
    if (testResponse.status !== 200) {
      throw new Error('Servidor no responde correctamente');
    }
    console.log('✅ Servidor funcionando correctamente\n');

    // 2. Probar expulsión de usuario
    console.log('2️⃣ Probando expulsión de usuario...');
    const creatorUserId = 143; // Usuario creador de la comunidad
    const targetUserId = 156; // Usuario a expulsar
    const communityId = 71; // ID de la comunidad
    
    console.log(`👤 Creador de la comunidad: ${creatorUserId}`);
    console.log(`🚫 Usuario a expulsar: ${targetUserId}`);
    console.log(`🏘️ Comunidad: ${communityId}`);
    
    const expelResponse = await makeRequest(
      `/api/communities/${communityId}/expel`,
      'POST',
      { 'x-user-id': creatorUserId.toString() },
      { userIdToExpel: targetUserId }
    );
    
    if (expelResponse.status === 200) {
      console.log('✅ Usuario expulsado exitosamente');
      console.log('📋 Respuesta:', expelResponse.data);
    } else {
      console.log('❌ Error al expulsar usuario:', expelResponse.status, expelResponse.data);
    }
    
    // 3. Verificar que el usuario expulsado no pueda re-unirse
    console.log('\n3️⃣ Verificando que el usuario expulsado no pueda re-unirse...');
    
    const joinResponse = await makeRequest(
      '/api/communities/action',
      'POST',
      { 'x-user-id': targetUserId.toString() },
      { action: 'join', communityId: communityId }
    );
    
    if (joinResponse.status === 400 && joinResponse.data.error && joinResponse.data.error.includes('expulsado')) {
      console.log('✅ Usuario expulsado no puede re-unirse (correcto)');
      console.log('📋 Mensaje de error:', joinResponse.data.error);
    } else {
      console.log('❌ Usuario expulsado pudo re-unirse (incorrecto)');
      console.log('📋 Respuesta:', joinResponse.status, joinResponse.data);
    }
    
    // 4. Verificar notificación de expulsión
    console.log('\n4️⃣ Verificando notificación de expulsión...');
    
    const notificationResponse = await makeRequest(
      '/api/notifications/user-expelled',
      'GET',
      { 'x-user-id': targetUserId.toString() }
    );
    
    if (notificationResponse.status === 200 && notificationResponse.data.notifications.length > 0) {
      console.log('✅ Notificación de expulsión creada correctamente');
      console.log('📋 Notificaciones:', notificationResponse.data.notifications.length);
      console.log('📝 Última notificación:', notificationResponse.data.notifications[0]);
    } else {
      console.log('❌ No se encontró notificación de expulsión');
      console.log('📋 Respuesta:', notificationResponse.status, notificationResponse.data);
    }
    
    // 5. Verificar tabla de usuarios expulsados
    console.log('\n5️⃣ Verificando tabla de usuarios expulsados...');
    
    // Intentar unirse de nuevo para ver el mensaje de expulsión
    const rejoinResponse = await makeRequest(
      '/api/communities/action',
      'POST',
      { 'x-user-id': targetUserId.toString() },
      { action: 'join', communityId: communityId }
    );
    
    if (rejoinResponse.status === 400) {
      console.log('✅ Prevención de re-unión funcionando');
      console.log('📋 Mensaje:', rejoinResponse.data.error);
    } else {
      console.log('❌ Prevención de re-unión no funcionando');
    }
    
    console.log('\n🎉 === PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testExpulsion();
