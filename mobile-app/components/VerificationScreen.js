// components/VerificationScreen.js - PANTALLA DE VERIFICACIÓN POR EMAIL
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import VerificationSuccessModal from './VerificationSuccessModal';

const VerificationScreen = ({ navigation, route }) => {
  const { email, userName, fromRegistration = false } = route.params || {};
  const { logout, login, loginWithToken } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const inputRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null)
  ];
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ✅ ANIMACIÓN DE ENTRADA
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ COUNTDOWN TIMER
  useEffect(() => {
    let interval = null;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // ✅ MANEJAR CAMBIO EN CAMPO DE CÓDIGO
  const handleCodeChange = (text, index) => {
    setError('');
    
    // Solo permitir números
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericText;
      setCode(newCode);
      
      // Auto-focus al siguiente campo si hay texto
      if (numericText && index < 5) {
        inputRefs[index + 1].current?.focus();
      }
      
      // Auto-verificar cuando todos los campos estén llenos
      if (index === 5 && numericText) {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          setTimeout(() => handleVerification(fullCode), 100);
        }
      }
    }
  };

  // ✅ MANEJAR BACKSPACE
  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // ✅ FUNCIÓN DE VERIFICACIÓN
  const handleVerification = async (codeToVerify = null) => {
    try {
      const verificationCode = codeToVerify || code.join('');
      
      if (verificationCode.length !== 6) {
        setError('Ingresa el código completo de 6 dígitos');
        return;
      }

      // ✅ VALIDAR QUE EL EMAIL EXISTA
      if (!email || typeof email !== 'string') {
        console.error('❌ Email is undefined or invalid:', email);
        setError('Error: Email no válido. Por favor, regresa al registro.');
        return;
      }

      setLoading(true);
      setError('');
      
      console.log('🔐 Verifying code:', verificationCode);
      console.log('📧 Email:', email);

      const result = await authService.verifyCode(email, verificationCode);
      
      console.log('✅ Verification result:', result);
      console.log('🔍 Debug - result.token:', result.token);
      console.log('🔍 Debug - result.user:', result.user);
      console.log('🔍 Debug - result.success:', result.success);

      if (result.success) {
        // Animación de éxito
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // ✅ MOSTRAR MODAL DE ÉXITO
        console.log('🎉 Verificación exitosa, mostrando modal de éxito...');
        setShowSuccessModal(true);
      } else {
        throw new Error(result.error || 'Error en la verificación');
      }

    } catch (error) {
      console.error('❌ Verification failed:', error);
      
      let errorMessage = 'Error en la verificación';
      if (error.message.includes('inválido')) {
        errorMessage = 'Código inválido. Verifica que sea correcto.';
        // Limpiar campos en caso de error
        setCode(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
      } else if (error.message.includes('expirado')) {
        errorMessage = 'El código ha expirado. Te enviaremos uno nuevo.';
        handleResendCode();
      } else {
        errorMessage = error.message || 'Error en la verificación';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES PARA MANEJAR EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleContinueFromSuccess = () => {
    setShowSuccessModal(false);
    // Navegar al login con el email verificado
    navigation.navigate('Login', {
      verifiedEmail: email,
      showSuccessMessage: true,
      verificationCompleted: true
    });
  };

  // ✅ FUNCIÓN PARA REENVIAR CÓDIGO
  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      setError('');
      
      console.log('📧 Resending code to:', email);

      const result = await authService.resendVerificationCode(email);
      
      if (result.success) {
        setTimer(60);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
        
        Alert.alert(
          '📧 Código Reenviado',
          'Te hemos enviado un nuevo código de verificación a tu correo electrónico.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Error reenviando código');
      }

    } catch (error) {
      console.error('❌ Resend failed:', error);
      setError(error.message || 'Error reenviando el código');
    } finally {
      setResendLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA IR ATRÁS
  const handleGoBack = () => {
    Alert.alert(
      'Cancelar Verificación',
      '¿Estás seguro que quieres cancelar la verificación? Deberás verificar tu email más tarde para usar todas las funciones.',
      [
        { text: 'Continuar Verificando', style: 'cancel' },
        { 
          text: 'Cancelar', 
          style: 'destructive',
          onPress: () => {
            if (fromRegistration) {
              // Si viene del registro, ir al login (estamos en AuthStack)
              navigation.navigate('Login');
            } else {
              // Si viene del login (usuario ya autenticado), hacer logout y regresar
              logout().then(() => {
                // Después del logout, navegar al login
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }).catch((error) => {
                console.error('Error during logout:', error);
                // Fallback: navegar al login directamente
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              });
            }
          }
        }
      ]
    );
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="#4B7BEC" />
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <View style={styles.emailIcon}>
                <Ionicons name="mail" size={40} color="#4B7BEC" />
              </View>
            </View>
            
            <Text style={styles.title}>Verifica tu Email</Text>
            <Text style={styles.subtitle}>
              Te hemos enviado un código de 6 dígitos a{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          {/* Campos de código */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Ingresa tu código</Text>
            
            <View style={styles.codeInputs}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                    error && styles.codeInputError
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                />
              ))}
            </View>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          {/* Botón de verificación */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              !isCodeComplete && styles.verifyButtonDisabled,
              loading && styles.verifyButtonLoading
            ]}
            onPress={() => handleVerification()}
            disabled={!isCodeComplete || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.verifyButtonText}>Verificando...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.verifyButtonText}>Verificar Email</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Reenviar código */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>¿No recibiste el código?</Text>
            
            {canResend ? (
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color="#4B7BEC" size="small" />
                ) : (
                  <Text style={styles.resendButtonText}>Reenviar Código</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Reenviar en {timer}s
              </Text>
            )}
          </View>

          {/* Información adicional */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#8395a7" />
            <Text style={styles.infoText}>
              El código expira en 10 minutos. Revisa tu carpeta de spam si no lo encuentras.
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Modal de éxito */}
      <VerificationSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title="¡Verificación Exitosa! 🎉"
        message="Tu email ha sido verificado correctamente. Ya puedes usar todas las funciones de Mi Ciudad SV."
        showConfetti={true}
        buttonText="Ir al Login"
        onButtonPress={handleContinueFromSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 20,
  },
  emailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#4B7BEC',
  },
  codeContainer: {
    marginBottom: 40,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    backgroundColor: '#f8f9fa',
  },
  codeInputFilled: {
    borderColor: '#4B7BEC',
    backgroundColor: '#f0f8ff',
  },
  codeInputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  verifyButton: {
    backgroundColor: '#4B7BEC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonLoading: {
    backgroundColor: '#3742fa',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#4B7BEC',
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 14,
    color: '#8395a7',
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#8395a7',
    flex: 1,
    lineHeight: 18,
  },
});

export default VerificationScreen;