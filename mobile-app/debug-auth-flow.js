// debug-auth-flow.js - Script para debuggear el flujo de autenticación
const { exec } = require('child_process');
const fs = require('fs');

console.log('🔍 === DEBUG AUTH FLOW ===\n');

// Función para ejecutar comandos y mostrar resultados
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📋 ${description}:`);
    console.log(`💻 Comando: ${command}\n`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        resolve(null);
        return;
      }
      if (stderr) {
        console.log(`⚠️ Stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`✅ Resultado:\n${stdout}`);
      }
      console.log(''); // Línea en blanco
      resolve(stdout);
    });
  });
}

// Función principal de debug
async function debugAuthFlow() {
  try {
    console.log('🚀 Iniciando debug del flujo de autenticación...\n');

    // 1. Verificar estado del backend
    console.log('1️⃣ === VERIFICANDO BACKEND ===');
    await runCommand('cd backend && npm list bcrypt', 'Verificar instalación de bcrypt');
    await runCommand('cd backend && node -e "console.log(\'Node.js version:\', process.version)"', 'Verificar versión de Node.js');
    
    // 2. Verificar logs del backend
    console.log('2️⃣ === VERIFICANDO LOGS DEL BACKEND ===');
    console.log('📝 Para ver logs en tiempo real, ejecuta en otra terminal:');
    console.log('   cd backend && node server.js\n');
    
    // 3. Verificar estado de la base de datos
    console.log('3️⃣ === VERIFICANDO BASE DE DATOS ===');
    console.log('📊 Para verificar la base de datos, ejecuta en MySQL:');
    console.log('   SELECT idUsuario, nombre, correo, emailVerificado, activo FROM usuarios WHERE correo = \'tu-email@ejemplo.com\';\n');
    
    // 4. Verificar configuración del frontend
    console.log('4️⃣ === VERIFICANDO FRONTEND ===');
    await runCommand('cd .. && npm list @react-native-async-storage/async-storage', 'Verificar AsyncStorage');
    await runCommand('cd .. && npm list @react-navigation/native', 'Verificar React Navigation');
    
    // 5. Verificar archivos críticos
    console.log('5️⃣ === VERIFICANDO ARCHIVOS CRÍTICOS ===');
    
    const criticalFiles = [
      'hooks/useAuth.js',
      'services/authService.js',
      'App.js',
      'components/LoginScreen.js'
    ];
    
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} - EXISTE`);
      } else {
        console.log(`❌ ${file} - NO EXISTE`);
      }
    }
    
    console.log('\n6️⃣ === INSTRUCCIONES DE DEBUG ===');
    console.log('Para debuggear el problema:');
    console.log('');
    console.log('1. Abre la consola de React Native/Expo');
    console.log('2. Intenta hacer login con un usuario verificado');
    console.log('3. Observa los logs del useAuth hook');
    console.log('4. Verifica si isAuthenticated cambia a true');
    console.log('5. Verifica si hay errores en la consola');
    console.log('');
    console.log('🔍 Logs importantes a buscar:');
    console.log('   - "=== useAuth.login called ==="');
    console.log('   - "Login successful, user:"');
    console.log('   - "Session data saved to AsyncStorage"');
    console.log('   - "Login completed successfully"');
    console.log('   - "=== CHECKING AUTH STATUS ==="');
    console.log('   - "Authentication successful for user:"');
    console.log('');
    console.log('7️⃣ === POSIBLES SOLUCIONES ===');
    console.log('Si el problema persiste, verifica:');
    console.log('');
    console.log('1. Que el usuario tenga emailVerificado = true en la base de datos');
    console.log('2. Que la respuesta del backend incluya success: true');
    console.log('3. Que AsyncStorage se esté guardando correctamente');
    console.log('4. Que no haya errores en la sincronización de servicios');
    console.log('5. Que el estado isAuthenticated se esté actualizando correctamente');
    
    console.log('\n🎯 === FIN DEL DEBUG ===');
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  }
}

// Ejecutar el debug
debugAuthFlow();
