// services/replyService.js
import ipDetector from './ipDetector';

class ReplyService {
  constructor() {
    this.ipDetector = ipDetector;
  }

  async createReply(commentId, replyText) {
    try {
      const url = this.ipDetector.getFullURL('api/comments/replies');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idComentarioPadre: commentId,
          idUsuario: this.getCurrentUserId(),
          respuesta: replyText
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear respuesta');
      }

      return data;
    } catch (error) {
      console.error('Error en createReply:', error);
      throw error;
    }
  }

  async getReplies(commentId) {
    try {
      const url = this.ipDetector.getFullURL(`api/comments/${commentId}/replies`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener respuestas');
      }

      return data;
    } catch (error) {
      console.error('Error en getReplies:', error);
      throw error;
    }
  }

  getCurrentUserId() {
    // Importar dinámicamente para evitar dependencias circulares
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    // En una implementación real, esto debería obtener el ID del usuario actual
    // Por ahora, retornamos un ID temporal
    return 179; // ID del usuario actual (Jenny)
  }
}

export default new ReplyService();
