// services/authService.js - AUTHSERVICE CON VERIFICACIÓN COMPLETA
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.13:3000/api';

console.log('🔧 AuthService initialized with API_URL:', API_URL);

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  // ✅ FUNCIÓN LOGIN ACTUALIZADA PARA MANEJAR VERIFICACIÓN
  async login(correo, contraseña) {
    try {
      console.log('📝 === LOGIN ATTEMPT ===');
      console.log('📧 Email:', correo);
      console.log('🔑 Password length:', contraseña ? contraseña.length : 0);
      
      // Validar campos
      if (!correo || !contraseña) {
        throw new Error('Correo y contraseña son requeridos');
      }

      const requestBody = {
        correo: correo,
        contraseña: contraseña,
        email: correo,
        password: contraseña
      };

      console.log('🚀 Sending login request to:', `${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Login response:', data);

      // 🔥 CRÍTICO: Verificar primero si la respuesta es exitosa
      if (data.success && data.user) {
        console.log('✅ Login successful from backend response');
        
        // Guardar datos del usuario
        this.token = data.token;
        this.user = data.user;
        
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        console.log('✅ Login successful, user:', data.user.nombre);
        return data;
      }

      // Solo manejar requiresVerification si el backend explícitamente lo indica
      if (response.status === 403 && data.requiresVerification === true) {
        console.log('⚠️ Email verification required (explicitly from backend)');
        return {
          success: false,
          requiresVerification: true,
          user: data.user,
          verification: data.verification,
          error: data.error
        };
      }

      // Si no es exitoso y no requiere verificación, es un error
      if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
      }

      // Fallback: si llegamos aquí, algo salió mal
      throw new Error(data.error || 'Login failed - unexpected response');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  // ✅ FUNCIÓN: Recuperación de contraseña
  async forgotPassword(email) {
    try {
      console.log('🔑 === FORGOT PASSWORD ===');
      console.log('📧 Email:', email);
      
      if (!email || !email.trim()) {
        throw new Error('Email es requerido');
      }

      const requestBody = {
        email: email.trim(),
        correo: email.trim()
      };

      console.log('🚀 Sending forgot password request to:', `${API_URL}/auth/forgot-password`);
      
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Forgot password response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error en la recuperación de contraseña');
      }

      return data;
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      throw error;
    }
  }



  // ✅ FUNCIÓN REGISTER ACTUALIZADA PARA MANEJAR VERIFICACIÓN
  async register(userData) {
    try {
      console.log('📝 === REGISTER ATTEMPT ===');
      console.log('👤 Name:', userData.nombre);
      console.log('📧 Email:', userData.correo);
      console.log('🔑 Password provided:', !!userData.contraseña);

      // Validar campos requeridos
      if (!userData.nombre || !userData.correo || !userData.contraseña) {
        throw new Error('Todos los campos son requeridos');
      }

      const requestBody = {
        nombre: userData.nombre,
        correo: userData.correo,
        contraseña: userData.contraseña,
        name: userData.nombre,
        email: userData.correo,
        password: userData.contraseña
      };

      console.log('🚀 Sending registration request to:', `${API_URL}/auth/register`);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      if (data.success) {
        console.log('✅ Registration successful');
        return {
          success: true,
          user: data.user,
          verification: data.verification,
          message: data.message
        };
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  // ✅ NUEVA FUNCIÓN: VERIFICAR CÓDIGO DE EMAIL
  async verifyCode(email, code) {
    try {
      console.log('🔐 === VERIFY CODE ===');
      console.log('📧 Email:', email);
      console.log('🔑 Code:', code);

      if (!email || !code) {
        throw new Error('Email y código son requeridos');
      }

      const requestBody = {
        email: email,
        correo: email,
        code: code,
        codigo: code
      };

      console.log('🚀 Sending verification request to:', `${API_URL}/auth/verify-code`);

      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Verification response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Verification response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error en la verificación');
      }

      if (data.success) {
        console.log('✅ Email verification successful');
        
        // Si la verificación incluye token, guardar sesión
        if (data.token && data.user) {
          this.token = data.token;
          this.user = data.user;
          
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        return data;
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      throw error;
    }
  }

  // ✅ NUEVA FUNCIÓN: REENVIAR CÓDIGO DE VERIFICACIÓN
  async resendVerificationCode(email) {
    try {
      console.log('📧 === RESEND VERIFICATION CODE ===');
      console.log('📧 Email:', email);

      if (!email) {
        throw new Error('Email es requerido');
      }

      const requestBody = {
        email: email,
        correo: email
      };

      console.log('🚀 Sending resend request to:', `${API_URL}/auth/resend-code`);

      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Resend response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Resend response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error reenviando código');
      }

      if (data.success) {
        console.log('✅ Verification code resent successfully');
        return data;
      } else {
        throw new Error(data.error || 'Resend failed');
      }
    } catch (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }
  }

  // ✅ NUEVA FUNCIÓN: ENVIAR EMAIL DE PRUEBA
  async sendTestEmail(email) {
    try {
      console.log('🧪 === SEND TEST EMAIL ===');
      console.log('📧 Email:', email);

      if (!email) {
        throw new Error('Email es requerido');
      }

      const requestBody = {
        email: email,
        correo: email
      };

      console.log('🚀 Sending test email request to:', `${API_URL}/auth/test-email`);

      const response = await fetch(`${API_URL}/auth/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Test email response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Test email response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error enviando email de prueba');
      }

      return data;
    } catch (error) {
      console.error('❌ Test email error:', error);
      throw error;
    }
  }

  // ✅ FUNCIÓN getUserSession EXISTENTE
  async getUserSession() {
    try {
      console.log('🔍 Getting user session...');
      
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        console.log('✅ Session found for user:', user.nombre);
        
        this.token = token;
        this.user = user;
        
        return {
          token: token,
          user: user,
          isAuthenticated: true
        };
      } else {
        console.log('❌ No session found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  }

  // ✅ FUNCIÓN logout EXISTENTE
  async logout() {
    try {
      console.log('🚪 Logging out user...');
      
      this.token = null;
      this.user = null;
      
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  // ✅ FUNCIÓN isAuthenticated EXISTENTE
  async isAuthenticated() {
    try {
      const session = await this.getUserSession();
      return !!session;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  // ✅ FUNCIÓN getCurrentUser EXISTENTE
  getCurrentUser() {
    return this.user;
  }

  // ✅ FUNCIÓN getToken EXISTENTE
  getToken() {
    return this.token;
  }

  // ✅ FUNCIÓN testConnection EXISTENTE
  async testConnection() {
    try {
      console.log('🧪 Testing backend connection...');
      console.log('🔗 API URL:', `${API_URL}/auth/test`);
      
      const response = await fetch(`${API_URL}/auth/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Test response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Test response data:', data);

      return {
        success: response.ok,
        data: data,
        status: response.status
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ NUEVA FUNCIÓN: VERIFICAR ESTADO DE VERIFICACIÓN
  async checkVerificationStatus(email) {
    try {
      console.log('🔍 Checking verification status for:', email);
      
      const session = await this.getUserSession();
      if (session && session.user) {
        return {
          isVerified: session.user.emailVerificado || false,
          user: session.user
        };
      }
      
      return {
        isVerified: false,
        user: null
      };
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      return {
        isVerified: false,
        user: null
      };
    }
  }

  // ✅ NUEVA FUNCIÓN: LIMPIAR DATOS DE VERIFICACIÓN
  async clearVerificationData() {
    try {
      console.log('🧹 Clearing verification data...');
      // Esta función se puede usar para limpiar datos temporales de verificación
      // si decides almacenar algo temporalmente durante el proceso
      return true;
    } catch (error) {
      console.error('❌ Error clearing verification data:', error);
      return false;
    }
  }

  // ✅ NUEVO MÉTODO: ACTUALIZAR INFORMACIÓN DEL USUARIO
  async updateUserInfo(userId, userData) {
    try {
      console.log(`🔄 Updating user info for ID: ${userId}`);
      console.log('📝 New data:', userData);

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('✅ Update response:', data);

      return data;
    } catch (error) {
      console.error('❌ Error updating user info:', error);
      throw error;
    }
  }
}

export default new AuthService();