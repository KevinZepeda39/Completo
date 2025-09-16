const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'miciudadsv'
};

async function debugCommunities() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // 1. Verificar la estructura de las tablas
    console.log('\n📋 === ESTRUCTURA DE TABLAS ===');
    
    const tables = ['usuarios', 'comunidad', 'usuario_comunidad'];
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`\n📊 Tabla: ${table}`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
        });
      } catch (error) {
        console.log(`❌ Error describiendo tabla ${table}:`, error.message);
      }
    }
    
    // 2. Verificar usuarios existentes
    console.log('\n👥 === USUARIOS EXISTENTES ===');
    const [users] = await connection.execute('SELECT idUsuario, nombre, correo, fechaCreacion FROM usuarios ORDER BY idUsuario DESC LIMIT 10');
    console.log('Usuarios (últimos 10):');
    users.forEach(user => {
      console.log(`  - ID: ${user.idUsuario}, Nombre: ${user.nombre}, Email: ${user.correo}, Fecha: ${user.fechaCreacion}`);
    });
    
    // 3. Verificar comunidades existentes
    console.log('\n🏘️ === COMUNIDADES EXISTENTES ===');
    const [communities] = await connection.execute(`
      SELECT 
        c.idComunidad,
        c.titulo,
        c.idUsuario as creadorId,
        u.nombre as creadorNombre,
        c.fechaCreacion,
        c.estado
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      ORDER BY c.fechaCreacion DESC
      LIMIT 10
    `);
    console.log('Comunidades (últimas 10):');
    communities.forEach(comm => {
      console.log(`  - ID: ${comm.idComunidad}, Título: ${comm.titulo}, Creador: ${comm.creadorNombre} (ID: ${comm.creadorId}), Estado: ${comm.estado}`);
    });
    
    // 4. Verificar membresías de usuario
    console.log('\n🔗 === MEMBRESÍAS DE USUARIO ===');
    const [memberships] = await connection.execute(`
      SELECT 
        uc.idUsuario,
        uc.idComunidad,
        uc.rolEnComunidad,
        uc.fechaUnion,
        c.titulo as comunidadNombre,
        u.nombre as usuarioNombre
      FROM usuario_comunidad uc
      LEFT JOIN comunidad c ON uc.idComunidad = c.idComunidad
      LEFT JOIN usuarios u ON uc.idUsuario = u.idUsuario
      ORDER BY uc.fechaUnion DESC
      LIMIT 15
    `);
    console.log('Membresías (últimas 15):');
    memberships.forEach(membership => {
      console.log(`  - Usuario: ${membership.usuarioNombre} (ID: ${membership.idUsuario}) -> Comunidad: ${membership.comunidadNombre} (ID: ${membership.idComunidad}), Rol: ${membership.rolEnComunidad}`);
    });
    
    // 5. Probar la query getAllCommunities para un usuario específico
    console.log('\n🧪 === PRUEBA DE QUERY getAllCommunities ===');
    
    // Probar con el último usuario creado
    if (users.length > 0) {
      const testUserId = users[0].idUsuario;
      console.log(`\n🔍 Probando getAllCommunities para usuario ID: ${testUserId} (${users[0].nombre})`);
      
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
        
        // Verificar si realmente está unido
        if (community.isJoined === 1) {
          console.log(`     ⚠️  ESTÁ MARCADO COMO UNIDO - Verificando membresía real...`);
        }
      });
      
      // 6. Verificar membresías específicas del usuario de prueba
      console.log(`\n🔍 === VERIFICANDO MEMBRESÍAS REALES DEL USUARIO ${testUserId} ===`);
      const [userMemberships] = await connection.execute(`
        SELECT 
          uc.idComunidad,
          uc.rolEnComunidad,
          uc.fechaUnion,
          c.titulo as comunidadNombre
        FROM usuario_comunidad uc
        LEFT JOIN comunidad c ON uc.idComunidad = c.idComunidad
        WHERE uc.idUsuario = ?
      `, [testUserId]);
      
      if (userMemberships.length === 0) {
        console.log(`  ✅ Usuario ${testUserId} NO tiene membresías en ninguna comunidad`);
      } else {
        console.log(`  📋 Usuario ${testUserId} tiene ${userMemberships.length} membresías:`);
        userMemberships.forEach(membership => {
          console.log(`    - Comunidad: ${membership.comunidadNombre} (ID: ${membership.idComunidad}), Rol: ${membership.rolEnComunidad}, Fecha: ${membership.fechaUnion}`);
        });
      }
      
      // 7. Verificar si es creador de alguna comunidad
      console.log(`\n🔍 === VERIFICANDO SI ES CREADOR DE ALGUNA COMUNIDAD ===`);
      const [userCommunities] = await connection.execute(`
        SELECT 
          idComunidad,
          titulo,
          fechaCreacion
        FROM comunidad
        WHERE idUsuario = ?
      `, [testUserId]);
      
      if (userCommunities.length === 0) {
        console.log(`  ✅ Usuario ${testUserId} NO es creador de ninguna comunidad`);
      } else {
        console.log(`  🏗️  Usuario ${testUserId} es creador de ${userCommunities.length} comunidades:`);
        userCommunities.forEach(community => {
          console.log(`    - Comunidad: ${community.titulo} (ID: ${community.idComunidad}), Fecha: ${community.fechaCreacion}`);
        });
      }
    }
    
    // 8. Verificar si hay algún problema con la tabla usuario_comunidad
    console.log('\n🔍 === VERIFICANDO TABLA usuario_comunidad ===');
    const [allMemberships] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM usuario_comunidad
    `);
    console.log(`Total de membresías en la tabla: ${allMemberships[0].total}`);
    
    // Verificar si hay membresías duplicadas
    const [duplicateMemberships] = await connection.execute(`
      SELECT 
        idUsuario,
        idComunidad,
        COUNT(*) as count
      FROM usuario_comunidad
      GROUP BY idUsuario, idComunidad
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateMemberships.length === 0) {
      console.log('✅ No hay membresías duplicadas');
    } else {
      console.log('⚠️  Se encontraron membresías duplicadas:');
      duplicateMemberships.forEach(dup => {
        console.log(`  - Usuario ${dup.idUsuario} en Comunidad ${dup.idComunidad}: ${dup.count} veces`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el debug
debugCommunities().catch(console.error);
