// test-frontend-auth.js
// Script para probar la autenticación del frontend simulando AsyncStorage

const http = require('http');

// Simular AsyncStorage del frontend
const mockAsyncStorage = {
  userSession: null,
  user: null,
  currentUser: null,
  token: null
};

// Función para simular login exitoso
const simulateLogin = (userId, userName, userEmail) => {
  console.log(`🔐 === SIMULANDO LOGIN PARA USUARIO ${userId} ===`);
  
  // Simular datos que se guardarían en AsyncStorage
  const userData = {
    idUsuario: userId,
    nombre: userName,
    correo: userEmail,
    emailVerificado: true
  };
  
  const sessionData = {
    user: userData,
    token: `mock-token-${userId}`,
    loginTime: new Date().toISOString()
  };
  
  // Guardar en "AsyncStorage" simulado
  mockAsyncStorage.userSession = JSON.stringify(sessionData);
  mockAsyncStorage.user = JSON.stringify(userData);
  mockAsyncStorage.token = `mock-token-${userId}`;
  
  console.log('✅ Login simulado exitosamente');
  console.log('📱 AsyncStorage simulado:', {
    userSession: !!mockAsyncStorage.userSession,
    user: !!mockAsyncStorage.user,
    token: !!mockAsyncStorage.token
  });
};

// Función para simular logout
const simulateLogout = () => {
  console.log('🚪 === SIMULANDO LOGOUT ===');
  mockAsyncStorage.userSession = null;
  mockAsyncStorage.user = null;
  mockAsyncStorage.currentUser = null;
  mockAsyncStorage.token = null;
  console.log('✅ Logout simulado exitosamente');
};

// Función para obtener headers de autenticación (simulando el servicio)
const getAuthHeaders = async () => {
  try {
    console.log('🔍 === OBTENIENDO HEADERS DE AUTENTICACIÓN ===');
    
    let currentUser = null;
    
    // 1️⃣ PRIORIZAR userSession
    if (mockAsyncStorage.userSession) {
      try {
        const session = JSON.parse(mockAsyncStorage.userSession);
        if (session.user && session.user.idUsuario) {
          currentUser = session.user;
          console.log('✅ Usuario obtenido de userSession:', currentUser.idUsuario);
        }
      } catch (e) {
        console.log('⚠️ Error parseando userSession:', e.message);
      }
    }
    
    // 2️⃣ FALLBACK: usar user
    if (!currentUser && mockAsyncStorage.user) {
      try {
        const user = JSON.parse(mockAsyncStorage.user);
        if (user.idUsuario) {
          currentUser = user;
          console.log('✅ Usuario obtenido de user:', currentUser.idUsuario);
        }
      } catch (e) {
        console.log('⚠️ Error parseando user:', e.message);
      }
    }
    
    // 3️⃣ VERIFICAR QUE TENEMOS UN USUARIO VÁLIDO
    if (!currentUser || !currentUser.idUsuario) {
      console.error('❌ No se pudo obtener usuario válido');
      throw new Error('Usuario no autenticado - No se encontró ID de usuario válido');
    }
    
    console.log('✅ Usuario autenticado correctamente:', currentUser.idUsuario);
    
    return {
      'Content-Type': 'application/json',
      'x-user-id': currentUser.idUsuario.toString()
    };
  } catch (error) {
    console.error('❌ Error obteniendo headers de autenticación:', error);
    throw error;
  }
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

// Función para probar el servicio completo
const testService = async () => {
  console.log('🧪 === PRUEBAS DEL SERVICIO DE NOTIFICACIONES ===\n');

  try {
    // 1. Probar sin autenticación
    console.log('1️⃣ Probando sin autenticación...');
    try {
      const response = await makeRequest('/api/notifications/user-expelled');
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 2. Simular login del usuario 1
    console.log('\n2️⃣ Simulando login del usuario 1...');
    simulateLogin(1, 'Usuario Uno', 'usuario1@test.com');
    
    try {
      const headers = await getAuthHeaders();
      console.log('   Headers obtenidos:', headers);
      
      const response = await makeRequest('/api/notifications/user-expelled', 'GET', headers);
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 3. Simular login del usuario 2
    console.log('\n3️⃣ Simulando login del usuario 2...');
    simulateLogin(2, 'Usuario Dos', 'usuario2@test.com');
    
    try {
      const headers = await getAuthHeaders();
      console.log('   Headers obtenidos:', headers);
      
      const response = await makeRequest('/api/notifications/user-expelled', 'GET', headers);
      console.log('   Status:', response.status);
      console.log('   Response:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 4. Probar logout
    console.log('\n4️⃣ Probando logout...');
    simulateLogout();
    
    try {
      const headers = await getAuthHeaders();
      console.log('   Headers obtenidos:', headers);
    } catch (error) {
      console.log('   ❌ Error esperado después del logout:', error.message);
    }

    // 5. Probar endpoint después del logout
    console.log('\n5️⃣ Probando endpoint después del logout...');
    try {
      const response = await makeRequest('/api/notifications/user-expelled');
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
testService();
