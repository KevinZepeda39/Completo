// test-real-frontend.js
// Script para probar el comportamiento real del frontend con el nuevo método

const http = require('http');

// Simular el usuario que vendría del useAuth hook
const mockUseAuthUser = {
  idUsuario: 1,
  nombre: 'Usuario Real',
  correo: 'usuario@test.com',
  emailVerificado: true
};

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

// Simular el nuevo método del servicio
const getUserExpulsionNotificationsWithUser = async (authenticatedUser) => {
  try {
    console.log('🔍 === OBTENIENDO HEADERS CON USUARIO DEL HOOK ===');
    
    if (!authenticatedUser || !authenticatedUser.idUsuario) {
      console.error('❌ Usuario del hook inválido:', authenticatedUser);
      throw new Error('Usuario no autenticado - Usuario del hook inválido');
    }
    
    console.log('✅ Usuario del hook válido:', authenticatedUser.idUsuario);
    
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': authenticatedUser.idUsuario.toString()
    };
    
    console.log('🔔 Obteniendo notificaciones con usuario del hook:', headers);
    
    const response = await makeRequest('/api/notifications/user-expelled', 'GET', headers);
    
    if (response.status !== 200) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error desconocido');
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones con usuario del hook:', error);
    throw error;
  }
};

// Función para probar el comportamiento real
const testRealFrontend = async () => {
  console.log('🧪 === PRUEBAS DEL FRONTEND REAL ===\n');

  try {
    // 1. Probar con usuario válido del hook
    console.log('1️⃣ Probando con usuario válido del useAuth hook...');
    try {
      const result = await getUserExpulsionNotificationsWithUser(mockUseAuthUser);
      console.log('   ✅ Éxito!');
      console.log('   Status: 200');
      console.log('   Response:', result);
      console.log('   Notificaciones:', result.notifications.length);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 2. Probar con usuario inválido (sin idUsuario)
    console.log('\n2️⃣ Probando con usuario inválido (sin idUsuario)...');
    try {
      const invalidUser = { nombre: 'Usuario Inválido', correo: 'test@test.com' };
      const result = await getUserExpulsionNotificationsWithUser(invalidUser);
      console.log('   ✅ Éxito (no debería llegar aquí):', result);
    } catch (error) {
      console.log('   ❌ Error esperado:', error.message);
    }

    // 3. Probar con usuario null
    console.log('\n3️⃣ Probando con usuario null...');
    try {
      const result = await getUserExpulsionNotificationsWithUser(null);
      console.log('   ✅ Éxito (no debería llegar aquí):', result);
    } catch (error) {
      console.log('   ❌ Error esperado:', error.message);
    }

    // 4. Probar con usuario undefined
    console.log('\n4️⃣ Probando con usuario undefined...');
    try {
      const result = await getUserExpulsionNotificationsWithUser(undefined);
      console.log('   ✅ Éxito (no debería llegar aquí):', result);
    } catch (error) {
      console.log('   ❌ Error esperado:', error.message);
    }

    // 5. Probar con diferentes IDs de usuario
    console.log('\n5️⃣ Probando con diferentes IDs de usuario...');
    const testUsers = [
      { idUsuario: 1, nombre: 'Usuario 1', correo: 'user1@test.com' },
      { idUsuario: 2, nombre: 'Usuario 2', correo: 'user2@test.com' },
      { idUsuario: 3, nombre: 'Usuario 3', correo: 'user3@test.com' }
    ];

    for (const testUser of testUsers) {
      try {
        console.log(`   Probando usuario ${testUser.idUsuario}...`);
        const result = await getUserExpulsionNotificationsWithUser(testUser);
        console.log(`   ✅ Usuario ${testUser.idUsuario}: ${result.notifications.length} notificaciones`);
      } catch (error) {
        console.log(`   ❌ Usuario ${testUser.idUsuario}: ${error.message}`);
      }
    }

    console.log('\n✅ === PRUEBAS COMPLETADAS ===');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
};

// Ejecutar pruebas
testRealFrontend();
