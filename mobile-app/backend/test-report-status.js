// test-report-status.js - Script para probar el endpoint de reportes
const BASE_URL = 'http://192.168.1.13:3000';

async function testReportEndpoint() {
  try {
    console.log('🧪 Probando endpoint /api/reports/:id...');
    
    // Primero obtener todos los reportes para ver cuáles existen
    const reportsResponse = await fetch(`${BASE_URL}/api/reports`);
    if (!reportsResponse.ok) {
      throw new Error(`Error obteniendo reportes: ${reportsResponse.status}`);
    }
    
    const reportsData = await reportsResponse.json();
    console.log('📋 Reportes disponibles:', reportsData.data?.length || 0);
    
    if (reportsData.data && reportsData.data.length > 0) {
      // Tomar el primer reporte para probar
      const testReport = reportsData.data[0];
      console.log('🔍 Probando con reporte:', {
        id: testReport.id,
        titulo: testReport.titulo,
        estado: testReport.estado
      });
      
      // Probar el endpoint específico
      const reportResponse = await fetch(`${BASE_URL}/api/reports/${testReport.id}`);
      if (!reportResponse.ok) {
        throw new Error(`Error obteniendo reporte específico: ${reportResponse.status}`);
      }
      
      const reportData = await reportResponse.json();
      console.log('✅ Reporte obtenido exitosamente:');
      console.log('   - ID:', reportData.report?.idReporte);
      console.log('   - Título:', reportData.report?.titulo);
      console.log('   - Estado:', reportData.report?.estado);
      console.log('   - Categoría:', reportData.report?.categoria);
      console.log('   - Usuario:', reportData.report?.nombreUsuario);
      
      // Verificar que el campo estado esté presente
      if (reportData.report?.estado) {
        console.log('🎉 ✅ Campo estado presente:', reportData.report.estado);
      } else {
        console.log('❌ Campo estado NO está presente');
      }
      
    } else {
      console.log('⚠️ No hay reportes disponibles para probar');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testReportEndpoint();
