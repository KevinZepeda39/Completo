// config/serverConfig.js
// Configuración del servidor para facilitar el cambio de IP

export const SERVER_CONFIG = {
  // 🔧 CONFIGURACIÓN DEL SERVIDOR
  // Cambia esta IP cuando muevas el proyecto a otra computadora
  DEFAULT_IP: '192.168.1.13',
  
  // Puerto del servidor
  PORT: 3000,
  
  // URLs de prueba comunes (se probarán automáticamente)
  COMMON_IPS: [
    '192.168.1.13',    // IP original
    '192.168.1.100',   // IP común
    '192.168.1.101',   // IP común
    '192.168.1.102',   // IP común
    '192.168.0.13',    // Red 192.168.0.x
    '192.168.0.100',   // Red 192.168.0.x
    '10.0.2.2',        // Emulador Android
    'localhost',       // Localhost
    '127.0.0.1',       // Localhost IP
  ],
  
  // Configuración de timeout
  TIMEOUT: 3000, // 3 segundos para probar cada IP
  
  // Configuración de caché
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas
};

// Función para obtener la URL completa del servidor
export const getServerURL = (ip = SERVER_CONFIG.DEFAULT_IP) => {
  return `http://${ip}:${SERVER_CONFIG.PORT}`;
};

// Función para obtener la URL de la API
export const getAPIURL = (ip = SERVER_CONFIG.DEFAULT_IP) => {
  return `${getServerURL(ip)}/api`;
};

// Función para obtener la IP por defecto
export const getDefaultIP = () => {
  return SERVER_CONFIG.DEFAULT_IP;
};

// Función para obtener las IPs comunes para probar
export const getCommonIPs = () => {
  return SERVER_CONFIG.COMMON_IPS;
};

export default SERVER_CONFIG;
