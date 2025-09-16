// components/RegistrationSuccessModal.js
// Modal de éxito para registro de usuario
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

const RegistrationSuccessModal = ({ 
  visible, 
  onClose, 
  onContinue,
  userName = "Usuario",
  email = "usuario@ejemplo.com"
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
          count={120}
          origin={{ x: width / 2, y: -10 }}
          fadeOut={true}
          autoStart={true}
          colors={['#4B7BEC', '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header con gradiente */}
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: iconScaleAnim }],
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={45} color="#4B7BEC" />
            </Animated.View>
          </View>

          {/* Contenido */}
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.title}>¡Bienvenido a Mi Ciudad SV! 🎉</Text>
              <Text style={styles.subtitle}>Tu cuenta ha sido creada exitosamente</Text>
              
              {/* Información del usuario */}
              <View style={styles.userInfoContainer}>
                <View style={styles.userInfoItem}>
                  <Ionicons name="person" size={18} color="#4B7BEC" />
                  <Text style={styles.userInfoLabel}>Nombre:</Text>
                  <Text style={styles.userInfoValue}>{userName}</Text>
                </View>
                <View style={styles.userInfoItem}>
                  <Ionicons name="mail" size={18} color="#4B7BEC" />
                  <Text style={styles.userInfoLabel}>Email:</Text>
                  <Text style={styles.userInfoValue}>{email}</Text>
                </View>
              </View>

              {/* Pasos siguientes */}
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Próximos pasos:</Text>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Revisa tu email para el código de verificación</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Ingresa el código en la siguiente pantalla</Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>¡Comienza a usar la app!</Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Botón */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Verificar Email</Text>
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
    maxHeight: height * 0.9,
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
    backgroundColor: '#4B7BEC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 10,
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  userInfoContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 45,
  },
  userInfoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 15,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  stepNumber: {
    backgroundColor: '#4B7BEC',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#4B7BEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#4B7BEC',
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

export default RegistrationSuccessModal;
