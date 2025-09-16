// components/reports/CreateReportScreen.js - Diseño Mejorado
import React, { useState } from 'react';
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
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../hooks/useAuth';

// Paleta de colores mejorada
const colors = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#f093fb',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  text: '#2d3748',
  textSecondary: '#718096',
  border: '#e2e8f0',
  borderFocus: '#667eea',
  success: '#48bb78',
  error: '#f56565',
  warning: '#ed8936',
  info: '#4299e1',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const CreateReportScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Ubicación',
          'Necesitamos acceso a tu ubicación para llenar automáticamente el campo de ubicación.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurar', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return;
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      // Obtener dirección a partir de las coordenadas
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = `${address.street || ''} ${address.streetNumber || ''}, ${address.district || address.subregion || ''}, ${address.city || address.region || ''}`.trim();
        
        setFormData(prev => ({ ...prev, location: locationString }));
        
        Alert.alert(
          'Ubicación Obtenida',
          'Tu ubicación actual ha sido agregada al reporte.',
          [{ text: 'OK' }]
        );
      } else {
        // Si no se puede obtener la dirección, usar coordenadas
        const coordinatesString = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        setFormData(prev => ({ ...prev, location: coordinatesString }));
        
        Alert.alert(
          'Ubicación Obtenida',
          'Se han agregado las coordenadas de tu ubicación actual.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      
      let errorMessage = 'No se pudo obtener tu ubicación.';
      
      if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMessage = 'Los servicios de ubicación están deshabilitados. Por favor, actívalos en la configuración.';
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Se agotó el tiempo de espera al obtener la ubicación. Inténtalo de nuevo.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'La ubicación no está disponible en este momento.';
      }
      
      Alert.alert('Error de Ubicación', errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Se necesita acceso a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          fileName: `reporte_${Date.now()}.jpg`
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Se necesita acceso a la cámara.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          fileName: `reporte_${Date.now()}.jpg`
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      [
        { 
          text: 'Galería', 
          onPress: pickImage,
          style: 'default'
        },
        { 
          text: 'Cámara', 
          onPress: takePhoto,
          style: 'default'
        },
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        }
      ]
    );
  };

  const removeImage = () => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setSelectedImage(null) }
      ]
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        image: selectedImage
      };

      const result = await reportService.createReport(reportData);

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Tu reporte ha sido enviado exitosamente!',
          [
            {
              text: 'Ver Reportes',
              onPress: () => {
                navigation.navigate('Reports');
              }
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el reporte');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.description.trim() && formData.location.trim();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header simple */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        </View>
        
        <View style={styles.headerIcon}>
          <Ionicons name="document-text-outline" size={24} color="#333" />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Formulario principal */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="edit-outline" size={20} color={colors.primary} />
              <Text style={styles.cardHeaderText}>Detalles del reporte</Text>
            </View>

            {/* Campo Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Título del reporte <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity 
                style={[
                  styles.inputWrapper,
                  focusedField === 'title' && styles.inputWrapperFocused
                ]}
                activeOpacity={1}
                onPress={() => {
                  setFocusedField('title');
                  // Focus the input programmatically if needed
                }}
              >
                <Ionicons 
                  name="text-outline" 
                  size={20} 
                  color={focusedField === 'title' ? colors.primary : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => handleInputChange('title', text)}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ej: Alcantarilla tapada en mi barrio"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={100}
                  editable={!isSubmitting}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </TouchableOpacity>
              <Text style={styles.characterCount}>{formData.title.length}/100</Text>
            </View>

            {/* Campo Descripción */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Descripción <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity 
                style={[
                  styles.inputWrapper,
                  styles.textAreaWrapper,
                  focusedField === 'description' && styles.inputWrapperFocused
                ]}
                activeOpacity={1}
                onPress={() => {
                  setFocusedField('description');
                  // Focus the input programmatically if needed
                }}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={focusedField === 'description' ? colors.primary : colors.textSecondary}
                  style={[styles.inputIcon, styles.textAreaIcon]}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Describe detalladamente el problema, ubicación específica y cualquier detalle relevante..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                  editable={!isSubmitting}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </TouchableOpacity>
              <Text style={styles.characterCount}>{formData.description.length}/500</Text>
            </View>

            {/* Campo Ubicación */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Ubicación <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.locationInputContainer}>
                <TouchableOpacity 
                  style={[
                    styles.inputWrapper,
                    focusedField === 'location' && styles.inputWrapperFocused
                  ]}
                  activeOpacity={1}
                  onPress={() => {
                    setFocusedField('location');
                  }}
                >
                  <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={focusedField === 'location' ? colors.primary : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={(text) => handleInputChange('location', text)}
                    onFocus={() => setFocusedField('location')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ingresa la ubicación del problema o usa tu ubicación actual"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={200}
                    editable={!isSubmitting}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    isGettingLocation && styles.locationButtonDisabled
                  ]}
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation || isSubmitting}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="locate" size={20} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.locationHelpText}>
                💡 Toca el botón de ubicación para usar tu posición actual
              </Text>
            </View>

            {/* Campo Imagen */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Fotografía <Text style={styles.optional}>(opcional)</Text>
              </Text>
              
              {selectedImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                  <View style={styles.imageOverlay}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    <Text style={styles.imageSuccessText}>Imagen agregada</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={showImageOptions}
                  disabled={isSubmitting}
                >
                  <View style={styles.imagePickerContent}>
                    <Ionicons name="camera-outline" size={40} color={colors.primary} />
                    <Text style={styles.imagePickerText}>Agregar fotografía</Text>
                    <Text style={styles.imagePickerSubtext}>
                      Una imagen ayuda a entender mejor el problema
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Tarjeta de información */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Información importante</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                • Tu reporte será revisado por las autoridades competentes
              </Text>
              <Text style={styles.infoText}>
                • Tu identidad se mantendrá completamente confidencial
              </Text>
              <Text style={styles.infoText}>
                • Recibirás actualizaciones sobre el estado de tu reporte
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Botón de envío flotante */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled,
              isSubmitting && styles.submitButtonLoading
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            <LinearGradient
              colors={
                !isFormValid || isSubmitting
                  ? ['#a0a0a0', '#808080']
                  : [colors.primary, colors.primaryDark]
              }
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                </View>
              ) : (
                <View style={styles.submitContent}>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviar Reporte</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerIcon: {
    padding: 8,
  },
  
  // Scroll styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Form card styles
  formCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  
  // Input styles
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  optional: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  inputWrapperFocused: {
    borderColor: colors.borderFocus,
    elevation: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    minHeight: 140,
  },
  inputIcon: {
    marginRight: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    minHeight: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 22,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  
  // Image styles
  imageContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 240,
    backgroundColor: colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: 2,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(72, 187, 120, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  imageSuccessText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    marginTop: 8,
  },
  imagePickerContent: {
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  imagePickerSubtext: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Info card styles
  infoCard: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  infoContent: {
    marginLeft: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  submitButtonLoading: {
    elevation: 1,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Estilos para el campo de ubicación
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  locationButtonDisabled: {
    backgroundColor: colors.textSecondary,
    elevation: 0,
  },
  locationHelpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CreateReportScreen;