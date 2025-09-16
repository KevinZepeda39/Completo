// services/ipDetector.js
// Servicio para detectar automáticamente la IP del servidor

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_CONFIG } from '../config/serverConfig';

class IPDetector {
  constructor() {
    this.cachedIP = null;
    this.cacheKey = 'server_ip_cache';
    this.cacheExpiry = SERVER_CONFIG.CACHE_DURATION;
  }

  // Función para detectar la IP del servidor automáticamente
  async detectServerIP() {
    try {
      // Primero intentar usar IP en caché si es reciente
      const cachedData = await this.getCachedIP();
      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        console.log('🌐 Usando IP en caché:', cachedData.ip);
        this.cachedIP = cachedData.ip; // Guardar en la instancia
        return cachedData.ip;
      }

      console.log('🔍 Detectando IP del servidor...');
      
      // Usar IPs comunes desde la configuración
      const commonIPs = SERVER_CONFIG.COMMON_IPS;

      // Probar cada IP
      for (const ip of commonIPs) {
        try {
          const isWorking = await this.testIP(ip);
          if (isWorking) {
            console.log('✅ IP encontrada y funcionando:', ip);
            this.cachedIP = ip; // Guardar en la instancia
            await this.cacheIP(ip);
            return ip;
          }
        } catch (error) {
          console.log(`❌ IP ${ip} no funciona:`, error.message);
        }
      }

      // Si ninguna IP funciona, usar la IP por defecto
      console.log('⚠️ No se encontró IP funcionando, usando IP por defecto');
      this.cachedIP = SERVER_CONFIG.DEFAULT_IP; // Guardar en la instancia
      return SERVER_CONFIG.DEFAULT_IP;
      
    } catch (error) {
      console.error('❌ Error detectando IP:', error);
      this.cachedIP = SERVER_CONFIG.DEFAULT_IP; // Guardar en la instancia
      return SERVER_CONFIG.DEFAULT_IP; // IP por defecto
    }
  }

  // Función para probar si una IP funciona
  async testIP(ip) {
    const url = `http://${ip}:${SERVER_CONFIG.PORT}/api/health`;
    console.log(`🧪 Probando IP: ${ip}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ IP ${ip} responde correctamente`);
        return true;
      } else {
        console.log(`❌ IP ${ip} responde con error: ${response.status}`);
        return false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`❌ IP ${ip} no responde: ${error.message}`);
      return false;
    }
  }

  // Función para obtener IP desde caché
  async getCachedIP() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('❌ Error obteniendo IP del caché:', error);
      return null;
    }
  }

  // Función para guardar IP en caché
  async cacheIP(ip) {
    try {
      const cacheData = {
        ip: ip,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      console.log('💾 IP guardada en caché:', ip);
    } catch (error) {
      console.error('❌ Error guardando IP en caché:', error);
    }
  }

  // Función para verificar si el caché es válido
  isCacheValid(timestamp) {
    return (Date.now() - timestamp) < this.cacheExpiry;
  }

  // Función para limpiar caché
  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
      console.log('🧹 Caché de IP limpiado');
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
    }
  }

  // Función para obtener la URL completa del servidor
  async getServerURL() {
    const ip = await this.detectServerIP();
    return `http://${ip}:${SERVER_CONFIG.PORT}`;
  }

  // Función para obtener la URL de la API
  async getAPIURL() {
    const serverURL = await this.getServerURL();
    return `${serverURL}/api`;
  }

  // Función para obtener la URL completa con endpoint
  getFullURL(endpoint = '') {
    if (!this.cachedIP) {
      throw new Error('IPDetector no ha sido inicializado. Llama a detectServerIP() primero.');
    }
    
    // Limpiar el endpoint si tiene barras al inicio
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `http://${this.cachedIP}:${SERVER_CONFIG.PORT}/${cleanEndpoint}`;
  }
}

export default new IPDetector();