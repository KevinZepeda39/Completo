// services/commentService.js
// Servicio para manejar comentarios de reportes

import AsyncStorage from '@react-native-async-storage/async-storage';
import ipDetector from './ipDetector';

class CommentService {
  constructor() {
    this.isInitialized = false;
  }

  // ✅ INICIALIZAR SERVICIO
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('🚀 Inicializando CommentService...');
      const serverIP = await ipDetector.detectServerIP();
      
      if (serverIP) {
        console.log('✅ Servidor detectado en CommentService:', serverIP);
        this.isInitialized = true;
        return true;
      } else {
        console.error('❌ No se pudo detectar el servidor en CommentService');
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando CommentService:', error);
      return false;
    }
  }

  // ✅ OBTENER USUARIO ACTUAL
  async getCurrentUser() {
    try {
      let userData = await AsyncStorage.getItem('userSession');
      
      if (userData) {
        const session = JSON.parse(userData);
        const user = {
          idUsuario: session.user?.idUsuario || session.user?.id,
          nombre: session.user?.nombre || session.user?.name,
          correo: session.user?.correo || session.user?.email,
          token: session.token
        };
        
        console.log('👤 Current user from CommentService:', { 
          id: user.idUsuario, 
          name: user.nombre 
        });
        
        return user;
      }

      // Fallback
      userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.idUsuario && user.idUsuario !== 1) {
          return user;
        }
      }

      console.log('⚠️ No valid user session found in CommentService');
      return null;

    } catch (error) {
      console.error('❌ Error getting current user in CommentService:', error);
      return null;
    }
  }

  // ✅ OBTENER COMENTARIOS DE UN REPORTE
  async getReportComments(reportId) {
    try {
      console.log('💬 Obteniendo comentarios para reporte:', reportId);

      // Inicializar si no está inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'No se pudo conectar al servidor'
          };
        }
      }

      const response = await fetch(ipDetector.getFullURL(`/api/reports/${reportId}/comments`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status for comments:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Comentarios obtenidos exitosamente:', result.comments?.length || 0, 'comentarios');
        
        return {
          success: true,
          comments: result.comments || [],
          commentCount: result.commentCount || 0
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Error obteniendo comentarios:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error en getReportComments:', error);
      return {
        success: false,
        error: 'Error de red al obtener comentarios'
      };
    }
  }

  // ✅ CREAR COMENTARIO
  async createComment(reportId, commentText) {
    try {
      console.log('💬 Creando comentario para reporte:', reportId);
      console.log('📝 Texto del comentario:', commentText);

      // Inicializar si no está inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'No se pudo conectar al servidor'
          };
        }
      }

      // Obtener usuario actual
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'Usuario no encontrado. Por favor, inicia sesión de nuevo.'
        };
      }

      const commentData = {
        idReporte: reportId,
        idUsuario: currentUser.idUsuario,
        comentario: commentText.trim()
      };

      console.log('📊 Datos del comentario:', commentData);

      const response = await fetch(ipDetector.getFullURL('/api/reports/comments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      console.log('📡 Response status for create comment:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Comentario creado exitosamente');
        
        return {
          success: true,
          comment: result.comment,
          message: 'Comentario agregado exitosamente'
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Error creando comentario:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error en createComment:', error);
      return {
        success: false,
        error: 'Error de red al crear comentario'
      };
    }
  }

  // ✅ OBTENER CONTADOR DE COMENTARIOS
  async getCommentCount(reportId) {
    try {
      console.log('🔢 Obteniendo contador de comentarios para reporte:', reportId);

      // Inicializar si no está inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return 0;
        }
      }

      const response = await fetch(ipDetector.getFullURL(`/api/reports/${reportId}/comments/count`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const count = result.count || 0;
        console.log('✅ Contador de comentarios:', count);
        return count;
      } else {
        console.log('⚠️ No se pudo obtener contador de comentarios, usando 0');
        return 0;
      }

    } catch (error) {
      console.error('❌ Error obteniendo contador de comentarios:', error);
      return 0;
    }
  }

  // ✅ ELIMINAR COMENTARIO
  async deleteComment(commentId) {
    try {
      console.log('🗑️ Eliminando comentario:', commentId);

      // Inicializar si no está inicializado
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'No se pudo conectar al servidor'
          };
        }
      }

      const response = await fetch(ipDetector.getFullURL(`/api/reports/comments/${commentId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Comentario eliminado exitosamente');
        return {
          success: true,
          message: 'Comentario eliminado exitosamente'
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Error eliminando comentario:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error en deleteComment:', error);
      return {
        success: false,
        error: 'Error de red al eliminar comentario'
      };
    }
  }
}

export default new CommentService();
