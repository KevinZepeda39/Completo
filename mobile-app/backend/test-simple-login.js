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

// Función principal de test
async function testSimpleLogin() {
  console.log('🔍 === TEST SIMPLE LOGIN ===\n');
  
  try {
    // Intentar login
    console.log('🔐 Attempting login...');
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
    
    // Análisis
    console.log('\n📊 === ANALYSIS ===');
    
    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ SUCCESS: Login successful');
      console.log('🎯 Backend is working correctly');
      console.log('🔍 The issue is in the frontend mobile app');
      console.log('💡 Check the mobile app logs for authentication state changes');
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ PROBLEM: Login requires verification');
      console.log('🔍 User email is not verified');
    } else {
      console.log('❌ UNEXPECTED: Login failed');
      console.log('🔍 Status:', loginResponse.status);
      console.log('🔍 Response:', loginResponse.data);
    }
    
    console.log('\n🎯 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log('💡 IMPORTANTE: Update TEST_EMAIL and TEST_PASSWORD with valid credentials\n');
  
  testSimpleLogin();
}

module.exports = { testSimpleLogin };
