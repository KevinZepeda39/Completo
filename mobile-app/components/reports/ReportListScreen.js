// components/reports/ReportListScreen.js - Con estilo mejorado y consistente
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import reportService from '../../services/reportService';
import commentService from '../../services/commentService';

const { width, height } = Dimensions.get('window');

// Definición de colores consistente con ActivityScreen
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

// Helper para formatear cualquier valor de forma segura
const formatSafeValue = (value) => {
  if (value == null) return '';
  if (value instanceof Date) {
    return value.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// Helper específico para formatear fechas
const formatDate = (dateValue) => {
  try {
    if (!dateValue) return 'Sin fecha';
    
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return 'Fecha inválida';
      return dateValue.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue;
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return formatSafeValue(dateValue);
  } catch (error) {
    console.log('Error formatting date:', dateValue, error);
    return formatSafeValue(dateValue);
  }
};

const ReportListScreen = ({ navigation, route }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [userId, setUserId] = useState(null);
  const [autoUpdating, setAutoUpdating] = useState(false);
  // ✅ NUEVO: Estado para detectar cambios de estado
  const [lastStatuses, setLastStatuses] = useState({});
  const [statusChanges, setStatusChanges] = useState([]);
  // ✅ NUEVO: Estado para manejar el estado de carga de imágenes
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  // ✅ NUEVO: Estado para contadores de comentarios
  const [commentCounts, setCommentCounts] = useState({});

  const statusColors = {
    'Resuelto': colors.success,
    'En progreso': colors.warning, 
    'Pendiente': colors.danger,
    'Revisando': colors.info,
    'Error': colors.danger
  };

  const categoryIcons = {
    'Limpieza': 'leaf-outline',
    'Tráfico': 'car-outline',
    'Infraestructura': 'construct-outline',
    'Seguridad': 'shield-checkmark-outline',
    'Alumbrado': 'bulb-outline',
    'Agua': 'water-outline',
    'General': 'chatbubble-outline',
    'Sistema': 'cog-outline',
    'infrastructure': 'construct-outline',
    'security': 'shield-checkmark-outline',
    'cleaning': 'leaf-outline',
    'lighting': 'bulb-outline',
    'transportation': 'car-outline',
    'general': 'chatbubble-outline',
    'Otros': 'ellipsis-horizontal-outline'
  };

  const categoryColors = {
    'infrastructure': colors.primary,
    'security': colors.danger,
    'cleaning': colors.success,
    'lighting': colors.warning,
    'transportation': colors.info,
    'general': colors.secondary,
    'Infraestructura': colors.primary,
    'Seguridad': colors.danger,
    'Limpieza': colors.success,
    'Iluminación': colors.warning,
    'Transporte': colors.info,
    'General': colors.secondary,
  };

  // ⭐ ESTO ES LO CLAVE: Se ejecuta cada vez que vuelves a esta pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ReportListScreen focused - Loading reports...');
      
      // Obtener userId de los parámetros de la ruta
      if (route.params?.userId) {
        setUserId(route.params.userId);
        console.log(`👤 Filtrando reportes por usuario ID: ${route.params.userId}`);
        loadReports(route.params.userId); // Cargar reportes filtrados
      } else {
        setUserId(null);
        loadReports(); // Cargar todos los reportes
      }
    }, [route.params?.userId])
  );

  // ✅ LIMPIAR ESTADOS DE CARGA DE IMÁGENES AL DESMONTAR
  useEffect(() => {
    return () => {
      setImageLoadingStates({});
    };
  }, []);

  // ✅ ACTUALIZACIÓN AUTOMÁTICA CADA 30 SEGUNDOS
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática de reportes...');
      setAutoUpdating(true);
      if (userId) {
        loadReports(userId, true);
      } else {
        loadReports(null, true);
      }
    }, 10000); // 10 segundos en lugar de 30

    return () => clearInterval(interval);
  }, [userId]);

  const loadReports = async (userId = null, isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log(`📡 Obteniendo reportes del servidor... (userId: ${userId || 'todos'})`);
      
      // ✅ VERIFICAR QUE REPORTSERVICE EXISTE
      if (!reportService || !reportService.getReports) {
        throw new Error('ReportService no está disponible');
      }

      const response = await reportService.getReports(isRefresh, userId);
      
      console.log('📊 Respuesta del servidor:', {
        success: response.success,
        reportCount: response.reports?.length || 0,
        fromCache: response.fromCache
      });
      
      if (response.success) {
        // Normalizar los datos para compatibilidad
        const normalizedReports = (response.reports || []).map(report => ({
          ...report,
          id: formatSafeValue(report.id || report.idReporte),
          title: formatSafeValue(report.title || report.titulo),
          description: formatSafeValue(report.description || report.descripcion),
          category: formatSafeValue(report.category || report.categoria) || 'General',
          status: formatSafeValue(report.status) || 'Pendiente',
          location: formatSafeValue(report.location || report.ubicacion) || 'San Salvador, El Salvador',
          hasImage: Boolean(report.hasImage),
          imageUrl: report.imageUrl || null,
          idUsuario: report.idUsuario || null,
          nombreUsuario: report.nombreUsuario || null
        }));

        // ✅ DETECTAR CAMBIOS DE ESTADO
        if (isRefresh && reports.length > 0) {
          const newStatusChanges = [];
          
          normalizedReports.forEach(newReport => {
            const oldReport = reports.find(r => r.id === newReport.id);
            if (oldReport && oldReport.status !== newReport.status) {
              console.log('🎉 ¡ESTADO CAMBIÓ!', {
                reportId: newReport.id,
                titulo: newReport.title,
                anterior: oldReport.status,
                nuevo: newReport.status
              });
              
              newStatusChanges.push({
                reportId: newReport.id,
                titulo: newReport.title,
                anterior: oldReport.status,
                nuevo: newReport.status
              });
            }
          });

          // ✅ MOSTRAR ALERTA SI HAY CAMBIOS DE ESTADO
          if (newStatusChanges.length > 0) {
            setStatusChanges(prev => [...prev, ...newStatusChanges]);
            
            // Mostrar alerta del primer cambio
            const firstChange = newStatusChanges[0];
            Alert.alert(
              'Estado Actualizado',
              `El reporte "${firstChange.titulo}" cambió de "${firstChange.anterior}" a "${firstChange.nuevo}"`,
              [{ text: 'OK' }]
            );
          }
        }

        setReports(normalizedReports);
        setStats(response.stats || null);
        
        // ✅ CARGAR CONTADORES DE COMENTARIOS
        loadCommentCounts(normalizedReports);
        
        console.log(`✅ Cargados exitosamente ${normalizedReports.length} reportes`);
        console.log(`📷 Reportes con imágenes: ${normalizedReports.filter(r => r.hasImage).length}`);
        
        if (response.fromCache) {
          console.log('📦 Datos cargados desde caché');
        }
        if (response.warning) {
          console.warn('⚠️ Advertencia:', response.warning);
        }
      } else {
        throw new Error(response.error || 'Error desconocido al cargar reportes');
      }
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      setError(error.message);
      
      if (!isRefresh && reports.length === 0) {
        Alert.alert(
          'Error de Conexión',
          `No se pudieron cargar los reportes: ${error.message}`,
          [
            { text: 'Reintentar', onPress: () => loadReports() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setAutoUpdating(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Actualización manual activada');
    setRefreshing(true);
    loadReports(true);
  }, []);

  // ✅ NUEVA FUNCIÓN: Cargar contadores de comentarios
  const loadCommentCounts = async (reports) => {
    try {
      console.log('💬 Cargando contadores de comentarios...');
      
      const counts = {};
      const promises = reports.map(async (report) => {
        try {
          const count = await commentService.getCommentCount(report.id);
          counts[report.id] = count;
        } catch (error) {
          console.log(`⚠️ Error obteniendo comentarios para reporte ${report.id}:`, error);
          counts[report.id] = 0;
        }
      });

      await Promise.all(promises);
      setCommentCounts(counts);
      console.log('✅ Contadores de comentarios cargados:', counts);
    } catch (error) {
      console.error('❌ Error cargando contadores de comentarios:', error);
    }
  };

  const handleReportPress = (report) => {
    console.log('📄 Abriendo reporte:', report.id);
    navigation.navigate('ReportDetail', { reportId: report.id });
  };

  // ✅ FUNCIÓN PARA RECARGAR IMAGENES QUE FALLARON
  const retryImageLoad = (reportId, imageUrl) => {
    console.log('🔄 Reintentando cargar imagen para reporte:', reportId);
    
    // Resetear el estado de error
    setImageLoadingStates(prev => ({
      ...prev,
      [reportId]: { loading: true, error: false }
    }));
    
    // Forzar recarga de la imagen
    setTimeout(() => {
      setImageLoadingStates(prev => ({
        ...prev,
        [reportId]: { loading: false, error: false }
      }));
    }, 100);
  };

  // ✅ FUNCIÓN PARA MANEJAR PRESIONAR EN UNA IMAGEN
  const handleImagePress = (reportId, imageUrl) => {
    console.log('🖼️ Imagen presionada:', { reportId, imageUrl });
    
    // Aquí podrías abrir un modal o navegar a una vista de imagen completa
    Alert.alert(
      'Ver Imagen',
      '¿Quieres ver la imagen en pantalla completa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Completa', onPress: () => {
          // Implementar vista de imagen completa
          console.log('📱 Abriendo imagen en pantalla completa');
        }}
      ]
    );
  };

  const handleCreateReport = () => {
    console.log('➕ Navegando a CreateReport');
    navigation.navigate('CreateReport');
  };

  const getStatusColor = (status) => {
    return statusColors[formatSafeValue(status)] || colors.gray500;
  };

  const getCategoryColor = (category) => {
    return categoryColors[formatSafeValue(category)] || colors.secondary;
  };

  const renderReportCard = ({ item, index }) => {
    // ✅ DEBUGGING: Mostrar información completa del reporte
    console.log('🖼️ Renderizando reporte:', {
      id: item.id,
      titulo: item.title,
      hasImage: item.hasImage,
      imageUrl: item.imageUrl,
      imagen: item.imagen,
      rawData: item
    });

    // ✅ CONSTRUIR URL COMPLETA DE LA IMAGEN USANDO LA CONFIGURACIÓN DEL SERVIDOR
    let imageUrl = null;
    
    if (item.hasImage && (item.imageUrl || item.imagen)) {
      // Si la imagen ya tiene URL completa (http://...)
      if ((item.imageUrl && item.imageUrl.startsWith('http')) || (item.imagen && item.imagen.startsWith('http'))) {
        imageUrl = item.imageUrl || item.imagen;
      } else {
        // Si es una ruta relativa, construir la URL completa
        // Usar la configuración del servidor si está disponible
        try {
          const relativePath = item.imageUrl || item.imagen;
          // Intentar usar ipDetector si está disponible
          if (reportService && reportService.ipDetector) {
            imageUrl = reportService.ipDetector.getFullURL(relativePath);
          } else {
            // Fallback a la IP hardcodeada (temporal)
            imageUrl = `http://192.168.1.13:3000${relativePath}`;
          }
        } catch (error) {
          console.warn('⚠️ Error construyendo URL de imagen:', error);
          // Fallback a la IP hardcodeada
          const relativePath = item.imageUrl || item.imagen;
          imageUrl = `http://192.168.1.13:3000${relativePath}`;
        }
      }
      
      console.log('🖼️ URL de imagen construida:', {
        original: item.imageUrl || item.imagen,
        final: imageUrl,
        hasImage: item.hasImage
      });
    } else {
      console.log('⚠️ Reporte sin imagen:', {
        hasImage: item.hasImage,
        imageUrl: item.imageUrl,
        imagen: item.imagen
      });
    }
    
    return (
      <TouchableOpacity
        style={[styles.reportCard, { marginTop: index === 0 ? 0 : 16 }]}
        onPress={() => handleReportPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) }]}>
                <Ionicons 
                  name={categoryIcons[formatSafeValue(item.category)] || 'chatbubble-outline'} 
                  size={18} 
                  color={colors.white} 
                />
              </View>
              <Text style={styles.categoryText}>{formatSafeValue(item.category)}</Text>
              {item.hasImage && (
                <View style={styles.imageIndicator}>
                  <Ionicons name="image" size={14} color={colors.info} />
                </View>
              )}
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{formatSafeValue(item.status)}</Text>
            </View>
          </View>

          <Text style={styles.reportTitle} numberOfLines={2}>
            {formatSafeValue(item.title)}
          </Text>

          <Text style={styles.reportDescription} numberOfLines={3}>
            {formatSafeValue(item.description)}
          </Text>

          {/* ✅ MOSTRAR IMAGEN SI EXISTE - MEJORADO */}
          {imageUrl && (
            <View style={styles.imageContainer}>
              <TouchableOpacity
                onPress={() => handleImagePress(item.id, imageUrl)}
                activeOpacity={0.9}
                style={styles.imageTouchable}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.reportImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('❌ Error cargando imagen:', {
                      url: imageUrl,
                      error: error.nativeEvent?.error,
                      reportId: item.id
                    });
                    // Marcar la imagen como fallida
                    setImageLoadingStates(prev => ({
                      ...prev,
                      [item.id]: { loading: false, error: true }
                    }));
                  }}
                  onLoad={() => {
                    console.log('✅ Imagen cargada exitosamente:', {
                      url: imageUrl,
                      reportId: item.id,
                      dimensions: `${item.imageWidth || 'desconocido'} x ${item.imageHeight || 'desconocido'}`
                    });
                    // Marcar la imagen como cargada
                    setImageLoadingStates(prev => ({
                      ...prev,
                      [item.id]: { loading: false, error: false }
                    }));
                  }}
                  onLoadStart={() => {
                    console.log('🔄 Cargando imagen:', imageUrl);
                    // Marcar la imagen como cargando
                    setImageLoadingStates(prev => ({
                      ...prev,
                      [item.id]: { loading: true, error: false }
                    }));
                  }}
                />
              </TouchableOpacity>
              
              {/* ✅ INDICADOR DE CARGA */}
              {imageLoadingStates[item.id]?.loading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.imageLoadingText}>Cargando...</Text>
                </View>
              )}
              
              {/* ✅ INDICADOR DE ERROR */}
              {imageLoadingStates[item.id]?.error && (
                <View style={styles.imageErrorOverlay}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
                  <Text style={styles.imageErrorText}>Error al cargar</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => retryImageLoad(item.id, imageUrl)}
                  >
                    <Ionicons name="refresh" size={16} color={colors.white} />
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* ✅ OVERLAY DE INFORMACIÓN */}
              {!imageLoadingStates[item.id]?.loading && !imageLoadingStates[item.id]?.error && (
                <View style={styles.imageOverlay}>
                  <Ionicons name="image-outline" size={16} color={colors.white} />
                  <Text style={styles.imageOverlayText}>Ver imagen</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {formatSafeValue(item.location)}
              </Text>
            </View>
            
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.dateText}>
                {formatDate(item.date || item.createdAt || item.fechaCreacion)}
              </Text>
            </View>
          </View>

          <View style={styles.reportMeta}>
            <View style={styles.reportIdContainer}>
              <Ionicons name="finger-print-outline" size={12} color={colors.textMuted} />
              <Text style={styles.reportId}>#{formatSafeValue(item.id)}</Text>
            </View>
            
            {/* ✅ NUEVO: Icono de comentarios con contador */}
            <View style={styles.commentContainer}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
              <Text style={styles.commentCount}>
                {commentCounts[item.id] || 0}
              </Text>
            </View>
            
            {/* ✅ MOSTRAR INFORMACIÓN DEL USUARIO */}
            {item.idUsuario && (
              <View style={styles.userIdContainer}>
                <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                <Text style={styles.userId}>
                  {item.nombreUsuario || `Usuario ${formatSafeValue(item.idUsuario)}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        {error ? (
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
        ) : (
          <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {error ? 'Error de Conexión' : 'No hay Reportes'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {error 
          ? 'No se pudieron cargar los reportes. Verifica tu conexión e intenta de nuevo.'
          : 'Aún no hay reportes en el sistema. ¡Sé el primero en crear uno!'
        }
      </Text>
      
      {error ? (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={() => loadReports()}
        >
          <Ionicons name="refresh" size={20} color={colors.white} />
          <Text style={styles.emptyActionText}>Reintentar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleCreateReport}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.emptyActionText}>Crear Reporte</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
          <Text style={styles.loadingSubtext}>Conectando con la base de datos</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header mejorado con gradiente */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Todos los Reportes</Text>
            <Text style={styles.headerSubtitle}>
              {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'} en el sistema
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.headerAction}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh-outline" 
              size={24} 
              color={colors.white}
              style={refreshing ? styles.spinning : null}
            />
          </TouchableOpacity>
        </View>

        {/* Estadísticas en el header */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Ionicons name="document-text" size={18} color={colors.white} />
            </View>
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.3)' }]}>
              <Ionicons name="image" size={18} color="#FFD700" />
            </View>
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>
              {reports.filter(r => r.hasImage).length}
            </Text>
            <Text style={styles.statLabel}>Con Imágenes</Text>
            {/* ✅ INDICADOR VISUAL DE IMÁGENES */}
            {reports.filter(r => r.hasImage).length > 0 && (
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>
                  {Math.round((reports.filter(r => r.hasImage).length / reports.length) * 100)}%
                </Text>
              </View>
            )}
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(135, 206, 235, 0.3)' }]}>
              <Ionicons name="people" size={18} color="#87CEEB" />
            </View>
            <Text style={[styles.statNumber, { color: '#87CEEB' }]}>
              {new Set(reports.map(r => r.idUsuario).filter(Boolean)).size}
            </Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ✅ BANNER INFORMATIVO: Explicar actualización automática */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={styles.infoBannerText}>
          Los estados de los reportes se actualizan automáticamente cada 10 segundos
        </Text>
      </View>

      {/* ✅ INDICADOR DE ACTUALIZACIÓN AUTOMÁTICA MEJORADO */}
      {autoUpdating && (
        <View style={styles.autoUpdateBanner}>
          <View style={styles.autoUpdateIndicator}>
            <Ionicons name="sync" size={16} color={colors.white} />
            <Text style={styles.autoUpdateText}>Auto</Text>
          </View>
          <Text style={styles.autoUpdateDescription}>
            Actualizando estados de reportes...
          </Text>
        </View>
      )}

      {/* Banner de error si hay */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="wifi-outline" size={16} color={colors.white} />
          <Text style={styles.errorBannerText}>
            Error de conexión - Mostrando datos guardados
          </Text>
          <TouchableOpacity onPress={() => loadReports()}>
            <Ionicons name="refresh" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de reportes */}
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={item => formatSafeValue(item.id) || Math.random().toString()}
        contentContainerStyle={[
          styles.listContainer,
          reports.length === 0 && styles.listContainerEmpty
        ]}
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
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreateReport}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  header: {
    paddingBottom: 24,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  // ✅ NUEVO: Banner informativo
  infoBanner: {
    backgroundColor: colors.gray50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBannerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorBannerText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  // ✅ MEJORADO: Banner de actualización automática
  autoUpdateBanner: {
    backgroundColor: colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  autoUpdateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  autoUpdateText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  autoUpdateDescription: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
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
  categoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 8,
  },
  imageIndicator: {
    padding: 4,
    backgroundColor: colors.gray100,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
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
  // ✅ ESTILOS PARA IMÁGENES MEJORADOS
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: colors.gray100,
  },
  imageTouchable: {
    flex: 1,
  },
  reportImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray100,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  imageOverlayText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // ✅ ESTILOS PARA INDICADORES DE CARGA Y ERROR
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageLoadingText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageErrorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    gap: 4,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportId: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  // ✅ NUEVO: Estilos para comentarios
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  commentCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userId: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyActionText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ✅ NUEVO: Estilos para el indicador de imágenes en el header
  imageCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.info,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.white,
  },
  imageCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ReportListScreen;