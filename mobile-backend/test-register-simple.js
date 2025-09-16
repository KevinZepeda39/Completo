// backend/test-register-simple.js - Script simple para probar registro
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.1.13:3000'; // Ajusta a tu IP

async function testRegister() {
  console.log('🧪 PROBANDO REGISTRO SIMPLE');
  console.log('============================\n');

  try {
    // Datos de prueba (SIN telefono)
    const testData = {
      nombre: 'Usuario Test',
      correo: 'test@example.com',
      contraseña: 'test123'
    };

    console.log('📤 Enviando datos:', testData);

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Respuesta: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Registro exitoso:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error en registro:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('🔍 Error estructurado:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('📝 Error en texto plano:', errorText);
      }
    }

  } catch (error) {
    console.error('💥 Error de red:', error.message);
  }
}

// Ejecutar prueba
testRegister();
