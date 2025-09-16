// components/PasswordUpdatedModal.js
// Modal de éxito para contraseña actualizada
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

const PasswordUpdatedModal = ({ 
  visible, 
  onClose, 
  onContinue
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
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
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          delay: 200,
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
      iconScaleAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <ConfettiCannon
          count={80}
          origin={{ x: width / 2, y: -10 }}
          fadeOut={true}
          autoStart={true}
          colors={['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#4B7BEC']}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header con gradiente verde */}
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: iconScaleAnim }],
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={50} color="#4CAF50" />
            </Animated.View>
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
            <Text style={styles.title}>¡Contraseña Actualizada! 🔐</Text>
            <Text style={styles.subtitle}>Tu contraseña ha sido cambiada exitosamente</Text>
            
            {/* Información de seguridad */}
            <View style={styles.securityInfo}>
              <View style={styles.securityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>Contraseña segura establecida</Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>Tu cuenta está protegida</Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="time" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>Cambio efectivo inmediatamente</Text>
              </View>
            </View>

            {/* Consejo de seguridad */}
            <View style={styles.tipContainer}>
              <Ionicons name="bulb" size={16} color="#FF9800" />
              <Text style={styles.tipText}>
                Recuerda usar una contraseña única y no compartirla con nadie
              </Text>
            </View>
          </Animated.View>

          {/* Botón */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  header: {
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: '#fff',
    borderRadius: 45,
    padding: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  securityInfo: {
    width: '100%',
    backgroundColor: '#f8fff8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f5e8',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 14,
    color: '#2e7d32',
    marginLeft: 12,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipText: {
    fontSize: 13,
    color: '#e65100',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default PasswordUpdatedModal;
