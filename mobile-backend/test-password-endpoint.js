// test-password-endpoint.js - Probar el endpoint de actualización de contraseña
const http = require('http');

async function testPasswordEndpoint() {
  try {
    console.log('🔐 Probando endpoint de actualización de contraseña...\n');
    
    const testData = {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    };
    
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/1/password',
      method: 'PUT',
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
          console.log('📄 Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200) {
            console.log('\n✅ Endpoint funcionando correctamente!');
          } else {
            console.log('\n⚠️ Endpoint respondió con error, pero está funcionando');
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

testPasswordEndpoint();
