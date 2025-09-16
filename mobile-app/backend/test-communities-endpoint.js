// test-communities-endpoint.js - Script para probar el endpoint de comunidades
const fetch = require('node-fetch');

const BASE_URL = 'http://192.168.1.13:3000';

async function testCommunitiesEndpoint() {
  console.log('🧪 === TESTING COMMUNITIES ENDPOINT ===');
  
  try {
    // Probar endpoint principal de comunidades
    console.log('\n1️⃣ Probando GET /api/communities...');
    const response1 = await fetch(`${BASE_URL}/api/communities`);
    console.log('Status:', response1.status);
    console.log('OK:', response1.ok);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Datos recibidos:', data1.success ? 'Sí' : 'No');
      if (data1.communities) {
        console.log('📊 Número de comunidades:', data1.communities.length);
      }
    }
    
    // Probar endpoint de miembros (si hay comunidades)
    if (response1.ok) {
      const data1 = await response1.json();
      if (data1.communities && data1.communities.length > 0) {
        const firstCommunity = data1.communities[0];
        console.log(`\n2️⃣ Probando GET /api/communities/${firstCommunity.id}/members...`);
        
        const response2 = await fetch(`${BASE_URL}/api/communities/${firstCommunity.id}/members`);
        console.log('Status:', response2.status);
        console.log('OK:', response2.ok);
        
        if (response2.ok) {
          const data2 = await response2.json();
          console.log('✅ Miembros recibidos:', data2.success ? 'Sí' : 'No');
          if (data2.members) {
            console.log('👥 Número de miembros:', data2.members.length);
          }
        } else {
          const errorText = await response2.text();
          console.log('❌ Error response:', errorText);
        }
      } else {
        console.log('⚠️ No hay comunidades para probar el endpoint de miembros');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testCommunitiesEndpoint();
