// src/screens/ActivityScreen.js - En español con diseño mejorado
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reportService from '../../services/reportService';

const { width, height } = Dimensions.get('window');

// Definición de colores mejorada
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
  // Colores adicionales para mejor diseño
  backgroundPrimary: '#f8fafc',
  backgroundSecondary: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Mapeo de categorías para mostrar
const categories = {
  infrastructure: { 
    label: 'Infraestructura', 
    icon: 'construct-outline', 
    color: colors.primary,
    gradient: ['#1e40af', '#3b82f6']
  },
  security: { 
    label: 'Seguridad', 
    icon: 'shield-checkmark-outline', 
    color: colors.danger,
    gradient: ['#ef4444', '#f87171']
  },
  cleaning: { 
    label: 'Limpieza', 
    icon: 'leaf-outline', 
    color: colors.success,
    gradient: ['#10b981', '#34d399']
  },
  lighting: { 
    label: 'Iluminación', 
    icon: 'bulb-outline', 
    color: colors.warning,
    gradient: ['#f59e0b', '#fbbf24']
  },
  transportation: { 
    label: 'Transporte', 
    icon: 'car-outline', 
    color: colors.info,
    gradient: ['#3b82f6', '#60a5fa']
  },
  general: { 
    label: 'General', 
    icon: 'chatbubble-outline', 
    color: colors.secondary,
    gradient: ['#64748b', '#94a3b8']
  },
};

