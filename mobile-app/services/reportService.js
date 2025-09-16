// services/reportService.js - ARREGLADO PARA USAR USUARIO DEL LOGIN
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.13:3000';

class ReportService {
  constructor() {
    this.baseUrl = BASE_URL;
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

  // ✅ CREAR REPORTE CON IMAGEN (FORMDATA)
  async createReportWithImage(reportData, imageFile, userId) {
    try {
      console.log('📷 Creating report WITH image...');
      console.log('📷 Image details:', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.fileName || imageFile.name || 'image.jpg'
      });
      console.log('👤 User ID for image report:', userId);

      // ✅ TEST FORMDATA
      const testFormData = new FormData();
      testFormData.append('test', 'test');
      console.log('🧪 Test FormData created:', testFormData);
      console.log('🧪 FormData entries:', Array.from(testFormData.entries()));

      const formData = new FormData();
      
      // ✅ DATOS DEL REPORTE CON ID CORRECTO
      formData.append('titulo', reportData.titulo || reportData.title || '');
      formData.append('descripcion', reportData.descripcion || reportData.description || '');
      formData.append('ubicacion', reportData.ubicacion || reportData.location || '');
      formData.append('categoria', reportData.categoria || reportData.category || 'general');
      formData.append('idUsuario', userId.toString()); // ✅ ID CORRECTO
      
      // ✅ IMAGEN - MEJORAR MANEJO DE NOMBRE Y TIPO
      const imageName = imageFile.fileName || imageFile.name || `report-${Date.now()}.jpg`;
      const imageType = imageFile.type || 'image/jpeg';
      
      formData.append('imagen', {
        uri: imageFile.uri,
        type: imageType,
        name: imageName
      });

      console.log('📊 FormData created with:');
      console.log('  - titulo:', reportData.titulo || reportData.title);
      console.log('  - descripcion:', reportData.descripcion || reportData.description);
      console.log('  - ubicacion:', reportData.ubicacion || reportData.location);
      console.log('  - categoria:', reportData.categoria || reportData.category);
      console.log('  - idUsuario:', userId);
      console.log('  - imagen:', imageName);
      console.log('  - imageType:', imageType);
      console.log('  - imageUri:', imageFile.uri);
      
      // ✅ VERIFICAR FORMDATA
      console.log('📊 FormData entries:', Array.from(formData.entries()));

      console.log('📡 Sending FormData request...');
      console.log('📡 URL:', `${this.baseUrl}/api/reports/upload`);
      
      // ✅ TEST FORMDATA ENDPOINT
      try {
        const testResponse = await fetch(`${this.baseUrl}/api/reports/upload`, {
          method: 'POST',
          headers: {
            'x-test-formdata': 'true'
          }
        });
        
        if (testResponse.ok) {
          const testResult = await testResponse.json();
          console.log('🧪 FormData test result:', testResult);
        } else {
          console.log('⚠️ FormData test failed:', testResponse.status);
        }
      } catch (testError) {
        console.log('⚠️ FormData test error:', testError.message);
      }

      const response = await fetch(`${this.baseUrl}/api/reports/upload`, {
        method: 'POST',
        body: formData,
        // ✅ REMOVER Content-Type manual - React Native lo maneja automáticamente
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        // },
        // ✅ TIMEOUT MANUAL PARA REACT NATIVE
        // signal: AbortSignal.timeout(120000), // 2 minutos - NO DISPONIBLE EN RN
      });

      console.log('📡 FormData response status:', response.status);
      console.log('📡 FormData response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report created successfully with FormData');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ FormData request failed:', response.status, errorText);
        
        // ✅ INTENTAR PARSEAR EL ERROR COMO JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }

    } catch (error) {
      console.error('❌ FormData fetch error:', error);
      console.error('❌ Error in FormData request:', error);
      console.log('📋 Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack
      });
      
      // ✅ VERIFICAR SI ES ERROR DE RED O SERVIDOR
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout error - la imagen es muy grande o la conexión es lenta');
      } else if (error.message.includes('Network request failed')) {
        console.log('🌐 Network error - verificar conexión a internet');
      } else if (error.message.includes('Server error')) {
        console.log('🖥️ Server error - verificar que el backend esté funcionando');
      }

      // ✅ FALLBACK A JSON SIN IMAGEN
      console.log('🔄 FormData failed, attempting fallback to JSON without image...');
      console.log('⚠️ La imagen no se pudo subir, pero el reporte se creará sin imagen');
      
      const fallbackResult = await this.createReportWithoutImage({
        ...reportData,
        idUsuario: userId
      });
      
