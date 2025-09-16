// components/ChangePasswordScreen.js - SOLO CAMBIO DE CONTRASEÑA
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { getAPIUrl } from '../constants/networkConfig';
import PasswordUpdatedModal from './PasswordUpdatedModal';

const ChangePasswordScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Estados para mostrar/ocultar contraseñas
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handlePasswordDataChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordData = () => {
    if (!passwordData.currentPassword) {
      Alert.alert('Error', 'Ingresa tu contraseña actual');
      return false;
    }

    if (!passwordData.newPassword) {
      Alert.alert('Error', 'Ingresa una nueva contraseña');
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual');
      return false;
    }

    return true;
  };

  // ✅ FUNCIONES PARA MANEJAR EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleContinueFromSuccess = () => {
    setShowSuccessModal(false);
    // Limpiar campos de contraseña
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    // Navegar de vuelta
    navigation.goBack();
  };

  // 🔥 FUNCIÓN PARA ACTUALIZAR CONTRASEÑA
  const updatePassword = async () => {
    if (!validatePasswordData()) return;

    setIsLoading(true);
    try {
      const userId = user.id || user.idUsuario;
      console.log('🔄 Updating password for user ID:', userId);

      const apiUrl = await getAPIUrl();
      const response = await fetch(`${apiUrl}/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      console.log('📡 Password update response:', data);

      if (data.success) {
        // ✅ MOSTRAR MODAL DE ÉXITO
        setShowSuccessModal(true);
      } else {
        throw new Error(data.error || 'Error cambiando contraseña');
      }

    } catch (error) {
      console.error('❌ Error updating password:', error);
      
      let errorMessage = 'No se pudo cambiar la contraseña';
      if (error.message.includes('incorrecta') || error.message.includes('invalid') || error.message.includes('wrong')) {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
        errorMessage = 'Problema de conexión. Verifica tu internet.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <View style={styles.globe}>
              <View style={styles.globeInner}>
                <Text style={styles.globeText}>🔒</Text>
              </View>
            </View>
            <View style={styles.logoRing} />
          </View>
          <Text style={styles.appName}>MiCiudadSv</Text>
        </View>

        <Text style={styles.sectionTitle}>¿Quieres Cambiar tu Contraseña?</Text>
        <Text style={styles.sectionSubtitle}>
          No te preocupes, puedes actualizar tu contraseña de forma segura
        </Text>

        {/* Contraseña Actual */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña Anterior</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.currentPassword}
              onChangeText={(value) => handlePasswordDataChange('currentPassword', value)}
              placeholder="Ingresa tu contraseña actual"
              secureTextEntry={!showPasswords.current}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => togglePasswordVisibility('current')}
            >
              <Ionicons
                name={showPasswords.current ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nueva Contraseña */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña Nueva</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.newPassword}
              onChangeText={(value) => handlePasswordDataChange('newPassword', value)}
              placeholder="Ingresa tu nueva contraseña"
              secureTextEntry={!showPasswords.new}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => togglePasswordVisibility('new')}
            >
              <Ionicons
                name={showPasswords.new ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar Nueva Contraseña */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirmar Contraseña Nueva</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={passwordData.confirmPassword}
              onChangeText={(value) => handlePasswordDataChange('confirmPassword', value)}
              placeholder="Confirma tu nueva contraseña"
              secureTextEntry={!showPasswords.confirm}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => togglePasswordVisibility('confirm')}
            >
              <Ionicons
                name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Requisitos de Contraseña */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
          
          <View style={styles.requirement}>
            <Ionicons
              name={passwordData.newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={passwordData.newPassword.length >= 6 ? "#4CAF50" : "#999"}
            />
            <Text style={[
              styles.requirementText,
              passwordData.newPassword.length >= 6 && styles.requirementMet
            ]}>
              Al menos 6 caracteres
            </Text>
          </View>

          <View style={styles.requirement}>
            <Ionicons
              name={passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? "#4CAF50" : "#999"}
            />
            <Text style={[
              styles.requirementText,
              passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword && styles.requirementMet
            ]}>
              Diferente a la contraseña actual
            </Text>
          </View>

          <View style={styles.requirement}>
            <Ionicons
              name={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? "#4CAF50" : "#999"}
            />
            <Text style={[
              styles.requirementText,
              passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && styles.requirementMet
            ]}>
              Las contraseñas coinciden
            </Text>
          </View>
        </View>


        {/* Botón Cambiar Contraseña */}
        <View style={[styles.buttonContainer, { marginBottom: 40 }]}>
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.disabledButton]}
            onPress={updatePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.updateButtonText}>Actualizando...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Cambiar Contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de éxito */}
      <PasswordUpdatedModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        onContinue={handleContinueFromSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoBackground: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globe: {
    width: 100,
    height: 100,
    backgroundColor: '#FFCC00',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  globeInner: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globeText: {
    fontSize: 30,
  },
  logoRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#333',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    zIndex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    marginHorizontal: 20,
    width: 'auto',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#4CAF50',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#4B7BEC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default ChangePasswordScreen;