// services/reportService.js - ARREGLADO PARA USAR USUARIO DEL LOGIN
import AsyncStorage from '@react-native-async-storage/async-storage';
import ipDetector from './ipDetector';

class ReportService {
  constructor() {
    this.ipDetector = ipDetector;
    this.isInitialized = false;
  }

  // ✅ INICIALIZAR SERVICIO Y DETECTAR IP
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('🚀 Inicializando ReportService...');
      const serverIP = await this.ipDetector.detectServerIP();
      
      if (serverIP) {
        console.log('✅ Servidor detectado en:', serverIP);
        this.isInitialized = true;
        return true;
      } else {
        console.error('❌ No se pudo detectar el servidor');
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando ReportService:', error);
      return false;
    }
  }

  // ✅ OBTENER URL DEL SERVIDOR
  getServerURL(endpoint) {
    if (!this.isInitialized) {
      throw new Error('ReportService no ha sido inicializado. Llama a initialize() primero.');
    }
    return this.ipDetector.getFullURL(endpoint);
  }

  // ✅ OBTENER/DETECTAR USUARIO ACTUAL DESDE LOGIN
  async getCurrentUser() {
    try {
      // ✅ BUSCAR PRIMERO EN userSession (del login)
      let userData = await AsyncStorage.getItem('userSession');
      
      if (userData) {
        const session = JSON.parse(userData);
        console.log('✅ User session found in reportService:', session);
        
        // Extraer datos del usuario del session
        const user = {
          idUsuario: session.user?.idUsuario || session.user?.id,
          nombre: session.user?.nombre || session.user?.name,
          correo: session.user?.correo || session.user?.email,
          token: session.token
        };
        
        console.log('👤 Current user from session:', { 
          id: user.idUsuario, 
          name: user.nombre,
          email: user.correo 
        });
        
        return user;
      }

      // ✅ FALLBACK: Buscar en userData (por compatibilidad)
      userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Validar que tenga el ID correcto (no el temporal)
        if (user.idUsuario && user.idUsuario !== 1) {
          console.log('👤 Current user from userData:', { 
            id: user.idUsuario, 
            name: user.nombre 
          });
          return user;
        }
      }

      console.log('⚠️ No valid user session found in reportService');
      return null;

    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // ✅ ESTABLECER USUARIO ACTUAL
  async setCurrentUser(user) {
    try {
      console.log('💾 Setting current user in reportService:', {
        id: user.idUsuario,
        name: user.nombre
      });
      
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return true;
    } catch (error) {
      console.error('❌ Error setting current user:', error);
      return false;
    }
  }

  // ✅ CREAR REPORTE CON USUARIO CORRECTO
  async createReport(reportData, imageFile = null) {
    try {
      console.log('📝 Creating report...');
      console.log('📋 Report data:', reportData);

      // ✅ INICIALIZAR SERVICIO SI NO ESTÁ INICIALIZADO
      if (!this.isInitialized) {
        console.log('🔄 Inicializando servicio...');
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'No se pudo conectar al servidor. Verifica tu conexión a internet.'
          };
        }
      }

      // ✅ OBTENER USUARIO ACTUAL
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser) {
        console.error('❌ No current user found');
        return {
          success: false,
          error: 'Usuario no encontrado. Por favor, inicia sesión de nuevo.'
        };
      }

      // ✅ USAR ID DEL USUARIO ACTUAL
      const finalReportData = {
        ...reportData,
        idUsuario: currentUser.idUsuario
      };

      console.log('👤 Using user ID:', currentUser.idUsuario);
      console.log('📊 Final report data:', finalReportData);

      if (imageFile) {
        console.log('📷 Creating report WITH image...');
        return await this.createReportWithImage(finalReportData, imageFile, currentUser.idUsuario);
      } else {
        console.log('📝 Creating report WITHOUT image...');
        return await this.createReportWithoutImage(finalReportData);
      }

    } catch (error) {
      console.error('❌ Error in createReport:', error);
      return {
        success: false,
        error: 'Error al crear el reporte'
      };
    }
  }

  // ✅ MÉTODO ALTERNATIVO USANDO XMLHttpRequest (más compatible)
  async uploadWithXMLHttpRequest(url, formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.timeout = 30000; // 30 segundos
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve(response)
            });
          } catch (error) {
            resolve({
              ok: true,
              status: xhr.status,
              text: () => Promise.resolve(xhr.responseText)
            });
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network request failed'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timeout'));
      };
      
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  // ✅ CREAR REPORTE CON IMAGEN (FORMDATA) - CORREGIDO COMPLETAMENTE
  async createReportWithImage(reportData, imageFile, userId) {
    try {
      console.log('📷 Creating report WITH image...');
      console.log('📷 Image details:', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.fileName || imageFile.name
      });
      console.log('👤 User ID for image report:', userId);

      // ✅ VALIDAR QUE LA IMAGEN TENGA URI VÁLIDA
      if (!imageFile.uri) {
        console.error('❌ Image URI is missing');
        throw new Error('URI de imagen no válida');
      }

      // ✅ VALIDAR Y CORREGIR EL TIPO MIME DE LA IMAGEN
      let imageType = imageFile.type;
      
      // Si no hay tipo o es inválido, intentar detectarlo desde la URI
      if (!imageType || !imageType.startsWith('image/')) {
        console.log('⚠️ Tipo de imagen no válido o faltante, detectando desde URI...');
        
        if (imageFile.uri.includes('.jpg') || imageFile.uri.includes('.jpeg')) {
          imageType = 'image/jpeg';
        } else if (imageFile.uri.includes('.png')) {
          imageType = 'image/png';
        } else if (imageFile.uri.includes('.gif')) {
          imageType = 'image/gif';
        } else if (imageFile.uri.includes('.webp')) {
          imageType = 'image/webp';
        } else if (imageFile.uri.includes('.bmp')) {
          imageType = 'image/bmp';
        } else {
          // Por defecto, asumir JPEG
          imageType = 'image/jpeg';
          console.log('ℹ️ Tipo de imagen no detectado, usando JPEG por defecto');
        }
        
        console.log('✅ Tipo de imagen detectado/corregido:', imageType);
      }

      // ✅ VALIDAR QUE LA IMAGEN EXISTA Y SEA ACCESIBLE
      try {
        console.log('🔍 Validating image accessibility...');
        const response = await fetch(imageFile.uri);
        if (!response.ok) {
          throw new Error(`No se puede acceder a la imagen: ${response.status}`);
        }
        console.log('✅ Image validation successful');
      } catch (imageError) {
        console.error('❌ Error validating image:', imageError);
        throw new Error('Error validando la imagen: ' + imageError.message);
      }

      // ✅ CREAR FORMDATA CON FORMATO CORRECTO PARA REACT NATIVE
      const formData = new FormData();
      
      // ✅ DATOS DEL REPORTE
      formData.append('titulo', reportData.titulo || reportData.title || '');
      formData.append('descripcion', reportData.descripcion || reportData.description || '');
      formData.append('ubicacion', reportData.ubicacion || reportData.location || '');
      formData.append('categoria', reportData.categoria || reportData.category || 'general');
      formData.append('idUsuario', userId.toString());
      
      // ✅ IMAGEN - FORMATO CORRECTO PARA REACT NATIVE
      // Usar el tipo corregido y asegurar que tenga un nombre válido
      const imageData = {
        uri: imageFile.uri,
        type: imageType, // Usar el tipo corregido
        name: imageFile.fileName || imageFile.name || `report-${Date.now()}.${imageType.split('/')[1] || 'jpg'}`
      };
      
      console.log('📷 Image data to append:', imageData);
      formData.append('imagen', imageData);

      console.log('📊 FormData created successfully');
      console.log('📊 FormData entries count:', formData._parts ? formData._parts.length : 'unknown');

      // ✅ CONFIGURAR REQUEST CON TIMEOUT Y RETRY
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      console.log('📡 Sending FormData request...');
      console.log('📡 URL:', this.ipDetector.getFullURL('/api/reports/upload'));

      let response;
      let lastError;
      
      // ✅ INTENTAR CON FETCH PRIMERO (3 intentos)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt}/3 con fetch...`);
          
          response = await fetch(this.ipDetector.getFullURL('/api/reports/upload'), {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            // ✅ NO INCLUIR Content-Type - DEJAR QUE SE ESTABLEZCA AUTOMÁTICAMENTE
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'MiCiudadSV-Mobile/1.0'
            }
          });
          
          // ✅ SI LLEGAMOS AQUÍ, LA REQUEST FUE EXITOSA
          clearTimeout(timeoutId);
          break;
          
        } catch (fetchError) {
          console.log(`⚠️ Intento ${attempt} con fetch falló:`, fetchError.message);
          lastError = fetchError;
          
          if (attempt === 3) {
            console.log('⚠️ Todos los intentos con fetch fallaron, probando XMLHttpRequest...');
            
            // ✅ FALLBACK A XMLHttpRequest
            try {
              response = await this.uploadWithXMLHttpRequest(
                this.ipDetector.getFullURL('/api/reports/upload'),
                formData
              );
              clearTimeout(timeoutId);
              break;
            } catch (xhrError) {
              console.error('❌ XMLHttpRequest también falló:', xhrError);
              clearTimeout(timeoutId);
              throw new Error(`Error de red: ${xhrError.message}`);
            }
          }
          
          // Esperar un poco antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      // ✅ PROCESAR RESPUESTA
      if (!response) {
        throw new Error('No se pudo obtener respuesta del servidor');
      }

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Error del servidor: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Report created successfully:', result);

      return {
        success: true,
        data: result,
        message: 'Reporte creado exitosamente con imagen'
      };

    } catch (error) {
      console.error('❌ Error in createReportWithImage:', error);
      
      // ✅ RETORNAR ERROR CON INFORMACIÓN ÚTIL PARA EL USUARIO
      return {
        success: false,
        error: error.message || 'Error desconocido al crear reporte con imagen',
        canRetry: true,
        details: {
          type: 'image_upload_error',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // ✅ CREAR REPORTE SIN IMAGEN (JSON)
  async createReportWithoutImage(reportData) {
    try {
      console.log('📝 Creating report WITHOUT image...');
      
      const requestData = {
        titulo: reportData.titulo || reportData.title || '',
        descripcion: reportData.descripcion || reportData.description || '',
        ubicacion: reportData.ubicacion || reportData.location || '',
        categoria: reportData.categoria || reportData.category || 'general',
        idUsuario: reportData.idUsuario
      };

      console.log('\n📊 Datos enviados al servidor (JSON):');
      console.log('  titulo:', requestData.titulo);
      console.log('  descripcion:', requestData.descripcion);
      console.log('  ubicacion:', requestData.ubicacion);
      console.log('  categoria:', requestData.categoria);
      console.log('  idUsuario:', requestData.idUsuario);
      console.log('  imagen: No');

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 JSON response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report created successfully with JSON');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ JSON request failed:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error in JSON request:', error);
      return {
        success: false,
        error: 'Error de red al crear el reporte'
      };
    }
  }

  // ✅ OBTENER REPORTES DEL USUARIO ACTUAL
  async getUserReports(userId = null) {
    try {
      console.log('📡 Fetching user reports...');
      
      // ✅ SI NO SE PROPORCIONA userId, OBTENER DEL USUARIO ACTUAL
      if (!userId) {
        const currentUser = await this.getCurrentUser();
        if (!currentUser) {
          console.error('❌ No current user found for getUserReports');
          return {
            success: false,
            error: 'Usuario no encontrado'
          };
        }
        userId = currentUser.idUsuario;
      }

      console.log('📋 Loading reports for user ID:', userId);
      console.log('🔗 URL:', `${this.ipDetector.getFullURL('/api/reports/user/' + userId)}`);

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports/user/' + userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User reports fetched successfully:', result.reportCount || 0, 'reports');
        console.log('📊 Server response:', {
          success: result.success,
          reportCount: result.reportCount,
          fromCache: result.fromCache
        });

        const reports = result.reports || [];
        console.log('✅ Successfully loaded', reports.length, 'user reports');
        
        // Log image statistics
        const reportsWithImages = reports.filter(report => report.imagen).length;
        console.log('📷 Reports with images:', reportsWithImages);

        return {
          success: true,
          reports: reports,
          reportCount: reports.length,
          fromCache: result.fromCache || false
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch user reports:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error fetching user reports:', error);
      return {
        success: false,
        error: 'Error de red al obtener los reportes'
      };
    }
  }

  // ✅ OBTENER TODOS LOS REPORTES (ADMIN)
  async getReports() {
    try {
      console.log('📡 Fetching all reports...');
      console.log('🔗 URL:', `${this.ipDetector.getFullURL('/api/reports')}`);

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Reports fetched successfully:', result.reportCount || 0, 'reports');
        
        const reports = result.reports || [];
        console.log('✅ Successfully loaded', reports.length, 'reports');
        
        return {
          success: true,
          reports: reports,
          reportCount: reports.length,
          fromCache: result.fromCache || false
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch reports:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      return {
        success: false,
        error: 'Error de red al obtener los reportes'
      };
    }
  }

  // ✅ OBTENER REPORTE ESPECÍFICO
  async getReport(id) {
    try {
      console.log('📡 Fetching report:', id);

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports/' + id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report fetched successfully');
        return { success: true, report: result.report };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch report:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error fetching report:', error);
      return {
        success: false,
        error: 'Error de red al obtener el reporte'
      };
    }
  }

  // ✅ ACTUALIZAR REPORTE
  async updateReport(id, reportData) {
    try {
      console.log('🔄 Updating report:', id);
      console.log('📋 Update data:', reportData);

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports/' + id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report updated successfully');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update report:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error updating report:', error);
      return {
        success: false,
        error: 'Error de red al actualizar el reporte'
      };
    }
  }

  // ✅ ELIMINAR REPORTE
  async deleteReport(id) {
    try {
      console.log('🗑️ Deleting report:', id);

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports/' + id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report deleted successfully');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete report:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error deleting report:', error);
      return {
        success: false,
        error: 'Error de red al eliminar el reporte'
      };
    }
  }

  // ✅ ESTADÍSTICAS
  async getStats() {
    try {
      console.log('📊 Fetching statistics...');

      const response = await fetch(`${this.ipDetector.getFullURL('/api/reports/stats')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Statistics fetched successfully');
        return { success: true, stats: result.stats };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch statistics:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      return {
        success: false,
        error: 'Error de red al obtener estadísticas'
      };
    }
  }

  // ✅ PROBAR CONEXIÓN
  async testConnection() {
    try {
      console.log('🔌 Testing connection...');

      const response = await fetch(`${this.ipDetector.getFullURL('/api/test')}`, {
        method: 'GET',
        timeout: 10000,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Connection test successful');
        return { success: true, data: result };
      } else {
        console.error('❌ Connection test failed:', response.status);
        return {
          success: false,
          error: `Error de conexión: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
      return {
        success: false,
        error: 'Error de red'
      };
    }
  }

  // ✅ CERRAR SESIÓN
  async logout() {
    try {
      console.log('🚪 Logging out...');
      
      await AsyncStorage.removeItem('userSession');
      await AsyncStorage.removeItem('userData');
      
      console.log('✅ User session cleared');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }
}

export default new ReportService();