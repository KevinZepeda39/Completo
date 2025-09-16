// check-user-verification.js - Verificar estado de verificación de un usuario
const http = require('http');

// 🔥 ACTUALIZADO: Usar credenciales reales para el test
const USER_EMAIL = 'manuel.paz4cm@gmail.com'; // Cambia esto por el email que quieras verificar
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

async function checkUserVerification() {
  try {
    console.log('🔍 === VERIFICANDO ESTADO DE USUARIO ===');
    console.log('📧 Email a verificar:', USER_EMAIL);
    
    // 1️⃣ === INTENTO DE LOGIN ===
    console.log('\n1️⃣ === INTENTO DE LOGIN ===');
    console.log('🔐 Intentando login...');
    
    const loginData = {
      email: USER_EMAIL,
      password: USER_PASSWORD
    };
    
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', loginResponse.data);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login exitoso - usuario verificado y autenticado');
      console.log('🎉 El problema del bucle de verificación está RESUELTO');
      
      // Verificar que el usuario tiene emailVerificado = true
      if (loginResponse.data.user && loginResponse.data.user.emailVerificado) {
        console.log('✅ Campo emailVerificado confirmado como true');
      } else {
        console.log('⚠️ Campo emailVerificado no está presente o es false');
      }
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ Login falló - requiere verificación de email');
      console.log('🔍 Problema detectado: El usuario no está verificado');
      
      // 2️⃣ === VERIFICAR ESTADO EN LA BASE DE DATOS ===
      console.log('\n2️⃣ === VERIFICANDO ESTADO EN LA BASE DE DATOS ===');
      console.log('💡 El usuario necesita verificar su email antes de poder hacer login');
      console.log('💡 Esto explica el bucle de verificación que estás experimentando');
      
    } else if (loginResponse.status === 401) {
      console.log('❌ Login falló - credenciales inválidas');
      console.log('💡 Verifica que la contraseña sea correcta');
      
    } else {
      console.log('❌ Login falló por otra razón:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
  
  console.log('\n🏁 Verificación completada');
}

// Ejecutar la verificación
checkUserVerification().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
