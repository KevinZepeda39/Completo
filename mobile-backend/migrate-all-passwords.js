// backend/migrate-all-passwords.js
// Script para migrar todas las contraseñas existentes a bcrypt

const bcrypt = require('bcrypt');
const { execute } = require('./config/database');

const SALT_ROUNDS = 12;

async function migrateAllPasswords() {
  try {
    console.log('🔄 === MIGRATING ALL PASSWORDS TO BCRYPT ===');
    console.log('⏰ Started at:', new Date().toISOString());
    
    // Verificar conexión a la base de datos
    console.log('🔍 Testing database connection...');
    await execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Obtener todos los usuarios
    console.log('👥 Fetching all users...');
    const users = await execute('SELECT idUsuario, nombre, correo, contraseña FROM usuarios');
    console.log(`📊 Found ${users.length} users to process`);
    
    if (users.length === 0) {
      console.log('ℹ️ No users found to migrate');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Procesar cada usuario
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.nombre} (${user.correo})`);
        
        // Verificar si la contraseña ya está hasheada
        const isHashed = /^\$2[ab]\$\d{1,2}\$/.test(user.contraseña);
        
        if (isHashed) {
          console.log('ℹ️ Password already hashed, skipping...');
          skippedCount++;
          continue;
        }
        
        // Verificar si la contraseña está vacía o es nula
        if (!user.contraseña || user.contraseña.trim() === '') {
          console.log('⚠️ Empty password detected, setting default...');
          const defaultPassword = 'password123';
          const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
          
          await execute(
            'UPDATE usuarios SET contraseña = ? WHERE idUsuario = ?',
            [hashedPassword, user.idUsuario]
          );
          
          console.log('✅ Default password set and hashed');
          migratedCount++;
          continue;
        }
        
        // Hashear la contraseña existente
        console.log('🔐 Hashing existing password...');
        const hashedPassword = await bcrypt.hash(user.contraseña, SALT_ROUNDS);
        
        // Actualizar en la base de datos
        await execute(
          'UPDATE usuarios SET contraseña = ? WHERE idUsuario = ?',
          [hashedPassword, user.idUsuario]
        );
        
        console.log('✅ Password migrated successfully');
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.nombre}:`, error.message);
        errorCount++;
      }
    }
    
    // Resumen final
    console.log('\n📊 === MIGRATION SUMMARY ===');
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️ Skipped (already hashed): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📈 Total processed: ${users.length} users`);
    console.log('⏰ Completed at:', new Date().toISOString());
    
    if (errorCount > 0) {
      console.log('\n⚠️ Some users had errors during migration');
      console.log('💡 Check the logs above for details');
    } else {
      console.log('\n🎉 All passwords migrated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Función para verificar el estado de las contraseñas
async function checkPasswordStatus() {
  try {
    console.log('🔍 === CHECKING PASSWORD STATUS ===');
    
    const users = await execute('SELECT idUsuario, nombre, correo, contraseña FROM usuarios LIMIT 10');
    
    console.log('\n📊 Password Status Report:');
    console.log('=' .repeat(60));
    
    for (const user of users) {
      const isHashed = /^\$2[ab]\$\d{1,2}\$/.test(user.contraseña);
      const status = isHashed ? '✅ Hashed' : '❌ Plain Text';
      const passwordLength = user.contraseña ? user.contraseña.length : 0;
      
      console.log(`${user.nombre.padEnd(20)} | ${user.correo.padEnd(25)} | ${status} (${passwordLength} chars)`);
    }
    
    // Estadísticas generales
    const allUsers = await execute('SELECT contraseña FROM usuarios');
    const hashedCount = allUsers.filter(u => /^\$2[ab]\$\d{1,2}\$/.test(u.contraseña)).length;
    const plainCount = allUsers.length - hashedCount;
    
    console.log('\n📈 Overall Statistics:');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Hashed passwords: ${hashedCount}`);
    console.log(`Plain text passwords: ${plainCount}`);
    console.log(`Security level: ${plainCount === 0 ? '🔒 SECURE' : '⚠️ NEEDS MIGRATION'}`);
    
  } catch (error) {
    console.error('❌ Error checking password status:', error);
  }
}

// Función para crear un usuario de prueba con contraseña hasheada
async function createTestUser() {
  try {
    console.log('🧪 === CREATING TEST USER ===');
    
    const testPassword = 'test123456';
    const hashedPassword = await bcrypt.hash(testPassword, SALT_ROUNDS);
    
    const result = await execute(`
      INSERT INTO usuarios (nombre, correo, contraseña, emailVerificado, fechaCreacion, fechaActualizacion, activo)
      VALUES (?, ?, ?, 1, NOW(), NOW(), 1)
    `, ['Usuario Test', 'test@example.com', hashedPassword]);
    
    console.log('✅ Test user created successfully');
    console.log(`User ID: ${result.insertId}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Hashed: ${hashedPassword.substring(0, 20)}...`);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await migrateAllPasswords();
      break;
    case 'check':
      await checkPasswordStatus();
      break;
    case 'test':
      await createTestUser();
      break;
    default:
      console.log('🔧 Password Migration Tool');
      console.log('\nUsage:');
      console.log('  node migrate-all-passwords.js migrate  - Migrate all passwords to bcrypt');
      console.log('  node migrate-all-passwords.js check    - Check password status');
      console.log('  node migrate-all-passwords.js test     - Create test user with hashed password');
      console.log('\nExamples:');
      console.log('  node migrate-all-passwords.js migrate');
      console.log('  node migrate-all-passwords.js check');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateAllPasswords,
  checkPasswordStatus,
  createTestUser
};
