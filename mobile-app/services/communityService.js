// services/communityService.js - Versión corregida con sincronización de estado
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiUrl = () => {
  if (__DEV__) {
    return 'http://192.168.1.13:3000/api'; // 🔧 CAMBIAR POR TU IP
  } else {
    return 'https://tu-servidor-produccion.com/api';
  }
};

const API_URL = getApiUrl();

// 🆕 Usuario actual (se obtendrá de AsyncStorage o contexto de autenticación)
let currentUser = null;

// Función para establecer usuario actual desde la autenticación real
const setCurrentUser = (user) => {
  if (user && user.id) {
    currentUser = {
      id: user.id,
      name: user.name || user.nombre || 'Usuario',
      email: user.email || user.correo || 'usuario@email.com'
    };
    console.log('👤 Usuario establecido:', currentUser);
  } else {
    console.warn('⚠️ Usuario inválido proporcionado:', user);
  }
};

// Headers con autenticación real
const getAuthHeaders = () => {
  if (!currentUser || !currentUser.id) {
    console.error('❌ No hay usuario autenticado');
    throw new Error('Usuario no autenticado');
  }
  
  return {
    'Content-Type': 'application/json',
    'x-user-id': currentUser.id.toString()
  };
};

const handleResponse = async (response) => {
  let data;
  
  try {
    // Verificar si la respuesta tiene contenido
    const responseText = await response.text();
    console.log('📡 Respuesta del servidor:', responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error('❌ Respuesta vacía del servidor');
      throw new Error('Respuesta vacía del servidor');
    }
    
    // Intentar parsear como JSON
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error('❌ Error parsing JSON:', parseError);
    console.error('❌ Respuesta recibida:', response);
    throw new Error('Error de formato en la respuesta del servidor');
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Error ${response.status}: ${response.statusText}`;
    
    // Solo mostrar error en consola si no es relacionado con comunidad eliminada
    if (!errorMessage.includes('Comunidad no encontrada') && 
        !errorMessage.includes('404') && 
        !errorMessage.includes('403') && 
        !errorMessage.includes('No autorizado')) {
      console.error('❌ Server error:', errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  return data;
};

const communityService = {
  // 🆕 Gestión de usuario actual
  setCurrentUser,
  getCurrentUser: () => currentUser,

  // 🆕 Inicializar usuario desde AsyncStorage
  async initializeUser() {
    try {
      console.log('🔄 Intentando inicializar usuario desde AsyncStorage...');
      
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('📱 Usuario encontrado en AsyncStorage:', user);
        setCurrentUser(user);
        return user;
      } else {
        console.log('⚠️ No hay datos de usuario en AsyncStorage');
        
        // 🆕 Intentar obtener de otras claves comunes
        const alternativeKeys = ['user', 'currentUser', 'authUser', 'userInfo'];
        for (const key of alternativeKeys) {
          try {
            const altUserData = await AsyncStorage.getItem(key);
            if (altUserData) {
              const altUser = JSON.parse(altUserData);
              console.log(`✅ Usuario encontrado en clave alternativa '${key}':`, altUser);
              setCurrentUser(altUser);
              return altUser;
            }
          } catch (altError) {
            console.log(`⚠️ Error verificando clave '${key}':`, altError.message);
          }
        }
      }
      
      console.log('❌ No se pudo encontrar usuario en AsyncStorage');
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario de AsyncStorage:', error);
      return null;
    }
  },

  // 🆕 Verificar si hay usuario autenticado
  isUserAuthenticated() {
    return currentUser && currentUser.id;
  },

  // 🆕 NUEVA FUNCIÓN: Sincronizar estado de unión con el servidor
  async syncMembershipStatus() {
    try {
      console.log('🔄 Sincronizando estado de unión con el servidor...');
      
      // Obtener comunidades del usuario desde el servidor
      const response = await fetch(`${API_URL}/communities/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (data.communities && Array.isArray(data.communities)) {
        // Crear un mapa de comunidades donde el usuario está unido
        const joinedCommunityIds = data.communities.map(community => community.id);
        console.log(`✅ Estado sincronizado: ${joinedCommunityIds.length} comunidades unidas`);
        return joinedCommunityIds;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error sincronizando estado de unión:', error);
      return [];
    }
  },

  // Test de conexión
  async testConnection() {
    try {
      console.log(`🔍 Probando conexión a: ${API_URL}/communities/test/debug`);
      
      const response = await fetch(`${API_URL}/communities/test/debug`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 5000
      });

      const data = await handleResponse(response);
      console.log('✅ Conexión exitosa:', data.debug);
      return data.debug;
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      throw new Error(`No se puede conectar al servidor: ${error.message}`);
    }
  },

  // Obtener todas las comunidades CON SINCRONIZACIÓN DE ESTADO
  async getAllCommunities() {
    try {
      console.log('🔍 Obteniendo todas las comunidades...');
      
      // 🆕 VERIFICAR QUE HAYA USUARIO AUTENTICADO
      if (!currentUser || !currentUser.id) {
        console.warn('⚠️ No hay usuario autenticado, intentando inicializar...');
        await this.initializeUser();
        
        if (!currentUser || !currentUser.id) {
          console.error('❌ No se pudo inicializar usuario');
          throw new Error('Usuario no autenticado');
        }
      }
      
      console.log(`👤 Usuario actual: ${currentUser.name} (ID: ${currentUser.id})`);
      
      // 🆕 SINCRONIZAR ESTADO DE UNIÓN CON EL SERVIDOR
      const joinedCommunityIds = await this.syncMembershipStatus();
      
      const response = await fetch(`${API_URL}/communities`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.communities || !Array.isArray(data.communities)) {
        console.warn('⚠️ Formato de respuesta inesperado:', data);
        return [];
      }
      
      // 🆕 APLICAR ESTADO SINCRONIZADO DEL SERVIDOR
      const processedCommunities = data.communities.map(community => {
        const isActuallyJoined = joinedCommunityIds.includes(community.id);
        
        // 🆕 SOLO ESTAR UNIDO SI REALMENTE ESTÁ UNIDO O ES CREADOR
        // Verificar que isCreator sea realmente true comparando IDs
        const isActuallyCreator = community.creadorId === currentUser.id;
        const finalIsJoined = isActuallyCreator || isActuallyJoined;
        
        // 🆕 DEBUG: Log del estado de cada comunidad
        console.log(`🔍 Comunidad "${community.name}" (ID: ${community.id}):`, {
          isCreator: community.isCreator,
          isActuallyCreator,
          isActuallyJoined,
          finalIsJoined,
          creadorId: community.creadorId,
          currentUserId: currentUser.id
        });
        
        return {
          ...community,
          isCreator: Boolean(community.isCreator),
          isAdmin: Boolean(community.isAdmin),
          isJoined: finalIsJoined, // 🆕 RESPETAR SI ES CREADOR
          creadorNombre: community.creadorNombre || 'Usuario Desconocido',
          creadorId: community.creadorId || null,
          memberCount: Number(community.memberCount) || 0,
          roleBadge: community.isCreator ? 'Creador' : 
                    (community.isAdmin ? 'Admin' : 
                    (finalIsJoined ? 'Miembro' : null))
        };
      });

      console.log(`✅ ${processedCommunities.length} comunidades procesadas con estado sincronizado`);
      console.log(`🔗 Comunidades unidas: ${joinedCommunityIds.join(', ')}`);
      
      return processedCommunities;
      
    } catch (error) {
      console.error('❌ Error obteniendo comunidades:', error);
      
      // Datos de respaldo
      return [
        {
          id: 1,
          name: 'Mi Ciudad SV Oficial',
          description: 'Comunidad oficial de la aplicación Mi Ciudad SV',
          category: 'general',
          memberCount: 150,
          isJoined: false,
          isAdmin: false,
          isCreator: false,
          creadorNombre: 'Admin Sistema',
          creadorId: 1,
          roleBadge: null,
          fechaCreacion: new Date().toISOString()
        }
      ];
    }
  },

  // Obtener comunidades del usuario
  async getUserCommunities() {
    try {
      // 🆕 VERIFICAR QUE HAYA USUARIO AUTENTICADO
      if (!currentUser || !currentUser.id) {
        console.warn('⚠️ No hay usuario autenticado, intentando inicializar...');
        await this.initializeUser();
        
        if (!currentUser || !currentUser.id) {
          console.error('❌ No se pudo inicializar usuario');
          return [];
        }
      }
      
      console.log(`🔍 Obteniendo comunidades del usuario ${currentUser.name}...`);
      
      const response = await fetch(`${API_URL}/communities/user`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.communities || !Array.isArray(data.communities)) {
        console.warn('⚠️ Sin comunidades de usuario');
        return [];
      }
      
      const userCommunities = data.communities.map(community => ({
        ...community,
        isCreator: Boolean(community.isCreator),
        isAdmin: Boolean(community.isAdmin),
        isJoined: true,
        creadorNombre: community.creadorNombre || 'Usuario Desconocido',
        roleBadge: community.isCreator ? 'Creador' : 
                  (community.isAdmin ? 'Admin' : 'Miembro')
      }));

      console.log(`✅ ${userCommunities.length} comunidades del usuario obtenidas`);
      return userCommunities;
      
    } catch (error) {
      console.error('❌ Error obteniendo comunidades del usuario:', error);
      return [];
    }
  },

  // Crear nueva comunidad
  async createCommunity(communityData) {
    try {
      console.log(`🔄 Creando nueva comunidad como ${currentUser.name}...`);
      console.log('📝 Datos a enviar:', communityData);
      
      const response = await fetch(`${API_URL}/communities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(communityData),
        timeout: 15000
      });

      const data = await handleResponse(response);
      
      if (!data.community) {
        throw new Error('Respuesta inválida del servidor al crear comunidad');
      }
      
      const newCommunity = {
        ...data.community,
        isCreator: true,
        isAdmin: true,
        isJoined: true,
        roleBadge: 'Creador',
        creadorNombre: data.community.creadorNombre || currentUser.name,
        memberCount: Number(data.community.memberCount) || 1
      };

      console.log(`✅ Comunidad "${newCommunity.name}" creada por ${currentUser.name}`);
      return newCommunity;
      
    } catch (error) {
      console.error('❌ Error creando comunidad:', error);
      throw error;
    }
  },

  // Unirse/salir de comunidad
  async toggleMembership(action, communityId) {
    try {
      console.log(`🔄 ${action === 'join' ? 'Uniéndose a' : 'Saliendo de'} comunidad ${communityId} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      const response = await fetch(`${API_URL}/communities/action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, communityId: Number(communityId) }),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      // 🆕 Guardar la acción del usuario en AsyncStorage para detectar abandono voluntario
      if (action === 'leave') {
        try {
          const userActions = await AsyncStorage.getItem('userCommunityActions') || '{}';
          const actions = JSON.parse(userActions);
          actions[communityId] = {
            lastAction: 'leave',
            timestamp: Date.now(),
            communityName: data.communityName || 'Comunidad'
          };
          await AsyncStorage.setItem('userCommunityActions', JSON.stringify(actions));
          console.log(`💾 Acción de salida guardada para comunidad ${communityId}`);
        } catch (storageError) {
          console.warn('⚠️ No se pudo guardar la acción de salida:', storageError);
        }
      } else if (action === 'join') {
        // 🆕 Limpiar la acción de salida cuando el usuario se une nuevamente
        try {
          const userActions = await AsyncStorage.getItem('userCommunityActions') || '{}';
          const actions = JSON.parse(userActions);
          if (actions[communityId]) {
            delete actions[communityId];
            await AsyncStorage.setItem('userCommunityActions', JSON.stringify(actions));
            console.log(`🧹 Acción de salida limpiada para comunidad ${communityId}`);
          }
        } catch (storageError) {
          console.warn('⚠️ No se pudo limpiar la acción de salida:', storageError);
        }
      }
      
      console.log(`✅ ${action === 'join' ? 'Unido a' : 'Salido de'} comunidad exitosamente`);
      return {
        ...data,
        roleBadge: data.isCreator ? 'Creador' : (action === 'join' ? 'Miembro' : null)
      };
      
    } catch (error) {
      console.error(`❌ Error en ${action}:`, error);
      throw error;
    }
  },

  // 🆕 Obtener acciones del usuario en una comunidad
  async getUserCommunityActions(communityId) {
    try {
      const userActions = await AsyncStorage.getItem('userCommunityActions') || '{}';
      const actions = JSON.parse(userActions);
      return actions[communityId] || null;
    } catch (error) {
      console.warn('⚠️ Error obteniendo acciones del usuario:', error);
      return null;
    }
  },

  // Obtener detalles de comunidad
  async getCommunityDetails(communityId) {
    try {
      console.log(`🔍 Obteniendo detalles de comunidad ${communityId} como ${currentUser?.name || 'desconocido'}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.community) {
        throw new Error('Detalles de comunidad no encontrados');
      }
      
      const communityDetails = {
        ...data.community,
        isCreator: Boolean(data.community.isCreator),
        isAdmin: Boolean(data.community.isAdmin),
        isJoined: Boolean(data.community.isJoined),
        creadorNombre: data.community.creadorNombre || 'Usuario Desconocido',
        roleBadge: data.community.isCreator ? 'Creador' : 
                  (data.community.isAdmin ? 'Admin' : 
                  (data.community.isJoined ? 'Miembro' : null)),
        userRole: data.community.isCreator ? 'Creador' : 
                 (data.community.isAdmin ? 'Administrador' : 'Miembro')
      };

      console.log(`✅ Detalles de comunidad obtenidos para ${currentUser?.name || 'desconocido'}`);
      return communityDetails;
      
    } catch (error) {
      // Solo mostrar error en consola si no es relacionado con comunidad eliminada
      if (!error.message.includes('Comunidad no encontrada') && 
          !error.message.includes('404') && 
          !error.message.includes('403') && 
          !error.message.includes('No autorizado')) {
        console.error('❌ Error obteniendo detalles:', error);
        
        // Si es un error de formato, proporcionar más información
        if (error.message.includes('Error de formato en la respuesta del servidor')) {
          console.error('❌ Detalles del error de formato:', {
            communityId,
            currentUser: currentUser?.name || 'desconocido',
            error: error.message
          });
        }
      }
      
      throw error;
    }
  },

  // 🆕 Obtener miembros de una comunidad
  async getCommunityMembers(communityId) {
    try {
      console.log(`👥 Obteniendo miembros de comunidad ${communityId} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}/members`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.members || !Array.isArray(data.members)) {
        console.warn('⚠️ Sin miembros encontrados');
        return [];
      }
      
      const membersWithRoles = data.members.map(member => ({
        ...member,
        userRole: member.userRole || 'Miembro',
        roleBadge: member.userRole === 'Creador' ? '👑' : 
                   (member.userRole === 'Admin' ? '⭐' : ''),
        isCreator: member.userRole === 'Creador',
        isAdmin: member.userRole === 'Admin',
        // 🆕 NUEVO: Indicar si se puede expulsar (solo para creadores, no al propio creador)
        canBeExpelled: !member.isCreator && currentUser && currentUser.id !== member.id
      }));

      console.log(`✅ ${membersWithRoles.length} miembros obtenidos para ${currentUser.name}`);
      return membersWithRoles;
      
    } catch (error) {
      console.error('❌ Error obteniendo miembros:', error);
      return [];
    }
  },

  // Obtener mensajes de comunidad
  async getCommunityMessages(communityId, page = 1) {
    try {
      console.log(`🔍 Obteniendo mensajes de comunidad ${communityId}, página ${page} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}/messages?page=${page}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn('⚠️ Sin mensajes encontrados');
        return [];
      }
      
      const messagesWithRoles = data.messages.map(message => ({
        ...message,
        userRole: message.userRole || 'Miembro',
        isCreatorMessage: Boolean(message.isCreatorMessage),
        messageStyle: message.isCreatorMessage ? 'creator' : 
                     (message.userRole === 'Admin' ? 'admin' : 'member'),
        roleBadge: message.userRole === 'Creador' ? '👑' : 
                   (message.userRole === 'Admin' ? '⭐' : ''),
        formattedTime: message.formattedTime || new Date(message.timestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      console.log(`✅ ${messagesWithRoles.length} mensajes obtenidos para ${currentUser.name}`);
      return messagesWithRoles;
      
    } catch (error) {
      console.error('❌ Error obteniendo mensajes:', error);
      
      return [
        {
          id: Date.now(),
          text: '¡Bienvenidos a la comunidad! (Mensaje de respaldo)',
          userName: 'Sistema',
          userId: 1,
          timestamp: new Date().toISOString(),
          isOwn: false,
          userRole: 'Creador',
          isCreatorMessage: true,
          messageStyle: 'creator',
          roleBadge: '👑',
          formattedTime: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ];
    }
  },

  // Enviar mensaje
  async sendMessage(communityId, messageText) {
    try {
      console.log(`🔄 Enviando mensaje a comunidad ${communityId} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      if (!messageText || !messageText.trim()) {
        throw new Error('El mensaje no puede estar vacío');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: messageText.trim() }),
        timeout: 10000
      });

      const data = await handleResponse(response);
      
      if (!data.message) {
        throw new Error('Respuesta inválida del servidor al enviar mensaje');
      }
      
      const sentMessage = {
        ...data.message,
        isOwn: true,
        userRole: data.message.userRole || 'Miembro',
        messageStyle: data.message.userRole === 'Creador' ? 'creator' : 
                     (data.message.userRole === 'Admin' ? 'admin' : 'member'),
        roleBadge: data.message.userRole === 'Creador' ? '👑' : 
                   (data.message.userRole === 'Admin' ? '⭐' : ''),
        formattedTime: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      console.log(`✅ Mensaje enviado por ${currentUser.name}`);
      return sentMessage;
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  },

  // 🆕 NUEVA FUNCIÓN: Expulsar usuario de comunidad (solo para creadores)
  async expelUserFromCommunity(communityId, userIdToExpel) {
    try {
      console.log(`🚫 Intentando expulsar usuario ${userIdToExpel} de comunidad ${communityId} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      if (!userIdToExpel || isNaN(userIdToExpel)) {
        throw new Error('ID de usuario a expulsar inválido');
      }
      
      // Verificar que el usuario sea el creador
      const communityDetails = await this.getCommunityDetails(communityId);
      if (!communityDetails.isCreator) {
        throw new Error('Solo el creador puede expulsar usuarios');
      }
      
      // Verificar que no se esté expulsando al creador
      if (parseInt(userIdToExpel) === currentUser.id) {
        throw new Error('No puedes expulsarte a ti mismo');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}/expel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userIdToExpel: Number(userIdToExpel) }),
        timeout: 15000
      });

      const data = await handleResponse(response);
      
      console.log(`✅ Usuario ${userIdToExpel} expulsado exitosamente de la comunidad por ${currentUser.name}`);
      return {
        success: true,
        message: 'Usuario expulsado exitosamente',
        communityId: communityId,
        expelledUserId: userIdToExpel,
        action: data.action || 'user_expelled',
        expelledUserWillBeRedirected: data.expelledUserWillBeRedirected || false
      };
      
    } catch (error) {
      console.error('❌ Error expulsando usuario:', error);
      throw error;
    }
  },

  // 🆕 NUEVA FUNCIÓN: Eliminar comunidad (solo para creadores)
  async deleteCommunity(communityId) {
    try {
      console.log(`🗑️ Intentando eliminar comunidad ${communityId} como ${currentUser.name}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      // Verificar que el usuario sea el creador
      const communityDetails = await this.getCommunityDetails(communityId);
      if (!communityDetails.isCreator) {
        throw new Error('Solo el creador puede eliminar la comunidad');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        timeout: 15000
      });

      const data = await handleResponse(response);
      
      console.log(`✅ Comunidad "${communityDetails.name}" eliminada exitosamente por ${currentUser.name}`);
      return {
        success: true,
        message: 'Comunidad eliminada exitosamente',
        communityId: communityId
      };
      
    } catch (error) {
      console.error('❌ Error eliminando comunidad:', error);
      throw error;
    }
  },

  // 🆕 NUEVA FUNCIÓN: Obtener categorías disponibles
  async getCategories() {
    try {
      console.log('🔍 Obteniendo categorías disponibles...');
      
      const response = await fetch(`${API_URL}/communities/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const data = await handleResponse(response);
      
      console.log(`✅ ${data.categories.length} categorías obtenidas`);
      return data.categories;
      
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      // Retornar categorías por defecto en caso de error
      return [
        'General',
        'Seguridad Ciudadana',
        'Medio Ambiente',
        'Educación',
        'Salud',
        'Transporte',
        'Cultura',
        'Deportes',
        'Tecnología',
        'Negocios',
        'Turismo',
        'Servicios Públicos',
        'Eventos',
        'Voluntariado',
        'Otros'
      ];
    }
  },

  // 🆕 NUEVA FUNCIÓN: Actualizar información de la comunidad (solo para creadores)
  async updateCommunity(communityId, updateData) {
    try {
      console.log(`✏️ Intentando actualizar comunidad ${communityId} con datos:`, updateData);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error('No hay datos para actualizar');
      }
      
      const response = await fetch(`${API_URL}/communities/${communityId}/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
        timeout: 15000
      });
      
      const data = await handleResponse(response);
      
      console.log(`✅ Comunidad ${communityId} actualizada exitosamente por ${currentUser.name}`);
      return {
        success: true,
        message: 'Comunidad actualizada exitosamente',
        community: data.community
      };
      
    } catch (error) {
      console.error('❌ Error actualizando comunidad:', error);
      throw error;
    }
  },

  // Funciones helper
  getAvailableActions(community) {
    const actions = [];
    
    if (community.isCreator) {
      actions.push({
        id: 'manage',
        title: 'Gestionar',
        icon: '⚙️',
        color: '#FFD700'
      });
      actions.push({
        id: 'chat',
        title: 'Chat',
        icon: '💬',
        color: '#4CAF50'
      });
      // 🆕 SOLO EL CREADOR PUEDE ELIMINAR
      actions.push({
        id: 'delete',
        title: 'Eliminar',
        icon: '🗑️',
        color: '#FF0000'
      });
    } else if (community.isJoined) {
      actions.push({
        id: 'chat',
        title: 'Chat',
        icon: '💬',
        color: '#4CAF50'
      });
      actions.push({
        id: 'leave',
        title: 'Salir',
        icon: '🚪',
        color: '#f44336'
      });
    } else {
      actions.push({
        id: 'join',
        title: 'Unirse',
        icon: '➕',
        color: '#2196F3'
      });
    }
    
    return actions;
  },

  getRoleColor(role) {
    switch (role) {
      case 'Creador': return '#FFD700';
      case 'Admin': return '#FF9800';
      case 'Miembro': return '#4CAF50';
      default: return '#9E9E9E';
    }
  },

  // 🆕 FUNCIÓN PARA LIMPIAR CACHÉ (requerida por HomeScreen y useAuth)
  async clearUserCache() {
    try {
      console.log('🧹 Limpiando caché del usuario en communityService...');
      // Resetear el usuario actual
      currentUser = null;
      // También limpiar AsyncStorage si es necesario
      await AsyncStorage.removeItem('userData');
      console.log('✅ Caché limpiado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
      return false;
    }
  },

  // 🆕 ALIAS PARA COMPATIBILIDAD
  async clearCache() {
    return this.clearUserCache();
  },

  // 🆕 NUEVA FUNCIÓN: Verificar si el usuario actual ha sido expulsado de una comunidad o si la comunidad fue eliminada
  async checkIfUserWasExpelled(communityId) {
    try {
      console.log(`🔍 Verificando si el usuario ${currentUser.name} fue expulsado de comunidad ${communityId}...`);
      
      if (!communityId || isNaN(communityId)) {
        throw new Error('ID de comunidad inválido');
      }
      
      // Intentar obtener detalles de la comunidad
      const communityDetails = await this.getCommunityDetails(communityId);
      
      // Si el usuario no está unido y no es el creador, verificar si se salió voluntariamente
      if (!communityDetails.isJoined && !communityDetails.isCreator) {
        // 🆕 NUEVO: Verificar si el usuario se salió voluntariamente
        try {
          const userActions = await this.getUserCommunityActions(communityId);
          
          // Si la última acción fue "leave", significa que se salió voluntariamente
          if (userActions && userActions.lastAction === 'leave') {
            console.log(`👋 Usuario ${currentUser.name} abandonó voluntariamente la comunidad ${communityId}`);
            return {
              wasExpelled: true,
              communityId: communityId,
              communityName: communityDetails.name,
              reason: 'Has abandonado la comunidad'
            };
          }
        } catch (actionError) {
          console.warn('⚠️ Error verificando acciones del usuario:', actionError);
        }
        
        // Si no se puede determinar la razón, asumir expulsión
        console.log(`🚫 Usuario ${currentUser.name} fue expulsado de comunidad ${communityId}`);
        return {
          wasExpelled: true,
          communityId: communityId,
          communityName: communityDetails.name,
          reason: 'Expulsado por el creador'
        };
      }
      
      console.log(`✅ Usuario ${currentUser.name} sigue siendo miembro de comunidad ${communityId}`);
      return {
        wasExpelled: false,
        communityId: communityId,
        communityName: communityDetails.name
      };
      
    } catch (error) {
      // 🆕 NUEVO: Si la comunidad no existe, significa que fue eliminada - NO MOSTRAR ERROR
      if (error.message.includes('Comunidad no encontrada') || 
          error.message.includes('404') || 
          error.message.includes('Respuesta vacía del servidor') ||
          error.message.includes('Error de formato en la respuesta del servidor')) {
        console.log(`🗑️ Comunidad ${communityId} fue eliminada por el administrador`);
        return {
          wasExpelled: true,
          communityId: communityId,
          communityName: 'Comunidad eliminada',
          reason: 'Comunidad eliminada por el administrador'
        };
      }
      
      // Si hay error de autorización, probablemente fue expulsado - NO MOSTRAR ERROR
      if (error.message.includes('403') || error.message.includes('No autorizado')) {
        console.log(`🚫 Usuario ${currentUser.name} probablemente fue expulsado de comunidad ${communityId}`);
        return {
          wasExpelled: true,
          communityId: communityId,
          communityName: 'Comunidad desconocida',
          reason: 'Expulsado por el creador'
        };
      }
      
      // Solo mostrar error en consola para otros tipos de errores (no relacionados con expulsión/eliminación)
      console.error('❌ Error verificando expulsión:', error);
      
      return {
        wasExpelled: false,
        communityId: communityId,
        communityName: 'Comunidad desconocida',
        error: error.message
      };
    }
  }
};

export default communityService;