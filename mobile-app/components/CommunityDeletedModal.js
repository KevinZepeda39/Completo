import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CommunityDeletedModal = ({ 
  visible, 
  onClose, 
  communityName, 
  reason = 'deleted' // 'deleted', 'expelled', 'left'
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de pulso para el icono
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Resetear animaciones
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Configurar contenido según la razón
  const getModalContent = () => {
    switch (reason) {
      case 'deleted':
        return {
          icon: 'trash',
          iconColor: '#EF4444',
          iconBackground: '#FEF2F2',
          title: '🗑️ Comunidad Eliminada',
          message: 'La comunidad ha sido eliminada por el administrador.',
          details: 'Todos los mensajes, miembros y contenido han sido eliminados permanentemente.',
          buttonColor: '#EF4444',
          buttonText: 'Entendido'
        };
      case 'expelled':
        return {
          icon: 'person-remove',
          iconColor: '#F59E0B',
          iconBackground: '#FFFBEB',
          title: '🚫 Has Sido Expulsado',
          message: 'Has sido expulsado de la comunidad por el creador.',
          details: 'Ya no tienes acceso a esta comunidad ni a su contenido.',
          buttonColor: '#F59E0B',
          buttonText: 'Entendido'
        };
      case 'left':
        return {
          icon: 'exit',
          iconColor: '#6B7280',
          iconBackground: '#F9FAFB',
          title: '👋 Has Abandonado la Comunidad',
          message: 'Has abandonado la comunidad exitosamente.',
          details: 'Ya no recibirás notificaciones de esta comunidad.',
          buttonColor: '#6B7280',
          buttonText: 'Entendido'
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6',
          iconBackground: '#EFF6FF',
          title: 'ℹ️ Información',
          message: 'Ya no tienes acceso a esta comunidad.',
          details: 'Serás redirigido al apartado general de comunidades.',
          buttonColor: '#3B82F6',
          buttonText: 'Entendido'
        };
    }
  };

  const content = getModalContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Icono con animación de pulso */}
          <View style={styles.iconContainer}>
            <Animated.View 
              style={[
                styles.iconBackground,
                { 
                  backgroundColor: content.iconBackground,
                  borderColor: content.iconColor,
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <Ionicons name={content.icon} size={60} color={content.iconColor} />
            </Animated.View>
          </View>

          {/* Título */}
          <Text style={styles.title}>{content.title}</Text>
          
          {/* Nombre de la comunidad */}
          <View style={[styles.communityNameContainer, { borderLeftColor: content.iconColor }]}>
            <Text style={styles.communityName}>"{communityName}"</Text>
          </View>

          {/* Mensaje principal */}
          <Text style={styles.message}>{content.message}</Text>

          {/* Detalles adicionales */}
          <View style={[styles.detailsContainer, { backgroundColor: content.iconBackground }]}>
            <Ionicons name="information-circle-outline" size={20} color={content.iconColor} />
            <Text style={[styles.detailsText, { color: content.iconColor }]}>
              {content.details}
            </Text>
          </View>

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoText}>
              Serás redirigido al apartado general de comunidades.
            </Text>
          </View>

          {/* Botón */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: content.buttonColor }]} 
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{content.buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: width * 0.9,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 15,
  },
  communityNameContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  detailsText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
    flex: 1,
  },
  additionalInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default CommunityDeletedModal;
