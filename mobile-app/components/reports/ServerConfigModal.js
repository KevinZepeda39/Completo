// components/reports/ServerConfigModal.js - Modal de configuración del servidor
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import serverConfig from '../../services/serverConfig';
import ipDetector from '../../services/ipDetector';

const ServerConfigModal = ({ visible, onClose, onConfigUpdate }) => {
  const [serverURL, setServerURL] = useState('');
  const [autoDetect, setAutoDetect] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    try {
      const config = await serverConfig.getFullConfig();
      setCurrentConfig(config);
      setServerURL(config.baseURL);
      setAutoDetect(config.autoDetect);
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }
  };

  const testConnection = async () => {
    if (!serverURL.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    setIsLoading(true);
    try {
      const cleanURL = serverURL.replace('http://', '').replace('https://', '');
      const isReachable = await ipDetector.testConnection(cleanURL);
      
      if (isReachable) {
        Alert.alert('✅ Conexión Exitosa', 'El servidor está accesible');
      } else {
        Alert.alert('❌ Conexión Fallida', 'No se pudo conectar al servidor');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error probando conexión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!serverURL.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    if (!serverConfig.isValidURL(serverURL)) {
      Alert.alert('Error', 'Por favor ingresa una URL válida (ej: http://192.168.1.13:3000)');
      return;
    }

    setIsLoading(true);
    try {
      if (autoDetect) {
        await serverConfig.enableAutoDetect();
        Alert.alert('✅ Configuración Guardada', 'Detección automática activada');
      } else {
        await serverConfig.updateServerURL(serverURL);
        Alert.alert('✅ Configuración Guardada', `Servidor configurado en: ${serverURL}`);
      }
      
      onConfigUpdate();
      onClose();
    } catch (error) {
      Alert.alert('❌ Error', `Error guardando configuración: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = async () => {
    Alert.alert(
      'Resetear Configuración',
      '¿Estás seguro de que quieres resetear a la configuración por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            try {
              await serverConfig.resetToDefault();
              await loadCurrentConfig();
              Alert.alert('✅ Reset Completado', 'Configuración reseteada a valores por defecto');
            } catch (error) {
              Alert.alert('❌ Error', `Error reseteando configuración: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const detectAutomatically = async () => {
    setIsLoading(true);
    try {
      const detectedIP = await ipDetector.detectServerIP();
      if (detectedIP) {
        setServerURL(`http://${detectedIP}`);
        setAutoDetect(true);
        Alert.alert('✅ IP Detectada', `Servidor encontrado en: ${detectedIP}`);
      } else {
        Alert.alert('❌ No Detectado', 'No se pudo detectar automáticamente el servidor');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Error en detección automática: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Configuración del Servidor</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>URL del Servidor</Text>
              <TextInput
                style={styles.input}
                value={serverURL}
                onChangeText={setServerURL}
                placeholder="http://192.168.1.13:3000"
                placeholderTextColor="#999"
                editable={!autoDetect}
              />
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAutoDetect(!autoDetect)}
              >
                <Ionicons
                  name={autoDetect ? "checkbox" : "square-outline"}
                  size={24}
                  color={autoDetect ? "#007AFF" : "#666"}
                />
                <Text style={styles.checkboxText}>Detección automática de IP</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones</Text>
              
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={testConnection}
                disabled={isLoading}
              >
                <Ionicons name="wifi" size={20} color="white" />
                <Text style={styles.buttonText}>Probar Conexión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={detectAutomatically}
                disabled={isLoading}
              >
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.buttonText}>Detectar Automáticamente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={saveConfig}
                disabled={isLoading}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={styles.buttonText}>Guardar Configuración</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={resetToDefault}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Resetear a Default</Text>
              </TouchableOpacity>
            </View>

            {currentConfig && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuración Actual</Text>
                <Text style={styles.configText}>URL: {currentConfig.baseURL}</Text>
                <Text style={styles.configText}>Auto-detect: {currentConfig.autoDetect ? 'Sí' : 'No'}</Text>
                <Text style={styles.configText}>Timeout: {currentConfig.timeout}ms</Text>
                <Text style={styles.configText}>Reintentos: {currentConfig.retryAttempts}</Text>
              </View>
            )}
          </ScrollView>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Procesando...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  successButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ServerConfigModal;
