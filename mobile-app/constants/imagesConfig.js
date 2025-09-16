// constants/imagesConfig.js
// Configuración para URLs de imágenes compartidas

const imagesConfig = {
  // URLs para diferentes entornos
  IMAGE_URLS: {
    // Desarrollo local
    LOCAL: 'http://localhost:3000/uploads',
    
    // Producción - Railway
    PRODUCTION: 'https://miciudadsv-images.railway.app/uploads'
  },

  // Función para obtener la URL de imágenes según el entorno
  getImageUrl: () => {
    if (__DEV__) {
      return imagesConfig.IMAGE_URLS.LOCAL;
    }
    return imagesConfig.IMAGE_URLS.PRODUCTION;
  },

  // Función para construir URL completa de imagen
  getFullImageUrl: (imagePath) => {
    const baseUrl = imagesConfig.getImageUrl();
    if (!imagePath) return null;
    
    // Remover barra inicial si existe
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    return `${baseUrl}/${cleanPath}`;
  },

  // Función para obtener URL de perfil
  getProfileImageUrl: (profileImage) => {
    if (!profileImage) {
      return 'https://via.placeholder.com/150x150/4CAF50/FFFFFF?text=👤';
    }
    return imagesConfig.getFullImageUrl(`profiles/${profileImage}`);
  },

  // Función para obtener URL de reporte
  getReportImageUrl: (reportImage) => {
    if (!reportImage) {
      return 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=📷';
    }
    return imagesConfig.getFullImageUrl(`reportes/${reportImage}`);
  }
};

export default imagesConfig;
