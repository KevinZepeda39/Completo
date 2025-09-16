// test-notifications.js - Script para diagnosticar problemas de notificaciones
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

console.log('🔍 DIAGNÓSTICO DE NOTIFICACIONES');
console.log('================================');

// 1. Verificar información del dispositivo
console.log('\n📱 INFORMACIÓN DEL DISPOSITIVO:');
console.log('App Ownership:', Constants.appOwnership);
console.log('Platform:', Constants.platform);
console.log('Device Type:', Device.deviceType);
console.log('Is Device:', Device.isDevice);

// 2. Verificar permisos actuales
async function checkPermissions() {
  try {
    console.log('\n🔐 VERIFICANDO PERMISOS:');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Estado actual de permisos:', existingStatus);
    
    if (existingStatus !== 'granted') {
      console.log('⚠️ Permisos no otorgados. Solicitando...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Nuevo estado de permisos:', status);
      return status === 'granted';
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
    return false;
  }
}

// 3. Verificar configuración del sistema
async function checkSystemSettings() {
  try {
    console.log('\n⚙️ CONFIGURACIÓN DEL SISTEMA:');
    
    // Verificar si las notificaciones están habilitadas
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Estado de permisos:', status);
    
    // Verificar configuración del handler
    console.log('Handler configurado:', !!Notifications.getNotificationHandler());
    
    return status === 'granted';
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return false;
  }
}

// 4. Probar envío de notificación
async function testNotification() {
  try {
    console.log('\n🧪 PROBANDO NOTIFICACIÓN:');
    
    const notification = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Prueba de Notificación',
        body: 'Si ves esto, las notificaciones funcionan correctamente',
        data: { type: 'test' },
        sound: true,
        badge: 1,
      },
      trigger: null, // Enviar inmediatamente
    });
    
    console.log('✅ Notificación de prueba enviada con ID:', notification);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
    return false;
  }
}

// 5. Función principal
async function runDiagnostic() {
  console.log('\n🚀 INICIANDO DIAGNÓSTICO...');
  
  // Verificar permisos
  const hasPermissions = await checkPermissions();
  if (!hasPermissions) {
    console.log('\n❌ DIAGNÓSTICO FALLIDO: No se otorgaron permisos');
    return;
  }
  
  // Verificar configuración
  const isConfigured = await checkSystemSettings();
  if (!isConfigured) {
    console.log('\n❌ DIAGNÓSTICO FALLIDO: Configuración incorrecta');
    return;
  }
  
  // Probar notificación
  const notificationSent = await testNotification();
  if (notificationSent) {
    console.log('\n✅ DIAGNÓSTICO EXITOSO: Las notificaciones deberían funcionar');
    console.log('\n💡 CONSEJOS:');
    console.log('- Asegúrate de que tu teléfono no esté en modo "No molestar"');
    console.log('- Verifica que las notificaciones estén habilitadas en Configuración > Notificaciones');
    console.log('- Si usas Expo Go, las notificaciones solo funcionan cuando la app está abierta');
  } else {
    console.log('\n❌ DIAGNÓSTICO FALLIDO: No se pudo enviar notificación de prueba');
  }
}

// Ejecutar diagnóstico
runDiagnostic().catch(error => {
  console.error('💥 Error en diagnóstico:', error);
});