export default function ActivityScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editFormData, setEditFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    categoria: 'general'
  });
  
  // Removed image editing state variables

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    recent: 0
  });

  // Cargar usuario actual
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA USAR USUARIO DEL LOGIN
  const loadCurrentUser = async () => {
    try {
      // ✅ BUSCAR PRIMERO EN userSession (del login)
      let userData = await AsyncStorage.getItem('userSession');
      
      if (userData) {
        const session = JSON.parse(userData);
        console.log('✅ Sesión de usuario encontrada:', session);
        
        // Extraer datos del usuario del session
        const user = {
          idUsuario: session.user?.idUsuario || session.user?.id,
          nombre: session.user?.nombre || session.user?.name,
          correo: session.user?.correo || session.user?.email,
          token: session.token
        };
        
        setCurrentUser(user);
        console.log('👤 Usuario actual desde sesión:', { 
          id: user.idUsuario, 
          name: user.nombre,
          email: user.correo 
        });
        
        // ✅ ACTUALIZAR reportService con el usuario correcto
        await reportService.setCurrentUser(user);
        return;
      }

      // ✅ FALLBACK: Buscar en userData (por compatibilidad)
      userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Validar que tenga el ID correcto (no el temporal)
        if (user.idUsuario && user.idUsuario !== 1) {
          setCurrentUser(user);
          console.log('👤 Usuario actual desde userData:', { 
            id: user.idUsuario, 
            name: user.nombre 
          });
          
          await reportService.setCurrentUser(user);
          return;
        }
      }

      // ✅ ÚLTIMO RECURSO: Obtener usuario por defecto del servidor
      console.log('⚠️ No se encontró sesión de usuario válida, obteniendo usuario por defecto...');
      const defaultUser = await reportService.getCurrentUser();
      
      if (defaultUser) {
        setCurrentUser(defaultUser);
        console.log('✅ Usuario por defecto cargado:', { 
          id: defaultUser.idUsuario, 
          name: defaultUser.nombre 
        });
      } else {
        console.error('❌ No se encontró usuario');
        Alert.alert('Error', 'No se pudo cargar el usuario. Por favor, inicia sesión de nuevo.');
      }

    } catch (error) {
      console.error('❌ Error cargando usuario:', error);
      Alert.alert('Error', 'Error al cargar el usuario');
    }
  };

  // Cargar reportes del usuario
  const loadUserReports = useCallback(async () => {
    try {
      console.log('📋 Cargando reportes del usuario desde MySQL...');
      
      if (!currentUser) {
        console.log('⚠️ No hay usuario actual, no se pueden cargar reportes');
        return;
      }

      console.log('📋 Cargando reportes para usuario:', {
        id: currentUser.idUsuario,
        name: currentUser.nombre
      });
      
      // ✅ USAR getUserReports() CON EL USUARIO CORRECTO
      const result = await reportService.getUserReports(currentUser.idUsuario);
      
      if (result.success) {
        const userReports = result.reports || [];
        setReports(userReports);
        
        // Calcular estadísticas
        const totalReports = userReports.length;
        const categoryStats = {};
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        let recentCount = 0;
        
        userReports.forEach(report => {
          // Estadísticas por categoría
          const category = report.categoria || 'general';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
          
          // Reportes recientes (última semana)
          const reportDate = new Date(report.fechaCreacion || report.date);
          if (reportDate >= oneWeekAgo) {
            recentCount++;
          }
        });
        
        setStats({
          total: totalReports,
          byCategory: categoryStats,
          recent: recentCount
        });
        
        console.log(`✅ ${totalReports} reportes del usuario ${currentUser.nombre} (ID: ${currentUser.idUsuario}) cargados desde MySQL`);
        
        if (result.fromCache) {
          console.log('📱 Datos cargados desde caché');
        }
      } else {
        console.error('❌ Error cargando reportes del usuario:', result.error);
        Alert.alert('Error', result.error || 'No se pudieron cargar los reportes');
      }
    } catch (error) {
      console.error('❌ Excepción cargando reportes del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  // Carga inicial
  useEffect(() => {
    if (currentUser) {
      loadUserReports();
    }
  }, [currentUser, loadUserReports]);

  // Manejador de actualización
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserReports();
  }, [loadUserReports]);

  // Editar reporte
  const handleEditReport = (report) => {
    console.log('🔍 [EDIT] Iniciando edición del reporte:', report.idReporte);
    console.log('🔍 [EDIT] Datos del reporte:', {
      id: report.idReporte,
      titulo: report.titulo,
      imagenUrl: report.imagenUrl,
      imagen: report.imagen
    });
    
    setSelectedReport(report);
    setEditFormData({
      titulo: report.titulo || '',
      descripcion: report.descripcion || '',
      ubicacion: report.ubicacion || '',
      categoria: report.categoria || 'general'
    });
    
    // Removed image editing setup
    setEditModalVisible(true);
  };

  // Guardar reporte editado
  const handleSaveEdit = async () => {
    try {
      console.log('💾 [SAVE] Iniciando guardado de edición');
      console.log('💾 [SAVE] Datos del formulario:', editFormData);
      
      if (!editFormData.titulo || !editFormData.descripcion || !editFormData.ubicacion) {
        Alert.alert('Error', 'Todos los campos son requeridos');
        return;
      }

      console.log('🔄 [SAVE] Actualizando reporte:', selectedReport.idReporte);
      
      // Removed image handling from update data
      const updateData = {
        ...editFormData
      };
      
      console.log('💾 [SAVE] Datos finales para envío:', updateData);
      
      const result = await reportService.updateReport(selectedReport.idReporte, updateData);
      
      console.log('💾 [SAVE] Resultado del servicio:', result);
      
      if (result.success) {
        setEditModalVisible(false);
        setSelectedReport(null);
        Alert.alert('Éxito', 'Reporte actualizado exitosamente');
        console.log('✅ [SAVE] Reporte actualizado exitosamente, recargando lista');
        loadUserReports(); // Refrescar lista
      } else {
        console.error('❌ [SAVE] Error en resultado:', result.error);
        Alert.alert('Error', result.error || 'No se pudo actualizar el reporte');
      }
    } catch (error) {
      console.error('❌ [SAVE] Excepción al actualizar reporte:', error);
      Alert.alert('Error', 'No se pudo actualizar el reporte');
    }
  };



  // Eliminar reporte
  const handleDeleteReport = (report) => {
    Alert.alert(
      'Eliminar Reporte',
      '¿Estás seguro de que quieres eliminar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando reporte:', report.idReporte);
              
              const result = await reportService.deleteReport(report.idReporte);
              
              if (result.success) {
                Alert.alert('Éxito', 'Reporte eliminado exitosamente');
                loadUserReports(); // Refrescar lista
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar el reporte');
              }
            } catch (error) {
              console.error('❌ Error eliminando reporte:', error);
              Alert.alert('Error', 'No se pudo eliminar el reporte');
            }
          }
        }
      ]
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Obtener información de categoría
  const getCategoryInfo = (categoryId) => {
    return categories[categoryId] || categories.general;
  };



  // Renderizar elemento de reporte
  const renderReportItem = ({ item, index }) => {
    const categoryInfo = getCategoryInfo(item.categoria);
    
    console.log(`🔍 [RENDER] Renderizando reporte ${item.idReporte}:`, {
      id: item.idReporte,
      titulo: item.titulo,
      imagenUrl: item.imagenUrl,
      imagen: item.imagen
    });
    
    // ✅ NUEVO: Construir URL de imagen para mostrar en la lista
    const getImageUrl = (imagePath) => {
      console.log(`🖼️ [RENDER] Procesando imagen para reporte ${item.idReporte}:`, imagePath);
      
      if (!imagePath) {
        console.log(`🖼️ [RENDER] No hay ruta de imagen para reporte ${item.idReporte}`);
        return null;
      }
      
      try {
        let cleanPath = imagePath;
        
        // Si ya es una URL completa, devolverla directamente
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
          console.log(`🖼️ [RENDER] Ya es una URL completa:`, cleanPath);
          return cleanPath;
        }
        
        // Remover IP si ya está incluida
        if (cleanPath.includes('192.168.1.13:3000')) {
          cleanPath = cleanPath.replace('192.168.1.13:3000', '');
          console.log(`🖼️ [RENDER] IP removida: ${cleanPath}`);
        }
        
        // Normalizar ruta
        if (cleanPath.startsWith('/')) {
          cleanPath = cleanPath.substring(1);
          console.log(`🖼️ [RENDER] Slash inicial removido: ${cleanPath}`);
        }
        
        // Si la ruta ya empieza con uploads/reportes/, usarla tal como está
        if (cleanPath.startsWith('uploads/reportes/')) {
          console.log(`🖼️ [RENDER] Ruta ya tiene formato correcto: ${cleanPath}`);
        } else if (cleanPath.startsWith('uploads/')) {
          // Si empieza solo con uploads/, agregar reportes/
          cleanPath = `uploads/reportes/${cleanPath.substring(8)}`;
          console.log(`🖼️ [RENDER] Ruta convertida de uploads/ a uploads/reportes/: ${cleanPath}`);
        } else {
          // Si no empieza con uploads/, convertir a formato de carpeta compartida
          cleanPath = `uploads/reportes/${cleanPath}`;
          console.log(`🖼️ [RENDER] Formato corregido: ${cleanPath}`);
        }
        
        const finalUrl = `http://192.168.1.13:3000/${cleanPath}`;
        console.log(`🖼️ [RENDER] URL final para reporte ${item.idReporte}: ${finalUrl}`);
        return finalUrl;
        
      } catch (error) {
        console.error(`❌ [RENDER] Error construyendo URL de imagen para reporte ${item.idReporte}:`, error);
        return null;
      }
    };
    
    const imageUrl = item.imagenUrl || item.imagen ? getImageUrl(item.imagenUrl || item.imagen) : null;
    const hasImage = !!imageUrl;
    
    console.log(`🖼️ [RENDER] Resultado final para reporte ${item.idReporte}:`, {
      hasImage,
      imageUrl
    });
    
    return (
      <View style={[styles.reportItem, { marginTop: index === 0 ? 0 : 12 }]}>
        <View style={styles.reportHeader}>
          <View style={styles.categoryBadge}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
              <Ionicons name={categoryInfo.icon} size={16} color={colors.white} />
            </View>
            <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
          </View>
          
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditReport(item)}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteReport(item)}
            >
              <Ionicons name="trash" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* ✅ NUEVO: Mostrar imagen del reporte */}
        {hasImage && (
          <View style={styles.reportImageContainer}>
            {console.log(`🖼️ [RENDER] Mostrando imagen para reporte ${item.idReporte}: ${imageUrl}`)}
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.reportImage}
              resizeMode="cover"
              onLoadStart={() => console.log(`🖼️ [RENDER] Inicio de carga imagen reporte ${item.idReporte}`)}
              onLoad={() => console.log(`✅ [RENDER] Imagen cargada exitosamente reporte ${item.idReporte}`)}
              onError={(error) => console.error(`❌ [RENDER] Error cargando imagen reporte ${item.idReporte}:`, error)}
            />
            <View style={styles.reportImageOverlay}>
              <Text style={styles.reportImageLabel}>Imagen del Reporte</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.reportTitle}>{item.titulo}</Text>
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.descripcion}
        </Text>
        
        <View style={styles.reportFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color={colors.textMuted} />
            <Text style={styles.reportLocation}>{item.ubicacion}</Text>
          </View>
          <Text style={styles.reportDate}>
            {formatDate(item.fechaCreacion || item.date)}
          </Text>
        </View>
      </View>
    );
  };

  // Renderizar estadísticas
  const renderStatistics = () => (
    <View style={styles.statisticsContainer}>
      <View style={styles.statisticsHeader}>
        <Ionicons name="analytics" size={24} color={colors.primary} />
        <Text style={styles.statisticsTitle}>Mis Estadísticas</Text>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="document-text" size={20} color={colors.white} />
          </View>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total de Reportes</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.success }]}>
            <Ionicons name="time" size={20} color={colors.white} />
          </View>
          <Text style={styles.statNumber}>{stats.recent}</Text>
          <Text style={styles.statLabel}>Esta Semana</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.accent }]}>
            <Ionicons name="grid" size={20} color={colors.white} />
          </View>
          <Text style={styles.statNumber}>{Object.keys(stats.byCategory).length}</Text>
          <Text style={styles.statLabel}>Categorías</Text>
        </View>
      </View>

      {Object.keys(stats.byCategory).length > 0 && (
        <View style={styles.categoryStats}>
          <Text style={styles.categoryStatsTitle}>Por Categoría:</Text>
          {Object.entries(stats.byCategory).map(([categoryId, count]) => {
            const categoryInfo = getCategoryInfo(categoryId);
            return (
              <View key={categoryId} style={styles.categoryStatItem}>
                <View style={[styles.categoryStatIcon, { backgroundColor: categoryInfo.color }]}>
                  <Ionicons name={categoryInfo.icon} size={12} color={colors.white} />
                </View>
                <Text style={styles.categoryStatLabel}>{categoryInfo.label}</Text>
                <View style={styles.categoryStatBadge}>
                  <Text style={styles.categoryStatCount}>{count}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyStateTitle}>No tienes reportes aún</Text>
      <Text style={styles.emptyStateSubtitle}>
        Aún no has creado ningún reporte. ¡Comienza creando tu primer reporte!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateReport')}
      >
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.createButtonText}>Crear Primer Reporte</Text>
      </TouchableOpacity>
    </View>
  );

  // Removed all image editing functions: handleSelectNewImage, openCamera, openGallery, processImageForUpload

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mis Reportes</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} {stats.total === 1 ? 'reporte' : 'reportes'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={colors.white}
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>



      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tus reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => (item.idReporte || item.id || Math.random()).toString()}
          ListHeaderComponent={renderStatistics}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Actualizando..."
              titleColor={colors.textSecondary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de edición mejorado */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                // Simplified close logic without image changes
                if (editFormData.titulo !== selectedReport?.titulo ||
                    editFormData.descripcion !== selectedReport?.descripcion ||
                    editFormData.ubicacion !== selectedReport?.ubicacion ||
                    editFormData.categoria !== selectedReport?.categoria) {
                  Alert.alert(
                    'Cambios sin guardar',
                    '¿Estás seguro de que quieres cerrar sin guardar los cambios?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { 
                        text: 'Cerrar', 
                        style: 'destructive',
                        onPress: () => {
                          setEditModalVisible(false);
                          setSelectedReport(null);
                        }
                      }
                    ]
                  );
                } else {
                  setEditModalVisible(false);
                  setSelectedReport(null);
                }
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Reporte</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.titulo}
                onChangeText={(text) => setEditFormData({...editFormData, titulo: text})}
                placeholder="Título del reporte"
                maxLength={100}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editFormData.descripcion}
                onChangeText={(text) => setEditFormData({...editFormData, descripcion: text})}
                placeholder="Descripción del reporte"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ubicación</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.ubicacion}
                onChangeText={(text) => setEditFormData({...editFormData, ubicacion: text})}
                placeholder="Ubicación del reporte"
                maxLength={200}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Categoría</Text>
              <View style={styles.categorySelector}>
                {Object.entries(categories).map(([id, info]) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.categoryOption,
                      editFormData.categoria === id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setEditFormData({...editFormData, categoria: id})}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: info.color }]}>
                      <Ionicons name={info.icon} size={16} color={colors.white} />
                    </View>
                    <Text style={[
                      styles.categoryOptionText,
                      editFormData.categoria === id && styles.categoryOptionTextSelected
                    ]}>
                      {info.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Removed image editing section */}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },

  // Header mejorado
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },



  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Lista
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Estadísticas mejoradas
  statisticsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statisticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  categoryStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  categoryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  categoryStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryStatLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryStatBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryStatCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Elemento de reporte mejorado
  reportItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: colors.gray100,
  },
  deleteButton: {
    backgroundColor: colors.gray100,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  reportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  reportLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  reportDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Estado vacío mejorado
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Modal mejorado
  modalContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  modalSaveText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Grupos de entrada mejorados
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  // Removed inputSubtext style (was only used for image editing)

  // Selector de categoría mejorado
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.gray50,
    borderWidth: 2,
  },
  categoryOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  categoryOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Removed image editing styles

  // Reporte con imagen mejorado
  reportImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  reportImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  reportImageLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});