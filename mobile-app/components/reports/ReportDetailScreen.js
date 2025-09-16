// components/reports/ReportDetailScreen.js - Diseño limpio y simple
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Platform,
  Share,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import reportService from '../../services/reportService';
import commentService from '../../services/commentService';
import replyService from '../../services/replyService';
import ImageTestComponent from './ImageTestComponent';
import Avatar from '../common/Avatar';

// Colores modernos y limpios
const colors = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
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
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const statusInfo = {
  'Pendiente': { color: colors.warning, icon: 'time-outline' },
  'En progreso': { color: colors.info, icon: 'build-outline' },
  'Resuelto': { color: colors.success, icon: 'checkmark-circle-outline' },
  'Revisando': { color: colors.primary, icon: 'eye-outline' },
  'Rechazado': { color: colors.danger, icon: 'close-circle-outline' }
};

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params || { reportId: '1' };
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageTest, setShowImageTest] = useState(false);
  
  // Estados simples para la imagen
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // ✅ NUEVO: Estados para comentarios
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replies, setReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  useEffect(() => {
    fetchReportDetails();
    loadComments();
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reportService.getReport(reportId);
      
      if (response && response.success) {
        const processedReport = {
          ...response.report,
          status: response.report.estado || 'Pendiente',
          imagenUrl: response.report.imagen || response.report.imagenUrl,
          hasImage: response.report.hasImage || !!response.report.imagen,
          titulo: response.report.titulo || 'Sin título',
          descripcion: response.report.descripcion || 'Sin descripción',
          ubicacion: response.report.ubicacion || 'Ubicación no especificada',
          categoria: response.report.categoria || 'general',
          fechaCreacion: response.report.fechaCreacion || new Date().toISOString(),
          nombreUsuario: response.report.nombreUsuario || 'Usuario desconocido'
        };
        
        setReport(processedReport);
      } else {
        throw new Error(response?.error || 'Error al obtener detalles del reporte');
      }
      
    } catch (error) {
      console.error('❌ Error al obtener detalles del reporte:', error.message);
      setError('No se pudieron cargar los detalles del reporte. ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  
  // Función simple para construir URL de imagen
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log('❌ [URL] No hay ruta de imagen proporcionada');
      return null;
    }
    
    try {
      console.log('🔍 [URL] Procesando ruta de imagen:', imagePath);
      
      let cleanPath = imagePath;
      
      // Si ya es una URL completa, devolverla directamente
      if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        console.log('🖼️ [URL] Ya es una URL completa:', cleanPath);
        return cleanPath;
      }
      
      // Remover IP si ya está incluida
      if (cleanPath.includes('192.168.1.13:3000')) {
        cleanPath = cleanPath.replace('192.168.1.13:3000', '');
        console.log('🖼️ [URL] IP removida de la ruta:', cleanPath);
      }
      
      // Normalizar ruta - remover slash inicial si existe
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
        console.log('🖼️ [URL] Slash inicial removido:', cleanPath);
      }
      
      // Si la ruta ya empieza con uploads/reportes/, usarla tal como está
      if (cleanPath.startsWith('uploads/reportes/')) {
        console.log('🖼️ [URL] Ruta ya tiene formato correcto:', cleanPath);
      } else if (cleanPath.startsWith('uploads/')) {
        // Si empieza solo con uploads/, agregar reportes/
        cleanPath = `uploads/reportes/${cleanPath.substring(8)}`;
        console.log('🖼️ [URL] Ruta convertida de uploads/ a uploads/reportes/:', cleanPath);
      } else {
        // Si no empieza con uploads/, convertir a formato de carpeta compartida
        cleanPath = `uploads/reportes/${cleanPath}`;
        console.log('🖼️ [URL] Ruta convertida a carpeta compartida:', cleanPath);
      }
      
      const fullUrl = `http://192.168.1.13:3000/${cleanPath}`;
      console.log('🖼️ [URL] URL final construida:', fullUrl);
      
      return fullUrl;
      
    } catch (error) {
      console.error('❌ [URL] Error construyendo URL de imagen:', error);
      return null;
    }
  };

  // Funciones simples para manejar imagen
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
    
    // Timeout simple de 5 segundos
    setTimeout(() => {
      if (imageLoading) {
        setImageLoading(false);
        setImageError(true);
      }
    }, 5000);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Función para compartir
  const handleShare = async () => {
    try {
      const shareMessage = `🚨 Reporte: ${report?.titulo || 'Sin título'}\n\n📍 Ubicación: ${report?.ubicacion || 'Ubicación no especificada'}\n📅 Fecha: ${formatDate(report?.fechaCreacion)}\n\n${report?.descripcion || 'Sin descripción'}\n\n#MiCiudadSV`;
      
      await Share.share({
        message: shareMessage,
        title: 'Compartir Reporte'
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Función para obtener tiempo transcurrido
  const getTimeAgo = (dateString) => {
    try {
      const now = new Date();
      const reportDate = new Date(dateString);
      const diffInMinutes = Math.floor((now - reportDate) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minutos`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
      }
    } catch (error) {
      return 'Tiempo no disponible';
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar comentarios
  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      console.log('💬 Cargando comentarios para reporte:', reportId);
      
      const response = await commentService.getReportComments(reportId);
      
      if (response.success) {
        setComments(response.comments || []);
        console.log('✅ Comentarios cargados:', response.comments?.length || 0);
        
        // Cargar respuestas para cada comentario
        if (response.comments) {
          response.comments.forEach(comment => {
            loadReplies(comment.id);
          });
        }
      } else {
        console.log('⚠️ No se pudieron cargar comentarios:', response.error);
        setComments([]);
      }
    } catch (error) {
      console.error('❌ Error cargando comentarios:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Enviar comentario
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    try {
      setSubmittingComment(true);
      console.log('💬 Enviando comentario:', newComment);
      
      const response = await commentService.createComment(reportId, newComment.trim());
      
      if (response.success) {
        console.log('✅ Comentario enviado exitosamente');
        setNewComment('');
        // Recargar comentarios
        await loadComments();
        Alert.alert('Éxito', 'Comentario agregado exitosamente');
      } else {
        Alert.alert('Error', response.error || 'No se pudo enviar el comentario');
      }
    } catch (error) {
      console.error('❌ Error enviando comentario:', error);
      Alert.alert('Error', 'Error al enviar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };


  // ✅ NUEVA FUNCIÓN: Cargar respuestas
  const loadReplies = async (commentId) => {
    try {
      const result = await replyService.getReplies(commentId);
      if (result.success) {
        setReplies(prev => ({
          ...prev,
          [commentId]: result.replies
        }));
      }
    } catch (error) {
      console.error('Error al cargar respuestas:', error);
    }
  };

  // ✅ NUEVA FUNCIÓN: Iniciar respuesta
  const startReply = (comment) => {
    setReplyingTo(comment);
    setReplyText('');
  };

  // ✅ NUEVA FUNCIÓN: Cancelar respuesta
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  // ✅ NUEVA FUNCIÓN: Enviar respuesta
  const handleSubmitReply = async () => {
    if (!replyText.trim() || submittingReply || !replyingTo) return;

    setSubmittingReply(true);
    try {
      const result = await replyService.createReply(replyingTo.id, replyText.trim());
      
      if (result.success) {
        setReplyText('');
        setReplyingTo(null);
        // Recargar respuestas para este comentario
        loadReplies(replyingTo.id);
        Alert.alert('Éxito', 'Respuesta enviada correctamente');
      } else {
        Alert.alert('Error', result.error || 'Error al enviar respuesta');
      }
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      Alert.alert('Error', 'Error al enviar respuesta');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Construir URL de imagen
  const imageUrl = report && report.imagenUrl 
    ? getImageUrl(report.imagenUrl)
    : null;

  // Verificar si hay imagen disponible - CORREGIDO
  const hasImage = report && (report.imagenUrl || report.imagen);
  
  // ✅ DEBUGGING: Mostrar información de la imagen
  console.log('🔍 === DEBUGGING DE IMAGEN ===');
  console.log('📋 Reporte completo:', report);
  console.log('🖼️ imagenUrl del reporte:', report?.imagenUrl);
  console.log('🖼️ imagen del reporte:', report?.imagen);
  console.log('✅ hasImage:', hasImage);
  console.log('🌐 imageUrl construida:', imageUrl);
  console.log('🔍 === FIN DEBUGGING ===');
  
  // Verificaciones de seguridad
  const safeReport = report || {};
  const safeStatus = safeReport.status || 'Pendiente';
  
  // Si no hay reporte
  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.gray400} />
          <Text style={styles.errorTitle}>Reporte no Encontrado</Text>
          <Text style={styles.errorText}>No se pudo encontrar el reporte solicitado</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Si está cargando
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Cargando detalles del reporte...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  
  // Si hay un error
  if (error && !report) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          <Text style={styles.errorTitle}>Error al Cargar</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportDetails}>
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const statusData = statusInfo[safeStatus] || statusInfo['Pendiente'];
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header limpio */}
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
            <Text style={styles.headerTitle}>Detalles del Reporte</Text>
            <Text style={styles.headerSubtitle}>#{safeReport.idReporte || 'N/A'}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => setShowImageTest(true)}
            >
              <Ionicons name="bug-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Título y Estado */}
        <View style={styles.titleSection}>
          <Text style={styles.reportTitle}>{safeReport.titulo || 'Sin título'}</Text>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusData.color }]}>
              <Ionicons name={statusData.icon} size={16} color={colors.white} />
              <Text style={styles.statusText}>{safeStatus}</Text>
            </View>
            <Text style={styles.timeAgo}>{getTimeAgo(safeReport.fechaCreacion)}</Text>
          </View>


        </View>

        {/* Imagen simple - Solo la imagen, sin información extra */}
        {hasImage ? (
          <View style={styles.imageSection}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.imageLoadingText}>Cargando imagen...</Text>
              </View>
            )}
            
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Ionicons name="image-outline" size={48} color={colors.gray400} />
                <Text style={styles.imageErrorText}>Error al cargar imagen</Text>
                <TouchableOpacity 
                  style={styles.retryImageButton}
                  onPress={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                >
                  <Ionicons name="refresh" size={16} color={colors.white} />
                  <Text style={styles.retryImageButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!imageLoading && !imageError && imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.reportImage}
                resizeMode="cover"
                onLoadStart={handleImageLoadStart}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </View>
        ) : (
          <View style={styles.imageSection}>
            <View style={styles.imageErrorContainer}>
              <Ionicons name="image-outline" size={48} color={colors.gray400} />
              <Text style={styles.imageErrorText}>No hay imagen disponible</Text>
            </View>
          </View>
        )}
        
        {/* Información Principal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Información Principal</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Fecha de Reporte:</Text>
            <Text style={styles.detailValue}>{formatDate(safeReport.fechaCreacion)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{safeReport.ubicacion}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="apps-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailLabel}>Categoría:</Text>
            <Text style={styles.detailValue}>{safeReport.categoria}</Text>
          </View>

          {safeReport.nombreUsuario && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.detailLabel}>Reportado por:</Text>
              <Text style={styles.detailValue}>{safeReport.nombreUsuario}</Text>
            </View>
          )}
        </View>
        
        {/* Descripción */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Descripción Detallada</Text>
          </View>
          <Text style={styles.description}>{safeReport.descripcion}</Text>
        </View>

        {/* ✅ NUEVA SECCIÓN: Comentarios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Comentarios ({comments.length})</Text>
          </View>
          
          {/* Campo para escribir comentario */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe tu comentario..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={[
                styles.commentSubmitButton,
                (!newComment.trim() || submittingComment) && styles.commentSubmitButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Lista de comentarios */}
          {commentsLoading ? (
            <View style={styles.commentsLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.commentsLoadingText}>Cargando comentarios...</Text>
            </View>
          ) : comments.length > 0 ? (
            <View style={styles.commentsList}>
              {comments.map((comment, index) => (
                <View key={comment.id || index} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentUserInfo}>
                      <Avatar 
                        user={{
                          nombre: comment.nombreUsuario,
                          fotoPerfil: comment.fotoPerfil,
                          emailVerificado: true
                        }}
                        size={32}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentUserDetails}>
                        <Text style={styles.commentUserName}>
                          {comment.nombreUsuario || 'Usuario Desconocido'}
                        </Text>
                        <Text style={styles.commentTime}>
                          {getTimeAgo(comment.fecha_creacion)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.replyButton}
                      onPress={() => startReply(comment)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.replyButtonText}>Responder</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.commentText}>{comment.comentario}</Text>
                  
                  {/* Sección de respuesta */}
                  {replyingTo && replyingTo.id === comment.id && (
                    <View style={styles.replySection}>
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder={`Responder a ${comment.nombreUsuario}...`}
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                          maxLength={500}
                        />
                        <View style={styles.replyActions}>
                          <TouchableOpacity
                            style={styles.replyCancelButton}
                            onPress={cancelReply}
                          >
                            <Text style={styles.replyCancelText}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.replySubmitButton,
                              (!replyText.trim() || submittingReply) && styles.replySubmitButtonDisabled
                            ]}
                            onPress={handleSubmitReply}
                            disabled={!replyText.trim() || submittingReply}
                          >
                            {submittingReply ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                              <Text style={styles.replySubmitText}>Enviar</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Mostrar respuestas existentes */}
                  {replies[comment.id] && replies[comment.id].length > 0 && (
                    <View style={styles.repliesContainer}>
                      {replies[comment.id].map((reply, replyIndex) => (
                        <View key={reply.id || replyIndex} style={styles.replyItem}>
                          <View style={styles.replyHeader}>
                            <Avatar 
                              user={{
                                nombre: reply.nombreUsuario,
                                fotoPerfil: reply.fotoPerfil,
                                emailVerificado: true
                              }}
                              size={24}
                              style={styles.replyAvatar}
                            />
                            <View style={styles.replyUserDetails}>
                              <Text style={styles.replyUserName}>
                                {reply.nombreUsuario || 'Usuario Desconocido'}
                              </Text>
                              <Text style={styles.replyTime}>
                                {getTimeAgo(reply.fecha_creacion)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.replyText}>{reply.respuesta}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noCommentsContainer}>
              <Ionicons name="chatbubble-outline" size={32} color={colors.gray400} />
              <Text style={styles.noCommentsText}>No hay comentarios aún</Text>
              <Text style={styles.noCommentsSubtext}>Sé el primero en comentar</Text>
            </View>
          )}
        </View>
        
        {/* Botones de Acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.buttonGradient}
            >
              <Ionicons name="list-outline" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Volver a Reportes</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Modal de Testing */}
      <Modal
        visible={showImageTest}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ImageTestComponent 
          onClose={() => setShowImageTest(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
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
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  titleSection: {
    backgroundColor: colors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 32,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  imageSection: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reportImage: {
    width: '100%',
    height: 250,
    backgroundColor: colors.gray100,
  },
  imageLoadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  imageLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  imageErrorContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: 20,
  },
  imageErrorText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.gray400,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryImageButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  retryImageButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  section: {
    backgroundColor: colors.card,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 100,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ NUEVOS ESTILOS: Para comentarios
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  commentsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  commentsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    gap: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  replySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyInputContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyInput: {
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  replyCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  replyCancelText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  replySubmitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  replySubmitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  replySubmitText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary + '30',
  },
  replyItem: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAvatar: {
    marginRight: 8,
  },
  replyUserDetails: {
    flex: 1,
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  replyTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  replyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 4,
  },
});

export default ReportDetailScreen;