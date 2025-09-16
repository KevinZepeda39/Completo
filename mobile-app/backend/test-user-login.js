// test-user-login.js - Probar la lógica de login para un usuario específico
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

// Función helper que replica la lógica del servidor
function isEmailVerified(emailVerificado) {
  // Manejar diferentes tipos de datos que MySQL puede devolver
  if (emailVerificado === null || emailVerificado === undefined) {
    return false;
  }
  
  // Convertir a string para comparaciones consistentes
  const value = String(emailVerificado).toLowerCase();
  
  // Valores que indican verificación exitosa
  const verifiedValues = ['1', 'true', 'yes', 'on'];
  
  return verifiedValues.includes(value) || Boolean(emailVerificado);
}

async function testUserLogin() {
  try {
    console.log('🧪 === TEST DE LOGIN PARA USUARIO ESPECÍFICO ===');
    console.log('📧 Email a probar:', USER_EMAIL);
    console.log('🔑 Contraseña proporcionada:', !!USER_PASSWORD);
    
    if (!USER_PASSWORD || USER_PASSWORD === 'tu_contraseña_real') {
      console.log('❌ ERROR: Debes configurar tu contraseña real en el script');
      console.log('💡 Cambia USER_PASSWORD por tu contraseña real');
      return;
    }
    
    // 1. Intentar login con credenciales reales
    console.log('\n1️⃣ === INTENTO DE LOGIN REAL ===');
    console.log('🔐 Intentando login con credenciales reales...');
    
    const loginData = { email: USER_EMAIL, password: USER_PASSWORD };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // 2. Analizar la respuesta
    if (loginResponse.status === 200) {
      console.log('\n✅ ¡LOGIN EXITOSO!');
      console.log('🎉 El problema está RESUELTO');
      console.log('📊 Usuario verificado correctamente');
      
      if (loginResponse.data.user) {
        console.log('📊 Información del usuario:');
        console.log('   - ID:', loginResponse.data.user.idUsuario);
        console.log('   - Nombre:', loginResponse.data.user.nombre);
        console.log('   - Email:', loginResponse.data.user.correo);
        console.log('   - emailVerificado:', loginResponse.data.user.emailVerificado);
        console.log('   - Tipo de emailVerificado:', typeof loginResponse.data.user.emailVerificado);
      }
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('\n❌ LOGIN FALLÓ - Requiere verificación');
      console.log('🔍 PROBLEMA CONFIRMADO: El sistema no reconoce tu email como verificado');
      
      if (loginResponse.data.user) {
        console.log('📊 Estado del usuario en la respuesta:');
        console.log('   - ID:', loginResponse.data.user.idUsuario);
        console.log('   - Nombre:', loginResponse.data.user.nombre);
        console.log('   - Email:', loginResponse.data.user.correo);
        console.log('   - emailVerificado:', loginResponse.data.user.emailVerificado);
        console.log('   - Tipo de emailVerificado:', typeof loginResponse.data.user.emailVerificado);
      }
      
      // 3. Probar la función helper localmente
      console.log('\n2️⃣ === PRUEBA DE FUNCIÓN HELPER ===');
      console.log('🔍 Probando función isEmailVerified localmente...');
      
      const testValues = [0, 1, '0', '1', true, false, null, undefined];
      console.log('🧪 Valores de prueba:');
      
      testValues.forEach(value => {
        const result = isEmailVerified(value);
        console.log(`   - ${value} (${typeof value}) -> ${result}`);
      });
      
      // 4. Análisis del problema
      console.log('\n3️⃣ === ANÁLISIS DEL PROBLEMA ===');
      console.log('🔍 El problema está en que:');
      console.log('   1. Tu usuario existe en la base de datos');
      console.log('   2. El campo emailVerificado tiene un valor');
      console.log('   3. Pero la función isEmailVerified no lo reconoce como válido');
      console.log('   4. O hay un problema en la comparación en el servidor');
      
      console.log('\n💡 SOLUCIONES POSIBLES:');
      console.log('   1. Revisar el valor exacto de emailVerificado en la BD');
      console.log('   2. Corregir la función isEmailVerified en el servidor');
      console.log('   3. Forzar el valor correcto en la base de datos');
      
    } else if (loginResponse.status === 401) {
      console.log('\n❌ LOGIN FALLÓ - Credenciales inválidas');
      console.log('💡 Verifica que la contraseña sea correcta');
      
    } else {
      console.log('\n❌ Login falló por otra razón');
      console.log('🔍 Status:', loginResponse.status);
      console.log('🔍 Error:', loginResponse.data.error);
    }
    
    // 5. Resumen y recomendaciones
    console.log('\n4️⃣ === RESUMEN Y RECOMENDACIONES ===');
    
    if (loginResponse.status === 200) {
      console.log('🎉 ¡PROBLEMA RESUELTO! El login funciona correctamente');
      console.log('✅ Ahora puedes acceder al HomeScreen sin problemas');
      
    } else if (loginResponse.status === 403) {
      console.log('❌ PROBLEMA PERSISTE: El sistema no reconoce tu verificación');
      console.log('🔧 Necesitamos corregir la lógica de verificación en el servidor');
      
      console.log('\n🚀 PRÓXIMOS PASOS:');
      console.log('   1. Revisar la base de datos directamente');
      console.log('   2. Corregir la función isEmailVerified en el servidor');
      console.log('   3. O usar un email diferente para registrarte');
      
    } else {
      console.log('🔍 Problema de credenciales o del servidor');
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
  
  console.log('\n🏁 Test completado');
}

// Ejecutar el test
console.log('🚀 Iniciando test de login para usuario específico...');
testUserLogin().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
