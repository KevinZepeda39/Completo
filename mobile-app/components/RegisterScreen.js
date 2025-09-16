// components/RegisterScreen.js - DISEÑO ORIGINAL CORREGIDO
import React, { useState } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';
import RegistrationSuccessModal from './RegistrationSuccessModal';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    confirmarContraseña: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState({});

  // ✅ VALIDACIÓN EN TIEMPO REAL
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'nombre':
        if (!value.trim()) {
          newErrors.nombre = 'El nombre es requerido';
        } else if (value.length < 2) {
          newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        } else {
          delete newErrors.nombre;
        }
        break;

      case 'correo':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.correo = 'El correo es requerido';
        } else if (!emailRegex.test(value)) {
          newErrors.correo = 'Formato de correo inválido';
        } else {
          delete newErrors.correo;
        }
        break;

      case 'contraseña':
        if (!value) {
          newErrors.contraseña = 'La contraseña es requerida';
        } else if (value.length < 6) {
          newErrors.contraseña = 'Mínimo 6 caracteres';
        } else {
          delete newErrors.contraseña;
        }
        break;

      case 'confirmarContraseña':
        if (!value) {
          newErrors.confirmarContraseña = 'Confirma tu contraseña';
        } else if (value !== formData.contraseña) {
          newErrors.confirmarContraseña = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmarContraseña;
        }
        break;
    }

    setErrors(newErrors);
  };

  // ✅ MANEJAR CAMBIOS EN CAMPOS
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validar en tiempo real
    validateField(field, value);
    
    // Si es confirmar contraseña, también validar cuando cambie la contraseña principal
    if (field === 'contraseña' && formData.confirmarContraseña) {
      validateField('confirmarContraseña', formData.confirmarContraseña);
    }
  };

  // ✅ FUNCIÓN DE REGISTRO CORREGIDA
  const handleRegister = async () => {
    try {
      console.log('📝 === FORM SUBMISSION ===');
      
      // Validar todos los campos
      const fieldsToValidate = ['nombre', 'correo', 'contraseña', 'confirmarContraseña'];
      fieldsToValidate.forEach(field => {
        validateField(field, formData[field]);
      });

      // Verificar si hay errores
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        console.log('❌ Form has validation errors:', errors);
        Alert.alert('Error', 'Por favor corrige los errores en el formulario');
        return;
      }

      // Verificar que todos los campos estén llenos
      if (!formData.nombre.trim() || !formData.correo.trim() || 
          !formData.contraseña || !formData.confirmarContraseña) {
        console.log('❌ Empty fields detected');
        Alert.alert('Error', 'Todos los campos son obligatorios');
        return;
      }

      console.log('Form data:', {
        nombre: formData.nombre,
        correo: formData.correo,
        contraseña: !!formData.contraseña,
        confirmarContraseña: !!formData.confirmarContraseña
      });

      setLoading(true);
      console.log('🚀 Attempting registration...');
      console.log('📧 Register attempt for:', formData.correo);

      // ✅ LLAMADA AL AUTHSERVICE CORREGIDA
      const result = await authService.register({
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim().toLowerCase(),
        contraseña: formData.contraseña
      });

      console.log('✅ Registration result:', result);

      if (result.success) {
        // ✅ VERIFICAR SI REQUIERE VERIFICACIÓN POR EMAIL
        if (result.verification && result.verification.required) {
          // ✅ MOSTRAR MODAL DE ÉXITO
          setRegisteredUser({
            nombre: formData.nombre.trim(),
            correo: formData.correo.trim().toLowerCase(),
            emailSent: result.verification.emailSent
          });
          setShowSuccessModal(true);
        } else {
          // Si no requiere verificación o ya está verificado
          Alert.alert(
            '¡Registro Exitoso!', 
            'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate('Login', {
                    registeredEmail: formData.correo.trim().toLowerCase(),
                    registeredPassword: formData.contraseña,
                    showSuccessMessage: true
                  });
                }
              }
            ]
          );
        }
      } else {
        throw new Error(result.error || 'Error en el registro');
      }

    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = 'Error en el registro';
      if (error.message.includes('ya está registrado')) {
        errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión.';
      } else if (error.message.includes('formato')) {
        errorMessage = 'El formato del correo electrónico es inválido.';
      } else if (error.message.includes('contraseña')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else {
        errorMessage = error.message || 'Error en el registro';
      }

      Alert.alert('Error de Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIONES PARA MANEJAR EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleContinueToVerification = () => {
    setShowSuccessModal(false);
    // ✅ NAVEGAR A PANTALLA DE VERIFICACIÓN
    navigation.navigate('Verification', {
      email: registeredUser.correo,
      userName: registeredUser.nombre,
      fromRegistration: true
    });
  };

  // ✅ FUNCIÓN PARA IR AL LOGIN
  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };


  // ✅ CALCULAR FORTALEZA DE CONTRASEÑA
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '#ddd' };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const levels = [
      { label: 'Muy débil', color: '#ff4757' },
      { label: 'Débil', color: '#ff6b7d' },
      { label: 'Regular', color: '#ffa502' },
      { label: 'Buena', color: '#2ed573' },
      { label: 'Excelente', color: '#20bf6b' }
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(formData.contraseña);
  const isFormValid = formData.nombre.trim().length >= 2 && 
                     formData.correo.trim().length > 0 && 
                     formData.contraseña.length >= 6 && 
                     formData.confirmarContraseña === formData.contraseña &&
                     Object.keys(errors).length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleLoginNavigation}
            >
              <Ionicons name="arrow-back" size={24} color="#4B7BEC" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>
                Únete a Mi Ciudad SV y ayuda a mejorar tu comunidad
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Campo Nombre */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Nombre completo
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.nombre && styles.inputError,
                formData.nombre.trim().length >= 2 && styles.inputSuccess
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={errors.nombre ? '#ff4757' : formData.nombre.trim().length >= 2 ? '#2ed573' : '#8395a7'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu nombre completo"
                  value={formData.nombre}
                  onChangeText={(text) => handleInputChange('nombre', text)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {formData.nombre.trim().length >= 2 && (
                  <Ionicons name="checkmark-circle" size={20} color="#2ed573" />
                )}
              </View>
              {errors.nombre && (
                <Text style={styles.errorText}>{errors.nombre}</Text>
              )}
              <Text style={styles.helperText}>
                {formData.nombre.length}/50 caracteres
              </Text>
            </View>

            {/* Campo Correo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Correo electrónico
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.correo && styles.inputError,
                formData.correo.trim().length > 0 && !errors.correo && styles.inputSuccess
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={errors.correo ? '#ff4757' : !errors.correo && formData.correo.trim().length > 0 ? '#2ed573' : '#8395a7'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  value={formData.correo}
                  onChangeText={(text) => handleInputChange('correo', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!errors.correo && formData.correo.trim().length > 0 && (
                  <Ionicons name="checkmark-circle" size={20} color="#2ed573" />
                )}
              </View>
              {errors.correo && (
                <Text style={styles.errorText}>{errors.correo}</Text>
              )}
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Contraseña
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.contraseña && styles.inputError,
                formData.contraseña.length >= 6 && styles.inputSuccess
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={errors.contraseña ? '#ff4757' : formData.contraseña.length >= 6 ? '#2ed573' : '#8395a7'} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.contraseña}
                  onChangeText={(text) => handleInputChange('contraseña', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#8395a7" 
                  />
                </TouchableOpacity>
              </View>
              {errors.contraseña && (
                <Text style={styles.errorText}>{errors.contraseña}</Text>
              )}
              
              {/* Indicador de fortaleza */}
              {formData.contraseña.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${(passwordStrength.strength / 4) * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Campo Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirmar contraseña
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={[
                styles.inputWrapper,
                errors.confirmarContraseña && styles.inputError,
                formData.confirmarContraseña && formData.confirmarContraseña === formData.contraseña && styles.inputSuccess
              ]}>
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={20} 
                  color={
                    errors.confirmarContraseña ? '#ff4757' : 
                    formData.confirmarContraseña === formData.contraseña && formData.confirmarContraseña ? '#2ed573' : '#8395a7'
                  } 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmarContraseña}
                  onChangeText={(text) => handleInputChange('confirmarContraseña', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#8395a7" 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmarContraseña && (
                <Text style={styles.errorText}>{errors.confirmarContraseña}</Text>
              )}
            </View>

            {/* Información de seguridad */}
            <View style={styles.securityInfo}>
              <Ionicons name="information-circle-outline" size={16} color="#4B7BEC" />
              <Text style={styles.securityText}>
                Tu información está protegida con encriptación de nivel bancario
              </Text>
            </View>
          </View>

          {/* Botón de Registro */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.registerButton,
                !isFormValid && styles.registerButtonDisabled,
                loading && styles.registerButtonLoading
              ]}
              onPress={handleRegister}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.registerButtonText}>Creando cuenta...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Términos y condiciones */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Al registrarte, aceptas nuestros{' '}
                <Text style={styles.termsLink}>Términos de Servicio</Text>
                {' '}y{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>
          </View>

          {/* Separador */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Link al Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity onPress={handleLoginNavigation}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Demo info */}
          {__DEV__ && (
            <View style={styles.demoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#4B7BEC" />
              <Text style={styles.demoText}>
                Modo desarrollo: Cualquier email válido y contraseña de 6+ caracteres
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de éxito del registro */}
      <RegistrationSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        onContinue={handleContinueToVerification}
        userName={registeredUser.nombre}
        email={registeredUser.correo}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  inputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  inputSuccess: {
    borderColor: '#2ed573',
    backgroundColor: '#f0fff4',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: '#8395a7',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#4B7BEC',
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  registerButton: {
    backgroundColor: '#4B7BEC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonLoading: {
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
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4B7BEC',
    fontWeight: '500',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#8395a7',
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loginLink: {
    fontSize: 16,
    color: '#4B7BEC',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  demoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  demoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#4B7BEC',
    flex: 1,
  },
});

export default RegisterScreen;