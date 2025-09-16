const fetch = require('node-fetch');

async function testFixedEndpoint() {
  try {
    console.log('🧪 === PROBANDO ENDPOINT CORREGIDO /api/communities/user ===');
    
    // Probar con el usuario 156 (el que estaba teniendo problemas)
    const userId = 156;
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    };
    
    console.log(`🔍 Probando con usuario ID: ${userId}`);
    console.log('📋 Headers:', headers);
    
    const response = await fetch('http://localhost:3000/api/communities/user', {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log('  - Success:', data.success);
      console.log('  - Message:', data.message);
      console.log('  - Communities count:', data.communities ? data.communities.length : 0);
      
      if (data.communities && data.communities.length > 0) {
        console.log('\n📋 Comunidades del usuario:');
        data.communities.forEach((community, index) => {
          console.log(`  ${index + 1}. ${community.name} (ID: ${community.id})`);
          console.log(`     - isJoined: ${community.isJoined}`);
          console.log(`     - isCreator: ${community.isCreator}`);
          console.log(`     - isAdmin: ${community.isAdmin}`);
        });
      } else {
        console.log('✅ Usuario no tiene comunidades (correcto para un usuario nuevo)');
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Error en la respuesta:');
      console.log('  - Error data:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testFixedEndpoint().catch(console.error);
