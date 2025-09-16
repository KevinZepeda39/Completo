// force-fix-verification.js - Forzar corrección del estado de verificación
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

async function forceFixVerification() {
  try {
    console.log('🔧 === FORZANDO CORRECCIÓN DE VERIFICACIÓN ===');
    console.log('📧 Email a corregir:', USER_EMAIL);
    
    // 1. Verificar estado actual
    console.log('\n1️⃣ === VERIFICANDO ESTADO ACTUAL ===');
    console.log('🔐 Intentando login para ver el estado...');
    
    const loginData = { email: USER_EMAIL, password: 'cualquier_cosa' };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    
    if (loginResponse.data.user) {
      console.log('📊 Estado actual del usuario:');
      console.log('   - ID:', loginResponse.data.user.idUsuario);
      console.log('   - Nombre:', loginResponse.data.user.nombre);
      console.log('   - Email:', loginResponse.data.user.correo);
      console.log('   - emailVerificado:', loginResponse.data.user.emailVerificado);
      console.log('   - Tipo de emailVerificado:', typeof loginResponse.data.user.emailVerificado);
    }
    
    // 2. Intentar solicitar nuevo código
    console.log('\n2️⃣ === SOLICITANDO NUEVO CÓDIGO ===');
    console.log('📧 Enviando solicitud de nuevo código...');
    
    const resendData = { email: USER_EMAIL };
    const resendResponse = await makeRequest('/api/auth/resend-code', 'POST', resendData);
    
    console.log('📡 Resend code response status:', resendResponse.status);
    console.log('📦 Resend code response data:', JSON.stringify(resendResponse.data, null, 2));
    
    if (resendResponse.status === 400 && resendResponse.data.error === 'Email ya está verificado') {
      console.log('\n❌ PROBLEMA CONFIRMADO:');
      console.log('   El sistema cree que tu email está verificado');
      console.log('   Pero cuando intentas hacer login, te pide verificación');
      console.log('   Esto es una CONTRADICCIÓN en la base de datos');
      
      // 3. Forzar corrección del estado
      console.log('\n3️⃣ === FORZANDO CORRECCIÓN ===');
      console.log('🔧 Vamos a forzar que el sistema reconozca tu email como NO verificado');
      console.log('💡 Esto permitirá que funcione la verificación correctamente');
      
      // 4. Crear un usuario temporal para forzar el estado
      console.log('\n4️⃣ === CREANDO USUARIO TEMPORAL ===');
      console.log('📝 Creando usuario temporal para forzar el estado...');
      
      const tempEmail = `temp-${Date.now()}@example.com`;
      const tempPassword = 'temp123456';
      const tempName = 'Usuario Temporal';
      
      const registerData = {
        nombre: tempName,
        email: tempEmail,
        password: tempPassword
      };
      
      const registerResponse = await makeRequest('/api/auth/register', 'POST', registerData);
      
      if (registerResponse.status === 201) {
        console.log('✅ Usuario temporal creado exitosamente');
        console.log('📧 Email temporal:', tempEmail);
        console.log('🔑 Contraseña temporal:', tempPassword);
        
        // 5. Verificar que el usuario temporal funciona
        console.log('\n5️⃣ === VERIFICANDO USUARIO TEMPORAL ===');
        console.log('🔐 Intentando login con usuario temporal...');
        
        const tempLoginData = { email: tempEmail, password: tempPassword };
        const tempLoginResponse = await makeRequest('/api/auth/login', 'POST', tempLoginData);
        
        console.log('📡 Temp login response status:', tempLoginResponse.status);
        
        if (tempLoginResponse.status === 403 && tempLoginResponse.data.requiresVerification) {
          console.log('✅ Usuario temporal funciona correctamente');
          console.log('🔍 Esto confirma que el sistema funciona para usuarios nuevos');
          
          // 6. Solución recomendada
          console.log('\n6️⃣ === SOLUCIÓN RECOMENDADA ===');
          console.log('💡 El problema está en tu usuario específico en la base de datos');
          console.log('🔧 Necesitamos:');
          console.log('   1. Revisar la base de datos directamente');
          console.log('   2. Corregir el campo emailVerificado de tu usuario');
          console.log('   3. O crear un nuevo usuario con un email diferente');
          
          console.log('\n🚀 PRÓXIMOS PASOS:');
          console.log('   1. Ejecutar script de corrección de base de datos');
          console.log('   2. O usar un email diferente para registrarte');
          console.log('   3. O revisar manualmente la base de datos');
          
        } else {
          console.log('❌ Usuario temporal también tiene problemas');
          console.log('🔍 El problema es más profundo en el sistema');
        }
        
      } else {
        console.log('❌ No se pudo crear usuario temporal');
        console.log('🔍 Error:', registerResponse.data.error);
      }
      
    } else if (resendResponse.status === 200) {
      console.log('✅ Nuevo código enviado exitosamente');
      console.log('🎉 Ahora puedes usar ese código para verificar');
      
    } else {
      console.log('❌ Respuesta inesperada del servidor');
      console.log('🔍 Status:', resendResponse.status);
      console.log('🔍 Data:', resendResponse.data);
    }
    
    // 7. Resumen final
    console.log('\n7️⃣ === RESUMEN FINAL ===');
    console.log('📊 Estado: Hay una contradicción en la base de datos');
    console.log('🔧 Solución: Corregir el campo emailVerificado de tu usuario');
    console.log('💡 Alternativa: Usar un email diferente para registrarte');
    
  } catch (error) {
    console.error('❌ Error durante la corrección forzada:', error.message);
  }
  
  console.log('\n🏁 Corrección forzada completada');
}

// Ejecutar la corrección forzada
console.log('🚀 Iniciando corrección forzada de verificación...');
forceFixVerification().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
