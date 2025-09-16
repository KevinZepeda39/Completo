// check-users-communities.js - Verificar usuarios y comunidades existentes
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

async function checkUsersAndCommunities() {
  console.log('🔍 === VERIFICANDO USUARIOS Y COMUNIDADES ===\n');
  
  try {
    // 1. Verificar servidor
    console.log('1️⃣ Verificando servidor...');
    const testResponse = await makeRequest('/api/test');
    if (testResponse.status !== 200) {
      throw new Error('Servidor no responde');
    }
    console.log('✅ Servidor funcionando\n');

    // 2. Obtener usuarios (usar un ID conocido)
    console.log('2️⃣ Verificando usuarios...');
    
    // Probar con diferentes IDs de usuario
    const testUserIds = [1, 143, 156, 200, 300];
    
    for (const userId of testUserIds) {
      try {
        const userResponse = await makeRequest(
          `/api/users/${userId}`,
          'GET',
          { 'x-user-id': userId.toString() }
        );
        
        if (userResponse.status === 200) {
          console.log(`✅ Usuario ${userId} existe:`, userResponse.data.user?.nombre || 'Sin nombre');
        } else {
          console.log(`❌ Usuario ${userId} no existe o error:`, userResponse.status);
        }
      } catch (error) {
        console.log(`⚠️ Error verificando usuario ${userId}:`, error.message);
      }
    }
    
    console.log('\n3️⃣ Verificando comunidades...');
    
    // 3. Obtener todas las comunidades
    try {
      const communitiesResponse = await makeRequest('/api/communities');
      
      if (communitiesResponse.status === 200) {
        const communities = communitiesResponse.data.communities || [];
        console.log(`✅ Encontradas ${communities.length} comunidades:`);
        
        communities.slice(0, 5).forEach(community => {
          console.log(`   🏘️ ID: ${community.id}, Nombre: "${community.name}", Creador: ${community.creadorId}`);
        });
        
        if (communities.length > 5) {
          console.log(`   ... y ${communities.length - 5} más`);
        }
      } else {
        console.log('❌ Error obteniendo comunidades:', communitiesResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Error verificando comunidades:', error.message);
    }
    
    console.log('\n4️⃣ Verificando endpoint de expulsión...');
    
    // 4. Verificar que el endpoint de expulsión existe
    try {
      // Intentar hacer una petición OPTIONS o verificar que el endpoint responde
      const expelCheckResponse = await makeRequest('/api/communities/1/expel', 'POST', { 'x-user-id': '1' }, { userIdToExpel: 999 });
      
      if (expelCheckResponse.status === 400 || expelCheckResponse.status === 401 || expelCheckResponse.status === 403) {
        console.log('✅ Endpoint de expulsión existe y responde correctamente');
      } else {
        console.log('⚠️ Endpoint de expulsión responde con estado inesperado:', expelCheckResponse.status);
      }
    } catch (error) {
      console.log('⚠️ Error verificando endpoint de expulsión:', error.message);
    }
    
    console.log('\n🎉 === VERIFICACIÓN COMPLETADA ===');
    console.log('\n💡 Para probar la expulsión, usa los IDs reales de arriba');
    console.log('💡 Ejemplo: Si usuario 143 es creador de comunidad 71, puedes expulsar usuario 156');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar verificación
checkUsersAndCommunities();
