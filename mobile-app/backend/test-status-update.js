// test-status-update.js - Script para probar la actualización de estado de reportes
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testStatusUpdate() {
  try {
    console.log('🧪 === TESTING REPORT STATUS UPDATE ===\n');

    // 1. Obtener todos los reportes
    console.log('1️⃣ Obteniendo reportes existentes...');
    const reportsResponse = await fetch(`${BASE_URL}/api/reports`);
    const reportsData = await reportsResponse.json();
    
    if (!reportsData.success) {
      throw new Error('No se pudieron obtener los reportes');
    }
    
    const reports = reportsData.reports || [];
    console.log(`✅ Se encontraron ${reports.length} reportes`);
    
    if (reports.length === 0) {
      console.log('⚠️ No hay reportes para probar');
      return;
    }
    
    // 2. Seleccionar el primer reporte para la prueba
    const testReport = reports[0];
    console.log(`\n2️⃣ Probando con reporte ID: ${testReport.id}`);
    console.log(`   Título: ${testReport.title}`);
    console.log(`   Estado actual: ${testReport.status}`);
    
    // 3. Probar cambio de estado a "En progreso"
    console.log('\n3️⃣ Probando cambio de estado a "En progreso"...');
    const updateResponse = await fetch(`${BASE_URL}/api/reports/${testReport.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'En progreso' }),
    });
    
    const updateResult = await updateResponse.json();
    console.log('📡 Respuesta del servidor:', updateResult);
    
    if (updateResult.success) {
      console.log('✅ Estado actualizado exitosamente');
    } else {
      console.log('❌ Error al actualizar estado:', updateResult.error);
    }
    
    // 4. Verificar que el cambio se aplicó
    console.log('\n4️⃣ Verificando que el cambio se aplicó...');
    const verifyResponse = await fetch(`${BASE_URL}/api/reports/${testReport.id}`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      const updatedReport = verifyData.report;
      console.log(`📊 Estado después de la actualización: ${updatedReport.status}`);
      
      if (updatedReport.status === 'En progreso') {
        console.log('✅ Verificación exitosa: el estado se cambió correctamente');
      } else {
        console.log('⚠️ El estado no se cambió como se esperaba');
      }
    } else {
      console.log('❌ No se pudo verificar el cambio');
    }
    
    // 5. Probar cambio a "Resuelto"
    console.log('\n5️⃣ Probando cambio de estado a "Resuelto"...');
    const resolveResponse = await fetch(`${BASE_URL}/api/reports/${testReport.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'Resuelto' }),
    });
    
    const resolveResult = await resolveResponse.json();
    console.log('📡 Respuesta del servidor:', resolveResult);
    
    if (resolveResult.success) {
      console.log('✅ Estado cambiado a "Resuelto" exitosamente');
    } else {
      console.log('❌ Error al cambiar a "Resuelto":', resolveResult.error);
    }
    
    // 6. Probar estado inválido
    console.log('\n6️⃣ Probando estado inválido...');
    const invalidResponse = await fetch(`${BASE_URL}/api/reports/${testReport.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'EstadoInvalido' }),
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('📡 Respuesta del servidor:', invalidResult);
    
    if (!invalidResult.success) {
      console.log('✅ Correctamente rechazó el estado inválido');
    } else {
      console.log('⚠️ Debería haber rechazado el estado inválido');
    }
    
    // 7. Probar con reporte inexistente
    console.log('\n7️⃣ Probando con reporte inexistente...');
    const fakeResponse = await fetch(`${BASE_URL}/api/reports/99999/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'Pendiente' }),
    });
    
    const fakeResult = await fakeResponse.json();
    console.log('📡 Respuesta del servidor:', fakeResult);
    
    if (!fakeResult.success) {
      console.log('✅ Correctamente rechazó el reporte inexistente');
    } else {
      console.log('⚠️ Debería haber rechazado el reporte inexistente');
    }
    
    console.log('\n🎉 === PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testStatusUpdate();
}

module.exports = { testStatusUpdate };
