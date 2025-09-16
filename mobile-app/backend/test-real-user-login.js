const http = require('http');

// Credenciales de un usuario real que ya esté verificado
const REAL_EMAIL = 'test@example.com'; // Cambiar por un email real verificado
const REAL_PASSWORD = 'test123'; // Cambiar por la contraseña real

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
async function testRealUserLogin() {
  console.log('🔍 === TEST REAL USER LOGIN ===\n');
  
  try {
    // Paso 1: Verificar estado del usuario en la BD
    console.log('🔍 Step 1: Checking user status in database...');
    const userStatus = await checkUserStatus(REAL_EMAIL);
    
    if (!userStatus) {
      console.log('❌ User not found in database');
      console.log('💡 Please update REAL_EMAIL with a valid email address');
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
    
    // Paso 2: Intentar login
    console.log('\n🔐 Step 2: Attempting login...');
    const loginData = {
      email: REAL_EMAIL,
      password: REAL_PASSWORD
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
    
    // Paso 3: Análisis
    console.log('\n📊 === ANALYSIS ===');
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ SUCCESS: Login successful');
      console.log('🎯 User should be redirected to home screen');
      console.log('🔍 Response indicates no verification required');
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
    
    console.log('\n🎯 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log('💡 IMPORTANTE: Update REAL_EMAIL and REAL_PASSWORD with valid credentials');
  console.log('💡 This test requires a user that has already been verified\n');
  
  testRealUserLogin();
}

module.exports = { testRealUserLogin };
