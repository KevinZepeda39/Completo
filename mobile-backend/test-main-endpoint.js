const fetch = require('node-fetch');

async function testMainEndpoint() {
  try {
    console.log('🧪 === PROBANDO ENDPOINT PRINCIPAL /api/communities ===');
    
    // Probar con el usuario 156 (el que estaba teniendo problemas)
    const userId = 156;
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId.toString()
    };
    
    console.log(`🔍 Probando con usuario ID: ${userId}`);
    console.log('📋 Headers:', headers);
    
    const response = await fetch('http://localhost:3000/api/communities', {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:');
      console.log('  - Success:', data.success);
      console.log('  - Communities count:', data.communities ? data.communities.length : 0);
      
      if (data.communities && data.communities.length > 0) {
        console.log('\n📋 Primeras 5 comunidades:');
        data.communities.slice(0, 5).forEach((community, index) => {
          console.log(`  ${index + 1}. ${community.name} (ID: ${community.id})`);
          console.log(`     - isJoined: ${community.isJoined}`);
          console.log(`     - isCreator: ${community.isCreator}`);
          console.log(`     - isAdmin: ${community.isAdmin}`);
          console.log(`     - Creador ID: ${community.creadorId}`);
          console.log(`     - Creador Nombre: ${community.creadorNombre}`);
        });
        
        // Verificar que isCreator sea false para todas las comunidades
        const communitiesWithIsCreatorTrue = data.communities.filter(c => c.isCreator === true);
        console.log(`\n🔍 Comunidades con isCreator = true: ${communitiesWithIsCreatorTrue.length}`);
        
        if (communitiesWithIsCreatorTrue.length > 0) {
          console.log('⚠️  PROBLEMA: Hay comunidades marcadas como creador por el usuario:');
          communitiesWithIsCreatorTrue.forEach(comm => {
            console.log(`  - ${comm.name} (ID: ${comm.id}) - Creador real: ${comm.creadorId}`);
          });
        } else {
          console.log('✅ CORRECTO: Todas las comunidades tienen isCreator = false para este usuario');
        }
        
        // Verificar que isJoined sea false para todas las comunidades
        const communitiesWithIsJoinedTrue = data.communities.filter(c => c.isJoined === true);
        console.log(`\n🔍 Comunidades con isJoined = true: ${communitiesWithIsJoinedTrue.length}`);
        
        if (communitiesWithIsJoinedTrue.length > 0) {
          console.log('⚠️  PROBLEMA: Hay comunidades marcadas como unidas por el usuario:');
          communitiesWithIsJoinedTrue.forEach(comm => {
            console.log(`  - ${comm.name} (ID: ${comm.id})`);
          });
        } else {
          console.log('✅ CORRECTO: Todas las comunidades tienen isJoined = false para este usuario');
        }
      } else {
        console.log('⚠️  No se recibieron comunidades');
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
testMainEndpoint().catch(console.error);
