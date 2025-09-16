// test-interactive-verification.js - Script interactivo para probar verificación
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Función para hacer pregunta al usuario
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function testInteractiveVerification() {
  try {
    console.log('🧪 === TEST INTERACTIVO DE VERIFICACIÓN ===\n');
    
    // 1. Obtener credenciales del usuario
    console.log('1️⃣ === INGRESO DE CREDENCIALES ===');
    const email = await askQuestion('📧 Ingresa tu email: ');
    const password = await askQuestion('🔑 Ingresa tu contraseña: ');
    
    console.log('\n2️⃣ === INTENTO DE LOGIN INICIAL ===');
    console.log('🔐 Intentando login con las credenciales...');
    
    const loginData = { email, password };
    const loginResponse = await makeRequest('/api/auth/login', 'POST', loginData);
    
    console.log('📡 Login response status:', loginResponse.status);
    console.log('📦 Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 200) {
      console.log('\n✅ ¡EXCELENTE! El login funciona correctamente');
      console.log('🎉 El problema del bucle de verificación está RESUELTO');
      
      if (loginResponse.data.user && loginResponse.data.user.emailVerificado) {
        console.log('✅ Campo emailVerificado confirmado como true');
      }
      
    } else if (loginResponse.status === 403 && loginResponse.data.requiresVerification) {
      console.log('\n❌ Login falló - requiere verificación de email');
      console.log('🔍 Problema detectado: El usuario no está verificado');
      
      // 3. Intentar verificación
      console.log('\n3️⃣ === INTENTO DE VERIFICACIÓN ===');
      const code = await askQuestion('🔑 Ingresa el código de verificación que recibiste por email: ');
      
      if (code) {
        console.log('🔐 Verificando código...');
        
        const verifyData = { email, code };
        const verifyResponse = await makeRequest('/api/auth/verify-code', 'POST', verifyData);
        
        console.log('📡 Verify response status:', verifyResponse.status);
        console.log('📦 Verify response data:', JSON.stringify(verifyResponse.data, null, 2));
        
        if (verifyResponse.status === 200) {
          console.log('\n✅ ¡Email verificado exitosamente!');
          
          // 4. Intentar login nuevamente
          console.log('\n4️⃣ === INTENTO DE LOGIN DESPUÉS DE VERIFICACIÓN ===');
          console.log('🔐 Intentando login nuevamente...');
          
          const loginAfterVerify = await makeRequest('/api/auth/login', 'POST', loginData);
          
          console.log('📡 Login after verify status:', loginAfterVerify.status);
          console.log('📦 Login after verify data:', JSON.stringify(loginAfterVerify.data, null, 2));
          
          if (loginAfterVerify.status === 200) {
            console.log('\n🎉 ¡ÉXITO TOTAL! El flujo completo funciona correctamente');
            console.log('✅ Verificación + Login funcionando perfectamente');
          } else {
            console.log('\n❌ Login después de verificación falló');
            console.log('🔍 Esto indica que hay un problema en el flujo');
          }
          
        } else {
          console.log('\n❌ Verificación falló');
          console.log('🔍 Revisa el código o solicita uno nuevo');
        }
      }
      
    } else if (loginResponse.status === 401) {
      console.log('\n❌ Login falló - credenciales inválidas');
      console.log('💡 Verifica que la contraseña sea correcta');
      
    } else {
      console.log('\n❌ Login falló por otra razón:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar el test interactivo
console.log('🚀 Iniciando test interactivo...');
testInteractiveVerification().then(() => {
  console.log('\n🏁 Test completado');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test falló:', error.message);
  process.exit(1);
});
