// test-complete-flow.js - Script para probar el flujo completo de autenticación
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'test123456';
const TEST_NAME = 'Usuario Test';

console.log('🧪 === TESTING COMPLETE AUTH FLOW ===');
console.log('📧 Test email:', TEST_EMAIL);
console.log('🔑 Test password:', TEST_PASSWORD);
console.log('👤 Test name:', TEST_NAME);

// Función helper para hacer requests HTTP
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
            error: error.message
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

// Función para esperar un tiempo
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para generar código de verificación (simulado)
function generateTestCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function testCompleteFlow() {
  try {
    console.log('\n1️⃣ === REGISTRO DE USUARIO ===');
    
    // Paso 1: Registrar usuario
    const registerData = {
      nombre: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    console.log('📝 Registrando usuario...');
    const registerResponse = await makeRequest('/api/auth/register', 'POST', registerData);
    
    console.log('📡 Register response status:', registerResponse.status);
    console.log('📦 Register response data:', registerResponse.data);
    
    if (registerResponse.status !== 201) {
      throw new Error(`Registro falló con status ${registerResponse.status}`);
    }
    
    console.log('✅ Usuario registrado exitosamente');
    
    // Esperar un momento para que se procese
    await wait(1000);
    
    console.log('\n2️⃣ === VERIFICACIÓN DE EMAIL ===');
    
    // Paso 2: Verificar código (obtener el código real de la BD)
    console.log('🔍 Obteniendo código de verificación de la base de datos...');
    
    // Hacer una consulta directa a la BD para obtener el código
    const { execute } = require('./config/database.js');
    
    try {
      const users = await execute(`
        SELECT codigoVerificacion, codigoExpiracion 
        FROM usuarios 
        WHERE correo = ?
      `, [TEST_EMAIL]);
      
      if (users.length === 0) {
        throw new Error('Usuario no encontrado en la base de datos');
      }
      
      const user = users[0];
      const verificationCode = user.codigoVerificacion;
      
      if (!verificationCode) {
        throw new Error('No se encontró código de verificación para el usuario');
      }
      
      console.log('🔐 Código de verificación obtenido de la BD:', verificationCode);
      console.log('⏰ Expira en:', user.codigoExpiracion);
      
      // Simular que el usuario ingresa el código
      const verifyData = {
        email: TEST_EMAIL,
        code: verificationCode
      };
      
      console.log('🔐 Verificando código...');
      const verifyResponse = await makeRequest('/api/auth/verify-code', 'POST', verifyData);
      
      console.log('📡 Verify response status:', verifyResponse.status);
      console.log('📦 Verify response data:', verifyResponse.data);
      
      if (verifyResponse.status !== 200) {
        throw new Error(`Verificación falló con status ${verifyResponse.status}`);
      }
      
      console.log('✅ Email verificado exitosamente');
      
    } catch (dbError) {
      console.error('❌ Error obteniendo código de verificación:', dbError.message);
      throw new Error('No se pudo obtener el código de verificación de la base de datos');
    }
    
    // Esperar un momento
    await wait(1000);
    
    console.log('\n3️⃣ === INTENTO DE LOGIN ===');
    
    // Paso 3: Intentar hacer login
    const loginData = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    console.log('🔐 Intentando login...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', loginResponse.data);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login exitoso después de verificación');
      console.log('🎉 Flujo completo funcionando correctamente');
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ Login falló - aún requiere verificación');
      console.log('🔍 Problema detectado: El sistema no reconoce que el email ya está verificado');
      
      // Verificar el estado en la base de datos
      console.log('\n4️⃣ === DIAGNÓSTICO DE BASE DE DATOS ===');
      console.log('🔍 Verificando estado del usuario en la BD...');
      
      // Aquí podrías hacer una consulta directa a la BD si tienes acceso
      console.log('💡 Sugerencia: Verifica el campo emailVerificado en la tabla usuarios');
      console.log('💡 El valor debería ser 1 o true después de la verificación');
      
    } else {
      console.log('❌ Login falló por otra razón:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar el test
console.log('🚀 Iniciando test del flujo completo...');
testCompleteFlow().then(() => {
  console.log('\n🏁 Test completado');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test falló:', error.message);
  process.exit(1);
});
