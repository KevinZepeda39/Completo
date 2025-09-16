// test-fix.js - Test simple para verificar que el fix funciona
const http = require('http');

// 🔥 CONFIGURAR AQUÍ TU EMAIL Y CONTRASEÑA REAL
const USER_EMAIL = 'manuel.paz4cm@gmail.com'; // Cambia esto por tu email real
const USER_PASSWORD = 'tu_contraseña_real'; // 🔥 CAMBIA ESTO por tu contraseña real

const BASE_URL = 'http://localhost:3000';

// Función para hacer requests HTTP
function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON response', raw: body }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testFix() {
  try {
    console.log('🧪 === TEST DEL FIX APLICADO ===');
    console.log('📧 Email a probar:', USER_EMAIL);
    
    if (!USER_PASSWORD || USER_PASSWORD === 'tu_contraseña_real') {
      console.log('❌ ERROR: Debes configurar tu contraseña real');
      console.log('💡 Cambia USER_PASSWORD por tu contraseña real');
      console.log('💡 O simplemente prueba el login desde la app móvil');
      
      console.log('\n🎯 RESULTADO ESPERADO DESPUÉS DEL FIX:');
      console.log('   - El login debería funcionar correctamente');
      console.log('   - Deberías ir al HomeScreen en lugar de la verificación');
      console.log('   - El campo emailVerificado: 1 debería ser reconocido');
      
      return;
    }
    
    // Intentar login
    console.log('\n🔐 Intentando login...');
    const loginData = { email: USER_EMAIL, password: USER_PASSWORD };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      console.log('\n🎉 ¡FIX FUNCIONANDO!');
      console.log('✅ Login exitoso - usuario verificado correctamente');
      console.log('✅ Ahora puedes acceder al HomeScreen sin problemas');
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('\n❌ FIX NO FUNCIONÓ');
      console.log('🔍 El problema persiste');
      console.log('💡 Necesitamos revisar más a fondo');
      
    } else {
      console.log('\n🔍 Respuesta inesperada');
      console.log('📦 Data:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
  
  console.log('\n🏁 Test completado');
}

// Ejecutar el test
console.log('🚀 Iniciando test del fix...');
testFix().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
