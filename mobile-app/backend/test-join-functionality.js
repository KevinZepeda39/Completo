const http = require('http');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'miciudadsv'
};

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
async function testJoinFunctionality() {
  console.log('🧪 === PROBANDO FUNCIONALIDAD DE UNIRSE ===\n');

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

    // 2. Probar con diferentes usuarios
    const testUsers = [156, 143, 58]; // Usuarios de prueba
    
    for (const userId of testUsers) {
      console.log(`\n2️⃣ Probando con usuario ID: ${userId}`);
      
      // Obtener comunidades para este usuario
      const communitiesResponse = await makeRequest('/api/communities', 'GET', {
        'x-user-id': userId.toString()
      });
      
      if (communitiesResponse.status === 200 && communitiesResponse.data.success) {
        const communities = communitiesResponse.data.communities || [];
        console.log(`   ✅ Comunidades obtenidas: ${communities.length}`);
        
        if (communities.length > 0) {
          const firstCommunity = communities[0];
          console.log(`   🏘️ Probando con comunidad: ${firstCommunity.titulo} (ID: ${firstCommunity.id})`);
          console.log(`      - isJoined: ${firstCommunity.isJoined}`);
          console.log(`      - isCreator: ${firstCommunity.isCreator}`);
          
          // Intentar unirse a la comunidad
          const joinResponse = await makeRequest('/api/communities/action', 'POST', {
            'x-user-id': userId.toString()
          }, {
            action: 'join',
            communityId: firstCommunity.id
          });
          
          console.log(`   🔗 Respuesta de unirse: ${joinResponse.status}`);
          if (joinResponse.status === 200) {
            console.log(`      ✅ Unirse exitoso: ${joinResponse.data.message}`);
          } else {
            console.log(`      ❌ Error al unirse: ${joinResponse.data?.error || 'Error desconocido'}`);
          }
          
          // Verificar estado después de unirse
          const updatedCommunitiesResponse = await makeRequest('/api/communities', 'GET', {
            'x-user-id': userId.toString()
          });
          
          if (updatedCommunitiesResponse.status === 200 && updatedCommunitiesResponse.data.success) {
            const updatedCommunities = updatedCommunitiesResponse.data.communities || [];
            const updatedCommunity = updatedCommunities.find(c => c.id === firstCommunity.id);
            
            if (updatedCommunity) {
              console.log(`   📊 Estado después de unirse:`);
              console.log(`      - isJoined: ${updatedCommunity.isJoined}`);
              console.log(`      - isCreator: ${updatedCommunity.isCreator}`);
            }
          }
        }
      } else {
        console.log(`   ❌ Error obteniendo comunidades: ${communitiesResponse.status}`);
        if (communitiesResponse.data?.error) {
          console.log(`      Error: ${communitiesResponse.data.error}`);
        }
      }
    }

    // 3. Probar endpoint específico de toggleMembership
    console.log('\n3️⃣ Probando endpoint toggleMembership directamente...');
    const testUserId = 156;
    const testCommunityId = 71; // Vilarreal
    
    const directJoinResponse = await makeRequest('/api/communities/action', 'POST', {
      'x-user-id': testUserId.toString()
    }, {
      action: 'join',
      communityId: testCommunityId
    });
    
    console.log(`   🔗 Respuesta directa: ${directJoinResponse.status}`);
    if (directJoinResponse.status === 200) {
      console.log(`      ✅ Unirse directo exitoso: ${directJoinResponse.data.message}`);
      console.log(`      📋 Datos completos:`, JSON.stringify(directJoinResponse.data, null, 2));
    } else {
      console.log(`      ❌ Error en unirse directo: ${directJoinResponse.data?.error || 'Error desconocido'}`);
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testJoinFunctionality();
