const http = require('http');

const BASE_URL = 'http://localhost:3000';
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

// Función para limpiar usuario de prueba
async function cleanupTestUser(email) {
  try {
    const { execute } = require('./config/database.js');
    
    await execute('DELETE FROM usuarios WHERE correo = ?', [email]);
    console.log('🧹 Test user cleaned up');
  } catch (error) {
    console.log('⚠️ Could not cleanup test user:', error.message);
  }
}

// Función principal de debug
async function debugVerificationFlow() {
  console.log('🔍 === DEBUG VERIFICATION FLOW ===\n');
  
  try {
    // Paso 1: Limpiar usuario de prueba anterior
    console.log('🧹 Step 1: Cleaning up previous test user...');
    await cleanupTestUser(TEST_EMAIL);
    
    // Paso 2: Registrar nuevo usuario
    console.log('\n📝 Step 2: Registering new user...');
    const registerData = {
      nombre: 'Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    const registerResponse = await makeRequest('/api/auth/register', 'POST', registerData);
    console.log('📡 Register response status:', registerResponse.status);
    console.log('📦 Register response data:', registerResponse.data);
    
    if (registerResponse.status !== 201) {
      throw new Error(`Registration failed with status ${registerResponse.status}`);
    }
    
    // Paso 3: Verificar estado del usuario después del registro
    console.log('\n🔍 Step 3: Checking user status after registration...');
    let userStatus = await checkUserStatus(TEST_EMAIL);
    if (userStatus) {
      console.log('👤 User in database:', {
        id: userStatus.idUsuario,
        nombre: userStatus.nombre,
        emailVerificado: userStatus.emailVerificado,
        codigoVerificacion: userStatus.codigoVerificacion ? 'EXISTS' : 'NULL',
        codigoExpiracion: userStatus.codigoExpiracion
      });
    }
    
    // Paso 4: Obtener código de verificación de la BD
    console.log('\n🔐 Step 4: Getting verification code from database...');
    const { execute } = require('./config/database.js');
    
    const users = await execute(`
      SELECT codigoVerificacion, codigoExpiracion 
      FROM usuarios 
      WHERE correo = ?
    `, [TEST_EMAIL]);
    
    if (users.length === 0) {
      throw new Error('User not found after registration');
    }
    
    const user = users[0];
    const verificationCode = user.codigoVerificacion;
    
    if (!verificationCode) {
      throw new Error('No verification code found');
    }
    
    console.log('🔐 Verification code from DB:', verificationCode);
    console.log('⏰ Expires at:', user.codigoExpiracion);
    
    // Paso 5: Verificar el código
    console.log('\n✅ Step 5: Verifying the code...');
    const verifyData = {
      email: TEST_EMAIL,
      code: verificationCode
    };
    
    const verifyResponse = await makeRequest('/api/auth/verify-code', 'POST', verifyData);
    console.log('📡 Verify response status:', verifyResponse.status);
    console.log('📦 Verify response data:', verifyResponse.data);
    
    if (verifyResponse.status !== 200) {
      throw new Error(`Verification failed with status ${verifyResponse.status}`);
    }
    
    // Paso 6: Verificar estado del usuario después de la verificación
    console.log('\n🔍 Step 6: Checking user status after verification...');
    userStatus = await checkUserStatus(TEST_EMAIL);
    if (userStatus) {
      console.log('👤 User in database after verification:', {
        id: userStatus.idUsuario,
        nombre: userStatus.nombre,
        emailVerificado: userStatus.emailVerificado,
        codigoVerificacion: userStatus.codigoVerificacion ? 'EXISTS' : 'NULL',
        codigoExpiracion: userStatus.codigoExpiracion
      });
    }
    
    // Paso 7: Intentar login inmediatamente después de verificación
    console.log('\n🔐 Step 7: Attempting login after verification...');
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', loginResponse.data);
    
    // Paso 8: Análisis del resultado
    console.log('\n📊 === ANALYSIS ===');
    if (loginResponse.status === 200) {
      console.log('✅ SUCCESS: Login successful after verification');
      console.log('🎯 User should be redirected to home screen');
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ PROBLEM: Login still requires verification');
      console.log('🔍 This indicates the verification did not properly update the database');
      console.log('🔍 Or there is a logic error in the isEmailVerified function');
    } else {
      console.log('❌ UNEXPECTED: Login failed with unexpected status');
      console.log('🔍 Status:', loginResponse.status);
      console.log('🔍 Response:', loginResponse.data);
    }
    
    // Paso 9: Verificación final del estado
    console.log('\n🔍 Step 9: Final user status check...');
    userStatus = await checkUserStatus(TEST_EMAIL);
    if (userStatus) {
      console.log('👤 Final user status:', {
        id: userStatus.idUsuario,
        nombre: userStatus.nombre,
        emailVerificado: userStatus.emailVerificado,
        emailVerificadoType: typeof userStatus.emailVerificado,
        emailVerificadoEquals1: userStatus.emailVerificado === 1,
        emailVerificadoEqualsTrue: userStatus.emailVerificado === true,
        emailVerificadoEqualsString1: userStatus.emailVerificado === '1'
      });
    }
    
    console.log('\n🎯 === DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el debug
if (require.main === module) {
  debugVerificationFlow();
}

module.exports = { debugVerificationFlow };
