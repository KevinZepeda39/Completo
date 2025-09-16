// components/ProfileUpdatedModal.js
// Modal moderno y atractivo para información actualizada
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProfileUpdatedModal = ({ 
  visible, 
  onClose, 
  userName = 'Usuario',
  onViewProfile
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada espectacular
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
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
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de pulso para el icono
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();

      // Animación de rotación sutil
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

    } else {
      // Resetear animaciones
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      iconScaleAnim.setValue(0);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
    }
    onClose();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Overlay con gradiente */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />
      </Animated.View>

      {/* Contenido del modal */}
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
            },
          ]}
        >
          {/* Header con gradiente */}
          <LinearGradient
            colors={['#4CAF50', '#45A049', '#2E7D32']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icono animado */}
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  transform: [
                    { scale: iconScaleAnim },
                    { scale: pulseAnim },
                    { rotate: rotate }
                  ],
                },
              ]}
            >
              <View style={styles.iconBackground}>
                <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
              </View>
              
              {/* Efectos de brillo */}
              <View style={styles.glowEffect} />
              <View style={styles.glowEffect2} />
            </Animated.View>

            <Text style={styles.title}>¡Información Actualizada!</Text>
          </LinearGradient>

          {/* Contenido principal */}
          <View style={styles.content}>
            <Text style={styles.greeting}>
              ¡Perfecto, <Text style={styles.userName}>{userName}</Text>!
            </Text>
            
            <Text style={styles.message}>
              Tu información se ha actualizado exitosamente y ya es visible en toda la aplicación.
            </Text>

            {/* Lista de beneficios */}
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Perfil actualizado en tiempo real</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="sync" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Sincronización automática</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="eye" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Visible en toda la aplicación</Text>
              </View>
            </View>

            {/* Consejo adicional */}
            <View style={styles.tipContainer}>
              <Ionicons name="bulb" size={16} color="#FF9800" />
              <Text style={styles.tipText}>
                Los cambios se aplicarán automáticamente en todos tus reportes y actividades
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.viewProfileButton}
              onPress={handleViewProfile}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="person" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>VER PERFIL</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradientOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  glowEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: -1,
  },
  glowEffect2: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: -2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    padding: 25,
  },
  greeting: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  userName: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    flex: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 10,
  },
  viewProfileButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileUpdatedModal;
