// components/ForgotPasswordScreen.js - PANTALLA DE RECUPERACIÓN DE CONTRASEÑA
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ FUNCIÓN PARA SOLICITAR RECUPERACIÓN
  const handleForgotPassword = async () => {
    try {
      if (!email.trim()) {
        setError('El correo electrónico es requerido');
        return;
      }

      setLoading(true);
      setError('');
      
      console.log('🔑 Requesting password recovery for:', email.trim());
      
      const result = await authService.forgotPassword(email.trim());
      
      if (result.success) {
        Alert.alert(
          '📧 Email Enviado',
          'Se ha enviado una nueva contraseña temporal a tu correo electrónico. Revisa tu bandeja de entrada y carpeta de spam.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Error solicitando recuperación');
      }
      
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      setError(error.message || 'Error solicitando recuperación de contraseña');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA LIMPIAR ERRORES
  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  const isFormValid = email.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#4B7BEC" />
            </TouchableOpacity>
            
            <View style={styles.iconContainer}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-open" size={40} color="#4B7BEC" />
              </View>
            </View>
            
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos una nueva contraseña temporal.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={[
                styles.inputWrapper,
                error && styles.inputWrapperError
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={error ? "#ff4757" : "#8395a7"} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ff4757" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Botón Enviar */}
            <TouchableOpacity
              style={[
                styles.sendButton, 
                loading && styles.sendButtonDisabled,
                isFormValid && styles.sendButtonActive
              ]}
              onPress={handleForgotPassword}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.sendButtonText}>Enviando...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="mail" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.sendButtonText}>Enviar Contraseña</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#8395a7" />
              <Text style={styles.infoText}>
                La contraseña temporal se enviará inmediatamente a tu correo electrónico.
              </Text>
            </View>
          </View>

          {/* Volver al login */}
          <View style={styles.backToLoginContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>
                ← Volver al inicio de sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  lockIcon: {
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
  inputWrapperError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#bdc3c7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sendButtonActive: {
    backgroundColor: '#4B7BEC',
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
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
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
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
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#4B7BEC',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
