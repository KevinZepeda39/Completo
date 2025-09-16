// components/EditProfileScreen.js - SOLO EDICIÓN DE PERFIL
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import networkService from '../services/networkService';
import ProfileUpdatedModal from './ProfileUpdatedModal';

const EditProfileScreen = ({ navigation }) => {
  const { user, checkAuthStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [updatedUserName, setUpdatedUserName] = useState('');
  
  // Estados para información personal
  const [personalData, setPersonalData] = useState({
    nombre: '',
    correo: '',
  });

  // 🔧 INICIALIZAR DATOS DEL USUARIO
  useEffect(() => {
    console.log('👤 Initializing user data in EditProfile:', user);
    if (user) {
      setPersonalData({
        nombre: user.nombre || user.name || '',
        correo: user.correo || user.email || '',
      });
    }
  }, [user]);

  const handlePersonalDataChange = (field, value) => {
    setPersonalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePersonalData = () => {
    if (!personalData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return false;
    }

    if (personalData.nombre.length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!personalData.correo.trim()) {
      Alert.alert('Error', 'El correo es requerido');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalData.correo)) {
      Alert.alert('Error', 'El formato del correo es inválido');
      return false;
    }

    return true;
  };

      // 🔥 FUNCIÓN PRINCIPAL PARA ACTUALIZAR INFORMACIÓN PERSONAL
  const updatePersonalInfo = async () => {
    if (!validatePersonalData()) return;

    // Verificar si hay cambios
    const hasChanges = 
      personalData.nombre !== (user.nombre || user.name) ||
      personalData.correo !== (user.correo || user.email);

    if (!hasChanges) {
      Alert.alert('Información', 'No hay cambios para guardar');
      return;
    }

    setIsLoading(true);
    
    try {
      const userId = user.id || user.idUsuario;
      console.log('🔄 Actualizando información del usuario ID:', userId);
      console.log('📝 Datos nuevos:', personalData);

      // 🚀 USAR EL SERVICIO DE RED MEJORADO
      const data = await networkService.updateUserProfile(userId, {
        nombre: personalData.nombre.trim(),
        correo: personalData.correo.trim(),
      });

      // Si llegamos aquí sin error, la actualización fue exitosa
      
      // 🎯 CREAR OBJETO USUARIO ACTUALIZADO
      const updatedUser = {
        ...user,
        nombre: personalData.nombre.trim(),
        name: personalData.nombre.trim(), // Alias para compatibilidad
        correo: personalData.correo.trim(),
        email: personalData.correo.trim(), // Alias para compatibilidad
      };

      console.log('✅ Updated user object:', updatedUser);

      // 🔥 ACTUALIZAR ASYNCSTORAGE INMEDIATAMENTE
      try {
        const currentToken = user.token || `token-${user.id || user.idUsuario}-${Date.now()}`;
        await AsyncStorage.setItem('userSession', JSON.stringify({
          user: updatedUser,
          token: currentToken,
          timestamp: Date.now()
        }));
        console.log('💾 AsyncStorage updated successfully');
      } catch (storageError) {
        console.error('❌ Error updating AsyncStorage:', storageError);
      }

      // 🔄 FORZAR ACTUALIZACIÓN DEL CONTEXTO
      try {
        await checkAuthStatus();
        console.log('🔄 Auth context refreshed');
      } catch (authError) {
        console.error('⚠️ Error refreshing auth context:', authError);
      }

        // 🎉 MOSTRAR MODAL DE ÉXITO PERSONALIZADO
        setUpdatedUserName(updatedUser.nombre);
        setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Error updating personal info:', error);
      
      // El servicio de red ya maneja los mensajes de error
      const errorMessage = error.message || 'No se pudo actualizar la información';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 FUNCIONES PARA EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setUpdatedUserName('');
  };

  const handleViewProfile = () => {
    navigation.goBack();
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <View style={styles.globe}>
              <View style={styles.globeInner}>
                <Text style={styles.globeText}>🌍</Text>
              </View>
            </View>
            <View style={styles.logoRing} />
          </View>
          <Text style={styles.appName}>MiCiudadSv</Text>
        </View>

        <Text style={styles.sectionTitle}>Información Personal</Text>
        <Text style={styles.sectionSubtitle}>
          Los cambios se aplicarán automáticamente en toda la aplicación
        </Text>

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nombre Completo</Text>
          <View style={styles.inputContainerInner}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={personalData.nombre}
              onChangeText={(value) => handlePersonalDataChange('nombre', value)}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Correo */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Correo Electrónico</Text>
          <View style={styles.inputContainerInner}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={personalData.correo}
              onChangeText={(value) => handlePersonalDataChange('correo', value)}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Información del usuario actual */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>📋 Información Actual:</Text>
          <Text style={styles.currentInfoText}>
            👤 Nombre: {user?.nombre || user?.name || 'No disponible'}
          </Text>
          <Text style={styles.currentInfoText}>
            📧 Email: {user?.correo || user?.email || 'No disponible'}
          </Text>
          <Text style={styles.currentInfoText}>
            🆔 ID: {user?.id || user?.idUsuario || 'No disponible'}
          </Text>
          
          {/* Mostrar vista previa de cambios */}
          {(personalData.nombre !== (user?.nombre || user?.name) || 
            personalData.correo !== (user?.correo || user?.email)) && (
            <View style={styles.previewChanges}>
              <Text style={styles.previewTitle}>🔄 Vista previa de cambios:</Text>
              {personalData.nombre !== (user?.nombre || user?.name) && (
                <Text style={styles.previewText}>
                  👤 Nuevo nombre: {personalData.nombre}
                </Text>
              )}
              {personalData.correo !== (user?.correo || user?.email) && (
                <Text style={styles.previewText}>
                  📧 Nuevo email: {personalData.correo}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Botón Actualizar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.disabledButton]}
            onPress={updatePersonalInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.updateButtonText}>Actualizando perfil...</Text>
              </View>
            ) : (
              <Text style={styles.updateButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 🎉 Modal de éxito personalizado */}
      <ProfileUpdatedModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        userName={updatedUserName}
        onViewProfile={handleViewProfile}
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
  inputContainerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
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
  currentInfoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  previewChanges: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B7BEC',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 12,
    color: '#4B7BEC',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
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

export default EditProfileScreen;
