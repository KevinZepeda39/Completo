// components/reports/ImageTestComponent.js - Componente de testing para imágenes
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ DEFINIR COLORES ANTES DE LOS ESTILOS
const colors = {
  primary: '#1e40af',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  gray: '#6b7280',
  white: '#ffffff',
  background: '#f8fafc'
};

const ImageTestComponent = ({ onClose }) => {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [customImagePath, setCustomImagePath] = useState('');
  const [testImageUrl, setTestImageUrl] = useState('');

  // ✅ Función para construir URL de imagen (COPIA EXACTA de ReportDetailScreen)
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return null;
    }
    
    try {
      console.log('🔍 [TEST] Procesando ruta de imagen:', imagePath);
      
      // Si ya es una URL completa, usarla directamente
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('🖼️ [TEST] URL completa detectada:', imagePath);
        return imagePath;
      }
      
      // Verificar que la ruta sea válida
      if (!imagePath.startsWith('/')) {
        console.log('⚠️ [TEST] Ruta de imagen no válida, agregando /:', imagePath);
        imagePath = '/' + imagePath;
      }
      
      // Fallback: usar IP hardcodeada
      const serverIP = '192.168.1.13:3000';
      const fullUrl = `http://${serverIP}${imagePath}`;
      console.log('🖼️ [TEST] URL construida:', fullUrl);
      return fullUrl;
      
    } catch (error) {
      console.error('❌ [TEST] Error construyendo URL de imagen:', error);
      return null;
    }
  };

  // ✅ Función para probar una imagen específica
  const testSpecificImage = async (imagePath) => {
    const testId = Date.now();
    const result = {
      id: testId,
      imagePath,
      status: 'testing',
      message: 'Probando imagen...',
      url: null,
      error: null,
      loadTime: null,
      success: false
    };

    setTestResults(prev => [...prev, result]);

    try {
      const startTime = Date.now();
      const url = getImageUrl(imagePath);
      
      if (!url) {
        throw new Error('No se pudo construir URL válida');
      }

      result.url = url;
      result.status = 'loading';
      setTestResults(prev => prev.map(r => r.id === testId ? result : r));

      // ✅ CREAR UNA PROMESA CON TIMEOUT PARA LA IMAGEN
      const imagePromise = new Promise((resolve, reject) => {
        // En React Native, usar Image.resolveAssetSource o fetch
        fetch(url)
          .then(response => {
            if (response.ok) {
              resolve();
            } else {
              reject(new Error(`HTTP ${response.status}`));
            }
          })
          .catch(error => reject(error));
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de 10 segundos')), 10000);
      });

      await Promise.race([imagePromise, timeoutPromise]);
      
      const loadTime = Date.now() - startTime;
      result.status = 'success';
      result.message = `✅ Imagen cargada exitosamente en ${loadTime}ms`;
      result.loadTime = loadTime;
      result.success = true;

    } catch (error) {
      result.status = 'error';
      result.message = `❌ Error: ${error.message}`;
      result.error = error.message;
      result.success = false;
    }

    setTestResults(prev => prev.map(r => r.id === testId ? result : r));
  };

  // ✅ Función para ejecutar todas las pruebas
  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([]);

    const testImages = [
      '/uploads/reportes/reporte-1756678113750-275502244.jpeg',
      'uploads/reportes/reporte-1756678113750-275502244.jpeg',
      'reporte-1756678113750-275502244.jpeg',
      '/uploads/test-image.jpg',
      'uploads/test-image.jpg',
      'test-image.jpg'
    ];

    for (const imagePath of testImages) {
      await testSpecificImage(imagePath);
      // Pequeña pausa entre pruebas
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsTesting(false);
  };

  // ✅ Función para probar imagen personalizada
  const testCustomImage = () => {
    if (!customImagePath.trim()) {
      Alert.alert('Error', 'Por favor ingresa una ruta de imagen');
      return;
    }
    testSpecificImage(customImagePath.trim());
  };

  // ✅ Función para limpiar resultados
  const clearResults = () => {
    setTestResults([]);
  };

  // ✅ Función para copiar URL al portapapeles
  const copyToClipboard = (text) => {
    // En React Native, podrías usar Clipboard API
    Alert.alert('Copiado', `URL copiada: ${text}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧪 Testing de Imágenes</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Panel de control */}
        <View style={styles.controlPanel}>
          <TouchableOpacity 
            style={[styles.testButton, isTesting && styles.testButtonDisabled]}
            onPress={runAllTests}
            disabled={isTesting}
          >
            <Ionicons name="play" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isTesting ? 'Probando...' : 'Ejecutar Todas las Pruebas'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Ionicons name="trash" size={20} color={colors.white} />
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {/* Prueba personalizada */}
        <View style={styles.customTestSection}>
          <Text style={styles.sectionTitle}>🔍 Prueba Personalizada</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ingresa ruta de imagen (ej: uploads/reportes/imagen.jpg)"
              value={customImagePath}
              onChangeText={setCustomImagePath}
              placeholderTextColor={colors.gray}
            />
            <TouchableOpacity 
              style={styles.customTestButton}
              onPress={testCustomImage}
            >
              <Text style={styles.customTestButtonText}>Probar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultados de las pruebas */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Resultados de las Pruebas</Text>
          
          {testResults.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="information-circle" size={48} color={colors.gray} />
              <Text style={styles.noResultsText}>No hay resultados de pruebas</Text>
              <Text style={styles.noResultsSubtext}>Ejecuta las pruebas para ver los resultados</Text>
            </View>
          ) : (
            testResults.map((result) => (
              <View key={result.id} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultStatus}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: result.success ? colors.success : colors.danger }
                    ]} />
                    <Text style={styles.resultStatusText}>
                      {result.success ? 'ÉXITO' : 'ERROR'}
                    </Text>
                  </View>
                  {result.loadTime && (
                    <Text style={styles.loadTimeText}>{result.loadTime}ms</Text>
                  )}
                </View>

                <Text style={styles.resultPath}>{result.imagePath}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>
                
                {result.url && (
                  <View style={styles.urlContainer}>
                    <Text style={styles.urlLabel}>URL construida:</Text>
                    <TouchableOpacity 
                      style={styles.urlText}
                      onPress={() => copyToClipboard(result.url)}
                    >
                      <Text style={styles.urlTextContent}>{result.url}</Text>
                      <Ionicons name="copy" size={16} color={colors.info} />
                    </TouchableOpacity>
                  </View>
                )}

                {result.error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorLabel}>Error detallado:</Text>
                    <Text style={styles.errorText}>{result.error}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Información del servidor */}
        <View style={styles.serverInfoSection}>
          <Text style={styles.sectionTitle}>🌐 Información del Servidor</Text>
          <View style={styles.serverInfo}>
            <Text style={styles.serverInfoText}>
              <Text style={styles.serverInfoLabel}>IP del Servidor:</Text> 192.168.1.13:3000
            </Text>
            <Text style={styles.serverInfoText}>
              <Text style={styles.serverInfoLabel}>Carpeta Compartida:</Text> C:\ImagenesCompartidas\uploads\reportes\
            </Text>
            <Text style={styles.serverInfoText}>
              <Text style={styles.serverInfoLabel}>Estado:</Text> {isTesting ? '🔄 Probando...' : '✅ Listo'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ✅ ESTILOS DESPUÉS DE DEFINIR COLORES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  controlPanel: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  testButton: {
    flex: 1,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButtonDisabled: {
    backgroundColor: colors.gray,
  },
  testButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  customTestSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.primary,
  },
  customTestButton: {
    backgroundColor: colors.info,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  customTestButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 12,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  resultItem: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  loadTimeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  resultPath: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  urlContainer: {
    marginBottom: 8,
  },
  urlLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4,
  },
  urlText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 6,
  },
  urlTextContent: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorLabel: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  serverInfoSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serverInfo: {
    gap: 8,
  },
  serverInfoText: {
    fontSize: 14,
    color: colors.primary,
  },
  serverInfoLabel: {
    fontWeight: '600',
  },
});

export default ImageTestComponent;
