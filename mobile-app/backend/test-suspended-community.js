const fetch = require('node-fetch');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_COMMUNITY_ID = 71; // Cambiar por el ID de una comunidad que exista
const TEST_USER_ID = 91; // Cambiar por un usuario válido

async function testSuspendedCommunity() {
  console.log('🧪 === PRUEBA DE COMUNIDAD SUSPENDIDA ===\n');
  
  try {
    // 1. Primero, verificar el estado actual de la comunidad
    console.log('1️⃣ Verificando estado actual de la comunidad...');
    const statusResponse = await fetch(`${BASE_URL}/api/communities/${TEST_COMMUNITY_ID}`);
    const statusData = await statusResponse.json();
    
    if (statusData.success) {
      console.log(`✅ Comunidad encontrada: ${statusData.community.titulo}`);
      console.log(`📊 Estado actual: ${statusData.community.estado || 'activa'}`);
    } else {
      console.log('❌ No se pudo obtener información de la comunidad');
      return;
    }
    
    // 2. Intentar enviar un mensaje
    console.log('\n2️⃣ Intentando enviar mensaje...');
    const messageResponse = await fetch(`${BASE_URL}/api/communities/${TEST_COMMUNITY_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID.toString()
      },
      body: JSON.stringify({
        text: 'Este es un mensaje de prueba para verificar la validación de comunidades suspendidas'
      })
    });
    
    const messageData = await messageResponse.json();
    
    if (messageResponse.status === 403) {
      console.log('🚫 ✅ CORRECTO: El servidor bloqueó el mensaje');
      console.log(`📝 Respuesta: ${messageData.error}`);
      
      if (messageData.error.includes('suspendida')) {
        console.log('🎯 ✅ La validación de comunidad suspendida está funcionando correctamente');
      } else {
        console.log('⚠️ El mensaje de error no menciona que la comunidad esté suspendida');
      }
    } else if (messageResponse.status === 201) {
      console.log('⚠️ El mensaje se envió exitosamente, pero la comunidad debería estar suspendida');
      console.log('📝 Respuesta:', messageData);
    } else {
      console.log(`❌ Error inesperado: ${messageResponse.status}`);
      console.log('📝 Respuesta:', messageData);
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Función para suspender una comunidad (solo para pruebas)
async function suspendCommunity() {
  console.log('\n🔒 === SUSPENDIENDO COMUNIDAD PARA PRUEBA ===\n');
  
  try {
    // Nota: Esta función requiere permisos de administrador
    // En un entorno real, esto se haría desde el panel de administración
    
    console.log('⚠️ Para probar la funcionalidad de comunidades suspendidas:');
    console.log('1. Ve al panel de administración');
    console.log('2. Busca la comunidad que quieres suspender');
    console.log('3. Cambia su estado a "suspendida"');
    console.log('4. Ejecuta este script nuevamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de validación de comunidades suspendidas...\n');
  
  await testSuspendedCommunity();
  await suspendCommunity();
  
  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSuspendedCommunity, suspendCommunity };
