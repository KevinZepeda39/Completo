// screens/TipsScreen.js - Pantalla de Consejos para Reportes Efectivos
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  white: '#ffffff',
  backgroundPrimary: '#f8fafc',
  backgroundSecondary: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  orange: '#f97316',
  emerald: '#059669',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const TipsScreen = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  // Datos de consejos organizados por categorías
  const tipsData = [
    {
      id: 'basics',
      title: '📋 Fundamentos Básicos',
      icon: 'document-text-outline',
      color: colors.primary,
      bgColor: '#eff6ff',
      tips: [
        {
          title: 'Sé específico y claro',
          description: 'Describe el problema de forma detallada pero concisa. Incluye qué, dónde, cuándo y cómo.',
          example: 'Ejemplo: "Semáforo en Av. Principal esquina con Calle 5 no funciona desde hace 3 días"'
        },
        {
          title: 'Usa un título descriptivo',
          description: 'El título debe resumir el problema en pocas palabras.',
          example: 'Bueno: "Bache grande en Calle Libertad" | Malo: "Problema en la calle"'
        },
        {
          title: 'Selecciona la categoría correcta',
          description: 'Esto ayuda a que tu reporte llegue al departamento correcto más rápido.',
          example: 'Infraestructura, Servicios Públicos, Seguridad, Medio Ambiente, etc.'
        }
      ]
    },
    {
      id: 'photos',
      title: '📸 Fotografías Efectivas',
      icon: 'camera-outline',
      color: colors.accent,
      bgColor: '#fefbf3',
      tips: [
        {
          title: 'Toma fotos claras y bien iluminadas',
          description: 'Las fotos borrosas o muy oscuras no ayudan a entender el problema.',
          example: 'Usa la luz natural cuando sea posible, mantén el teléfono estable'
        },
        {
          title: 'Incluye contexto en las fotos',
          description: 'Muestra no solo el problema, sino también el área circundante.',
          example: 'Si es un bache, incluye la calle y referencias cercanas'
        },
        {
          title: 'Toma múltiples ángulos',
          description: 'Diferentes perspectivas ayudan a entender mejor la situación.',
          example: 'Vista general, primer plano, y ángulos que muestren el impacto'
        },
        {
          title: 'Evita incluir personas identificables',
          description: 'Respeta la privacidad de otros ciudadanos en tus fotos.',
          example: 'Enfócate en el problema, no en las personas'
        }
      ]
    },
    {
      id: 'location',
      title: '📍 Ubicación Precisa',
      icon: 'location-outline',
      color: colors.emerald,
      bgColor: '#ecfdf5',
      tips: [
        {
          title: 'Activa tu GPS',
          description: 'Permite que la app detecte automáticamente tu ubicación para mayor precisión.',
          example: 'Ve a Configuración > Privacidad > Servicios de ubicación'
        },
        {
          title: 'Incluye referencias claras',
          description: 'Menciona puntos de referencia conocidos cerca del problema.',
          example: '"Frente al Hospital Nacional" o "Entre la gasolinera Shell y el banco"'
        },
        {
          title: 'Usa números de direcciones',
          description: 'Si hay numeración visible, inclúyela en tu descripción.',
          example: '"Casa #123, Colonia Las Flores" o "Km 15 Carretera al Puerto"'
        }
      ]
    },
    {
      id: 'urgency',
      title: '🚨 Nivel de Urgencia',
      icon: 'alert-circle-outline',
      color: colors.danger,
      bgColor: '#fef2f2',
      tips: [
        {
          title: 'Emergencias inmediatas',
          description: 'Para peligros inminentes, llama primero a emergencias (911) y luego reporta.',
          example: 'Cables eléctricos caídos, inundaciones, accidentes graves'
        },
        {
          title: 'Problemas urgentes',
          description: 'Situaciones que requieren atención rápida pero no son emergencias.',
          example: 'Semáforos dañados, alcantarillas abiertas, alumbrado público'
        },
        {
          title: 'Mantenimiento general',
          description: 'Problemas importantes pero que no representan peligro inmediato.',
          example: 'Baches, grafitis, áreas verdes descuidadas'
        }
      ]
    },
    {
      id: 'followup',
      title: '🔄 Seguimiento',
      icon: 'refresh-outline',
      color: colors.purple,
      bgColor: '#f3f4f6',
      tips: [
        {
          title: 'Revisa el estado de tu reporte',
          description: 'Verifica periódicamente si hay actualizaciones en tu reporte.',
          example: 'Ve a "Mis Reportes" para ver el progreso'
        },
        {
          title: 'Proporciona información adicional',
          description: 'Si las autoridades solicitan más detalles, responde pronto.',
          example: 'Pueden pedir fotos adicionales o aclaraciones'
        },
        {
          title: 'Confirma cuando esté resuelto',
          description: 'Ayuda a cerrar el ciclo confirmando que el problema fue solucionado.',
          example: 'Marca como "Resuelto" cuando veas que se arregló'
        }
      ]
    },
    {
      id: 'community',
      title: '👥 Impacto Comunitario',
      icon: 'people-outline',
      color: colors.pink,
      bgColor: '#fdf2f8',
      tips: [
        {
          title: 'Describe cómo afecta a la comunidad',
          description: 'Explica cuántas personas se ven afectadas por el problema.',
          example: '"Afecta a 200 familias del sector" o "Ruta de transporte público"'
        },
        {
          title: 'Menciona riesgos para grupos vulnerables',
          description: 'Indica si afecta especialmente a niños, adultos mayores o personas con discapacidad.',
          example: '"Escalones dañados dificultan acceso a sillas de ruedas"'
        },
        {
          title: 'Sugiere soluciones viables',
          description: 'Si tienes ideas de cómo solucionar el problema, compártelas.',
          example: '"Se podría instalar una señal de tráfico temporal"'
        }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const renderTipCard = (tip, index) => (
    <View key={index} style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
      </View>
      <Text style={styles.tipDescription}>{tip.description}</Text>
      {tip.example && (
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleLabel}>💡 Ejemplo:</Text>
          <Text style={styles.exampleText}>{tip.example}</Text>
        </View>
      )}
    </View>
  );

  const renderSection = (section) => (
    <View key={section.id} style={styles.sectionContainer}>
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: section.bgColor }]}
        onPress={() => toggleSection(section.id)}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIcon, { backgroundColor: section.color }]}>
            <Ionicons name={section.icon} size={24} color={colors.white} />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <Ionicons
          name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expandedSection === section.id && (
        <View style={styles.sectionContent}>
          {section.tips.map((tip, index) => renderTipCard(tip, index))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundPrimary} />

      {/* Header personalizado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consejos y Mejores Prácticas</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => Alert.alert('Ayuda', 'Si tienes más preguntas, ve a la sección de Ayuda')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Ionicons name="bulb" size={48} color={colors.white} />
              <Text style={styles.heroTitle}>Crea Reportes Más Efectivos</Text>
              <Text style={styles.heroSubtitle}>
                Sigue estos consejos para que tus reportes tengan mayor impacto y se resuelvan más rápido
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Reportes con fotos se resuelven más rápido</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3x</Text>
            <Text style={styles.statLabel}>Más efectivos con ubicación precisa</Text>
          </View>
        </View>

        {/* Sections */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionsTitle}>📚 Guía Completa</Text>
          <Text style={styles.sectionsSubtitle}>
            Toca cada sección para ver los consejos detallados
          </Text>
          
          {tipsData.map(renderSection)}
        </View>

        {/* Call to action */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>🎯 ¿Listo para crear un reporte?</Text>
            <Text style={styles.ctaDescription}>
              Aplica estos consejos y haz un reporte que marque la diferencia en tu comunidad
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('CreateReport')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.accent, colors.orange]}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Crear Reporte Ahora</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  helpButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroGradient: {
    padding: 32,
  },
  heroContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tipCard: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  exampleContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  ctaCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginRight: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TipsScreen;