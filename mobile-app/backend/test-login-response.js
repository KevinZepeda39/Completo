// test-login-response.js - Probar la respuesta del login
const http = require('http');

async function testLoginResponse() {
  try {
    console.log('🔐 Probando respuesta del login...\n');
    
    const testData = {
      email: 'kevin.zep4cm@gmail.com',
      password: '123456'
    };
    
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('📡 Enviando request a:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('📦 Datos:', testData);
    
    const req = http.request(options, (res) => {
      console.log(`\n📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log('📄 Response completa:', JSON.stringify(response, null, 2));
          
          if (response.success && response.user) {
            console.log('\n📸 Datos del usuario:');
            console.log('   ID:', response.user.id);
            console.log('   Nombre:', response.user.nombre);
            console.log('   Email:', response.user.correo);
            console.log('   Foto de perfil:', response.user.fotoPerfil);
            
            if (response.user.fotoPerfil) {
              console.log('✅ El usuario tiene foto de perfil');
            } else {
              console.log('❌ El usuario NO tiene foto de perfil');
            }
          }
          
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          console.log('📄 Raw response:', responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginResponse();
