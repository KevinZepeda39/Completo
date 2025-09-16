// debug-user-verification.js - Debug detallado del estado de verificación
const http = require('http');

// 🔥 CONFIGURAR AQUÍ TU EMAIL
const USER_EMAIL = 'manuel.paz4cm@gmail.com'; // Cambia esto por tu email real

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

async function debugUserVerification() {
  try {
    console.log('🔍 === DEBUG DETALLADO DEL ESTADO DE VERIFICACIÓN ===');
    console.log('📧 Email a debuggear:', USER_EMAIL);
    
    // 1. Verificar estado actual del usuario
    console.log('\n1️⃣ === ESTADO ACTUAL DEL USUARIO ===');
    console.log('🔐 Intentando login para obtener información...');
    
    const loginData = { email: USER_EMAIL, password: 'cualquier_cosa' };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    
    if (loginResponse.data.user) {
      console.log('📊 INFORMACIÓN DEL USUARIO:');
      console.log('   - ID:', loginResponse.data.user.idUsuario);
      console.log('   - Nombre:', loginResponse.data.user.nombre);
      console.log('   - Email:', loginResponse.data.user.correo);
      console.log('   - emailVerificado:', loginResponse.data.user.emailVerificado);
      console.log('   - Tipo de emailVerificado:', typeof loginResponse.data.user.emailVerificado);
      
      if (loginResponse.data.verification) {
        console.log('   - Verificación requerida:', loginResponse.data.verification.required);
        console.log('   - Código enviado:', loginResponse.data.verification.codeSent);
        console.log('   - Mensaje:', loginResponse.data.verification.message);
      }
    }
    
    // 2. Intentar obtener un nuevo código de verificación
    console.log('\n2️⃣ === SOLICITANDO NUEVO CÓDIGO ===');
    console.log('📧 Enviando solicitud de nuevo código...');
    
    const resendData = { email: USER_EMAIL };
    const resendResponse = await makeRequest('/api/auth/resend-code', 'POST', resendData);
    
    console.log('📡 Resend code response status:', resendResponse.status);
    console.log('📦 Resend code response data:', JSON.stringify(resendResponse.data, null, 2));
    
    if (resendResponse.status === 200) {
      console.log('✅ Nuevo código enviado exitosamente');
      
      // 3. Esperar un momento y verificar el estado
      console.log('\n3️⃣ === ESPERANDO Y VERIFICANDO ESTADO ===');
      console.log('⏳ Esperando 3 segundos para que se procese...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 4. Verificar estado después del envío
      console.log('🔍 Verificando estado después del envío...');
      const loginAfterResend = await makeRequest('/api/auth/login', 'POST', loginData);
      
      console.log('📡 Login after resend status:', loginAfterResend.status);
      if (loginAfterResend.data.user) {
        console.log('📊 Estado después del resend:');
        console.log('   - emailVerificado:', loginAfterResend.data.user.emailVerificado);
        console.log('   - Verificación requerida:', loginAfterResend.data.verification?.required);
      }
      
    } else {
      console.log('❌ No se pudo enviar nuevo código');
      console.log('🔍 Error:', resendResponse.data.error);
    }
    
    // 5. Análisis del problema
    console.log('\n4️⃣ === ANÁLISIS DEL PROBLEMA ===');
    console.log('🔍 Basado en la información recopilada:');
    
    if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('❌ PROBLEMA CONFIRMADO:');
      console.log('   - El usuario existe en la base de datos');
      console.log('   - El campo emailVerificado está en FALSE');
      console.log('   - El sistema requiere verificación');
      console.log('   - Pero el código de verificación no funciona');
      
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   1. El código no se está guardando correctamente en la BD');
      console.log('   2. El código se está guardando pero no se está comparando bien');
      console.log('   3. Hay un problema en la lógica de verificación del servidor');
      console.log('   4. El código expira antes de que lo uses');
      
    } else if (loginResponse.status === 401) {
      console.log('✅ El usuario existe pero las credenciales son incorrectas');
      console.log('🔍 Esto es normal para este test');
      
    } else {
      console.log('🔍 Respuesta inesperada del servidor');
    }
    
    // 6. Recomendaciones
    console.log('\n5️⃣ === RECOMENDACIONES ===');
    console.log('💡 Para resolver el problema:');
    console.log('   1. Revisar los logs del servidor cuando intentas verificar');
    console.log('   2. Verificar que el código se guarde correctamente en la BD');
    console.log('   3. Revisar la lógica de comparación de códigos');
    console.log('   4. Considerar hacer la verificación manual en la BD');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   Ejecutar el servidor con logs detallados y probar la verificación');
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error.message);
  }
  
  console.log('\n🏁 Debug completado');
}

// Ejecutar el debug
console.log('🚀 Iniciando debug detallado del usuario...');
debugUserVerification().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
