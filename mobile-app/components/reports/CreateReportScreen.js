// components/reports/CreateReportScreen.js - En español con diseño mejorado
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reportService from '../../services/reporteService';
import ServerConfigModal from './ServerConfigModal';

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

// Categorías para reportes con gradientes
const categories = [
  { 
    id: 'infrastructure', 
    label: 'Infraestructura', 
    icon: 'construct-outline', 
    color: colors.primary,
    gradient: ['#1e40af', '#3b82f6']
  },
  { 
    id: 'security', 
    label: 'Seguridad', 
    icon: 'shield-checkmark-outline', 
    color: colors.danger,
    gradient: ['#ef4444', '#f87171']
  },
  { 
    id: 'cleaning', 
    label: 'Limpieza', 
    icon: 'leaf-outline', 
    color: colors.success,
    gradient: ['#10b981', '#34d399']
  },
  { 
    id: 'lighting', 
    label: 'Iluminación', 
    icon: 'bulb-outline', 
    color: colors.warning,
    gradient: ['#f59e0b', '#fbbf24']
  },
  { 
    id: 'transportation', 
    label: 'Transporte', 
    icon: 'car-outline', 
    color: colors.info,
    gradient: ['#3b82f6', '#60a5fa']
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: 'chatbubble-outline', 
    color: colors.secondary,
    gradient: ['#64748b', '#94a3b8']
  },
];

