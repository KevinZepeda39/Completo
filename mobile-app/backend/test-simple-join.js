const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
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
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData
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

// Función principal de prueba
async function testSimpleJoin() {
  console.log('🧪 === PRUEBA SIMPLE DE UNIRSE ===\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('1️⃣ Verificando servidor...');
    const healthCheck = await makeRequest('/api/test');
    console.log(`   Status: ${healthCheck.status}`);
    if (healthCheck.status === 200) {
      console.log('   ✅ Servidor funcionando correctamente');
    } else {
      console.log('   ❌ Servidor no responde correctamente');
      return;
    }

    // 2. Probar unirse a una comunidad con usuario 156
    console.log('\n2️⃣ Probando unirse a comunidad con usuario 156...');
    const testUserId = 156;
    const testCommunityId = 71; // Vilarreal
    
    const joinResponse = await makeRequest('/api/communities/action', 'POST', {
      'x-user-id': testUserId.toString()
    }, {
      action: 'join',
      communityId: testCommunityId
    });
    
    console.log(`   🔗 Respuesta de unirse: ${joinResponse.status}`);
    if (joinResponse.status === 200) {
      console.log(`      ✅ Unirse exitoso: ${joinResponse.data.message}`);
      console.log(`      📋 Datos completos:`, JSON.stringify(joinResponse.data, null, 2));
    } else {
      console.log(`      ❌ Error al unirse: ${joinResponse.data?.error || 'Error desconocido'}`);
    }

    // 3. Verificar estado después de unirse
    console.log('\n3️⃣ Verificando estado después de unirse...');
    const communitiesResponse = await makeRequest('/api/communities', 'GET', {
      'x-user-id': testUserId.toString()
    });
    
    if (communitiesResponse.status === 200 && communitiesResponse.data.success) {
      const communities = communitiesResponse.data.communities || [];
      const targetCommunity = communities.find(c => c.id === testCommunityId);
      
      if (targetCommunity) {
        console.log(`   🏘️ Comunidad ${targetCommunity.titulo} (ID: ${targetCommunity.id}):`);
        console.log(`      - isJoined: ${targetCommunity.isJoined}`);
        console.log(`      - isCreator: ${targetCommunity.isCreator}`);
        console.log(`      - Creador ID: ${targetCommunity.creadorId}`);
        console.log(`      - Creador Nombre: ${targetCommunity.creadorNombre}`);
      } else {
        console.log(`   ❌ No se encontró la comunidad ${testCommunityId}`);
      }
    } else {
      console.log(`   ❌ Error obteniendo comunidades: ${communitiesResponse.status}`);
      if (communitiesResponse.data?.error) {
        console.log(`      Error: ${communitiesResponse.data.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testSimpleJoin();
