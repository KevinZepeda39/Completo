// services/serverConfig.js - Configuración manual del servidor
import AsyncStorage from '@react-native-async-storage/async-storage';

class ServerConfig {
  constructor() {
    this.configKey = 'serverConfig';
    this.defaultConfig = {
      baseURL: 'http://192.168.1.13:3000',
      autoDetect: true,
      timeout: 30000,
      retryAttempts: 3
    };
  }

  // ✅ CARGAR CONFIGURACIÓN GUARDADA
  async loadConfig() {
    try {
      const savedConfig = await AsyncStorage.getItem(this.configKey);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log('📋 Configuración del servidor cargada:', config);
        return { ...this.defaultConfig, ...config };
      }
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      return this.defaultConfig;
    }
  }

  // ✅ GUARDAR CONFIGURACIÓN
  async saveConfig(config) {
    try {
      await AsyncStorage.setItem(this.configKey, JSON.stringify(config));
      console.log('💾 Configuración guardada:', config);
      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      return false;
    }
  }

  // ✅ ACTUALIZAR URL DEL SERVIDOR
  async updateServerURL(url) {
    try {
      const config = await this.loadConfig();
      config.baseURL = url;
      config.autoDetect = false; // Desactivar detección automática
      
      const success = await this.saveConfig(config);
      if (success) {
        console.log('✅ URL del servidor actualizada:', url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error actualizando URL:', error);
      return false;
    }
  }

  // ✅ REACTIVAR DETECCIÓN AUTOMÁTICA
  async enableAutoDetect() {
    try {
      const config = await this.loadConfig();
      config.autoDetect = true;
      
      const success = await this.saveConfig(config);
      if (success) {
        console.log('✅ Detección automática reactivada');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error reactivando detección automática:', error);
      return false;
    }
  }

  // ✅ OBTENER URL ACTUAL
  async getCurrentURL() {
    const config = await this.loadConfig();
    return config.baseURL;
  }

  // ✅ VERIFICAR SI LA DETECCIÓN AUTOMÁTICA ESTÁ ACTIVA
  async isAutoDetectEnabled() {
    const config = await this.loadConfig();
    return config.autoDetect;
  }

  // ✅ RESETEAR A CONFIGURACIÓN POR DEFECTO
  async resetToDefault() {
    try {
      await AsyncStorage.removeItem(this.configKey);
      console.log('🔄 Configuración reseteada a valores por defecto');
      return true;
    } catch (error) {
      console.error('❌ Error reseteando configuración:', error);
      return false;
    }
  }

  // ✅ VALIDAR URL
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ✅ OBTENER CONFIGURACIÓN COMPLETA
  async getFullConfig() {
    return await this.loadConfig();
  }
}

export default new ServerConfig();
