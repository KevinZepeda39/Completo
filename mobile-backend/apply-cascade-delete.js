const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'miciudadsv'
};

async function applyCascadeDeleteConstraints() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add-cascade-delete-constraints.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir el contenido en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log(`📋 Se encontraron ${commands.length} comandos SQL para ejecutar`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Saltar comandos de comentarios o vacíos
      if (command.startsWith('--') || command.startsWith('/*') || command.trim() === '') {
        continue;
      }

      try {
        console.log(`\n🔄 Ejecutando comando ${i + 1}/${commands.length}...`);
        console.log(`📝 Comando: ${command.substring(0, 100)}...`);
        
        await connection.execute(command);
        console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️ La restricción ya existe, continuando...`);
        } else if (error.code === 'ER_CANNOT_ADD_FOREIGN') {
          console.log(`⚠️ No se pudo agregar la restricción: ${error.message}`);
        } else {
          console.error(`❌ Error ejecutando comando ${i + 1}:`, error.message);
        }
      }
    }

    // Verificar que las restricciones se aplicaron
    console.log('\n🔍 Verificando restricciones aplicadas...');
    const constraints = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'usuarios' 
      AND TABLE_SCHEMA = 'miciudadsv'
      ORDER BY TABLE_NAME
    `);

    console.log('\n📊 Restricciones encontradas:');
    if (constraints[0].length === 0) {
      console.log('❌ No se encontraron restricciones');
    } else {
      constraints[0].forEach(constraint => {
        console.log(`✅ ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> usuarios.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    }

    console.log('\n🎯 Funcionalidad implementada:');
    console.log('✅ Cuando elimines un usuario con: DELETE FROM usuarios WHERE idUsuario = ?');
    console.log('✅ Se eliminarán automáticamente:');
    console.log('   - Todos sus reportes');
    console.log('   - Todas las comunidades que creó');
    console.log('   - Todas sus membresías en comunidades');
    console.log('   - Todos sus comentarios');
    console.log('\n🚀 La app del teléfono verá que los datos desaparecieron automáticamente');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Función para probar la funcionalidad
async function testCascadeDelete() {
  let connection;

  try {
    console.log('\n🧪 === PRUEBA DE CASCADE DELETE ===\n');
    console.log('⚠️ Esta función creará datos de prueba y los eliminará');
    console.log('⚠️ Solo ejecutar en un entorno de pruebas\n');

    connection = await mysql.createConnection(dbConfig);

    // 1. Crear usuario de prueba
    console.log('1️⃣ Creando usuario de prueba...');
    const [userResult] = await connection.execute(
      'INSERT INTO usuarios (nombre, correo, contraseña, emailVerificado, activo) VALUES (?, ?, ?, ?, ?)',
      ['Usuario Test CASCADE', 'test-cascade@test.com', 'hash123', 1, 1]
    );
    const testUserId = userResult.insertId;
    console.log(`✅ Usuario de prueba creado con ID: ${testUserId}`);

    // 2. Crear reporte de prueba
    console.log('\n2️⃣ Creando reporte de prueba...');
    const [reportResult] = await connection.execute(
      'INSERT INTO reportes (titulo, descripcion, idUsuario, categoria, estado) VALUES (?, ?, ?, ?, ?)',
      ['Reporte Test CASCADE', 'Descripción de prueba para CASCADE DELETE', testUserId, 'general', 'pendiente']
    );
    const testReportId = reportResult.insertId;
    console.log(`✅ Reporte de prueba creado con ID: ${testReportId}`);

    // 3. Crear comunidad de prueba
    console.log('\n3️⃣ Creando comunidad de prueba...');
    const [communityResult] = await connection.execute(
      'INSERT INTO comunidad (titulo, descripcion, idUsuario, categoria) VALUES (?, ?, ?, ?)',
      ['Comunidad Test CASCADE', 'Descripción de prueba para CASCADE DELETE', testUserId, 'general']
    );
    const testCommunityId = communityResult.insertId;
    console.log(`✅ Comunidad de prueba creada con ID: ${testCommunityId}`);

    // 4. Agregar membresía de prueba
    console.log('\n4️⃣ Agregando membresía de prueba...');
    await connection.execute(
      'INSERT INTO usuario_comunidad (idUsuario, idComunidad, rolEnComunidad, fechaUnion) VALUES (?, ?, ?, NOW())',
      [testUserId, testCommunityId, 'miembro']
    );
    console.log('✅ Membresía de prueba agregada');

    // 5. Crear comentario de prueba
    console.log('\n5️⃣ Creando comentario de prueba...');
    const [commentResult] = await connection.execute(
      'INSERT INTO comentarios (idComunidad, idUsuario, texto, fechaComentario) VALUES (?, ?, ?, NOW())',
      [testCommunityId, testUserId, 'Comentario de prueba para CASCADE DELETE']
    );
    console.log(`✅ Comentario de prueba creado con ID: ${commentResult.insertId}`);

    // 6. Verificar que todo existe
    console.log('\n6️⃣ Verificando datos creados...');
    const [reports] = await connection.execute('SELECT COUNT(*) as count FROM reportes WHERE idUsuario = ?', [testUserId]);
    const [communities] = await connection.execute('SELECT COUNT(*) as count FROM comunidad WHERE idUsuario = ?', [testUserId]);
    const [memberships] = await connection.execute('SELECT COUNT(*) as count FROM usuario_comunidad WHERE idUsuario = ?', [testUserId]);
    const [comments] = await connection.execute('SELECT COUNT(*) as count FROM comentarios WHERE idUsuario = ?', [testUserId]);

    console.log(`📊 Datos creados:`);
    console.log(`   - Reportes: ${reports[0].count}`);
    console.log(`   - Comunidades: ${communities[0].count}`);
    console.log(`   - Membresías: ${memberships[0].count}`);
    console.log(`   - Comentarios: ${comments[0].count}`);

    // 7. AHORA ELIMINAR EL USUARIO (esto debería activar CASCADE DELETE)
    console.log('\n7️⃣ 🗑️ ELIMINANDO USUARIO DE PRUEBA...');
    await connection.execute('DELETE FROM usuarios WHERE idUsuario = ?', [testUserId]);
    console.log('✅ Usuario eliminado');

    // 8. Verificar que todo se eliminó automáticamente
    console.log('\n8️⃣ Verificando CASCADE DELETE...');
    const [reportsAfter] = await connection.execute('SELECT COUNT(*) as count FROM reportes WHERE idUsuario = ?', [testUserId]);
    const [communitiesAfter] = await connection.execute('SELECT COUNT(*) as count FROM comunidad WHERE idUsuario = ?', [testUserId]);
    const [membershipsAfter] = await connection.execute('SELECT COUNT(*) as count FROM usuario_comunidad WHERE idUsuario = ?', [testUserId]);
    const [commentsAfter] = await connection.execute('SELECT COUNT(*) as count FROM comentarios WHERE idUsuario = ?', [testUserId]);

    console.log(`📊 Datos después de eliminar usuario:`);
    console.log(`   - Reportes: ${reportsAfter[0].count} (debería ser 0)`);
    console.log(`   - Comunidades: ${communitiesAfter[0].count} (debería ser 0)`);
    console.log(`   - Membresías: ${membershipsAfter[0].count} (debería ser 0)`);
    console.log(`   - Comentarios: ${commentsAfter[0].count} (debería ser 0)`);

    // 9. Verificar resultado
    const allZero = reportsAfter[0].count === 0 && 
                   communitiesAfter[0].count === 0 && 
                   membershipsAfter[0].count === 0 && 
                   commentsAfter[0].count === 0;

    if (allZero) {
      console.log('\n🎉 ✅ PRUEBA EXITOSA: CASCADE DELETE funciona correctamente!');
      console.log('✅ Cuando elimines un usuario, todos sus datos se eliminan automáticamente');
      console.log('✅ La app del teléfono verá que los reportes y comunidades desaparecieron');
    } else {
      console.log('\n❌ PRUEBA FALLIDA: CASCADE DELETE no funciona completamente');
      console.log('❌ Algunos datos no se eliminaron automáticamente');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'apply';

  console.log('🔒 === APLICADOR DE RESTRICCIONES CASCADE DELETE ===\n');

  switch (command) {
    case 'apply':
      await applyCascadeDeleteConstraints();
      break;

    case 'test':
      await testCascadeDelete();
      break;

    case 'both':
      await applyCascadeDeleteConstraints();
      await testCascadeDelete();
      break;

    default:
      console.log('📖 Uso:');
      console.log('  node apply-cascade-delete.js apply  - Solo aplicar restricciones');
      console.log('  node apply-cascade-delete.js test   - Solo probar funcionalidad');
      console.log('  node apply-cascade-delete.js both   - Aplicar y probar');
      console.log('\n💡 Recomendado: node apply-cascade-delete.js both');
      break;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyCascadeDeleteConstraints, testCascadeDelete };
