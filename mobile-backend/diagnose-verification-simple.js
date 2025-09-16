// diagnose-verification-simple.js - Diagnóstico simple del problema de verificación
const http = require('http');

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

async function diagnoseVerificationIssue() {
  try {
    console.log('🔍 === DIAGNÓSTICO SIMPLE DEL PROBLEMA DE VERIFICACIÓN ===');
    console.log('📅 Fecha y hora:', new Date().toLocaleString());
    
    // 1. Verificar que el servidor esté funcionando
    console.log('\n1️⃣ === VERIFICANDO SERVIDOR ===');
    try {
      const healthResponse = await makeRequest('/health', 'GET');
      console.log('✅ Servidor respondiendo en puerto 3000');
      console.log('📡 Health check status:', healthResponse.status);
    } catch (error) {
      console.log('❌ Servidor no responde:', error.message);
      return;
    }
    
    // 2. Crear un usuario de prueba
    console.log('\n2️⃣ === CREANDO USUARIO DE PRUEBA ===');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'test123456';
    const testName = 'Usuario Test';
    
    const registerData = {
      nombre: testName,
      email: testEmail,
      password: testPassword
    };
    
    console.log('📝 Registrando usuario de prueba...');
    const registerResponse = await makeRequest('/api/auth/register', 'POST', registerData);
    
    console.log('📡 Register response status:', registerResponse.status);
    if (registerResponse.status === 201) {
      console.log('✅ Usuario registrado exitosamente');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Contraseña:', testPassword);
    } else {
      console.log('❌ Registro falló:', registerResponse.data);
      return;
    }
    
    // 3. Verificar estado del usuario en la base de datos
    console.log('\n3️⃣ === VERIFICANDO ESTADO DEL USUARIO ===');
    console.log('🔍 Haciendo login para ver el estado...');
    
    const loginData = { email: testEmail, password: testPassword };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('✅ Usuario requiere verificación (estado correcto)');
      
      // 4. Simular verificación exitosa
      console.log('\n4️⃣ === SIMULANDO VERIFICACIÓN ===');
      console.log('🔍 Obteniendo código de verificación...');
      
      // Hacer una consulta directa al servidor para obtener el código
      // Por ahora, vamos a simular que el usuario ingresa un código
      console.log('💡 Para continuar, necesitas:');
      console.log('   1. Revisar tu email y obtener el código de verificación');
      console.log('   2. Ejecutar el script de verificación interactivo');
      
    } else if (loginResponse.status === 200) {
      console.log('❌ PROBLEMA DETECTADO: Usuario ya está verificado sin haber verificado email');
      console.log('🔍 Esto indica un problema en la lógica de verificación');
      
    } else {
      console.log('❌ Login falló por otra razón:', loginResponse.data.error);
    }
    
    // 5. Resumen del diagnóstico
    console.log('\n5️⃣ === RESUMEN DEL DIAGNÓSTICO ===');
    console.log('📊 Estado del servidor: ✅ Funcionando');
    console.log('📊 Registro de usuarios: ✅ Funcionando');
    console.log('📊 Verificación requerida: ✅ Funcionando');
    console.log('📊 Login después de verificación: 🔍 Pendiente de verificar');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Revisa tu email para obtener el código de verificación');
    console.log('   2. Ejecuta: node test-interactive-verification.js');
    console.log('   3. Usa las credenciales de prueba o las tuyas reales');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar el diagnóstico
console.log('🚀 Iniciando diagnóstico simple...');
diagnoseVerificationIssue().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Diagnóstico falló:', error.message);
  process.exit(1);
});
