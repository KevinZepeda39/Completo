// backend/diagnose-registration.js - Script de diagnóstico para registro de usuarios
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.1.13:3000'; // Ajusta a tu IP

async function diagnoseRegistration() {
  console.log('🔍 DIAGNÓSTICO DE REGISTRO DE USUARIOS');
  console.log('=======================================\n');

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('🔍 1. Verificando que el servidor esté funcionando...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/test`);
      if (healthResponse.ok) {
        console.log('✅ Servidor funcionando correctamente');
      } else {
        console.log('⚠️ Servidor respondiendo pero con error:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ No se puede conectar al servidor:', error.message);
      console.log('💡 Asegúrate de que el servidor esté corriendo en:', API_BASE_URL);
      return;
    }

    console.log('');

    // 2. Verificar que la ruta de registro esté disponible
    console.log('🔍 2. Verificando ruta de registro...');
    try {
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: 'Usuario Test',
          email: 'test@example.com',
          password: 'test123',
          telefono: '12345678'
        })
      });

      console.log(`📊 Respuesta del servidor: ${registerResponse.status} ${registerResponse.statusText}`);
      
      if (registerResponse.ok) {
        const result = await registerResponse.json();
        console.log('✅ Registro exitoso:', result);
      } else {
        console.log('❌ Error en registro');
        
        // Intentar obtener detalles del error
        try {
          const errorDetails = await registerResponse.text();
          console.log('📋 Detalles del error:', errorDetails);
          
          // Si es JSON, parsearlo para mejor legibilidad
          try {
            const errorJson = JSON.parse(errorDetails);
            console.log('🔍 Error estructurado:', JSON.stringify(errorJson, null, 2));
          } catch (parseError) {
            console.log('📝 Error en texto plano:', errorDetails);
          }
        } catch (readError) {
          console.log('⚠️ No se pudieron leer detalles del error:', readError.message);
        }
      }
    } catch (error) {
      console.log('❌ Error de red:', error.message);
      console.log('💡 Verifica:');
      console.log('   - Que el servidor esté corriendo');
      console.log('   - Que la IP sea correcta');
      console.log('   - Que no haya firewall bloqueando');
    }

    console.log('');

    // 3. Verificar base de datos
    console.log('🔍 3. Verificando base de datos...');
    console.log('💡 Verifica que:');
    console.log('   - MySQL esté funcionando');
    console.log('   - Las credenciales en config/database.js sean correctas');
    console.log('   - La base de datos exista');

    console.log('');

    // 4. Verificar estructura de la tabla usuarios
    console.log('🔍 4. Verificando estructura de tabla usuarios...');
    console.log('💡 Ejecuta en MySQL:');
    console.log('   DESCRIBE usuarios;');
    console.log('   SHOW CREATE TABLE usuarios;');

    console.log('');

    // 5. Verificar logs del servidor
    console.log('🔍 5. Verificando logs del servidor...');
    console.log('💡 Revisa la consola donde está corriendo node server.js');
    console.log('💡 Busca mensajes que empiecen con: ❌, ⚠️, 🔍');

  } catch (error) {
    console.error('💥 Error general en diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseRegistration();
