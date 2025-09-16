const http = require('http');

// Configuración
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
async function testSilentExpulsion() {
  console.log('🧪 === PRUEBA DEL SISTEMA DE EXPULSIÓN SILENCIOSO ===\n');

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
      }
    }

    // 2. Intentar unirse a la comunidad (debería fallar silenciosamente si está expulsado)
    console.log('\n2️⃣ Intentando unirse a la comunidad...');
    const joinResponse = await makeRequest('/api/communities/action', 'POST', {
      action: 'join',
      communityId: COMMUNITY_ID
    });
    
    console.log('✅ Respuesta del join:', joinResponse.status);
    
    if (joinResponse.status === 200) {
      const result = joinResponse.data;
      console.log('📋 Resultado del join:');
      console.log(`   - Mensaje: ${result.message}`);
      console.log(`   - isExpelled: ${result.isExpelled || false}`);
      
      if (result.isExpelled) {
        console.log('✅ ✅ SISTEMA FUNCIONANDO CORRECTAMENTE:');
        console.log('   - Usuario expulsado detectado');
        console.log('   - No se generó error');
        console.log('   - Respuesta silenciosa enviada');
        console.log('   - En el frontend se mostrará "Acceso Restringido"');
      } else {
        console.log('⚠️ Usuario no está expulsado, puede unirse normalmente');
      }
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
      });
    }

    console.log('\n✅ === PRUEBA COMPLETADA ===');
    console.log('\n📱 RESULTADO ESPERADO EN EL FRONTEND:');
    console.log('   ✅ No se muestra ningún error en pantalla');
    console.log('   ✅ No aparece botón "Unirse"');
    console.log('   ✅ Se muestra "Acceso Restringido" en rojo');
    console.log('   ✅ La experiencia es completamente silenciosa');
    console.log('   ✅ El usuario entiende que no puede unirse');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testSilentExpulsion();
