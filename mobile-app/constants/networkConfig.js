// constants/networkConfig.js
// Configuración para manejar diferentes entornos de red con detección automática de IP

import ipDetector from '../services/ipDetector';

const networkConfig = {
  // URLs del backend para diferentes entornos
  BACKEND_URLS: {
    // Desarrollo local (se detecta automáticamente)
    LOCAL: null, // Se detectará automáticamente
    
    // Desarrollo en emulador
    EMULATOR: 'http://10.0.2.2:3001',
    
    // Producción - Railway
    PRODUCTION: 'https://miciudadsv-mobile-api.railway.app'
  },

  // Configuración de timeout y reintentos
  TIMEOUT: 15000, // 15 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo

  // Configuración de detección de red
  NETWORK_CHECK_INTERVAL: 5000, // 5 segundos

  // Mensajes de error personalizados
  ERROR_MESSAGES: {
    TIMEOUT: 'La conexión tardó demasiado. Verifica tu internet.',
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
    SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
    UNAUTHORIZED: 'Sesión expirada. Inicia sesión nuevamente.',
    NOT_FOUND: 'Recurso no encontrado.',
    VALIDATION_ERROR: 'Datos inválidos. Revisa la información.',
    DUPLICATE_EMAIL: 'Este correo ya está siendo usado por otra cuenta.',
    GENERIC_ERROR: 'Ocurrió un error inesperado. Intenta nuevamente.',
    IP_DETECTION_FAILED: 'No se pudo conectar al servidor. Verifica que esté corriendo.'
  }
};

// Función para obtener la URL del backend según el entorno
export const getBackendUrl = async () => {
  if (__DEV__) {
    // En desarrollo, detectar automáticamente la IP
    try {
      const detectedIP = await ipDetector.detectServerIP();
      return `http://${detectedIP}:3001`;
    } catch (error) {
      console.error('❌ Error detectando IP, usando IP por defecto:', error);
      return 'http://192.168.1.13:3001'; // IP por defecto
    }
  }
  return networkConfig.BACKEND_URLS.PRODUCTION;
};

// Función para obtener la URL de la API
export const getAPIUrl = async () => {
  const backendUrl = await getBackendUrl();
  return `${backendUrl}/api`;
};

// Función para verificar si estamos en la misma red
export const isLocalNetwork = () => {
  return __DEV__;
};

// Función para limpiar caché de IP (útil para debugging)
export const clearIPCache = async () => {
  await ipDetector.clearCache();
};

export default networkConfig;
