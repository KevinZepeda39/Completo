// services/reactionService.js
import ipDetector from './ipDetector';

class ReactionService {
  constructor() {
    this.ipDetector = ipDetector;
  }

  async toggleReaction(commentId, userId) {
    try {
      const url = this.ipDetector.getFullURL(`api/comments/${commentId}/reactions`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idUsuario: userId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar reacción');
      }

      return data;
    } catch (error) {
      console.error('Error en toggleReaction:', error);
      throw error;
    }
  }

  async getReactions(commentId) {
    try {
      const url = this.ipDetector.getFullURL(`api/comments/${commentId}/reactions`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener reacciones');
      }

      return data;
    } catch (error) {
      console.error('Error en getReactions:', error);
      throw error;
    }
  }
}

export default new ReactionService();
