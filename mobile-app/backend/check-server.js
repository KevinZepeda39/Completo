const http = require('http');

console.log('🔍 Verificando si el servidor está corriendo en localhost:3000...');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
}, (res) => {
  console.log(`✅ Servidor respondiendo - Status: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📤 Respuesta:`, data);
  });
});

req.on('error', (error) => {
  console.log('❌ Servidor no está corriendo o no responde');
  console.log('💡 Asegúrate de ejecutar: node server.js');
});

req.on('timeout', () => {
  console.log('⏰ Timeout - El servidor no responde');
  req.destroy();
});

req.end();
