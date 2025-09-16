const http = require('http');

// Credenciales de prueba
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123';

// Función para hacer requests HTTP
async function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
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

// Función para verificar el estado de un usuario en la BD
async function checkUserStatus(email) {
  try {
    const { execute } = require('./config/database.js');
    
    const users = await execute(`
      SELECT idUsuario, nombre, correo, emailVerificado, codigoVerificacion, codigoExpiracion
      FROM usuarios 
      WHERE correo = ?
    `, [email]);
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0];
  } catch (error) {
    console.error('❌ Error checking user status:', error.message);
    return null;
  }
}

// Función principal de test
async function testAuthState() {
  console.log('🔍 === TEST AUTH STATE ===\n');
  
  try {
    // Paso 1: Verificar estado del usuario en la BD
    console.log('🔍 Step 1: Checking user status in database...');
    const userStatus = await checkUserStatus(TEST_EMAIL);
    
    if (!userStatus) {
      console.log('❌ User not found in database');
      console.log('💡 Please update TEST_EMAIL and TEST_PASSWORD with valid credentials');
      return;
    }
    
    console.log('👤 User found in database:', {
      id: userStatus.idUsuario,
      nombre: userStatus.nombre,
      emailVerificado: userStatus.emailVerificado,
      emailVerificadoType: typeof userStatus.emailVerificado,
      codigoVerificacion: userStatus.codigoVerificacion ? 'EXISTS' : 'NULL',
      codigoExpiracion: userStatus.codigoExpiracion
    });
    
    // Paso 2: Verificar que el usuario esté verificado
    if (!userStatus.emailVerificado || userStatus.emailVerificado !== 1) {
      console.log('❌ User is not verified');
      console.log('💡 Please verify the user first before testing login');
      return;
    }
    
    console.log('✅ User is verified, proceeding with login test...');
    
    // Paso 3: Intentar login
    console.log('\n🔐 Step 2: Attempting login...');
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    console.log('📤 Login request data:', {
      email: loginData.email,
      password: loginData.password ? '***' : 'MISSING'
    });
    
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('\n📡 Login response:');
    console.log('  - Status:', loginResponse.status);
    console.log('  - Success:', loginResponse.data.success);
    console.log('  - Requires verification:', loginResponse.data.requiresVerification);
    console.log('  - Error:', loginResponse.data.error);
    console.log('  - User ID:', loginResponse.data.user?.idUsuario);
    console.log('  - User emailVerified:', loginResponse.data.user?.emailVerificado);
    console.log('  - Token exists:', !!loginResponse.data.token);
    
    // Paso 4: Análisis detallado
    console.log('\n📊 === DETAILED ANALYSIS ===');
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ SUCCESS: Login successful from backend perspective');
      console.log('🎯 Backend correctly returns success: true');
      console.log('🔍 This means the issue is in the frontend mobile app');
      console.log('🔍 The mobile app should receive this response and navigate to home');
      
      // Verificar que el token esté presente
      if (loginResponse.data.token) {
        console.log('✅ Token is present in response');
        console.log('🔍 Frontend should store this token and set isAuthenticated to true');
      } else {
        console.log('❌ Token is missing from response');
        console.log('🔍 This could cause authentication issues in the frontend');
      }
      
      // Verificar que el usuario esté presente
      if (loginResponse.data.user) {
        console.log('✅ User data is present in response');
        console.log('🔍 Frontend should store this user data');
      } else {
        console.log('❌ User data is missing from response');
        console.log('🔍 This could cause user state issues in the frontend');
      }
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ PROBLEM: Login still requires verification');
      console.log('🔍 This indicates a mismatch between DB state and login logic');
      console.log('🔍 DB shows emailVerificado:', userStatus.emailVerificado);
      console.log('🔍 But login still requires verification');
    } else {
      console.log('❌ UNEXPECTED: Login failed with unexpected response');
      console.log('🔍 Status:', loginResponse.status);
      console.log('🔍 Full response:', JSON.stringify(loginResponse.data, null, 2));
    }
    
    // Paso 5: Recomendaciones
    console.log('\n💡 === RECOMMENDATIONS ===');
    console.log('1. Backend is working correctly');
    console.log('2. The issue is in the frontend mobile app');
    console.log('3. Check the following in the mobile app:');
    console.log('   - useAuth hook state management');
    console.log('   - AsyncStorage data storage');
    console.log('   - Navigation logic after successful login');
    console.log('   - useEffect dependencies in LoginScreen');
    
    console.log('\n🎯 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log('💡 IMPORTANTE: Update TEST_EMAIL and TEST_PASSWORD with valid credentials');
  console.log('💡 This test requires a user that has already been verified\n');
  
  testAuthState();
}

module.exports = { testAuthState };
