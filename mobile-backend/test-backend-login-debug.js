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
      SELECT idUsuario, nombre, correo, emailVerificado, codigoVerificacion, codigoExpiracion, activo
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

// Función para simular la lógica del backend
function simulateBackendLogic(user) {
  console.log('\n🔍 === SIMULANDO LÓGICA DEL BACKEND ===');
  
  // Simular la función isEmailVerified del backend
  function isEmailVerified(emailVerificado) {
    console.log('🔍 Backend isEmailVerified function called with:', emailVerificado);
    console.log('🔍 Type:', typeof emailVerificado);
    
    // Manejar diferentes tipos de datos que MySQL puede devolver
    if (emailVerificado === null || emailVerificado === undefined) {
      console.log('❌ Backend: emailVerificado is null/undefined, returning false');
      return false;
    }
    
    // CORREGIDO: Manejar específicamente el valor 1 de MySQL
    if (emailVerificado === 1 || emailVerificado === '1') {
      console.log('✅ Backend: emailVerificado === 1, returning true');
      return true;
    }
    
    // Convertir a string para comparaciones consistentes
    const value = String(emailVerificado).toLowerCase();
    console.log('🔍 Backend: String conversion:', value);
    
    // Valores que indican verificación exitosa
    const verifiedValues = ['1', 'true', 'yes', 'on'];
    const isVerified = verifiedValues.includes(value) || Boolean(emailVerificado);
    
    console.log('🔍 Backend: verifiedValues.includes(value):', verifiedValues.includes(value));
    console.log('🔍 Backend: Boolean(emailVerificado):', Boolean(emailVerificado));
    console.log('🔍 Backend: Final result:', isVerified);
    
    return isVerified;
  }
  
  console.log('👤 Simulating backend logic for user:', user.nombre);
  console.log('📧 User emailVerificado from DB:', user.emailVerificado);
  console.log('📧 User emailVerificado type:', typeof user.emailVerificado);
  
  const emailVerified = isEmailVerified(user.emailVerificado);
  
  console.log('🔍 Backend emailVerified result:', emailVerified);
  
  if (!emailVerified) {
    console.log('❌ Backend: Email not verified, would return requiresVerification: true');
    return {
      success: false,
      requiresVerification: true,
      error: 'Tu email no está verificado'
    };
  } else {
    console.log('✅ Backend: Email verified, would return success: true');
    return {
      success: true,
      requiresVerification: false,
      user: user
    };
  }
}

// Función principal de test
async function testBackendLoginDebug() {
  console.log('🔍 === TEST BACKEND LOGIN DEBUG ===\n');
  
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
      activo: userStatus.activo,
      codigoVerificacion: userStatus.codigoVerificacion ? 'EXISTS' : 'NULL',
      codigoExpiracion: userStatus.codigoExpiracion
    });
    
    // Paso 2: Simular lógica del backend
    console.log('\n🔍 Step 2: Simulating backend logic...');
    const backendSimulation = simulateBackendLogic(userStatus);
    
    console.log('\n📊 Backend simulation result:');
    console.log('  - Success:', backendSimulation.success);
    console.log('  - Requires verification:', backendSimulation.requiresVerification);
    console.log('  - Error:', backendSimulation.error);
    
    // Paso 3: Intentar login real
    console.log('\n🔐 Step 3: Attempting real login...');
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('\n📡 Real backend response:');
    console.log('  - Status:', loginResponse.status);
    console.log('  - Success:', loginResponse.data.success);
    console.log('  - Requires verification:', loginResponse.data.requiresVerification);
    console.log('  - Error:', loginResponse.data.error);
    console.log('  - User ID:', loginResponse.data.user?.idUsuario);
    console.log('  - User emailVerified:', loginResponse.data.user?.emailVerificado);
    
    // Paso 4: Análisis comparativo
    console.log('\n📊 === COMPARATIVE ANALYSIS ===');
    
    if (backendSimulation.success && loginResponse.data.success) {
      console.log('✅ MATCH: Both simulation and real backend return success');
      console.log('🎯 User should be able to login successfully');
    } else if (backendSimulation.requiresVerification && loginResponse.data.requiresVerification) {
      console.log('❌ MATCH: Both simulation and real backend require verification');
      console.log('🔍 This means the backend logic is working as expected');
      console.log('🔍 But the user is still being redirected to verification');
      console.log('💡 The issue might be in the frontend or a different part of the flow');
    } else {
      console.log('❌ MISMATCH: Simulation and real backend differ');
      console.log('🔍 Simulation result:', backendSimulation);
      console.log('🔍 Real backend result:', loginResponse.data);
      console.log('💡 This indicates a bug in the backend logic');
    }
    
    // Paso 5: Recomendaciones
    console.log('\n💡 === RECOMMENDATIONS ===');
    
    if (loginResponse.data.requiresVerification) {
      console.log('1. Backend is correctly detecting that verification is required');
      console.log('2. The issue is NOT in the backend login logic');
      console.log('3. Check the following:');
      console.log('   - Is the user actually verified in the database?');
      console.log('   - Are there multiple users with the same email?');
      console.log('   - Is there a database connection issue?');
      console.log('   - Are the credentials correct?');
    } else {
      console.log('1. Backend login is working correctly');
      console.log('2. The issue is in the frontend or elsewhere');
      console.log('3. Check the frontend authentication flow');
    }
    
    console.log('\n🎯 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log('💡 IMPORTANTE: Update TEST_EMAIL and TEST_PASSWORD with valid credentials\n');
  
  testBackendLoginDebug();
}

module.exports = { testBackendLoginDebug };
