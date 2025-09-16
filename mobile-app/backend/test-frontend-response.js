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

// Función para simular exactamente lo que hace el frontend
function simulateFrontendLogic(backendResponse) {
  console.log('\n🔍 === SIMULANDO LÓGICA DEL FRONTEND ===');
  
  // Simular authService.login logic
  console.log('📱 Frontend authService.login processing...');
  
  // Verificar primero si la respuesta es exitosa (como corregimos)
  if (backendResponse.data.success && backendResponse.data.user) {
    console.log('✅ Frontend: Login successful from backend response');
    console.log('🎯 Frontend: Returning success response to useAuth hook');
    return {
      success: true,
      user: backendResponse.data.user,
      token: backendResponse.data.token
    };
  }

  // Solo manejar requiresVerification si el backend explícitamente lo indica
  if (backendResponse.status === 403 && backendResponse.data.requiresVerification === true) {
    console.log('⚠️ Frontend: Email verification required (explicitly from backend)');
    return {
      success: false,
      requiresVerification: true,
      user: backendResponse.data.user,
      verification: backendResponse.data.verification,
      error: backendResponse.data.error
    };
  }

  // Si no es exitoso y no requiere verificación, es un error
  if (!backendResponse.status.toString().startsWith('2')) {
    console.log('❌ Frontend: Login failed, throwing error');
    throw new Error(backendResponse.data.error || 'Error en el login');
  }

  // Fallback
  console.log('❌ Frontend: Unexpected response, throwing error');
  throw new Error(backendResponse.data.error || 'Login failed - unexpected response');
}

// Función principal de test
async function testFrontendResponse() {
  console.log('🔍 === TEST FRONTEND RESPONSE ===\n');
  
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
    
    const backendResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('\n📡 Backend response (raw):');
    console.log('  - Status:', backendResponse.status);
    console.log('  - Success:', backendResponse.data.success);
    console.log('  - Requires verification:', backendResponse.data.requiresVerification);
    console.log('  - Error:', backendResponse.data.error);
    console.log('  - User ID:', backendResponse.data.user?.idUsuario);
    console.log('  - User emailVerified:', backendResponse.data.user?.emailVerificado);
    console.log('  - Token exists:', !!backendResponse.data.token);
    
    // Simular exactamente lo que hace el frontend
    const frontendResult = simulateFrontendLogic(backendResponse);
    
    console.log('\n📱 Frontend result (what useAuth hook receives):');
    console.log('  - Success:', frontendResult.success);
    console.log('  - Requires verification:', frontendResult.requiresVerification);
    console.log('  - User exists:', !!frontendResult.user);
    console.log('  - Token exists:', !!frontendResult.token);
    
    // Análisis final
    console.log('\n📊 === FINAL ANALYSIS ===');
    
    if (frontendResult.success) {
      console.log('✅ SUCCESS: Frontend will proceed to home screen');
      console.log('🎯 No verification required, user should be authenticated');
    } else if (frontendResult.requiresVerification) {
      console.log('❌ PROBLEM: Frontend thinks verification is required');
      console.log('🔍 This explains why user is redirected to verification screen');
      console.log('💡 Check if backend is sending requiresVerification: true somewhere');
    } else {
      console.log('❌ UNEXPECTED: Frontend received unexpected response');
      console.log('🔍 Response:', frontendResult);
    }
    
    console.log('\n🎯 === TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log('💡 IMPORTANTE: Update TEST_EMAIL and TEST_PASSWORD with valid credentials\n');
  
  testFrontendResponse();
}

module.exports = { testFrontendResponse };
