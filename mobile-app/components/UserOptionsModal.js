// components/UserOptionsModal.js
// Modal de opciones de usuario mejorado
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const UserOptionsModal = ({ 
  visible, 
  onClose, 
  userName = "Usuario",
  userPhoto = null,
  onViewProfile,
  onLogout
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Resetear animaciones
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleViewProfile = () => {
    onClose();
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const handleLogout = () => {
    onClose();
    if (onLogout) {
      onLogout();
    }
  };

  const getUserInitial = () => {
    return userName.charAt(0).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileContainer}>
              {userPhoto && typeof userPhoto === 'string' && userPhoto.trim().length > 0 ? (
                <Image 
                  source={{ uri: userPhoto }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                  onLoad={() => console.log('📸 UserOptionsModal: Foto de perfil cargada:', userPhoto)}
                  onError={(error) => {
                    console.log('❌ UserOptionsModal: Error cargando foto:', error);
                    console.log('❌ UserOptionsModal: URL de la foto:', userPhoto);
                  }}
                />
              ) : (
                <View style={styles.profileInitialContainer}>
                  <Text style={styles.profileInitial}>
                    {getUserInitial()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>Opciones de Usuario</Text>
            <Text style={styles.greeting}>Hola {userName}</Text>
          </View>

          {/* Contenido */}
          <Animated.View 
            style={[
              styles.content,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Opción Ver Perfil */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleViewProfile}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="person-outline" size={24} color="#4B7BEC" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Ver Perfil</Text>
                <Text style={styles.optionSubtitle}>Ver y editar tu información personal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Opción Cerrar Sesión */}
            <TouchableOpacity
              style={[styles.optionButton, styles.logoutButton]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, styles.logoutText]}>Cerrar Sesión</Text>
                <Text style={[styles.optionSubtitle, styles.logoutSubtitle]}>Salir de tu cuenta</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </Animated.View>

          {/* Botón Cancelar */}
          <View style={styles.cancelContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileContainer: {
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileInitialContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4B7BEC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logoutButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  optionIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutIconContainer: {
    backgroundColor: '#fff',
    shadowColor: '#FF3B30',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoutText: {
    color: '#FF3B30',
  },
  logoutSubtitle: {
    color: '#e53e3e',
  },
  cancelContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserOptionsModal;
