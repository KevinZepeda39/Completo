// check-user-status.js - Verificar estado de un usuario específico
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

async function checkUserStatus() {
  try {
    console.log('🔍 === VERIFICANDO ESTADO DEL USUARIO ===');
    console.log('📧 Email a verificar:', USER_EMAIL);
    
    // 1. Intentar hacer login para ver qué dice el sistema
    console.log('\n1️⃣ === INTENTO DE LOGIN ===');
    console.log('🔐 Intentando login (sin contraseña para ver el error)...');
    
    // Hacer un request sin contraseña para ver qué información devuelve
    const loginData = { email: USER_EMAIL, password: 'cualquier_cosa' };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    // 2. Analizar la respuesta
    if (loginResponse.status === 401) {
      console.log('\n✅ Login falló por credenciales inválidas (esperado)');
      console.log('🔍 Pero podemos ver información del usuario en la respuesta');
      
      if (loginResponse.data.user) {
        console.log('\n📊 INFORMACIÓN DEL USUARIO ENCONTRADA:');
        console.log('   - ID:', loginResponse.data.user.idUsuario);
        console.log('   - Nombre:', loginResponse.data.user.nombre);
        console.log('   - Email:', loginResponse.data.user.correo);
        console.log('   - emailVerificado:', loginResponse.data.user.emailVerificado);
        
        if (loginResponse.data.user.emailVerificado === false) {
          console.log('\n❌ PROBLEMA IDENTIFICADO:');
          console.log('   El campo emailVerificado está en FALSE');
          console.log('   Esto significa que el sistema no reconoce que ya verificaste tu email');
          
          console.log('\n💡 SOLUCIÓN NECESARIA:');
          console.log('   Necesitamos actualizar la base de datos para marcar tu email como verificado');
          
        } else if (loginResponse.data.user.emailVerificado === true) {
          console.log('\n✅ El campo emailVerificado está en TRUE');
          console.log('🔍 El problema podría estar en otra parte del código');
        }
      }
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('\n❌ PROBLEMA CONFIRMADO:');
      console.log('   El sistema requiere verificación de email');
      console.log('   Esto confirma el bucle que estás experimentando');
      
    } else {
      console.log('\n🔍 Respuesta inesperada del servidor');
    }
    
    // 3. Resumen y recomendaciones
    console.log('\n3️⃣ === RESUMEN Y RECOMENDACIONES ===');
    console.log('📊 Estado actual: El sistema no reconoce tu email como verificado');
    console.log('🔧 Acción requerida: Actualizar la base de datos');
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar script de corrección automática');
    console.log('   2. O hacer corrección manual en la base de datos');
    console.log('   3. Probar login nuevamente');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
  
  console.log('\n🏁 Verificación completada');
}

// Ejecutar la verificación
console.log('🚀 Iniciando verificación del estado del usuario...');
checkUserStatus().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
