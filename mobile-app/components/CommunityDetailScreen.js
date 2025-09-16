// components/CommunityDetailScreen.js - DISEÑO COMO WHATSAPP/TELEGRAM MODERNO
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
  Keyboard,
  Image,
} from 'react-native';
import communityService from '../services/communityService';
import CommunityDeletedModal from './CommunityDeletedModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CommunityDetailScreen = ({ route, navigation }) => {
  const { community: initialCommunity } = route.params;
  
  const [community, setCommunity] = useState(initialCommunity);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCommunityInfo, setShowCommunityInfo] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [expulsionAlertShown, setExpulsionAlertShown] = useState(false);

  // 🚫 ESTADO PARA MODAL DE COMUNIDAD ELIMINADA/EXPULSADA
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedCommunityInfo, setDeletedCommunityInfo] = useState(null);
  
  const flatListRef = useRef(null);

  // 🔥 useCallback para evitar recrear la función en cada render
  const loadMessages = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoadingMessages(true);
      }
      
      console.log(`📬 Cargando mensajes para comunidad ${community.id}...`);
      
      const messagesData = await communityService.getCommunityMessages(community.id, 1);
      
      console.log(`✅ Mensajes cargados:`, messagesData.length);
      
      // Procesar mensajes con formato de tiempo
      const processedMessages = messagesData.map(msg => ({
        ...msg,
        formattedTime: msg.formattedTime || new Date(msg.timestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      setMessages(processedMessages);
      
      // Scroll al final después de cargar mensajes
      setTimeout(() => {
        if (flatListRef.current && processedMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
      
    } catch (error) {
      console.error('❌ Error cargando mensajes:', error);
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  }, [community.id]);

  const loadCommunityDetails = useCallback(async () => {
    try {
      console.log(`🔍 Cargando detalles de comunidad ${community.id}...`);
      
      const details = await communityService.getCommunityDetails(community.id);
      if (details) {
        setCommunity(details);
        console.log(`✅ Detalles actualizados. Rol: ${details.isCreator ? 'Creador' : details.isAdmin ? 'Admin' : 'Miembro'}`);
      }
    } catch (error) {
      console.error('❌ Error cargando detalles:', error);
    }
  }, [community.id]);

  // 🆕 Cargar miembros de la comunidad
  const loadCommunityMembers = useCallback(async () => {
    try {
      console.log(`👥 Cargando miembros de comunidad ${community.id}...`);
      
      // Aquí deberías llamar al servicio para obtener los miembros
      // const members = await communityService.getCommunityMembers(community.id);
      
      // Datos de ejemplo mientras implementas el endpoint
      const exampleMembers = [
        {
          id: 1,
          name: community.creadorNombre || 'Creador',
          role: 'Creador',
          isCreator: true,
        },
        {
          id: 2,
          name: 'Usuario Ejemplo',
          role: 'Miembro',
          isCreator: false,
        },
      ];
      
      setCommunityMembers(exampleMembers);
      console.log(`✅ ${exampleMembers.length} miembros cargados`);
    } catch (error) {
      console.error('❌ Error cargando miembros:', error);
    }
  }, [community.id, community.creadorNombre]);

  // 🆕 Abrir modal de información
  const openCommunityInfo = useCallback(async () => {
    // Navegar a la pantalla de información de la comunidad
    navigation.navigate('CommunityInfo', { community });
  }, [navigation, community]);

  // 🆕 NUEVA FUNCIÓN: Verificar si el usuario actual fue expulsado
  const checkIfUserWasExpelled = useCallback(async () => {
    try {
      // 🆕 Si ya se mostró la alerta, no verificar más
      if (expulsionAlertShown) {
        console.log('🔇 Alerta ya mostrada, no verificar más');
        return true;
      }
      
      console.log('🔍 Verificando si el usuario fue expulsado del chat...');
      
      const expulsionStatus = await communityService.checkIfUserWasExpelled(community.id);
      
      if (expulsionStatus.wasExpelled) {
        console.log(`🚫 Usuario fue expulsado/eliminado de "${expulsionStatus.communityName}"`);
        
        // 🆕 Marcar que la alerta ya se mostró INMEDIATAMENTE
        setExpulsionAlertShown(true);
        
        // Determinar la razón para el modal
        const isCommunityDeleted = expulsionStatus.reason === 'Comunidad eliminada por el administrador';
        const isVoluntaryLeave = expulsionStatus.reason === 'Has abandonado la comunidad';
        
        let reason;
        if (isCommunityDeleted) {
          reason = 'deleted';
        } else if (isVoluntaryLeave) {
          reason = 'left';
        } else {
          reason = 'expelled';
        }
        
        // Mostrar modal bonito en lugar del Alert
        handleShowDeletedModal(expulsionStatus.communityName, reason);
        
        return true;
      }
      
      return false;
    } catch (error) {
      // Solo mostrar error en consola si no es relacionado con expulsión/eliminación
      if (!error.message.includes('Comunidad no encontrada') && 
          !error.message.includes('404') && 
          !error.message.includes('403') && 
          !error.message.includes('No autorizado')) {
        console.error('❌ Error verificando expulsión:', error);
      }
      return false;
    }
  }, [community.id, navigation, expulsionAlertShown]);

  // 🚫 FUNCIONES PARA EL MODAL DE COMUNIDAD ELIMINADA/EXPULSADA
  const handleShowDeletedModal = (communityName, reason) => {
    setDeletedCommunityInfo({ name: communityName, reason });
    setShowDeletedModal(true);
  };

  const handleCloseDeletedModal = () => {
    setShowDeletedModal(false);
    setDeletedCommunityInfo(null);
    
    // Navegar de vuelta a comunidades
    navigation.reset({
      index: 0,
      routes: [{ name: 'Communities' }],
    });
  };

  // 🔥 Efecto principal para cargar datos iniciales
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        
        // 🆕 VERIFICAR INMEDIATAMENTE SI EL USUARIO FUE EXPULSADO
        console.log('🔍 Verificando expulsión al cargar pantalla...');
        const wasExpelled = await checkIfUserWasExpelled();
        if (wasExpelled) {
          console.log('🚫 Usuario expulsado detectado al cargar pantalla - Redirigiendo inmediatamente...');
          // 🆕 REDIRIGIR INMEDIATAMENTE SIN MOSTRAR LA PANTALLA
          navigation.reset({
            index: 0,
            routes: [{ name: 'Communities' }],
          });
          return; // Salir sin cargar más datos
        }
        
        // Cargar en paralelo para mejorar performance
        await Promise.all([
          loadCommunityDetails(),
          loadMessages()
        ]);
        
      } catch (error) {
        console.error('❌ Error inicializando pantalla:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
    
    // 🆕 Verificar periódicamente si el usuario fue expulsado
    const checkExpulsionInterval = setInterval(async () => {
      // 🆕 Solo verificar si no se ha mostrado la alerta
      if (!expulsionAlertShown) {
        await checkIfUserWasExpelled();
      }
    }, 5000); // Verificar cada 5 segundos
    
    return () => {
      clearInterval(checkExpulsionInterval);
    };
  }, [loadCommunityDetails, loadMessages, expulsionAlertShown]); // 🆕 Agregar dependencia

  // 🎹 Listeners del teclado para mejor UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        // Auto-scroll suave cuando aparece el teclado, como en WhatsApp
        setTimeout(() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 200);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [messages.length]);

  // 🔥 Función de refresh mejorada
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Refrescando datos de la comunidad...');
      
      await Promise.all([
        loadCommunityDetails(),
        loadMessages(true)
      ]);
      
      console.log('✅ Datos refrescados exitosamente');
    } catch (error) {
      console.error('❌ Error refrescando:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  }, [loadCommunityDetails, loadMessages]);

  // 🔥 Función de envío de mensaje mejorada
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'El mensaje no puede estar vacío');
      return;
    }

    const messageText = newMessage.trim();
    
    // Limpiar input inmediatamente para mejor UX
    setNewMessage('');

    try {
      setSending(true);
      console.log(`📤 Enviando mensaje a comunidad ${community.id}: "${messageText.substring(0, 50)}..."`);
      
      const sentMessage = await communityService.sendMessage(community.id, messageText);
      
      console.log('✅ Mensaje enviado exitosamente:', sentMessage);
      
      // 🔥 AGREGAR EL NUEVO MENSAJE A LA LISTA INMEDIATAMENTE
      const processedMessage = {
        ...sentMessage,
        formattedTime: sentMessage.formattedTime || new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      setMessages(prev => [...prev, processedMessage]);
      
      // Scroll al final
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      // 🔥 OPCIONAL: Recargar todos los mensajes después de 2 segundos para sincronizar
      setTimeout(() => {
        loadMessages(false);
      }, 2000);
      
      
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      
      // 🔒 Manejo especial para comunidades suspendidas
      if (error.message && error.message.includes('suspendida')) {
        Alert.alert(
          'Comunidad Suspendida', 
          'Esta comunidad está suspendida. No se pueden enviar mensajes hasta que sea reactivada.',
          [{ text: 'Entendido', style: 'default' }]
        );
      } else if (error.message && error.message.includes('no está disponible')) {
        Alert.alert(
          'Comunidad No Disponible', 
          'Esta comunidad no está disponible para mensajes en este momento.',
          [{ text: 'Entendido', style: 'default' }]
        );
      } else {
        Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
      }
      
      // Restaurar mensaje en caso de error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // 🆕 Obtener estilo según el usuario
  const isOwnMessage = (message) => {
    // Aquí deberías tener la lógica para determinar si es mensaje propio
    return message.isOwn || false;
  };

  // 🆕 Renderizar mensaje
  const renderMessage = ({ item: message, index }) => {
    const isOwn = isOwnMessage(message);
    const showAvatar = !isOwn && (index === 0 || !isOwnMessage(messages[index - 1]));
    
    return (
      <View style={[
        styles.messageWrapper,
        isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper
      ]}>
        {/* Avatar para mensajes de otros */}
        {showAvatar && !isOwn && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {message.userPhoto ? (
                <Image 
                  source={{ uri: message.userPhoto }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {(message.userName || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        )}
        
        {/* Espaciador si no hay avatar */}
        {!showAvatar && !isOwn && (
          <View style={styles.avatarSpacer} />
        )}
        
        {/* Bubble del mensaje */}
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble
        ]}>
          {/* Nombre del usuario (solo para mensajes de otros y si es primer mensaje del grupo) */}
          {!isOwn && showAvatar && (
            <Text style={styles.senderName}>
              {message.userName || `Usuario ${message.userId}`}
            </Text>
          )}
          
          {/* Texto del mensaje */}
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.text || message.comentario}
          </Text>
          
          {/* Hora del mensaje */}
          <Text style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {message.formattedTime}
          </Text>
        </View>
      </View>
    );
  };

  // 🔥 Componente de loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
             <KeyboardAvoidingView 
         style={styles.keyboardAvoidingView}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
         enabled={true}
       >
        {/* Header simple y limpio */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={openCommunityInfo}
          activeOpacity={0.7}
        >
          <View style={styles.communityAvatar}>
            <Text style={styles.communityAvatarText}>
              {community.name ? community.name[0].toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.communityStatus}>
              Toca para ver información
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onRefresh}
        >
          <Text style={styles.headerButtonIcon}>⟲</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => `${item.id || item.idComentario || index}`}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loadingMessages ? (
                <View style={styles.emptyLoading}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.emptyLoadingText}>Cargando mensajes...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyText}>
                    No hay mensajes aún.{'\n'}¡Sé el primero en escribir!
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => loadMessages(true)}
                  >
                    <Text style={styles.retryButtonText}>
                      Recargar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
          onContentSizeChange={() => {
            if (messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
        />


        {/* Input de mensaje - DENTRO del KeyboardAvoidingView */}
        <View style={styles.whatsappInputContainer}>
          <View style={styles.whatsappInputWrapper}>
                         <TextInput
               style={styles.whatsappTextInput}
               placeholder="Escribe un mensaje..."
               placeholderTextColor="#999999"
               value={newMessage}
               onChangeText={setNewMessage}
               multiline={false}
               returnKeyType="send"
               onSubmitEditing={handleSendMessage}
               selectionColor="#007AFF"
               underlineColorAndroid="transparent"
               autoCorrect={true}
               autoCapitalize="sentences"
               textAlignVertical="center"
             />
            
            <TouchableOpacity
              style={styles.whatsappSendButton}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Text style={styles.whatsappSendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>

      {/* 🚫 Modal de comunidad eliminada/expulsada */}
      <CommunityDeletedModal
        visible={showDeletedModal}
        onClose={handleCloseDeletedModal}
        communityName={deletedCommunityInfo?.name || ''}
        reason={deletedCommunityInfo?.reason || 'deleted'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },

  // Modal de información de la comunidad
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: SCREEN_WIDTH * 0.9,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCommunityAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCommunityAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCommunityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalCommunityDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  memberRole: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  memberRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  creatorBadge: {
    backgroundColor: '#FFD700',
  },
  adminBadge: {
    backgroundColor: '#FF9800',
  },
  memberBadge: {
    backgroundColor: '#4CAF50',
  },
  memberRoleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header estilo WhatsApp
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  headerInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  communityStatus: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 1,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerButtonIcon: {
    fontSize: 20,
    color: '#007AFF',
  },
  
  // Chat container
  chatContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
    paddingBottom: 20, // Espacio normal para el input
  },
  
  // Mensajes estilo iMessage
  messageWrapper: {
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  
  // Avatares
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarSpacer: {
    width: 38,
  },
  
  // Burbujas de mensaje
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 1,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  
  // Texto del mensaje
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666666',
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyLoading: {
    alignItems: 'center',
  },
  emptyLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Input estilo WhatsApp
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    minHeight: 100,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 36,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
    borderWidth: 0,
    includeFontPadding: false,
    textAlign: 'left',
    fontWeight: '400',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // 🔒 Estilos para comunidad suspendida
  textInputDisabled: {
    color: '#999999',
    backgroundColor: '#F5F5F5',
  },
  suspendedWarning: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FFCCCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  suspendedWarningText: {
    color: '#CC0000',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  // DISEÑO COMO WHATSAPP - EXACTO COMO EN LA IMAGEN
  whatsappInputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  
  whatsappInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 40,
    marginHorizontal: 8,
    borderWidth: 0,
  },
  
  whatsappTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 28,
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
    includeFontPadding: false,
  },
  
  whatsappSendButton: {
    backgroundColor: '#25D366',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  whatsappSendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

});

export default CommunityDetailScreen;