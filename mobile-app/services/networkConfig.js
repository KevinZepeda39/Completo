// services/networkConfig.js - Configuración de red para mejorar conectividad
class NetworkConfig {
  constructor() {
    this.baseUrl = 'http://192.168.1.13:3000';
    this.timeout = 30000; // 30 segundos
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 segundos
  }

  // ✅ CONFIGURAR HEADERS PARA REACT NATIVE
  getHeaders(contentType = null) {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'MiCiudadSV-Mobile/1.0',
      'Cache-Control': 'no-cache'
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    return headers;
  }

  // ✅ CONFIGURAR REQUEST CON TIMEOUT Y RETRY
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getHeaders(options.contentType),
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ✅ REQUEST CON RETRY AUTOMÁTICO
  async makeRequestWithRetry(url, options = {}, attempt = 1) {
    try {
      return await this.makeRequest(url, options);
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        console.log(`🔄 Reintento ${attempt}/${this.retryAttempts} después de ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
        return this.makeRequestWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  // ✅ DETERMINAR SI SE DEBE REINTENTAR
  shouldRetry(error) {
    // Reintentar en errores de red, timeout, o errores 5xx
    return (
      error.name === 'AbortError' ||
      error.message.includes('Network request failed') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    );
  }

  // ✅ DELAY ENTRE REINTENTOS
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ✅ VALIDAR CONECTIVIDAD
  async checkConnectivity() {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.log('❌ Error checking connectivity:', error.message);
      return false;
    }
  }

  // ✅ OBTENER URL COMPLETA
  getFullUrl(endpoint) {
    return `${this.baseUrl}${endpoint}`;
  }
}

export default new NetworkConfig();
