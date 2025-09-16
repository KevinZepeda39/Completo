// src/screens/PersonalInfoScreen.js - Pantalla para editar información personal COMPLETA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

const PersonalInfoScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
  });
  const [originalData, setOriginalData] = useState({
    nombre: '',
    correo: '',
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    communitiesJoined: 0
  });

  // ✅ CARGAR DATOS DEL USUARIO AL INICIAR
  useEffect(() => {
    loadUserData();
    loadUserStats();
  }, [user]);

  // ✅ DETECTAR CAMBIOS EN EL FORMULARIO
  useEffect(() => {
    const hasChanges = Object.keys(formData).some(
      key => formData[key] !== originalData[key]
    );
    setHasChanges(hasChanges);
  }, [formData, originalData]);

  // ✅ CARGAR DATOS DEL USUARIO
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userId = user?.id || user?.idUsuario;
      
      console.log('🔄 Loading user data for ID:', userId);
      
      // Intentar cargar datos completos del usuario desde el backend
      const response = await fetch(`http://192.168.1.13:3000/api/users/${userId}`);
      const userData = await response.json();

      let userInfo = {};
      
      if (userData.success && userData.user) {
        console.log('✅ User data loaded from backend:', userData.user);
        userInfo = {
          nombre: userData.user.nombre || '',
          correo: userData.user.correo || '',
        };
      } else {
        console.log('⚠️ Using context data as fallback');
        // Si no se puede cargar del backend, usar datos del contexto
        userInfo = {
          nombre: user?.nombre || user?.name || '',
          correo: user?.correo || user?.email || '',
        };
      }

      setFormData(userInfo);
      setOriginalData(userInfo);
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // Usar datos del contexto como fallback
      const fallbackData = {
        nombre: user?.nombre || user?.name || '',
        correo: user?.correo || user?.email || '',
      };
      setFormData(fallbackData);
      setOriginalData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CARGAR ESTADÍSTICAS DEL USUARIO
  const loadUserStats = async () => {
    try {
      const userId = user?.id || user?.idUsuario;
      if (!userId) return;

      console.log('📊 Loading user stats for ID:', userId);

      // Obtener reportes del usuario
      const reportsResponse = await fetch(`http://192.168.1.13:3000/api/reports/user/${userId}`);
      const reportsData = await reportsResponse.json();
      
      setUserStats({
        totalReports: reportsData.reportCount || 0,
        communitiesJoined: 0 // Por ahora, puedes implementar esto después
      });

      console.log('✅ User stats loaded:', {
        totalReports: reportsData.reportCount || 0,
        communitiesJoined: 0
      });
      
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  // ✅ REFRESCAR DATOS
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadUserData(),
        loadUserStats()
      ]);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ✅ VALIDAR FORMULARIO
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.nombre.trim().length > 50) {
      newErrors.nombre = 'El nombre no puede superar los 50 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!emailRegex.test(formData.correo.trim())) {
      newErrors.correo = 'Ingresa un correo válido';
    } else if (formData.correo.trim().length > 100) {
      newErrors.correo = 'El correo es demasiado largo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ VERIFICAR DISPONIBILIDAD DE EMAIL (opcional)
  const checkEmailAvailability = async (email) => {
    if (!email || email === originalData.correo) return true;
    
    try {
      const userId = user?.id || user?.idUsuario;
      const response = await fetch('http://192.168.1.13:3000/api/users/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: email.trim().toLowerCase(),
          userId: userId
        }),
      });

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('❌ Error checking email availability:', error);
      return true; // Asumir que está disponible si no se puede verificar
    }
  };

  // ✅ GUARDAR CAMBIOS
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    if (!hasChanges) {
      Alert.alert('Sin cambios', 'No has realizado ningún cambio');
      return;
    }

    // Verificar disponibilidad del email si cambió
    const emailChanged = formData.correo.trim().toLowerCase() !== originalData.correo.toLowerCase();
    if (emailChanged) {
      const isEmailAvailable = await checkEmailAvailability(formData.correo);
      if (!isEmailAvailable) {
        setErrors({
          ...errors,
          correo: 'Este correo ya está siendo usado por otra cuenta'
        });
        Alert.alert('Error', 'Este correo ya está siendo usado por otra cuenta');
        return;
      }
    }

    setIsSaving(true);
    try {
      const userId = user?.id || user?.idUsuario;
      const updateUrl = `http://192.168.1.13:3000/api/users/update/${userId}`;
      
      console.log('🔄 Sending update request to:', updateUrl);
      console.log('📝 Update payload:', {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim().toLowerCase(),
      });

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim().toLowerCase(),
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        // Si el response no es ok, intentar leer el error
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          console.log('❌ Error response:', errorData);
          errorMessage = errorData.includes('<!DOCTYPE') 
            ? `Ruta no encontrada (${response.status})` 
            : errorData;
        } catch (e) {
          console.log('❌ Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Update response:', data);

      if (data.success) {
        // Actualizar el contexto de usuario
        if (updateUser) {
          const updatedUserData = {
            ...user,
            nombre: formData.nombre.trim(),
            name: formData.nombre.trim(),
            correo: formData.correo.trim().toLowerCase(),
            email: formData.correo.trim().toLowerCase(),
            emailVerificado: data.emailChanged ? false : user?.emailVerificado,
          };
          
          updateUser(updatedUserData);
        }

        // Actualizar datos originales para detectar futuros cambios
        const newOriginalData = {
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim().toLowerCase(),
        };
        setOriginalData(newOriginalData);

        let alertMessage = 'Tu información personal ha sido actualizada correctamente.';
        if (data.emailChanged) {
          alertMessage += '\n\nComo cambiaste tu correo, deberás verificarlo nuevamente.';
        }

        Alert.alert(
          '✅ Perfil Actualizado',
          alertMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refrescar stats después de actualizar
                loadUserStats();
              }
            }
          ]
        );
      } else {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      
      let errorMessage = error.message;
      if (errorMessage.includes('Network request failed')) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else if (errorMessage.includes('Ruta no encontrada')) {
        errorMessage = 'La ruta del servidor no está configurada. Contacta al administrador.';
      }
      
      Alert.alert(
        'Error',
        `No se pudo actualizar tu perfil:\n\n${errorMessage}\n\nURL: ${updateUrl}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ MANEJAR CAMBIOS EN INPUTS
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // ✅ CONFIRMAR SALIDA SI HAY CAMBIOS
  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        '¿Estás seguro que deseas salir? Los cambios se perderán.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Salir sin guardar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // ✅ OBTENER DATOS CORRECTOS DEL USUARIO PARA MOSTRAR
  const displayUserName = formData.nombre || user?.nombre || user?.name || 'Usuario';
  const displayUserEmail = formData.correo || user?.correo || user?.email || 'usuario@email.com';
  const userId = user?.id || user?.idUsuario || 'N/A';
  const isEmailVerified = user?.emailVerificado || false;
  const userInitial = displayUserName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BEC" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
      
      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4B7BEC']}
              tintColor="#4B7BEC"
            />
          }
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[
              styles.avatar,
              { backgroundColor: user?.fotoPerfil ? 'transparent' : (isEmailVerified ? '#4B7BEC' : '#FFCC00') }
            ]}>
              {user?.fotoPerfil ? (
                <Image 
                  source={{ uri: user.fotoPerfil }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {userInitial}
                </Text>
              )}
            </View>
            {isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarButton}>
              <Ionicons name="camera-outline" size={20} color="#4B7BEC" />
              <Text style={styles.changeAvatarText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          {/* User Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.totalReports}</Text>
                <Text style={styles.statLabel}>Reportes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.communitiesJoined}</Text>
                <Text style={styles.statLabel}>Comunidades</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userId}</Text>
                <Text style={styles.statLabel}>ID Usuario</Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo *</Text>
              <TextInput
                style={[styles.input, errors.nombre && styles.inputError]}
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
                placeholder="Ingresa tu nombre completo"
                autoCapitalize="words"
                maxLength={50}
                editable={!isSaving}
              />
              {errors.nombre && (
                <Text style={styles.errorText}>{errors.nombre}</Text>
              )}
              <Text style={styles.helperText}>
                Este nombre aparecerá en tus reportes y comunidades
              </Text>
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico *</Text>
              <TextInput
                style={[styles.input, errors.correo && styles.inputError]}
                value={formData.correo}
                onChangeText={(value) => handleInputChange('correo', value)}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                maxLength={100}
                editable={!isSaving}
              />
              {errors.correo && (
                <Text style={styles.errorText}>{errors.correo}</Text>
              )}
              <Text style={styles.helperText}>
                Si cambias tu correo, deberás verificarlo nuevamente
              </Text>
            </View>

            {/* Estado de verificación */}
            <View style={styles.verificationCard}>
              <View style={styles.verificationRow}>
                <Ionicons 
                  name={isEmailVerified ? "checkmark-circle" : "warning"} 
                  size={20} 
                  color={isEmailVerified ? "#2E7D32" : "#FF6B35"} 
                />
                <Text style={[
                  styles.verificationText,
                  { color: isEmailVerified ? "#2E7D32" : "#FF6B35" }
                ]}>
                  {isEmailVerified ? 'Email verificado' : 'Email pendiente de verificación'}
                </Text>
              </View>
              {!isEmailVerified && (
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={() => navigation.navigate('Verification', {
                    email: displayUserEmail,
                    userName: displayUserName,
                    fromRegistration: false
                  })}
                >
                  <Text style={styles.verifyButtonText}>Verificar ahora</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Información adicional */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color="#4B7BEC" />
                <Text style={styles.infoText}>
                  Los campos marcados con * son obligatorios
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2E7D32" />
                <Text style={styles.infoText}>
                  Tu información está protegida y segura
                </Text>
              </View>
              {hasChanges && (
                <View style={styles.infoRow}>
                  <Ionicons name="save-outline" size={20} color="#FF6B35" />
                  <Text style={[styles.infoText, { color: '#FF6B35' }]}>
                    Tienes cambios sin guardar
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}; 


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4B7BEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  avatarSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4B7BEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4B7BEC',
  },
  changeAvatarText: {
    color: '#4B7BEC',
    marginLeft: 8,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default PersonalInfoScreen;