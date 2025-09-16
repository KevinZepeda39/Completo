// components/HomeScreen.js - DISEÑO MODERNO CON NAVEGACIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import UserOptionsModal from './UserOptionsModal';
import LogoutConfirmModal from './LogoutConfirmModal';

import reportService from '../services/reportService';
import communityService from '../services/communityService';

const { width: screenWidth } = Dimensions.get('window');

// Definición de colores moderna
const colors = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  backgroundPrimary: '#f8fafc',
  backgroundSecondary: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  emerald: '#059669',
  cyan: '#06b6d4',
};

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    totalCommunities: 0,
    userCommunities: 0
  });
  const [showUserOptionsModal, setShowUserOptionsModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  useEffect(() => {
    loadUserStats();
    
    // Limpiar caché corrupto si es necesario
    if (user && user.nombre === 'Neymar' && user.idUsuario === 69) {
      console.log('🚨 Detected corrupted cache, clearing...');
      fixUserCache();
    }
  }, [user]);

  // 📸 DETECTAR CAMBIOS EN LA FOTO DE PERFIL
  useEffect(() => {
    console.log('📸 HomeScreen: Usuario actualizado:', user);
    console.log('📸 HomeScreen: Foto de perfil:', user?.fotoPerfil);
    console.log('📸 HomeScreen: Usuario completo:', user);
  }, [user?.fotoPerfil]);

  // 📸 DETECTAR CAMBIOS EN EL USUARIO COMPLETO
  useEffect(() => {
    console.log('📸 HomeScreen: Usuario completo actualizado:', user);
  }, [user]);

  // 🔧 Limpiar caché corrupto automáticamente
  const fixUserCache = async () => {
    try {
      await communityService.clearUserCache();
      await communityService.getCurrentUser(true);
      console.log('✅ User cache fixed automatically');
    } catch (error) {
      console.error('❌ Error fixing cache:', error);
    }
  };

  // 📊 Cargar estadísticas reales del usuario
  const loadUserStats = async () => {
    try {
      console.log('📊 Loading user stats...');
      
      if (!user || !user.idUsuario) {
        console.log('⚠️ No user available for stats');
        return;
      }

      setIsLoading(true);

      // 1️⃣ Obtener reportes del usuario
      let userReports = [];
      try {
        const reportsResult = await reportService.getUserReports(user.idUsuario);
        if (reportsResult.success) {
          userReports = reportsResult.reports || [];
          console.log(`✅ Found ${userReports.length} user reports`);
        } else {
          console.log('⚠️ No reports found or error:', reportsResult.error);
        }
      } catch (error) {
        console.error('❌ Error loading user reports:', error);
      }

      // 2️⃣ Obtener comunidades del usuario
      let userCommunities = [];
      let totalCommunities = [];
      try {
        await communityService.clearUserCache(); // Asegurar caché limpio
        
        userCommunities = await communityService.getUserCommunities();
        totalCommunities = await communityService.getAllCommunities();
        
        console.log(`✅ Found ${userCommunities.length} user communities`);
        console.log(`✅ Found ${totalCommunities.length} total communities`);
      } catch (error) {
        console.error('❌ Error loading communities:', error);
      }

      // 3️⃣ Procesar estadísticas de reportes
      const totalReports = userReports.length;
      let resolvedReports = 0;
      let pendingReports = 0;
      let inProgressReports = 0;

      // Simular estados basados en fecha (mientras no tengas campo status)
      userReports.forEach(report => {
        const reportDate = new Date(report.fechaCreacion || report.date);
        const daysSince = Math.floor((new Date() - reportDate) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 30) {
          resolvedReports++;
        } else if (daysSince > 7) {
          inProgressReports++;
        } else {
          pendingReports++;
        }
      });

      // 4️⃣ Actualizar estado
      const newStats = {
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        totalCommunities: totalCommunities.length,
        userCommunities: userCommunities.length
      };

      setStats(newStats);
      
      console.log('📊 Stats updated:', newStats);
      
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
      
      // Fallback stats
      setStats({
        totalReports: 0,
        resolvedReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        totalCommunities: 0,
        userCommunities: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Refreshing HomeScreen stats...');
    
    // Limpiar caché para obtener datos frescos
    await fixUserCache();
    await loadUserStats();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getUserName = () => {
    if (user) {
      return user.nombre || user.name || 'Usuario';
    }
    return 'Usuario';
  };

  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = getUserName().split(' ')[0];
    
    if (hour < 12) return `Hola, ${firstName}`;
    if (hour < 18) return `Buenas tardes, ${firstName}`;
    return `Buenas noches, ${firstName}`;
  };

  const getMotivationalMessage = () => {
    const totalReports = stats.totalReports;
    
    if (totalReports === 0) {
      return "¿Qué vas a reportar hoy?";
    } else if (totalReports < 3) {
      return "¡Excelente! Sigues mejorando tu comunidad";
    } else if (totalReports < 10) {
      return "¡Eres un ciudadano ejemplar!";
    } else {
      return "¡Tu compromiso hace la diferencia!";
    }
  };

  const handleReportPress = async () => {
    console.log('🔄 Navegando a CreateReport desde HomeScreen');
    setIsLoading(true);
    
    try {
      navigation.navigate('CreateReport');
    } catch (error) {
      console.error('❌ Error navegando a CreateReport:', error);
      Alert.alert('Error', 'No se pudo navegar a la pantalla de reportes');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // 🔧 NAVEGACIÓN CORREGIDA - Ver todos los reportes
  const navigateToReports = () => {
    console.log('🔄 Navegando a Reports desde HomeScreen');
    try {
      navigation.navigate('Reports'); // ✅ CORREGIDO: Usar nombre correcto del App.js
    } catch (error) {
      console.error('❌ Error navegando a Reports:', error);
      Alert.alert('Error', 'No se pudo acceder a la sección de reportes');
    }
  };

  // 🔧 NAVEGACIÓN CORREGIDA - Mi actividad
  const navigateToActivity = () => {
    console.log('🔄 Navegando a Activity desde HomeScreen');
    try {
      navigation.navigate('Activity'); // ✅ CORREGIDO: Usar nombre correcto del App.js
    } catch (error) {
      console.error('❌ Error navegando a Activity:', error);
      Alert.alert(
        'Mi Actividad', 
        'Esta función te permitirá ver todos tus reportes y actividad en la app. ¡Próximamente disponible!',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToCommunities = () => {
    console.log('🔄 Navegando a Communities desde HomeScreen');
    navigation.navigate('Communities');
  };

  const navigateToTips = () => {
    console.log('🔄 Navegando a Tips desde HomeScreen');
    try {
      navigation.navigate('Tips');
    } catch (error) {
      console.error('❌ Error navegando a Tips:', error);
      Alert.alert(
        'Error',
        'No se pudo acceder a la pantalla de consejos',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToHelp = () => {
    console.log('🔄 Navegando a Help desde HomeScreen');
    try {
      navigation.navigate('Help');
    } catch (error) {
      console.error('❌ Error navegando a Help:', error);
      Alert.alert(
        'Error',
        'No se pudo acceder a la pantalla de ayuda',
        [{ text: 'OK' }]
      );
    }
  };

  // ✅ FUNCIONES PARA MANEJAR EL MODAL DE OPCIONES DE USUARIO
  const handleProfilePress = () => {
    setShowUserOptionsModal(true);
  };

  const handleCloseUserOptionsModal = () => {
    setShowUserOptionsModal(false);
  };

  const handleViewProfile = () => {
    console.log('👤 Navegando al perfil...');
    // Navegar al tab de perfil usando el Tab Navigator
    navigation.navigate('ProfileTab');
  };

  const handleLogout = () => {
    console.log('🚪 handleLogout called, setting showLogoutConfirmModal to true');
    setShowLogoutConfirmModal(true);
  };

  const handleCloseLogoutConfirmModal = () => {
    setShowLogoutConfirmModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirmModal(false);
    console.log('🚪 Cerrando sesión...');
    logout();
  };

  // Tarjetas de acción principales
  const quickActions = [
    {
      id: 'reports',
      title: 'Ver Reportes',
      subtitle: `${stats.totalReports} reportes creados`,
      icon: 'document-text-outline',
      gradient: [colors.primary, colors.primaryLight],
      onPress: navigateToReports,
      size: 'large'
    },
    {
      id: 'activity',
      title: 'Mi Actividad',
      subtitle: `${stats.userCommunities} Lis reportes`,
      icon: 'person-outline',
      gradient: [colors.purple, '#a855f7'],
      onPress: navigateToActivity,
      size: 'large'
    }
  ];

  // Tarjetas adicionales
  const additionalCards = [
    {
      id: 'community',
      title: 'Comunidades',
      subtitle: `${stats.totalCommunities} disponibles`,
      icon: 'people-outline',
      color: colors.emerald,
      bgColor: '#ecfdf5',
      onPress: navigateToCommunities
    },
    {
      id: 'tips',
      title: 'Consejos',
      subtitle: 'Mejores prácticas',
      icon: 'bulb-outline',
      color: colors.orange,
      bgColor: '#fff7ed',
      onPress: navigateToTips
    },
    {
      id: 'help',
      title: 'Ayuda',
      subtitle: 'Soporte técnico',
      icon: 'help-circle-outline',
      color: colors.cyan,
      bgColor: '#ecfeff',
      onPress: navigateToHelp
    }
  ];

  const renderQuickActionCard = (action) => (
    <TouchableOpacity 
      key={action.id}
      style={[styles.quickActionCard, action.size === 'large' && styles.quickActionLarge]}
      onPress={action.onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={action.gradient}
        style={styles.quickActionGradient}
      >
        <View style={styles.quickActionContent}>
          <View style={styles.quickActionIcon}>
            <Ionicons name={action.icon} size={28} color={colors.white} />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderAdditionalCard = (card) => (
    <TouchableOpacity 
      key={card.id}
      style={[styles.additionalCard, { backgroundColor: card.bgColor }]}
      onPress={card.onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.additionalCardIcon, { backgroundColor: card.color }]}>
        <Ionicons name={card.icon} size={20} color={colors.white} />
      </View>
      <Text style={styles.additionalCardTitle}>{card.title}</Text>
      <Text style={styles.additionalCardSubtitle}>{card.subtitle}</Text>
    </TouchableOpacity>
  );
  
  return (
         <SafeAreaView style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
                                  colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header con saludo personalizado */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
                         <Text style={styles.greeting}>{getGreeting()}</Text>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              <View style={styles.profileAvatar}>
                {user?.fotoPerfil ? (
                  <Image 
                    source={{ uri: user.fotoPerfil }} 
                    style={styles.profileAvatarImage}
                    resizeMode="cover"
                    onLoad={() => console.log('📸 HomeScreen: Foto de perfil cargada:', user.fotoPerfil)}
                    onError={(error) => console.log('❌ HomeScreen: Error cargando foto:', error)}
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {getUserInitial()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Barra de búsqueda simulada */}
          <TouchableOpacity 
            style={styles.searchBar} 
            activeOpacity={0.7}
            onPress={() => Alert.alert('Búsqueda', 'Función de búsqueda próximamente disponible')}
          >
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                         <Text style={styles.searchPlaceholder}>Buscar reportes...</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta principal motivacional */}
        <View style={styles.motivationalSection}>
          <TouchableOpacity 
            style={styles.motivationalCard}
            onPress={handleReportPress}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.motivationalGradient}
            >
              <View style={styles.motivationalContent}>
                <View style={styles.motivationalLeft}>
                  <Text style={styles.motivationalTitle}>
                    {getMotivationalMessage()}
                  </Text>
                  <TouchableOpacity 
                    style={styles.getStartedButton}
                    onPress={handleReportPress}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.getStartedText}>Comenzar</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.motivationalRight}>
                  <View style={styles.illustrationContainer}>
                    <Ionicons name="document-text" size={40} color={colors.white} />
                    <View style={styles.illustrationAccent}>
                      <Ionicons name="add-circle" size={24} color={colors.accent} />
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sección "Para ti" */}
        <View style={styles.forYouSection}>
          <View style={styles.sectionHeader}>
                         <Text style={styles.sectionTitle}>Para ti</Text>
            <TouchableOpacity onPress={() => Alert.alert('Ver Todo', 'Mostrando todas las opciones disponibles')}>
                             <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickActionCard)}
          </View>
        </View>

        {/* Tarjetas adicionales en grid */}
        <View style={styles.additionalSection}>
          <View style={styles.additionalGrid}>
            {additionalCards.map(renderAdditionalCard)}
          </View>
        </View>

        {/* Sección de estadísticas reales */}
        <View style={styles.statsSection}>
                     <Text style={styles.sectionTitle}>Tu Impacto</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="document-text" size={20} color={colors.white} />
              </View>
                                            <Text style={styles.statNumber}>{stats.totalReports}</Text>
                <Text style={styles.statLabel}>Reportes Creados</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              </View>
                                            <Text style={styles.statNumber}>{stats.resolvedReports}</Text>
                <Text style={styles.statLabel}>Resueltos</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
                <Ionicons name="time" size={20} color={colors.white} />
              </View>
                                            <Text style={styles.statNumber}>{stats.inProgressReports}</Text>
                <Text style={styles.statLabel}>En Progreso</Text>
            </View>
          </View>
          
          {/* Estadísticas adicionales */}
          <View style={styles.secondaryStatsGrid}>
            <View style={styles.secondaryStatCard}>
              <Ionicons name="hourglass-outline" size={16} color={colors.textMuted} />
                                            <Text style={styles.secondaryStatText}>
                  {stats.pendingReports} pendientes
                </Text>
            </View>
            <View style={styles.secondaryStatCard}>
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
                                            <Text style={styles.secondaryStatText}>
                  {stats.userCommunities} comunidades
                </Text>
            </View>
          </View>
        </View>

        {/* Footer con información adicional */}
        <View style={styles.footerSection}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.tipContent}>
                                            <Text style={styles.tipTitle}>💡 Consejo del día</Text>
                <Text style={styles.tipText}>
                  Incluye fotos claras y ubicación exacta para reportes más efectivos
                </Text>
            </View>
          </View>
        </View>

        {/* Debug info (solo en desarrollo) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🔍 Debug Info:</Text>
            <Text style={styles.debugText}>
              Usuario: {getUserName()} (ID: {user?.idUsuario || user?.id || 'N/A'})
            </Text>
            <Text style={styles.debugText}>
              Email: {user?.correo || user?.email || 'N/A'}
            </Text>
            <Text style={styles.debugText}>
              Reportes: {stats.totalReports} | Comunidades: {stats.userCommunities}
            </Text>
            <Text style={styles.debugText}>
              Resueltos: {stats.resolvedReports} | En progreso: {stats.inProgressReports}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de opciones de usuario */}
      <UserOptionsModal
        visible={showUserOptionsModal}
        onClose={handleCloseUserOptionsModal}
        userName={getUserName()}
        userPhoto={user?.fotoPerfil}
        onViewProfile={handleViewProfile}
        onLogout={handleLogout}
      />

      {/* Modal de confirmación de logout */}
      {console.log('🔍 Renderizando LogoutConfirmModal, visible:', showLogoutConfirmModal)}
      <LogoutConfirmModal
        visible={showLogoutConfirmModal}
        onClose={handleCloseLogoutConfirmModal}
        onConfirm={handleConfirmLogout}
        userName={getUserName()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
     container: {
      flex: 1,
      backgroundColor: '#f8fafc', // Fallback color
    },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
        searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff', // Fallback color
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0', // Fallback color
    },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textMuted,
  },
  motivationalSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  motivationalCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  motivationalGradient: {
    padding: 24,
  },
  motivationalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationalLeft: {
    flex: 1,
    marginRight: 20,
  },
  motivationalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    lineHeight: 26,
  },
  getStartedButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  getStartedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  motivationalRight: {
    alignItems: 'center',
  },
  illustrationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationAccent: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
  },
  forYouSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  quickActionLarge: {
    // Estilo para tarjetas grandes si es necesario
  },
  quickActionGradient: {
    padding: 20,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  additionalSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  additionalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  additionalCard: {
    width: (screenWidth - 52) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionalCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  additionalCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  additionalCardSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
           statCard: {
      flex: 1,
      backgroundColor: '#ffffff', // Fallback color
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0', // Fallback color
    },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  secondaryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
           secondaryStatCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
  secondaryStatText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  footerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
           tipCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  debugContainer: {
    backgroundColor: '#f0f8ff',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default HomeScreen;