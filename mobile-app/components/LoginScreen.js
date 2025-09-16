// components/LoginScreen.js - LOGINSCREEN CON VERIFICACIÓN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import VerificationSuccessModal from './VerificationSuccessModal';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({});

  const { login, isAuthenticated } = useAuth();

  // ✅ FUNCIONES PARA MANEJAR EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  // ✅ NAVEGAR AUTOMÁTICAMENTE CUANDO SE AUTENTICA - VERSIÓN MEJORADA
  useEffect(() => {
    console.log('🔍 LoginScreen useEffect - isAuthenticated changed:', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('🎉 User authenticated, App will handle navigation automatically');
      
      // ✅ NO NAVEGAR MANUALMENTE - El App.js manejará la navegación automáticamente
      // cuando isAuthenticated cambie a true, el AppContent renderizará MainStack
      console.log('🔄 Authentication complete, App will handle navigation automatically');
    }
  }, [isAuthenticated, navigation]);

  // ✅ MANEJAR PARÁMETROS DE NAVEGACIÓN
  useEffect(() => {
    if (route.params) {
      const { 
        registeredEmail, 
        registeredPassword, 
        verifiedEmail,
        showSuccessMessage,
        verificationCompleted,
        verificationToken
      } = route.params;
      
      // Si viene del registro exitoso
      if (registeredEmail) {
        setEmail(registeredEmail);
        if (registeredPassword) {
          setPassword(registeredPassword);
        }
      }
      
      // Si viene de verificación exitosa
      if (verifiedEmail) {
        setEmail(verifiedEmail);
      }
      
      // Mostrar mensaje de éxito
      if (showSuccessMessage) {
        setTimeout(() => {
          let message = '';
          let title = '🎉 ¡Perfecto!';
          let showConfetti = false;
          
          if (verificationCompleted) {
            title = '✅ ¡Verificación Completada!';
            message = 'Tu email ha sido verificado exitosamente. Ahora puedes iniciar sesión con tu contraseña.';
            showConfetti = true;
          } else if (verifiedEmail) {
            title = '✅ ¡Email Verificado!';
            message = 'Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión.';
            showConfetti = true;
          } else {
            title = '🎉 ¡Cuenta Creada!';
            message = 'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.';
            showConfetti = true;
          }
          
          setSuccessModalData({
            title,
            message,
            showConfetti,
            buttonText: 'Continuar'
          });
          setShowSuccessModal(true);
        }, 500);
      }
    }
  }, [route.params]);

  // ✅ FUNCIÓN DE LOGIN ACTUALIZADA PARA MANEJAR VERIFICACIÓN
  const handleLogin = async () => {
    try {
      console.log('🔍 === LOGIN DEBUG ===');
      console.log('📧 Email value:', email);
      console.log('🔑 Password value:', password);
      console.log('📧 Email length:', email.length);
      console.log('🔑 Password length:', password.length);
      
      setError('');
      
      // Validar campos
      if (!email.trim()) {
        setError('El correo electrónico es requerido');
        return;
      }
      
      if (!password) {
        setError('La contraseña es requerida');
        return;
      }

      const emailTrimmed = email.trim();
      console.log('📧 Email trimmed:', emailTrimmed);
      console.log('🔐 Login attempt for:', emailTrimmed);
      console.log('🔑 Password length:', password.length);

      setLoading(true);
      
      // ✅ LLAMAR AL LOGIN DEL AUTH HOOK
      const result = await login(emailTrimmed, password);
      
      console.log('✅ Login result:', result);
      console.log('🔍 Debug - result.success:', result?.success);
      console.log('🔍 Debug - result.requiresVerification:', result?.requiresVerification);
      console.log('🔍 Debug - result.error:', result?.error);

      // ✅ VERIFICAR SI REQUIERE VERIFICACIÓN DE EMAIL
      if (result && !result.success && result.requiresVerification) {
        console.log('⚠️ Email verification required');
        console.log('🔍 Full result object:', JSON.stringify(result, null, 2));
        
        Alert.alert(
          '📧 Verificación Requerida',
          result.verification && result.verification.codeSent
            ? 'Te hemos enviado un nuevo código de verificación a tu correo electrónico.'
            : 'Tu email no está verificado. Necesitas verificar tu correo para continuar.',
          [
            {
              text: 'Verificar Ahora',
              onPress: () => {
                navigation.navigate('Verification', {
                  email: emailTrimmed,
                  userName: result.user?.nombre || 'Usuario',
                  fromRegistration: false
                });
              }
            },
            {
              text: 'Más Tarde',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      // ✅ LOGIN EXITOSO - El useEffect detectará el cambio de isAuthenticated y navegará automáticamente
      console.log('🎉 Login completed successfully');
      console.log('🔄 isAuthenticated will be set to true, triggering navigation...');
      console.log('⏳ Waiting for navigation to trigger...');

    } catch (error) {
      // Prevenir que React Native muestre el error automáticamente
      try {
        let errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
        
        if (error.message && error.message.includes('Credenciales inválidas')) {
          errorMessage = 'El email o la contraseña que ingresaste no son correctos. Verifica tus datos e inténtalo nuevamente.';
        } else if (error.message && error.message.includes('verificación')) {
          errorMessage = 'Tu cuenta no está verificada. Por favor, revisa tu email y haz clic en el enlace de verificación.';
        } else if (error.message && error.message.includes('desactivado')) {
          errorMessage = 'Tu cuenta ha sido desactivada. Contacta al soporte técnico para más información.';
        } else if (error.message && error.message.includes('Email es requerido')) {
          errorMessage = 'Por favor, ingresa tu dirección de email.';
        } else if (error.message && error.message.includes('Contraseña es requerida')) {
          errorMessage = 'Por favor, ingresa tu contraseña.';
        } else if (error.message && (error.message.includes('network') || error.message.includes('Network'))) {
          errorMessage = 'No hay conexión a internet. Verifica tu conexión e inténtalo nuevamente.';
        }
        
        setError(errorMessage);
      } catch (innerError) {
        // Si hay algún error en el manejo, mostrar mensaje genérico
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ NAVEGACIÓN AL REGISTRO
  const handleRegisterNavigation = () => {
    console.log('🔄 Navigating to Register');
    navigation.navigate('Register');
  };

  // ✅ FUNCIÓN PARA LIMPIAR ERRORES
  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>
                Bienvenido de vuelta a Mi Ciudad SV
              </Text>
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Campo Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {/* Modal de Error */}
              <Modal
                visible={!!error}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setError('')}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <View style={styles.modalIconContainer}>
                        <Ionicons name="alert-circle" size={32} color="#FF3B30" />
                      </View>
                      <Text style={styles.modalTitle}>Error de Inicio de Sesión</Text>
                    </View>
                    
                    <View style={styles.modalContent}>
                      <Text style={styles.modalMessage}>{error}</Text>
                      
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={() => setError('')}
                        >
                          <Text style={styles.modalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Botón de Login */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!isFormValid || loading) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              {/* Enlaces adicionales */}
              <View style={styles.linksContainer}>
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ¿No tienes una cuenta?{' '}
                <Text style={styles.footerLink} onPress={handleRegisterNavigation}>
                  Regístrate aquí
                </Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Modal de éxito */}
      <VerificationSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title={successModalData.title || "¡Éxito!"}
        message={successModalData.message || "Operación completada exitosamente."}
        showConfetti={successModalData.showConfetti || false}
        buttonText={successModalData.buttonText || "Continuar"}
        onButtonPress={handleCloseSuccessModal}
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  passwordToggle: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#4B7BEC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linksContainer: {
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#4B7BEC',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerLink: {
    color: '#4B7BEC',
    fontWeight: '600',
  },
  
  // Estilos del Modal de Error
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  modalHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    backgroundColor: '#4B7BEC',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoginScreen;