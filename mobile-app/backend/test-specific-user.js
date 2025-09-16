const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'miciudadsv'
};

async function testSpecificUser() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // ID del usuario a probar (el último usuario creado según el debug anterior)
    const testUserId = 156;
    
    console.log(`\n🧪 === PROBANDO USUARIO ESPECÍFICO ID: ${testUserId} ===`);
    
    // 1. Verificar si el usuario existe
    const [userResult] = await connection.execute(
      'SELECT idUsuario, nombre, correo, fechaCreacion FROM usuarios WHERE idUsuario = ?',
      [testUserId]
    );
    
    if (userResult.length === 0) {
      console.log(`❌ Usuario ${testUserId} no existe`);
      return;
    }
    
    const user = userResult[0];
    console.log(`✅ Usuario encontrado: ${user.nombre} (${user.correo})`);
    
    // 2. Verificar si es creador de alguna comunidad
    const [creatorCommunities] = await connection.execute(
      'SELECT idComunidad, titulo FROM comunidad WHERE idUsuario = ?',
      [testUserId]
    );
    
    if (creatorCommunities.length === 0) {
      console.log(`✅ Usuario ${testUserId} NO es creador de ninguna comunidad`);
    } else {
      console.log(`🏗️ Usuario ${testUserId} ES creador de ${creatorCommunities.length} comunidades:`);
      creatorCommunities.forEach(comm => {
        console.log(`  - ${comm.titulo} (ID: ${comm.idComunidad})`);
      });
    }
    
    // 3. Verificar membresías en usuario_comunidad
    const [memberships] = await connection.execute(
      'SELECT idComunidad, rolEnComunidad FROM usuario_comunidad WHERE idUsuario = ?',
      [testUserId]
    );
    
    if (memberships.length === 0) {
      console.log(`✅ Usuario ${testUserId} NO tiene membresías en ninguna comunidad`);
    } else {
      console.log(`🔗 Usuario ${testUserId} tiene ${memberships.length} membresías:`);
      memberships.forEach(membership => {
        console.log(`  - Comunidad ID: ${membership.idComunidad}, Rol: ${membership.rolEnComunidad}`);
      });
    }
    
    // 4. Probar la query exacta de getAllCommunities
    console.log(`\n🧪 === PROBANDO QUERY getAllCommunities ===`);
    
    const testQuery = `
      SELECT 
        c.idComunidad as id,
        c.titulo as name,
        c.descripcion as description,
        c.categoria as category,
        NULL as imagen,
        c.fechaCreacion,
        u.nombre as creadorNombre,
        c.idUsuario as creadorId,
        COUNT(DISTINCT uc.idUsuario) as memberCount,
        CASE 
          WHEN ucu.idUsuario IS NOT NULL THEN 1 
          ELSE 0 
        END as isJoined,
        CASE 
          WHEN c.idUsuario = ? THEN 1
          WHEN ucu.rolEnComunidad = 'administrador' THEN 1
          ELSE 0 
        END as isAdmin,
        CASE 
          WHEN c.idUsuario = ? THEN 1
          ELSE 0 
        END as isCreator
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      LEFT JOIN usuario_comunidad uc ON c.idComunidad = uc.idComunidad
      LEFT JOIN usuario_comunidad ucu ON c.idComunidad = ucu.idComunidad AND ucu.idUsuario = ?
      WHERE c.estado = 'activa' OR c.estado IS NULL
      GROUP BY c.idComunidad, c.titulo, c.descripcion, c.categoria, c.fechaCreacion, u.nombre, c.idUsuario, ucu.idUsuario, ucu.rolEnComunidad
      ORDER BY c.fechaCreacion DESC
      LIMIT 10
    `;
    
    console.log('🔍 Ejecutando query con parámetros:', [testUserId, testUserId, testUserId]);
    
    const [testResults] = await connection.execute(testQuery, [testUserId, testUserId, testUserId]);
    
    console.log(`\n📊 Resultados para usuario ${testUserId}:`);
    testResults.forEach((community, index) => {
      console.log(`\n  ${index + 1}. Comunidad: ${community.name} (ID: ${community.id})`);
      console.log(`     - isJoined: ${community.isJoined} (${community.isJoined === 1 ? 'UNIDO' : 'NO UNIDO'})`);
      console.log(`     - isCreator: ${community.isCreator} (${community.isCreator === 1 ? 'CREADOR' : 'NO CREADOR'})`);
      console.log(`     - isAdmin: ${community.isAdmin} (${community.isAdmin === 1 ? 'ADMIN' : 'NO ADMIN'})`);
      console.log(`     - Creador ID: ${community.creadorId}, Nombre: ${community.creadorNombre}`);
      console.log(`     - Miembros: ${community.memberCount}`);
      
      // Verificar si hay discrepancia
      if (community.isCreator === 1 && community.creadorId !== testUserId) {
        console.log(`     ⚠️  PROBLEMA: isCreator = 1 pero creadorId (${community.creadorId}) ≠ testUserId (${testUserId})`);
      }
    });
    
    // 5. Verificar si hay algún problema con el GROUP BY
    console.log(`\n🔍 === VERIFICANDO PROBLEMAS DE GROUP BY ===`);
    
    // Probar sin GROUP BY para ver si hay duplicados
    const simpleQuery = `
      SELECT 
        c.idComunidad,
        c.titulo,
        c.idUsuario as creadorId,
        u.nombre as creadorNombre,
        ucu.idUsuario as joinedUserId,
        ucu.rolEnComunidad
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      LEFT JOIN usuario_comunidad ucu ON c.idComunidad = ucu.idComunidad AND ucu.idUsuario = ?
      WHERE c.estado = 'activa' OR c.estado IS NULL
      ORDER BY c.fechaCreacion DESC
      LIMIT 5
    `;
    
    const [simpleResults] = await connection.execute(simpleQuery, [testUserId]);
    
    console.log(`\n📊 Resultados sin GROUP BY (primeras 5 comunidades):`);
    simpleResults.forEach((community, index) => {
      console.log(`\n  ${index + 1}. Comunidad: ${community.titulo} (ID: ${community.idComunidad})`);
      console.log(`     - Creador ID: ${community.creadorId}, Nombre: ${community.creadorNombre}`);
      console.log(`     - Usuario unido: ${community.joinedUserId || 'NO UNIDO'}`);
      console.log(`     - Rol: ${community.rolEnComunidad || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
testSpecificUser().catch(console.error);
