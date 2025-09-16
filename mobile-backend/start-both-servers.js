// start-both-servers.js - Script para ejecutar ambos servidores simultáneamente
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando ambos servidores simultáneamente...\n');

// Configuración de puertos
const APP_MOBILE_PORT = 3000;
const PLATFORM_WEB_PORT = 3001;

// Función para iniciar servidor
function startServer(name, command, args, options = {}) {
  console.log(`📱 Iniciando ${name}...`);
  
  const server = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    ...options
  });

  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[${name}] ${output}`);
  });

  server.stderr.on('data', (data) => {
    const output = data.toString();
    console.log(`[${name} ERROR] ${output}`);
  });

  server.on('close', (code) => {
    console.log(`[${name}] Servidor cerrado con código ${code}`);
  });

  server.on('error', (error) => {
    console.error(`[${name}] Error:`, error);
  });

  return server;
}

// 1️⃣ Iniciar servidor de la App Móvil (Puerto 3000)
console.log('📱 === SERVIDOR APP MÓVIL ===');
console.log(`🌐 Puerto: ${APP_MOBILE_PORT}`);
console.log(`📁 Directorio: ${__dirname}`);
console.log('');

const appMobileServer = startServer(
  'APP MÓVIL', 
  'node', 
  ['server.js'],
  { cwd: __dirname }
);

// Esperar un poco antes de iniciar el segundo servidor
setTimeout(() => {
  // 2️⃣ Iniciar servidor de la Plataforma Web (Puerto 3001)
  console.log('\n🌐 === SERVIDOR PLATAFORMA WEB ===');
  console.log(`🌐 Puerto: ${PLATFORM_WEB_PORT}`);
  console.log(`📁 Directorio: C:\\WebTwo\\Web\\Plataforma`);
  console.log('');
  
  const platformWebServer = startServer(
    'PLATAFORMA WEB', 
    'node', 
    ['server.js'],
    { cwd: 'C:\\WebTwo\\Web\\Plataforma' }
  );

  // Manejar cierre de ambos servidores
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando ambos servidores...');
    appMobileServer.kill('SIGINT');
    platformWebServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando ambos servidores...');
    appMobileServer.kill('SIGTERM');
    platformWebServer.kill('SIGTERM');
    process.exit(0);
  });

}, 2000);

// Manejar cierre del script principal
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando script principal...');
  process.exit(0);
});

console.log('\n✅ Script iniciado. Presiona Ctrl+C para detener ambos servidores.');
console.log('\n📱 App Móvil: http://localhost:3001');
console.log('🌐 Plataforma Web: http://localhost:3000');
console.log('\n🔍 Monitoreando logs de ambos servidores...\n');
