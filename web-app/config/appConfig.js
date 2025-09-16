// config/appConfig.js
// Configuración de la aplicación web

const appConfig = {
  // URLs para diferentes entornos
  API_URLS: {
    // Desarrollo local
    LOCAL: 'http://localhost:3002',
    
    // Producción - Railway
    PRODUCTION: 'https://miciudadsv-web-api.railway.app'
  },

  // URLs de imágenes
  IMAGE_URLS: {
    // Desarrollo local
    LOCAL: 'http://localhost:3000/uploads',
    
    // Producción - Railway
    PRODUCTION: 'https://miciudadsv-images.railway.app/uploads'
  },

  // Función para obtener la URL de la API según el entorno
  getApiUrl: () => {
    if (process.env.NODE_ENV === 'development') {
      return appConfig.API_URLS.LOCAL;
    }
    return appConfig.API_URLS.PRODUCTION;
  },

  // Función para obtener la URL de imágenes según el entorno
  getImageUrl: () => {
    if (process.env.NODE_ENV === 'development') {
      return appConfig.IMAGE_URLS.LOCAL;
    }
    return appConfig.IMAGE_URLS.PRODUCTION;
  },

  // Función para construir URL completa de imagen
  getFullImageUrl: (imagePath) => {
    const baseUrl = appConfig.getImageUrl();
    if (!imagePath) return null;
    
    // Remover barra inicial si existe
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    return `${baseUrl}/${cleanPath}`;
  },

  // Configuración de puertos
  PORTS: {
    WEB_APP: process.env.PORT || 3000,
    WEB_API: process.env.API_PORT || 3002
  },

  // Configuración de CORS
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://miciudadsv-web.railway.app',
    'https://miciudadsv-mobile-api.railway.app'
  ]
};

module.exports = appConfig;