      if (fallbackResult.success) {
        console.log('✅ Reporte creado sin imagen como fallback');
        return {
          ...fallbackResult,
          warning: 'La imagen no se pudo subir, pero el reporte se creó exitosamente'
        };
      } else {
        console.log('❌ Fallback también falló');
        return fallbackResult;
      }
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

      const response = await fetch(`${this.baseUrl}/api/reports`, {
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
      console.log('🔗 URL:', `${this.baseUrl}/api/reports/user/${userId}`);

      const response = await fetch(`${this.baseUrl}/api/reports/user/${userId}`, {
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
      console.log('🔗 URL:', `${this.baseUrl}/api/reports`);

      const response = await fetch(`${this.baseUrl}/api/reports`, {
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

      const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
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
      console.log('🔄 [SERVICE] Updating report:', id);
      console.log('📋 [SERVICE] Update data:', reportData);

      // ✅ NUEVO: Verificar si hay imagen para actualizar
      const hasImage = reportData.imagen && reportData.imagen.uri;
      
      console.log('🖼️ [SERVICE] Análisis de imagen:', {
        hasImage,
        imageObject: reportData.imagen,
        imageUri: reportData.imagen?.uri,
        isExisting: reportData.imagen?.isExisting
      });
      
      if (hasImage) {
        console.log('🖼️ [SERVICE] Actualizando reporte con nueva imagen');
        
        // ✅ USAR FormData para imagen
        const formData = new FormData();
        
        // Agregar campos del reporte
        formData.append('titulo', reportData.titulo);
        formData.append('descripcion', reportData.descripcion);
        formData.append('ubicacion', reportData.ubicacion);
        formData.append('categoria', reportData.categoria);
        
        console.log('📝 [SERVICE] Campos del formulario agregados al FormData');
        
        // ✅ Agregar imagen si es nueva (no existente)
        if (!reportData.imagen.isExisting) {
          const imageFile = {
            uri: reportData.imagen.uri,
            type: reportData.imagen.type || 'image/jpeg',
            name: reportData.imagen.name || `reporte-${Date.now()}.jpg`
          };
          
          formData.append('imagen', imageFile);
          console.log('🖼️ [SERVICE] Imagen nueva agregada al FormData:', imageFile);
        } else {
          console.log('🖼️ [SERVICE] Imagen existente, NO se agrega al FormData');
        }
        
        console.log('📡 [SERVICE] Enviando PUT request con FormData a:', `${this.baseUrl}/api/reports/${id}`);
        
        const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });
        
        console.log('📡 [SERVICE] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ [SERVICE] Report updated successfully with image:', result);
          return { success: true, data: result };
        } else {
          const errorText = await response.text();
          console.error('❌ [SERVICE] Failed to update report with image:', response.status, errorText);
          return {
            success: false,
            error: `Error del servidor: ${response.status} - ${errorText}`
          };
        }
        
      } else {
        console.log('📝 [SERVICE] Actualizando reporte sin imagen');
        
        // ✅ ACTUALIZACIÓN SIN IMAGEN - JSON normal
        console.log('📡 [SERVICE] Enviando PUT request con JSON a:', `${this.baseUrl}/api/reports/${id}`);
        
        const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reportData),
        });

        console.log('📡 [SERVICE] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [SERVICE] Report updated successfully without image:', result);
          return { success: true, data: result };
        } else {
          const errorText = await response.text();
          console.error('❌ [SERVICE] Failed to update report:', response.status, errorText);
          return {
            success: false,
            error: `Error del servidor: ${response.status} - ${errorText}`
          };
        }
      }

    } catch (error) {
      console.error('❌ [SERVICE] Error updating report:', error);
      return {
        success: false,
        error: 'Error de red al actualizar el reporte: ' + error.message
      };
    }
  }

  // ✅ ACTUALIZAR ESTADO DEL REPORTE
  async updateReportStatus(id, status) {
    try {
      console.log('🔄 Updating report status:', id, 'to:', status);

      const response = await fetch(`${this.baseUrl}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Report status updated successfully');
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update report status:', response.status, errorText);
        return {
          success: false,
          error: `Error del servidor: ${response.status}`
        };
      }

    } catch (error) {
      console.error('❌ Error updating report status:', error);
      return {
        success: false,
        error: 'Error de red al actualizar el estado del reporte'
      };
    }
  }

  // ✅ ELIMINAR REPORTE
  async deleteReport(id) {
    try {
      console.log('🗑️ Deleting report:', id);

      const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
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

      const response = await fetch(`${this.baseUrl}/api/reports/stats`, {
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

      const response = await fetch(`${this.baseUrl}/api/test`, {
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