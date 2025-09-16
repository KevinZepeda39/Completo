// hooks/useAuth.js - VERSIÓN CORREGIDA PARA IDENTIFICAR ID REAL
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

// Crear el contexto de autenticación
const AuthContext = createContext({});

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 FUNCIÓN CRÍTICA: Verificar sesión y extraer ID real
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('\n🔍 === CHECKING AUTH STATUS ===');
      
      // 1️⃣ BUSCAR EN AsyncStorage DIRECTAMENTE
      const userSession = await AsyncStorage.getItem('userSession');
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      console.log('📱 AsyncStorage contents:');
      console.log('  - userSession:', !!userSession);
      console.log('  - userData:', !!userData);
      console.log('  - token:', !!token);
      
      let authenticatedUser = null;
      
      // 2️⃣ PRIORIZAR userSession (datos del login más reciente)
      if (userSession) {
        try {
          const session = JSON.parse(userSession);
          console.log('📋 Session data found:', session);
          
          if (session.user && session.token) {
            authenticatedUser = {
              id: session.user.idUsuario || session.user.id,
              idUsuario: session.user.idUsuario || session.user.id,
              nombre: session.user.nombre || session.user.name,
              name: session.user.nombre || session.user.name,
              correo: session.user.correo || session.user.email,
              email: session.user.correo || session.user.email,
              emailVerificado: session.user.emailVerificado,
              fotoPerfil: session.user.fotoPerfil || null,
              token: session.token
            };
            
            console.log('✅ User from session:', {
              id: authenticatedUser.idUsuario,
              name: authenticatedUser.nombre,
              email: authenticatedUser.correo,
              fotoPerfil: authenticatedUser.fotoPerfil
            });
            console.log('📸 Session user completo:', authenticatedUser);
          }
        } catch (error) {
          console.error('❌ Error parsing userSession:', error);
        }
      }
      
      // 3️⃣ FALLBACK: usar userData si no hay userSession
      if (!authenticatedUser && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('📋 User data found:', user);
          
          if (user.idUsuario || user.id) {
            authenticatedUser = {
              id: user.idUsuario || user.id,
              idUsuario: user.idUsuario || user.id,
              nombre: user.nombre || user.name,
              name: user.nombre || user.name,
              correo: user.correo || user.email,
              email: user.correo || user.email,
              emailVerificado: user.emailVerificado,
              token: token || user.token
            };
            
            console.log('✅ User from userData:', {
              id: authenticatedUser.idUsuario,
              name: authenticatedUser.nombre,
              email: authenticatedUser.correo
            });
          }
        } catch (error) {
          console.error('❌ Error parsing userData:', error);
        }
      }
      
      // 4️⃣ ESTABLECER ESTADO DE AUTENTICACIÓN
      if (authenticatedUser && authenticatedUser.idUsuario) {
        console.log('🎉 Authentication successful for user:', authenticatedUser.nombre, 'ID:', authenticatedUser.idUsuario);
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        
        // 🔥 CRÍTICO: Sincronizar con todos los servicios
        await syncUserWithServices(authenticatedUser);
        
      } else {
        console.log('❌ No authenticated user found');
        setUser(null);
        setIsAuthenticated(false);
      }
      
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FUNCIÓN CRÍTICA: Sincronizar usuario con servicios
  const syncUserWithServices = async (userData) => {
    try {
      console.log('🔄 Syncing user with services...');
      
      // Aquí puedes agregar la sincronización con otros servicios
      // Por ejemplo: notificationService, communityService, etc.
      
      console.log('✅ User synced with services');
    } catch (error) {
      console.error('❌ Error syncing user with services:', error);
    }
  };

  // 📸 FUNCIÓN PARA ACTUALIZAR FOTO DE PERFIL GLOBALMENTE
  const updateUserProfilePhoto = (photoUrl) => {
    console.log('📸 Updating user profile photo globally:', photoUrl);
    
    if (user) {
      const updatedUser = {
        ...user,
        fotoPerfil: photoUrl
      };
      
      setUser(updatedUser);
      
      // Actualizar AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Actualizar userSession si existe
      AsyncStorage.getItem('userSession').then(session => {
        if (session) {
          const sessionData = JSON.parse(session);
          sessionData.user.fotoPerfil = photoUrl;
          AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
        }
      });
      
      console.log('✅ User profile photo updated globally');
    }
  };

  // 🔥 FUNCIÓN CRÍTICA: Limpiar usuario de servicios
  const clearUserFromServices = async () => {
    try {
      console.log('🧹 Clearing user from services...');
      
      // Aquí puedes agregar la limpieza de otros servicios
      
      console.log('✅ User cleared from services');
    } catch (error) {
      console.error('❌ Error clearing user from services:', error);
    }
  };

  // ✅ VERIFICAR ESTADO DE AUTENTICACIÓN AL MONTAR
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 🔥 FUNCIÓN LOGIN CON TOKEN - PARA VERIFICACIÓN DIRECTA
  const loginWithToken = async (userData, token) => {
    try {
      console.log('\n🔐 === useAuth.loginWithToken called ===');
      console.log('👤 User data:', userData);
      console.log('🔑 Token provided:', !!token);

      if (!userData || !token) {
        throw new Error('Datos de usuario y token son requeridos');
      }

      // 🔥 EXTRAER DATOS CORRECTOS DEL USUARIO
      const authenticatedUser = {
        id: userData.idUsuario || userData.id,
        idUsuario: userData.idUsuario || userData.id,
        nombre: userData.nombre || userData.name,
        name: userData.nombre || userData.name,
        correo: userData.correo || userData.email,
        email: userData.correo || userData.email,
        emailVerificado: userData.emailVerificado,
        fotoPerfil: userData.fotoPerfil || null,
        token: token
      };

      console.log('✅ Token login successful, user:', authenticatedUser.nombre);
      console.log('🆔 User ID:', authenticatedUser.idUsuario);
      console.log('📧 User email:', authenticatedUser.correo);

      // 🔥 GUARDAR EN ASYNCSTORAGE
      const sessionData = {
        user: authenticatedUser,
        token: token,
        loginTime: new Date().toISOString()
      };

      await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
      await AsyncStorage.setItem('user', JSON.stringify(authenticatedUser));
      await AsyncStorage.setItem('token', token);

      console.log('💾 Session data saved to AsyncStorage');

      // 🔥 ESTABLECER ESTADO - ESTO ES CRÍTICO
      setUser(authenticatedUser);
      setIsAuthenticated(true);

      // 🔥 SINCRONIZAR CON SERVICIOS
      await syncUserWithServices(authenticatedUser);

      console.log('🎉 Token login completed successfully');

      return { success: true, user: authenticatedUser, token: token };
    } catch (error) {
      console.error('❌ Token login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  // 🔥 FUNCIÓN LOGIN CORREGIDA - VERSIÓN MEJORADA
  const login = async (email, password) => {
    try {
      console.log('\n🔐 === useAuth.login called ===');
      console.log('📧 Email:', email);
      console.log('🔑 Password provided:', !!password);

      // Validación en el hook
      if (!email || !email.trim()) {
        throw new Error('Email es requerido');
      }

      if (!password || !password.trim()) {
        throw new Error('Contraseña es requerida');
      }

      console.log('📞 Calling authService.login...');
      const result = await authService.login(email.trim(), password.trim());
      
      console.log('📦 Login response:', result);

      if (result.success && result.user) {
        // 🔥 EXTRAER DATOS CORRECTOS DEL RESULTADO
        const userData = {
          id: result.user.idUsuario || result.user.id,
          idUsuario: result.user.idUsuario || result.user.id,
          nombre: result.user.nombre || result.user.name,
          name: result.user.nombre || result.user.name,
          correo: result.user.correo || result.user.email,
          email: result.user.correo || result.user.email,
          emailVerificado: result.user.emailVerificado,
          fotoPerfil: result.user.fotoPerfil || null,
          token: result.token
        };

        console.log('✅ Login successful, user:', userData.nombre);
        console.log('🆔 User ID:', userData.idUsuario);
        console.log('📧 User email:', userData.correo);
        console.log('📸 User fotoPerfil:', userData.fotoPerfil);
        console.log('📸 User data completo:', userData);

        // 🔥 GUARDAR EN ASYNCSTORAGE
        const sessionData = {
          user: userData,
          token: result.token,
          loginTime: new Date().toISOString()
        };

        await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', result.token);

        console.log('💾 Session data saved to AsyncStorage');

        // 🔥 ESTABLECER ESTADO - ESTO ES CRÍTICO
        setUser(userData);
        setIsAuthenticated(true);

        // 🔥 SINCRONIZAR CON SERVICIOS
        await syncUserWithServices(userData);

        console.log('🎉 Login completed successfully');
        console.log('✅ Login result:', result);
        console.log('🔐 isAuthenticated set to:', true);
        console.log('👤 User set to:', userData.nombre);

        // 🔥 CRÍTICO: Forzar re-render del componente
        console.log('🔄 Forcing component re-render...');

        return result;
      } else {
        // Sin logs para evitar mostrar errores técnicos al usuario
        const errorMessage = result.error || 'Login failed';
        const customError = new Error(errorMessage);
        customError.silent = true; // Marcar como error silencioso
        throw customError;
      }
    } catch (error) {
      // Sin logs para evitar mostrar errores técnicos al usuario
      setUser(null);
      setIsAuthenticated(false);
      // Marcar el error como silencioso para evitar que React Native lo muestre
      if (error && !error.silent) {
        error.silent = true;
      }
      throw error;
    }
  };

  // FUNCIÓN LOGOUT MEJORADA
  const logout = async () => {
    try {
      console.log('\n🚪 === LOGOUT ===');
      console.log('👤 Logging out user:', user?.nombre);

      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove(['userSession', 'user', 'token']);
      console.log('🧹 AsyncStorage cleared');

      // Limpiar servicios
      await clearUserFromServices();

      // Limpiar estado local
      setUser(null);
      setIsAuthenticated(false);

      // Intentar logout en el servidor
      try {
        await authService.logout();
        console.log('✅ Server logout successful');
      } catch (error) {
        console.log('⚠️ Server logout failed, but local logout completed');
      }

      console.log('✅ Logout completed successfully');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Forzar logout local aunque falle
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 🆕 FUNCIÓN PARA REFRESCAR SESIÓN
  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...');
      await checkAuthStatus();
      console.log('✅ Session refreshed');
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
    }
  };

  // 🆕 FUNCIÓN PARA OBTENER USUARIO ACTUAL
  const getCurrentUser = () => {
    return user;
  };

  // 🆕 FUNCIÓN PARA OBTENER TOKEN ACTUAL
  const getCurrentToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('❌ Error getting current token:', error);
      return null;
    }
  };

  // 🆕 FUNCIÓN DEBUG
  const debugAuth = async () => {
    try {
      console.log('\n🔍 === AUTH DEBUG ===');
      console.log('Current state:');
      console.log('  - user:', user);
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - isLoading:', isLoading);

      const userSession = await AsyncStorage.getItem('userSession');
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      console.log('AsyncStorage:');
      console.log('  - userSession:', userSession ? 'EXISTS' : 'NULL');
      console.log('  - userData:', userData ? 'EXISTS' : 'NULL');
      console.log('  - token:', token ? 'EXISTS' : 'NULL');

      if (userSession) {
        const session = JSON.parse(userSession);
        console.log('Session details:');
        console.log('  - user.id:', session.user?.idUsuario || session.user?.id);
        console.log('  - user.name:', session.user?.nombre || session.user?.name);
        console.log('  - user.email:', session.user?.correo || session.user?.email);
        console.log('  - token:', session.token ? 'EXISTS' : 'NULL');
      }
      
      console.log('=== END DEBUG ===\n');
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  };

  const value = {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    
    // Funciones principales
    login,
    loginWithToken,
    logout,
    checkAuthStatus,
    
    // Funciones auxiliares
    refreshSession,
    getCurrentUser,
    getCurrentToken,
    debugAuth,
    updateUserProfilePhoto,
    
    // Información del usuario
    userId: user?.idUsuario || user?.id,
    userName: user?.nombre || user?.name,
    userEmail: user?.correo || user?.email,
    isEmailVerified: user?.emailVerificado
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default { AuthProvider, useAuth };