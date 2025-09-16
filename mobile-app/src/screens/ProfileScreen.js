// src/screens/ProfileScreen.js - CORREGIDO PARA MOSTRAR INFO CORRECTA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { getAPIUrl } from '../../constants/networkConfig';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUserProfilePhoto } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    communitiesJoined: 0
  });

  // ✅ DEBUG: Ver qué datos tiene el usuario
  useEffect(() => {
    console.log('👤 === USER DEBUG INFO ===');
    console.log('Raw user object:', user);
    console.log('User ID:', user?.id || user?.idUsuario);
    console.log('User name:', user?.nombre || user?.name);
    console.log('User email:', user?.correo || user?.email);
    console.log('Email verified:', user?.emailVerificado);
    console.log('=========================');

    // Cargar estadísticas del usuario
    loadUserStats();
  }, [user]);

  // ✅ CARGAR ESTADÍSTICAS DEL USUARIO
  const loadUserStats = async () => {
    try {
      const userId = user?.id || user?.idUsuario;
      if (!userId) return;

      // Obtener reportes del usuario
      const apiUrl = await getAPIUrl();
      const reportsResponse = await fetch(`${apiUrl}/reports/user/${userId}`);
      const reportsData = await reportsResponse.json();
      
      setUserStats({
        totalReports: reportsData.reportCount || 0,
        communitiesJoined: 0 // Por ahora, puedes implementar esto después
      });
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              console.log('✅ Logout successful');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleEditProfile = () => {
    // ✅ NAVEGAR A LA PANTALLA DE EDICIÓN DE PERFIL
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleMyReports = () => {
    // Navegación corregida para cambiar entre tabs
    navigation.navigate('ActivityTab');
  };

  const handleMyCommunities = () => {
    navigation.navigate('Communities'); // Navegar directamente a CommunitiesScreen
  };

  // ✅ FUNCIÓN PARA VERIFICAR EMAIL SI NO ESTÁ VERIFICADO
  const handleVerifyEmail = () => {
    const userEmail = user?.correo || user?.email;
    if (userEmail) {
      navigation.navigate('Verification', {
        email: userEmail,
        userName: user?.nombre || user?.name || 'Usuario',
        fromRegistration: false
      });
    }
  };


  // ✅ FUNCIÓN PARA CAMBIAR FOTO DE PERFIL
  const handleChangeProfilePhoto = () => {
    Alert.alert(
      'Cambiar Foto de Perfil',
      '¿Cómo quieres cambiar tu foto de perfil?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cámara',
          onPress: () => openCamera(),
        },
        {
          text: 'Galería',
          onPress: () => openGallery(),
        },
      ]
    );
  };

  // ✅ ABRIR CÁMARA
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a la cámara para tomar una foto');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error abriendo cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  // ✅ ABRIR GALERÍA
  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a la galería para seleccionar una foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error abriendo galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  // ✅ SUBIR FOTO DE PERFIL
  const uploadProfilePhoto = async (imageUri) => {
    try {
      setIsUpdatingPhoto(true);
      const userId = user?.id || user?.idUsuario;
      
      if (!userId) {
        Alert.alert('Error', 'No se encontró el ID del usuario');
        return;
      }

      console.log('📸 Subiendo foto de perfil para usuario:', userId);
      console.log('📸 Image URI:', imageUri);

      // Primero, probar conectividad básica
      console.log('🔍 Probando conectividad básica...');
      try {
        const apiUrl = await getAPIUrl();
        const baseUrl = apiUrl.replace('/api', '');
        const testResponse = await fetch(baseUrl, {
          method: 'GET',
          timeout: 5000,
        });
        console.log('✅ Conectividad básica OK, status:', testResponse.status);
      } catch (testError) {
        console.error('❌ Error de conectividad básica:', testError.message);
        Alert.alert('Error de Red', 'No se puede conectar al servidor. Verifica que esté corriendo.');
        return;
      }

      const formData = new FormData();
      formData.append('fotoPerfil', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${userId}_${Date.now()}.jpg`,
      });

      const apiUrl = await getAPIUrl();
      const url = `${apiUrl}/users/${userId}/profile-photo`;
      console.log('📸 URL de subida:', url);

      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📸 Response status:', response.status);
      console.log('📸 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📸 Respuesta del servidor:', data);

      if (data.success) {
        Alert.alert('✅ Éxito', 'Foto de perfil actualizada correctamente');
        
        // ✅ ACTUALIZAR EL ESTADO LOCAL Y GLOBAL CON LA NUEVA FOTO
        if (data.fotoPerfil) {
          console.log('📸 Actualizando foto de perfil...');
          console.log('📸 Foto recibida del servidor:', data.fotoPerfil);
          console.log('📸 Usuario actual:', user);
          
          setProfilePhoto(data.fotoPerfil);
          updateUserProfilePhoto(data.fotoPerfil); // 🔥 ACTUALIZAR GLOBALMENTE
          
          console.log('📸 Foto actualizada en el estado local y global:', data.fotoPerfil);
          console.log('📸 Usuario después de actualizar:', user);
        }
        
        // También podrías recargar los datos del usuario desde el servidor
        // await loadUserData();
      } else {
        throw new Error(data.error || 'Error actualizando foto de perfil');
      }
    } catch (error) {
      console.error('❌ Error subiendo foto de perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil: ' + error.message);
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  // ✅ OBTENER DATOS CORRECTOS DEL USUARIO
  const userName = user?.nombre || user?.name || 'Usuario';
  const userEmail = user?.correo || user?.email || 'usuario@email.com';
  const userId = user?.id || user?.idUsuario || 'N/A';
  
  // ✅ CARGAR FOTO DE PERFIL SI EXISTE
  useEffect(() => {
    console.log('📸 ProfileScreen: Usuario recibido:', user);
    console.log('📸 ProfileScreen: Foto de perfil del usuario:', user?.fotoPerfil);
    
    if (user?.fotoPerfil) {
      setProfilePhoto(user.fotoPerfil);
      console.log('📸 Foto de perfil cargada desde el usuario:', user.fotoPerfil);
    } else {
      setProfilePhoto(null);
      console.log('📸 No hay foto de perfil para cargar');
    }
  }, [user?.fotoPerfil]);
  const isEmailVerified = user?.emailVerificado || false;
  const userInitial = userName.charAt(0).toUpperCase();
  const userHandle = `@${userName.toLowerCase().replace(/\s+/g, '')}${userId}`;

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Editar Perfil',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      id: 'change-password',
      title: 'Cambiar Contraseña',
      icon: 'lock-closed-outline',
      onPress: handleChangePassword,
    },
    {
      id: 'my-reports',
      title: 'Mis Reportes',
      icon: 'document-text-outline',
      onPress: handleMyReports,
      badge: userStats.totalReports > 0 ? userStats.totalReports.toString() : null,
    },
    {
      id: 'my-communities',
      title: 'Mis Comunidades',
      icon: 'people-outline',
      onPress: handleMyCommunities,
    },
  ];

  // ✅ AGREGAR OPCIONES DE EMAIL SI NO ESTÁ VERIFICADO
  if (!isEmailVerified) {
    menuItems.push({
      id: 'verify-email',
      title: 'Verificar Email',
      icon: 'mail-outline',
      onPress: handleVerifyEmail,
      highlight: true,
    });
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView style={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleChangeProfilePhoto}
            disabled={isUpdatingPhoto}
            activeOpacity={0.7}
          >
            <View style={[
              styles.avatar,
              { backgroundColor: profilePhoto ? 'transparent' : (isEmailVerified ? '#4B7BEC' : '#FFCC00') }
            ]}>
              {profilePhoto ? (
                <Image 
                  source={{ uri: profilePhoto }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{userInitial}</Text>
              )}
            </View>
            
            {/* Botón de editar foto */}
            <View style={styles.editPhotoButton}>
              {isUpdatingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={12} color="#fff" />
              )}
            </View>
            
            {isEmailVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userHandle}</Text>
          
          {/* Estado de verificación */}
          <View style={[
            styles.verificationStatus,
            { backgroundColor: isEmailVerified ? '#E8F5E8' : '#FFF3CD' }
          ]}>
            <Ionicons 
              name={isEmailVerified ? "checkmark-circle" : "warning"} 
              size={16} 
              color={isEmailVerified ? "#2E7D32" : "#856404"} 
            />
            <Text style={[
              styles.verificationText,
              { color: isEmailVerified ? "#2E7D32" : "#856404" }
            ]}>
              {isEmailVerified ? 'Email Verificado' : 'Email No Verificado'}
            </Text>
          </View>
          
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoRow}>
              <Text style={styles.userInfoLabel}>ID de Usuario</Text>
              <Text style={styles.userInfoValue}>{userId}</Text>
            </View>
            
            <View style={[styles.userInfoRow, styles.borderTop]}>
              <Text style={styles.userInfoLabel}>Email</Text>
              <Text style={styles.userInfoValue}>{userEmail}</Text>
            </View>

            <View style={[styles.userInfoRow, styles.borderTop]}>
              <Text style={styles.userInfoLabel}>Reportes Creados</Text>
              <Text style={styles.userInfoValue}>{userStats.totalReports}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.highlight && styles.menuItemHighlight,
                item.isDev && styles.menuItemDev
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={item.highlight ? "#FF6B35" : item.isDev ? "#4B7BEC" : "#333"} 
                />
                <Text style={[
                  styles.menuItemText,
                  item.highlight && styles.menuItemTextHighlight,
                  item.isDev && styles.menuItemTextDev
                ]}>
                  {item.title}
                </Text>
                {item.isDev && (
                  <Text style={styles.devBadge}>DEV</Text>
                )}
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FF3B30" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            )}
            <Text style={styles.logoutText}>
              {isLoading ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version & Debug Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Mi Ciudad SV v1.0.0</Text>
          {__DEV__ && (
            <Text style={styles.debugText}>
              Debug: UserID={userId} | Verified={isEmailVerified ? 'Yes' : 'No'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4B7BEC',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  userInfoCard: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
    paddingTop: 16,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemHighlight: {
    backgroundColor: '#FFF5F2',
  },
  menuItemDev: {
    backgroundColor: '#F0F8FF',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuItemTextHighlight: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  menuItemTextDev: {
    color: '#4B7BEC',
  },
  devBadge: {
    backgroundColor: '#4B7BEC',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#4B7BEC',
    fontFamily: 'monospace',
  },
});

export default ProfileScreen;