export default function CreateReportScreen({ navigation }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    categoria: 'general'
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); // Nuevo estado para la compresión manual

  // Referencias para los inputs
  const titleRef = React.useRef(null);
  const descriptionRef = React.useRef(null);
  const locationRef = React.useRef(null);

  // ✅ INICIALIZAR SERVICIO AL CARGAR
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('🚀 Inicializando servicio de reportes...');
        const success = await reportService.initialize();
        
        if (success) {
          console.log('✅ Servicio de reportes inicializado correctamente');
        } else {
          console.error('❌ No se pudo inicializar el servicio de reportes');
          Alert.alert(
            'Error de Conexión',
            'No se pudo conectar al servidor. Verifica tu conexión a internet.',
            [
              { text: 'Reintentar', onPress: initializeService },
              { text: 'Cancelar', style: 'cancel' }
            ]
          );
        }
      } catch (error) {
        console.error('❌ Error inicializando servicio:', error);
      }
    };

    initializeService();
  }, []);

  // ✅ REINICIALIZAR SERVICIO CUANDO SE ACTUALICE CONFIGURACIÓN
  const handleConfigUpdate = async () => {
    try {
      console.log('🔄 Reinicializando servicio después de cambio de configuración...');
      const success = await reportService.initialize();
      
      if (success) {
        console.log('✅ Servicio reinicializado correctamente');
        Alert.alert('✅ Configuración Actualizada', 'El servicio se ha reinicializado con la nueva configuración.');
      } else {
        console.error('❌ No se pudo reinicializar el servicio');
        Alert.alert('⚠️ Advertencia', 'La configuración se guardó pero el servicio no se pudo reinicializar. Intenta crear un reporte para verificar la conexión.');
      }
    } catch (error) {
      console.error('❌ Error reinicializando servicio:', error);
    }
  };

  // ✅ OBTENER USUARIO ACTUAL AL CARGAR
  useEffect(() => {
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
          
          // ✅ VALIDAR QUE EL USUARIO TENGA ID VÁLIDO
          if (user.idUsuario && user.idUsuario !== 1) {
            setCurrentUser(user);
            console.log('👤 Usuario actual desde sesión:', { 
              id: user.idUsuario, 
              name: user.nombre,
              email: user.correo 
            });
            return;
          } else {
            console.log('⚠️ Usuario de sesión tiene ID inválido:', user.idUsuario);
          }
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
            return;
          }
        }

        console.log('⚠️ No se encontró información del usuario válida');
        console.log('⚠️ Por favor, inicia sesión de nuevo');
        
        // ✅ NO CREAR USUARIO TEMPORAL - MOSTRAR ERROR
        Alert.alert(
          'Usuario no encontrado',
          'Por favor, inicia sesión de nuevo para crear reportes.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );

      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        Alert.alert(
          'Error',
          'No se pudo cargar la información del usuario. Por favor, inicia sesión de nuevo.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    };

    loadCurrentUser();
  }, [navigation]);

  // Función de validación
  const validateForm = () => {
    // ✅ VERIFICAR QUE HAYA UN USUARIO VÁLIDO
    if (!currentUser || !currentUser.idUsuario || currentUser.idUsuario === 1) {
      Alert.alert(
        'Usuario no válido',
        'Por favor, inicia sesión de nuevo para crear reportes.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      return false;
    }
    
    if (!formData.titulo.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      titleRef.current?.focus();
      return false;
    }
    if (!formData.descripcion.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      descriptionRef.current?.focus();
      return false;
    }
    if (!formData.ubicacion.trim()) {
      Alert.alert('Error', 'Por favor ingresa una ubicación');
      locationRef.current?.focus();
      return false;
    }
    return true;
  };

  // ✅ MANEJAR ENVÍO CORREGIDO PARA ENVIAR IMÁGENES
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    if (selectedImage) {
      setIsUploadingImage(true);
    }

    try {
      // ✅ PREPARAR DATOS DEL REPORTE
      const reportData = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        ubicacion: formData.ubicacion.trim(),
        categoria: formData.categoria,
        idUsuario: currentUser.idUsuario // ✅ USAR SOLO EL ID DEL USUARIO ACTUAL
      };

      console.log('\n📊 Datos del formulario antes de enviar:');
      console.log('  titulo:', reportData.titulo);
      console.log('  descripcion:', reportData.descripcion);
      console.log('  ubicacion:', reportData.ubicacion);
      console.log('  categoria:', reportData.categoria);
      console.log('  idUsuario:', reportData.idUsuario);
      console.log('  nombreUsuario:', currentUser.nombre);
      console.log('  tieneImagen:', !!selectedImage);
      
      if (selectedImage) {
        console.log('  📷 Detalles de la imagen:');
        console.log('    - uri:', selectedImage.uri);
        console.log('    - tipo:', selectedImage.type);
        console.log('    - nombreArchivo:', selectedImage.fileName);
        console.log('    - ancho:', selectedImage.width);
        console.log('    - alto:', selectedImage.height);
      }

      console.log('📝 Creando nuevo reporte...');
      
      // ✅ PASAR LA IMAGEN COMO SEGUNDO PARÁMETRO
      const result = await reportService.createReport(reportData, selectedImage);
      
      if (result.success) {
        const message = selectedImage ? 
          '¡Reporte con imagen creado exitosamente!' : 
          '¡Reporte creado exitosamente!';
          
        const warningMessage = result.warning ? 
          `\n\n⚠️ ${result.warning}` : '';
          
        Alert.alert(
          '¡Éxito!',
          message + warningMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar formulario
                setFormData({ titulo: '', descripcion: '', ubicacion: '', categoria: 'general' });
                setSelectedImage(null);
                
                // Navegar de vuelta
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Reports');
                }
              }
            }
          ]
        );
      } else {
        console.error('❌ Error creando reporte:', result.error);
        
        // ✅ MANEJAR ERRORES DE IMAGEN CON OPCIONES PARA EL USUARIO
        if (result.canRetry && selectedImage) {
          Alert.alert(
            'Error al subir imagen',
            result.error + '\n\n¿Qué quieres hacer?',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => {
                  setIsSubmitting(false);
                  setIsUploadingImage(false);
                }
              },
              {
                text: 'Reintentar',
                onPress: () => {
                  // Reintentar solo la subida de imagen
                  handleSubmit();
                }
              },
              {
                text: 'Enviar sin imagen',
                onPress: async () => {
                  try {
                    console.log('🔄 Intentando enviar reporte sin imagen...');
                    const resultWithoutImage = await reportService.createReportWithoutImage({
                      ...reportData,
                      idUsuario: currentUser.idUsuario
                    });
                    
                    if (resultWithoutImage.success) {
                      Alert.alert(
                        '¡Éxito!',
                        '¡Reporte creado exitosamente! (sin imagen)',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Limpiar formulario
                              setFormData({ titulo: '', descripcion: '', ubicacion: '', categoria: 'general' });
                              setSelectedImage(null);
                              
                              // Navegar de vuelta
                              if (navigation.canGoBack()) {
                                navigation.goBack();
                              } else {
                                navigation.navigate('Reports');
                              }
                            }
                          }
                        ]
                      );
                    } else {
                      Alert.alert('Error', resultWithoutImage.error || 'No se pudo crear el reporte');
                    }
                  } catch (retryError) {
                    console.error('❌ Error en reintento sin imagen:', retryError);
                    Alert.alert('Error', 'No se pudo crear el reporte. Por favor, inténtalo de nuevo.');
                  } finally {
                    setIsSubmitting(false);
                    setIsUploadingImage(false);
                  }
                }
              }
            ]
          );
        } else {
          // Error general del reporte
          Alert.alert('Error', result.error || 'No se pudo crear el reporte');
        }
      }
    } catch (error) {
      console.error('❌ Error creando reporte:', error);
      Alert.alert('Error', 'No se pudo crear el reporte. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  // ✅ FUNCIÓN AUXILIAR PARA ENVIAR REPORTE SIN IMAGEN
  const sendReportWithoutImage = async (reportData) => {
    try {
      console.log('🔄 Intentando enviar reporte sin imagen...');
      const resultWithoutImage = await reportService.createReportWithoutImage({
        ...reportData,
        idUsuario: currentUser.idUsuario
      });
      
      if (resultWithoutImage.success) {
        Alert.alert(
          '¡Éxito!',
          '¡Reporte creado exitosamente! (sin imagen)',
          [
            {
              text: 'OK',
              onPress: () => {
                // Limpiar formulario
                setFormData({ titulo: '', descripcion: '', ubicacion: '', categoria: 'general' });
                setSelectedImage(null);
                
                // Navegar de vuelta
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Reports');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', resultWithoutImage.error || 'No se pudo crear el reporte');
      }
    } catch (retryError) {
      console.error('❌ Error en reintento sin imagen:', retryError);
      Alert.alert('Error', 'No se pudo crear el reporte. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  // ✅ FUNCIÓN PARA COMPRIMIR Y REINTENTAR IMAGEN
  const compressAndRetryImage = async () => {
    try {
      console.log('🔄 Comprimiendo imagen para reintentar...');
      
      // Comprimir imagen usando expo-image-manipulator
      const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
      
      const compressedImage = await manipulateAsync(
        selectedImage.uri,
        [{ resize: { width: 800 } }], // Reducir a 800px de ancho
        {
          compress: 0.7, // Comprimir al 70%
          format: SaveFormat.JPEG
        }
      );
      
      console.log('✅ Imagen comprimida:', {
        originalSize: selectedImage.width + 'x' + selectedImage.height,
        compressedSize: compressedImage.width + 'x' + compressedImage.height
      });
      
      // Actualizar imagen seleccionada con la comprimida
      setSelectedImage({
        ...compressedImage,
        type: 'image/jpeg',
        fileName: `compressed_${Date.now()}.jpg`
      });
      
      // Reintentar envío
      setTimeout(() => handleSubmit(), 1000);
      
    } catch (compressError) {
      console.error('❌ Error comprimiendo imagen:', compressError);
      Alert.alert(
        'Error de compresión',
        'No se pudo comprimir la imagen. ¿Quieres enviar el reporte sin imagen?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar sin imagen', onPress: () => sendReportWithoutImage(reportData) }
        ]
      );
    }
  };

  // Manejar selección de imagen
  const handleSelectImage = () => {
    const actionText = selectedImage ? 'Editar' : 'Seleccionar';
    
    Alert.alert(
      `${actionText} Imagen`,
      selectedImage ? '¿Qué quieres hacer con la imagen actual?' : 'Elige una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => openCamera() },
        { text: 'Galería', onPress: () => openGallery() },
        ...(selectedImage ? [{ 
          text: 'Eliminar Actual', 
          style: 'destructive',
          onPress: removeImage 
        }] : [])
      ]
    );
  };

  const openCamera = async () => {
    try {
      console.log('📸 Abriendo cámara...');
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📋 Estado del permiso de cámara:', permissionResult.status);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permiso Requerido', 
          'Se necesita permiso de cámara para tomar fotos. Por favor, habilítalo en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      console.log('✅ Permiso de cámara concedido, lanzando cámara...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reducir calidad para mejor compatibilidad
        base64: false, // No usar base64 para evitar problemas de memoria
        exif: false, // Deshabilitar EXIF para evitar problemas
      });

      console.log('📷 Resultado de la cámara:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('✅ Foto tomada:', asset.uri);
        
        // ✅ PROCESAR Y VALIDAR LA IMAGEN ANTES DE ASIGNARLA
        const processedImage = await processImageForUpload(asset);
        if (processedImage) {
          setSelectedImage(processedImage);
          const message = selectedImage ? 
            '¡Foto actualizada exitosamente! La imagen anterior ha sido reemplazada.' : 
            '¡Foto capturada exitosamente!';
          Alert.alert('Éxito', message);
        }
      } else {
        console.log('❌ Cámara cancelada o falló');
      }
    } catch (error) {
      console.error('❌ Error abriendo cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara. Por favor, inténtalo de nuevo.');
    }
  };

  const openGallery = async () => {
    try {
      console.log('🖼️ Abriendo galería...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📋 Estado del permiso:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido', 
          'Se necesita permiso de galería para seleccionar imágenes. Por favor, habilítalo en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      console.log('✅ Permiso concedido, lanzando galería...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reducir calidad para mejor compatibilidad
        allowsMultipleSelection: false,
        base64: false, // No usar base64 para evitar problemas de memoria
        exif: false, // Deshabilitar EXIF para evitar problemas
      });

      console.log('📷 Resultado de la galería:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('✅ Imagen seleccionada:', asset.uri);
        
        // ✅ PROCESAR Y VALIDAR LA IMAGEN ANTES DE ASIGNARLA
        const processedImage = await processImageForUpload(asset);
        if (processedImage) {
          setSelectedImage(processedImage);
          const message = selectedImage ? 
            '¡Imagen actualizada exitosamente! La imagen anterior ha sido reemplazada.' : 
            '¡Imagen seleccionada exitosamente!';
          Alert.alert('Éxito', message);
        }
      } else {
        console.log('❌ Selección de galería cancelada o falló');
      }
    } catch (error) {
      console.error('❌ Error abriendo galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería. Por favor, inténtalo de nuevo.');
    }
  };

  // ✅ NUEVA FUNCIÓN PARA PROCESAR IMÁGENES ANTES DE LA SUBIDA
  const processImageForUpload = async (asset) => {
    try {
      console.log('🔧 Procesando imagen para subida...');
      console.log('📷 Asset original:', asset);

      // ✅ VALIDAR QUE LA IMAGEN TENGA URI VÁLIDA
      if (!asset.uri) {
        console.error('❌ Asset no tiene URI válida');
        Alert.alert('Error', 'La imagen seleccionada no es válida. Por favor, selecciona otra imagen.');
        return null;
      }

      // ✅ DETERMINAR EL TIPO MIME CORRECTO - MÁS FLEXIBLE
      let mimeType = 'image/jpeg'; // Por defecto
      
      // Primero intentar usar el tipo del asset
      if (asset.type && asset.type.startsWith('image/')) {
        mimeType = asset.type;
        console.log('✅ Tipo MIME detectado del asset:', mimeType);
      } else {
        // Si no hay tipo válido, detectarlo desde la URI
        console.log('⚠️ Tipo MIME no válido, detectando desde URI...');
        
        if (asset.uri.includes('.jpg') || asset.uri.includes('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (asset.uri.includes('.png')) {
          mimeType = 'image/png';
        } else if (asset.uri.includes('.gif')) {
          mimeType = 'image/gif';
        } else if (asset.uri.includes('.webp')) {
          mimeType = 'image/webp';
        } else if (asset.uri.includes('.bmp')) {
          mimeType = 'image/bmp';
        } else {
          // Por defecto, asumir JPEG
          mimeType = 'image/jpeg';
          console.log('ℹ️ Tipo no detectado, usando JPEG por defecto');
        }
        
        console.log('✅ Tipo MIME detectado desde URI:', mimeType);
      }

      // ✅ COMPRIMIR IMAGEN SI ES NECESARIO
      let processedUri = asset.uri;
      let processedWidth = asset.width || 800;
      let processedHeight = asset.height || 600;
      let wasCompressed = false;

      try {
        console.log('🔧 Verificando si la imagen necesita compresión...');
        console.log('📏 Dimensiones actuales:', `${asset.width || 'desconocido'} x ${asset.height || 'desconocido'}`);
        
        // Comprimir imagen si es muy grande (más de 1200px en cualquier dimensión)
        if (asset.width > 1200 || asset.height > 1200) {
          console.log('🔧 Imagen muy grande, comprimiendo...');
          
          const resizeResult = await ImageResizer.createResizedImage(
            asset.uri,
            1200, // ancho máximo
            1200, // alto máximo
            'JPEG',
            80, // calidad
            0, // rotación
            undefined, // outputPath
            false, // keepMetadata
            { mode: 'contain' } // opciones
          );
          
          processedUri = resizeResult.uri;
          processedWidth = resizeResult.width;
          processedHeight = resizeResult.height;
          wasCompressed = true;
          
          console.log('✅ Imagen comprimida exitosamente:', {
            original: `${asset.width}x${asset.height}`,
            compressed: `${processedWidth}x${processedHeight}`,
            uri: processedUri
          });
        } else {
          console.log('✅ Imagen no necesita compresión (dimensiones aceptables)');
        }
      } catch (compressionError) {
        console.warn('⚠️ Error comprimiendo imagen, usando original:', compressionError.message);
        // Continuar con la imagen original si falla la compresión
        wasCompressed = false;
      }

      // ✅ GENERAR NOMBRE DE ARCHIVO ÚNICO
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = `report_${timestamp}_${randomId}.${extension}`;

      // ✅ CREAR OBJETO DE IMAGEN PROCESADO
      const processedImage = {
        uri: processedUri,
        type: mimeType,
        fileName: fileName,
        width: processedWidth,
        height: processedHeight,
        size: asset.fileSize || null,
        // ✅ AGREGAR PROPIEDADES ADICIONALES PARA MEJOR COMPATIBILIDAD
        name: fileName,
        lastModified: timestamp,
        // ✅ AGREGAR INFORMACIÓN DE COMPRESIÓN
        compressed: wasCompressed,
        originalSize: asset.width && asset.height ? `${asset.width}x${asset.height}` : null,
        // ✅ AGREGAR INFORMACIÓN ADICIONAL
        originalAsset: asset
      };

      console.log('✅ Imagen procesada exitosamente:', {
        fileName: processedImage.fileName,
        type: processedImage.type,
        dimensions: `${processedImage.width}x${processedImage.height}`,
        compressed: processedImage.compressed,
        originalSize: processedImage.originalSize
      });
      
      // ✅ MOSTRAR INFORMACIÓN AL USUARIO SOBRE LA COMPRESIÓN
      if (wasCompressed) {
        Alert.alert(
          'Imagen Comprimida',
          `La imagen se comprimió automáticamente para mejor compatibilidad:\n\n` +
          `📐 Original: ${processedImage.originalSize}\n` +
          `📏 Comprimida: ${processedImage.width} x ${processedImage.height} px\n` +
          `💾 Formato: ${processedImage.type.split('/')[1].toUpperCase()}`,
          [{ text: 'Entendido', style: 'default' }]
        );
      }
      
      // ✅ VALIDAR TAMAÑO DE ARCHIVO (si está disponible)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { // 5MB
        console.warn('⚠️ Imagen muy grande, considerando compresión...');
        Alert.alert(
          'Imagen muy grande',
          'La imagen seleccionada es muy grande. Se recomienda usar una imagen más pequeña para mejor compatibilidad.',
          [
            { text: 'Usar de todos modos', onPress: () => {} },
            { text: 'Seleccionar otra', style: 'cancel' }
          ]
        );
      }

      return processedImage;

    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen. Por favor, selecciona otra imagen.');
      return null;
    }
  };

  // ✅ FUNCIÓN PARA MOSTRAR INFORMACIÓN DETALLADA DE LA IMAGEN
  const showImageInfo = () => {
    if (!selectedImage) return;
    
    Alert.alert(
      'Información de la Imagen',
      `📷 Nombre: ${selectedImage.fileName}\n` +
      `📏 Tamaño: ${selectedImage.width} x ${selectedImage.height}\n` +
      `📁 Tipo: ${selectedImage.type}\n` +
      `🔧 Comprimida: ${selectedImage.compressed ? 'Sí' : 'No'}\n` +
      `${selectedImage.originalSize ? `📐 Original: ${selectedImage.originalSize}\n` : ''}` +
      `📅 Fecha: ${new Date(selectedImage.lastModified).toLocaleString()}`,
      [
        { text: 'Eliminar', style: 'destructive', onPress: removeImage },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // ✅ FUNCIÓN PARA COMPRIMIR IMAGEN MANUALMENTE
  const compressImageManually = async () => {
    if (!selectedImage) return;
    
    try {
      setIsCompressing(true);
      console.log('🔧 Comprimiendo imagen manualmente...');
      
      const resizeResult = await ImageResizer.createResizedImage(
        selectedImage.uri,
        800, // ancho máximo más pequeño
        800, // alto máximo más pequeño
        'JPEG',
        70, // calidad más baja
        0, // rotación
        undefined, // outputPath
        false, // keepMetadata
        { mode: 'contain' } // opciones
      );
      
      const compressedImage = {
        ...selectedImage,
        uri: resizeResult.uri,
        width: resizeResult.width,
        height: resizeResult.height,
        compressed: true,
        originalSize: `${selectedImage.width}x${selectedImage.height}`
      };
      
      setSelectedImage(compressedImage);
      console.log('✅ Imagen comprimida manualmente:', compressedImage);
      
      Alert.alert(
        'Imagen Comprimida', 
        'Imagen comprimida exitosamente para mejor compatibilidad.\n\n' +
        `📏 Nueva dimensión: ${compressedImage.width} x ${compressedImage.height} px\n` +
        '💾 Formato: JPEG optimizado',
        [{ text: 'Entendido', style: 'default' }]
      );
      
    } catch (error) {
      console.error('❌ Error comprimiendo imagen manualmente:', error);
      Alert.alert('Error', 'No se pudo comprimir la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            setSelectedImage(null);
            Alert.alert('Eliminada', 'Imagen eliminada exitosamente');
          }
        }
      ]
    );
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCategoryIcon = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category || categories[5]; // Default to general
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header mejorado con gradiente */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nuevo Reporte</Text>
          <Text style={styles.headerSubtitle}>Reporta un problema en tu comunidad</Text>
        </View>
        
        <TouchableOpacity
          style={styles.configButton}
          onPress={() => setShowServerConfig(true)}
        >
          <Ionicons name="settings" size={24} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Información del usuario actual */}
          {currentUser && (
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                {currentUser?.fotoPerfil ? (
                  <Image 
                    source={{ uri: currentUser.fotoPerfil }} 
                    style={styles.userAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userInfoText}>
                  Creando reporte como: {currentUser.nombre || 'Usuario'}
                </Text>
                <Text style={styles.userInfoSubtext}>
                  ID: {currentUser.idUsuario}
                </Text>
              </View>
            </View>
          )}

          {/* Input de Título */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Título</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <TextInput
              ref={titleRef}
              style={styles.textInput}
              placeholder="Título breve para tu reporte..."
              placeholderTextColor={colors.textMuted}
              value={formData.titulo}
              onChangeText={(text) => updateFormData('titulo', text)}
              maxLength={100}
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{formData.titulo.length}/100</Text>
            </View>
          </View>

          {/* Input de Descripción */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="list-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Descripción</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <TextInput
              ref={descriptionRef}
              style={[styles.textInput, styles.textArea]}
              placeholder="Descripción detallada del problema..."
              placeholderTextColor={colors.textMuted}
              value={formData.descripcion}
              onChangeText={(text) => updateFormData('descripcion', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
              returnKeyType="next"
              onSubmitEditing={() => locationRef.current?.focus()}
              blurOnSubmit={false}
              autoCorrect={true}
              autoCapitalize="sentences"
              textAlignVertical="top"
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{formData.descripcion.length}/500</Text>
            </View>
          </View>

          {/* Input de Ubicación */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Ubicación</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <TextInput
              ref={locationRef}
              style={styles.textInput}
              placeholder="Calle, colonia o punto de referencia..."
              placeholderTextColor={colors.textMuted}
              value={formData.ubicacion}
              onChangeText={(text) => updateFormData('ubicacion', text)}
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit={true}
              autoCorrect={false}
              autoCapitalize="words"
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{formData.ubicacion.length}/200</Text>
            </View>
          </View>

          {/* Selección de Categoría */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="apps-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Categoría</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.categoria === category.id && styles.categoryItemSelected
                  ]}
                  onPress={() => updateFormData('categoria', category.id)}
                >
                  <LinearGradient
                    colors={formData.categoria === category.id ? category.gradient : [colors.gray100, colors.gray200]}
                    style={styles.categoryIconGradient}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={24} 
                      color={formData.categoria === category.id ? colors.white : colors.textMuted} 
                    />
                  </LinearGradient>
                  <Text style={[
                    styles.categoryText,
                    formData.categoria === category.id && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selección de Imagen */}
          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.inputLabel}>Foto</Text>
              <Text style={styles.optionalMark}>(Opcional)</Text>
              {selectedImage && (
                <Text style={[styles.optionalMark, { color: colors.info, marginLeft: 8 }]}>
                  • Editable
                </Text>
              )}
            </View>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Ionicons name="close-circle" size={32} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                
                {/* Detalles de la imagen */}
                <View style={styles.imageDetails}>
                  <View style={styles.imageDetailItem}>
                    <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.imageDetailsText}>
                      {selectedImage.fileName || 'imagen.jpg'}
                    </Text>
                  </View>
                  {selectedImage.width && selectedImage.height && (
                    <View style={styles.imageDetailItem}>
                      <Ionicons name="resize-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.imageDetailsText}>
                        {selectedImage.width} x {selectedImage.height} px
                      </Text>
                    </View>
                  )}
                  {selectedImage.compressed && selectedImage.originalSize && (
                    <View style={styles.imageDetailItem}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.imageDetailsText}>
                        Comprimida desde {selectedImage.originalSize}
                      </Text>
                    </View>
                  )}
                  
                  {/* ✅ Mensaje informativo sobre edición */}
                  <View style={styles.imageDetailItem}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                    <Text style={[styles.imageDetailsText, { color: colors.info, fontStyle: 'italic' }]}>
                      Toca "Editar" para cambiar la imagen o "Info" para más detalles
                    </Text>
                  </View>
                </View>

                {/* ✅ NUEVOS BOTONES DE ACCIÓN */}
                <View style={styles.imageActionButtons}>
                  <TouchableOpacity
                    style={[styles.imageActionButton, styles.infoButton]}
                    onPress={showImageInfo}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                    <Text style={[styles.imageActionButtonText, styles.infoButtonText]}>Info</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageActionButton, styles.compressButton]}
                    onPress={compressImageManually}
                    disabled={isCompressing}
                  >
                    {isCompressing ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="resize-outline" size={16} color={colors.white} />
                        <Text style={[styles.imageActionButtonText, styles.compressButtonText]}>Comprimir</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.imageActionButton, styles.changeButton]}
                    onPress={handleSelectImage}
                  >
                    <Ionicons name="swap-horizontal-outline" size={16} color={colors.warning} />
                    <Text style={[styles.imageActionButtonText, styles.changeButtonText]}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImage}
              >
                <View style={styles.addImageIcon}>
                  <Ionicons name="camera-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.addImageText}>Agregar Foto</Text>
                <Text style={styles.addImageSubtext}>
                  Toca para seleccionar de la galería o tomar una foto
                </Text>
                <Text style={[styles.addImageSubtext, { fontSize: 12, marginTop: 8, color: colors.info }]}>
                  📝 Puedes cambiar la imagen en cualquier momento usando "Cambiar"
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? [colors.gray400, colors.gray500] : [colors.primary, colors.primaryLight]}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <View style={styles.submitContent}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.submitText}>
                    {isUploadingImage ? 'Subiendo imagen...' : 'Creando Reporte...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Ionicons name="send" size={20} color={colors.white} />
                  <Text style={styles.submitText}>
                    {selectedImage ? 'Crear Reporte con Imagen' : 'Crear Reporte'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Configuración del Servidor */}
      <ServerConfigModal
        visible={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        onConfigUpdate={handleConfigUpdate}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 44,
  },
  configButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Información del usuario mejorada
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  userInfoText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  userInfoSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Teclado y scroll
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Secciones de input mejoradas
  inputSection: {
    marginBottom: 28,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  requiredMark: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: 'bold',
  },
  optionalMark: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 54,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Categorías mejoradas
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.gray50,
  },
  categoryIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Selección de imagen mejorada
  imageContainer: {
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.gray200,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  imageDetails: {
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    width: '100%',
  },
  imageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  imageDetailsText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  addImageButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  addImageIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  addImageSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Botón de envío mejorado
  submitButton: {
    borderRadius: 16,
    marginTop: 24,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Nuevos estilos para botones de acción de imagen
  imageActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoButton: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.info,
    borderWidth: 1,
  },
  compressButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  changeButton: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.warning,
    borderWidth: 1,
  },
  imageActionButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoButtonText: {
    color: colors.info,
  },
  compressButtonText: {
    color: colors.white,
  },
  changeButtonText: {
    color: colors.warning,
  },
});