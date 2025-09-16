const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 1; // Usuario que será expulsado
const COMMUNITY_ID = 71; // Comunidad de prueba

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID.toString(),
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
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
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
}

// Función principal de prueba
async function testExpulsionSystem() {
  console.log('🧪 === PRUEBA DEL SISTEMA DE EXPULSIÓN ===\n');

  try {
    // 1. Verificar estado inicial del usuario
    console.log('1️⃣ Verificando estado inicial del usuario...');
    const initialCommunities = await makeRequest('/api/communities');
    console.log('✅ Comunidades iniciales:', initialCommunities.status);
    
    if (initialCommunities.status === 200) {
      const communities = initialCommunities.data;
      const targetCommunity = communities.find(c => c.id === COMMUNITY_ID);
      
      if (targetCommunity) {
        console.log(`📋 Comunidad ${COMMUNITY_ID}:`);
        console.log(`   - Nombre: ${targetCommunity.name}`);
        console.log(`   - isJoined: ${targetCommunity.isJoined}`);
        console.log(`   - isExpelled: ${targetCommunity.isExpelled || false}`);
        console.log(`   - ExpulsionReason: ${targetCommunity.expulsionReason || 'N/A'}`);
        console.log(`   - ExpulsionDate: ${targetCommunity.expulsionDate || 'N/A'}`);
      }
    }

    // 2. Verificar si el usuario ya está expulsado
    console.log('\n2️⃣ Verificando si el usuario ya está expulsado...');
    const expelledCheck = await makeRequest(`/api/communities/${COMMUNITY_ID}/check-expulsion`);
    console.log('✅ Verificación de expulsión:', expelledCheck.status);
    
    if (expelledCheck.status === 200) {
      console.log('📋 Estado de expulsión:', expelledCheck.data);
    }

    // 3. Verificar notificaciones de expulsión
    console.log('\n3️⃣ Verificando notificaciones de expulsión...');
    const expulsionNotifications = await makeRequest('/api/notifications/user-expelled');
    console.log('✅ Notificaciones de expulsión:', expulsionNotifications.status);
    
    if (expulsionNotifications.status === 200) {
      const notifications = expulsionNotifications.data;
      console.log(`📋 Notificaciones encontradas: ${notifications.length}`);
      
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title}`);
        console.log(`      Mensaje: ${notification.body}`);
        console.log(`      Fecha: ${notification.sentAt}`);
        console.log(`      Tipo: ${notification.data?.type || 'N/A'}`);
      });
    }

    // 4. Verificar todas las notificaciones del usuario
    console.log('\n4️⃣ Verificando todas las notificaciones del usuario...');
    const allNotifications = await makeRequest('/api/notifications/unread');
    console.log('✅ Todas las notificaciones:', allNotifications.status);
    
    if (allNotifications.status === 200) {
      const notifications = allNotifications.data;
      console.log(`📋 Total de notificaciones: ${notifications.length}`);
      
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title}`);
        console.log(`      Mensaje: ${notification.body}`);
        console.log(`      Fecha: ${notification.sentAt}`);
        console.log(`      Estado: ${notification.status}`);
      });
    }

    console.log('\n✅ === PRUEBA COMPLETADA ===');
    console.log('\n📱 En el frontend, el usuario expulsado debería ver:');
    console.log('   - No botón "Unirse"');
    console.log('   - Indicador "Acceso Restringido" en rojo');
    console.log('   - Notificación de expulsión en la pantalla de notificaciones');
    console.log('   - No errores en pantalla');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testExpulsionSystem();
