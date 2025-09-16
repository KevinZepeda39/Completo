// services/networkService.js
// Servicio para manejar peticiones HTTP de manera robusta

import networkConfig, { getBackendUrl, getAPIUrl } from '../constants/networkConfig';

class NetworkService {
  constructor() {
    this.baseURL = null; // Se inicializará dinámicamente
    this.timeout = networkConfig.TIMEOUT;
    this.retryAttempts = networkConfig.RETRY_ATTEMPTS;
    this.retryDelay = networkConfig.RETRY_DELAY;
  }

  // Función para inicializar la URL base
  async initializeBaseURL() {
    if (!this.baseURL) {
      this.baseURL = await getBackendUrl();
      console.log('🌐 URL base inicializada:', this.baseURL);
    }
    return this.baseURL;
  }

  // Función para hacer peticiones HTTP con timeout
  async makeRequest(url, options = {}, attempt = 1) {
    try {
      // Inicializar URL base si no está inicializada
      await this.initializeBaseURL();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
      
      console.log(`🌐 Intento ${attempt} - Petición a: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Manejar diferentes códigos de estado HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createHttpError(response.status, response.statusText, errorData);
      }

      const data = await response.json();
      console.log('✅ Respuesta exitosa:', data);
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(networkConfig.ERROR_MESSAGES.TIMEOUT);
      }
      throw error;
    }
  }

  // Función para hacer peticiones con reintentos automáticos
  async requestWithRetry(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(url, options, attempt);
      } catch (error) {
        console.log(`❌ Intento ${attempt} falló:`, error.message);
        lastError = error;

        // Si es el último intento, no esperar
        if (attempt === this.retryAttempts) {
          break;
        }

        // Esperar antes del siguiente intento (tiempo exponencial)
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw this.enhanceErrorMessage(lastError);
  }

  // Función para actualizar información del usuario
  async updateUserProfile(userId, userData) {
    return this.requestWithRetry(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Función para crear un reporte
  async createReport(reportData) {
    return this.requestWithRetry('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  // Función para obtener reportes
  async getReports(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const url = queryString ? `/api/reports?${queryString}` : '/api/reports';
    return this.requestWithRetry(url, { method: 'GET' });
  }

  // Función para obtener detalles de un reporte
  async getReportDetails(reportId) {
    return this.requestWithRetry(`/api/reports/${reportId}`, { method: 'GET' });
  }

  // Función para actualizar estado de un reporte
  async updateReportStatus(reportId, status) {
    return this.requestWithRetry(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Función para crear error HTTP personalizado
  createHttpError(status, statusText, data = {}) {
    const error = new Error(statusText || 'Error de conexión');
    error.status = status;
    error.data = data;
    error.name = 'HttpError';
    return error;
  }

  // Función para mejorar mensajes de error
  enhanceErrorMessage(error) {
    let message = networkConfig.ERROR_MESSAGES.GENERIC_ERROR;

    if (error.message.includes('Timeout')) {
      message = networkConfig.ERROR_MESSAGES.TIMEOUT;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      message = networkConfig.ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.status === 401) {
      message = networkConfig.ERROR_MESSAGES.UNAUTHORIZED;
    } else if (error.status === 404) {
      message = networkConfig.ERROR_MESSAGES.NOT_FOUND;
    } else if (error.status === 422) {
      message = networkConfig.ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (error.status === 500) {
      message = networkConfig.ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.message.includes('ya está registrado') || error.message.includes('already exists')) {
      message = networkConfig.ERROR_MESSAGES.DUPLICATE_EMAIL;
    } else if (error.message) {
      message = error.message;
    }

    const enhancedError = new Error(message);
    enhancedError.originalError = error;
    enhancedError.status = error.status;
    enhancedError.data = error.data;
    return enhancedError;
  }

  // Función para verificar conectividad
  async checkConnectivity() {
    try {
      await this.initializeBaseURL();
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 segundos máximo
      });
      return response.ok;
    } catch (error) {
      console.log('❌ Error de conectividad:', error.message);
      return false;
    }
  }
}

export default new NetworkService();
