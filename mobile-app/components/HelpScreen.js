// screens/HelpScreen.js - Pantalla de Ayuda y Soporte
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
  Linking,
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
  cyan: '#06b6d4',
};

const HelpScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Preguntas frecuentes
  const faqData = [
    {
      id: 'create_report',
      question: '¿Cómo crear un reporte efectivo?',
      answer: 'Para crear un reporte efectivo: 1) Incluye fotos claras del problema, 2) Proporciona ubicación exacta, 3) Describe el problema detalladamente, 4) Selecciona la categoría correcta, 5) Indica el nivel de urgencia apropiado.',
    },
    {
      id: 'track_report',
      question: '¿Cómo puedo seguir el estado de mi reporte?',
      answer: 'Ve a la sección "Mis Reportes" en el menú principal. Ahí verás todos tus reportes con su estado actual: Nuevo, En Revisión, En Progreso, o Resuelto. Recibirás notificaciones cuando haya actualizaciones.',
    },
    {
      id: 'join_community',
      question: '¿Cómo me uno a una comunidad?',
      answer: 'Ve a la sección "Comunidades", busca comunidades de tu área de interés, y presiona "Unirse". Algunas comunidades pueden requerir aprobación del administrador.',
    },
    {
      id: 'response_time',
      question: '¿Cuánto tiempo tarda en resolverse un reporte?',
      answer: 'El tiempo de respuesta varía según la urgencia y tipo de problema. Emergencias: 24 horas, Problemas urgentes: 3-7 días, Mantenimiento general: 15-30 días. Te notificaremos sobre cualquier actualización.',
    },
    {
      id: 'edit_report',
      question: '¿Puedo editar mi reporte después de enviarlo?',
      answer: 'Puedes agregar comentarios y fotos adicionales, pero no puedes editar el contenido original. Si necesitas hacer cambios importantes, contacta al soporte.',
    },
    {
      id: 'private_info',
      question: '¿Mi información personal es privada?',
      answer: 'Sí, tu información personal está protegida. Solo tu nombre aparecerá públicamente en los reportes. Tu email, teléfono y otros datos personales son privados y solo visibles para los administradores cuando sea necesario.',
    },
    {
      id: 'notifications',
      question: '¿Cómo gestiono las notificaciones?',
      answer: 'Ve a Configuración > Notificaciones para personalizar qué tipos de notificaciones quieres recibir: actualizaciones de reportes, mensajes de comunidad, recordatorios, etc.',
    },
    {
      id: 'report_problem',
      question: '¿Qué tipos de problemas puedo reportar?',
      answer: 'Puedes reportar: infraestructura (baches, semáforos), servicios públicos (agua, electricidad), seguridad, medio ambiente, transporte público, y otros problemas que afecten a la comunidad.',
    },
  ];

  // Información de contacto
  const contactInfo = [
    {
      id: 'email',
      title: 'Email de Soporte',
      subtitle: 'soporte@reportesapp.com',
      icon: 'mail-outline',
      color: colors.primary,
      action: () => Linking.openURL('mailto:soporte@reportesapp.com?subject=Ayuda con ReportesApp'),
    },
    {
      id: 'phone',
      title: 'Teléfono de Soporte',
      subtitle: '+503 2XXX-XXXX',
      icon: 'call-outline',
      color: colors.success,
      action: () => Linking.openURL('tel:+50322000000'),
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Chat directo',
      icon: 'logo-whatsapp',
      color: colors.emerald,
      action: () => Linking.openURL('https://wa.me/50322000000?text=Hola,%20necesito%20ayuda%20con%20ReportesApp'),
    },
    {
      id: 'web',
      title: 'Centro de Ayuda Web',
      subtitle: 'ayuda.reportesapp.com',
      icon: 'globe-outline',
      color: colors.purple,
      action: () => Linking.openURL('https://ayuda.reportesapp.com'),
    },
  ];

  // Recursos útiles
  const resources = [
    {
      id: 'tips',
      title: 'Consejos y Mejores Prácticas',
      subtitle: 'Aprende a crear reportes más efectivos',
      icon: 'bulb-outline',
      color: colors.accent,
      action: () => navigation.navigate('Tips'),
    },
    {
      id: 'video_tutorials',
      title: 'Tutoriales en Video',
      subtitle: 'Guías paso a paso',
      icon: 'play-circle-outline',
      color: colors.danger,
      action: () => Alert.alert('Tutoriales', 'Los tutoriales en video estarán disponibles próximamente'),
    },
    {
      id: 'community_guidelines',
      title: 'Reglas de la Comunidad',
      subtitle: 'Normas para una convivencia positiva',
      icon: 'people-outline',
      color: colors.cyan,
      action: () => Alert.alert('Reglas de Comunidad', 'Sé respetuoso, mantén conversaciones constructivas, no compartas información falsa, respeta la privacidad de otros, y ayuda a mantener un ambiente positivo.'),
    },
    {
      id: 'feedback',
      title: 'Enviar Sugerencias',
      subtitle: 'Ayúdanos a mejorar la app',
      icon: 'chatbubble-outline',
      color: colors.orange,
      action: () => navigation.navigate('CreateReport'), // Podrías crear una pantalla específica para feedback
    },
  ];

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const renderFAQItem = (faq) => (
    <View key={faq.id} style={styles.faqContainer}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => toggleFAQ(faq.id)}
        activeOpacity={0.8}
      >
        <View style={styles.faqQuestion}>
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
        </View>
        <Ionicons
          name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      
      {expandedFAQ === faq.id && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );

  const renderContactCard = (contact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.contactCard}
      onPress={contact.action}
      activeOpacity={0.8}
    >
      <View style={[styles.contactIcon, { backgroundColor: contact.color }]}>
        <Ionicons name={contact.icon} size={24} color={colors.white} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{contact.title}</Text>
        <Text style={styles.contactSubtitle}>{contact.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderResourceCard = (resource) => (
    <TouchableOpacity
      key={resource.id}
      style={styles.resourceCard}
      onPress={resource.action}
      activeOpacity={0.8}
    >
      <View style={[styles.resourceIcon, { backgroundColor: resource.color }]}>
        <Ionicons name={resource.icon} size={20} color={colors.white} />
      </View>
      <View style={styles.resourceInfo}>
        <Text style={styles.resourceTitle}>{resource.title}</Text>
        <Text style={styles.resourceSubtitle}>{resource.subtitle}</Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => Alert.alert('Búsqueda', 'Función de búsqueda en ayuda próximamente disponible')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} />
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
              <Ionicons name="help-circle" size={48} color={colors.white} />
              <Text style={styles.heroTitle}>¿En qué podemos ayudarte?</Text>
              <Text style={styles.heroSubtitle}>
                Encuentra respuestas rápidas o contacta con nuestro equipo de soporte
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: '#eff6ff' }]}
            onPress={() => Alert.alert('Chat en Vivo', 'El chat en vivo estará disponible próximamente. Por ahora, contáctanos por WhatsApp o email.')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.white} />
            </View>
            <Text style={styles.quickActionTitle}>Chat en Vivo</Text>
            <Text style={styles.quickActionSubtitle}>Próximamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: '#ecfdf5' }]}
            onPress={() => Linking.openURL('mailto:soporte@reportesapp.com?subject=Problema Urgente - ReportesApp')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.emerald }]}>
              <Ionicons name="flash" size={24} color={colors.white} />
            </View>
            <Text style={styles.quickActionTitle}>Problema Urgente</Text>
            <Text style={styles.quickActionSubtitle}>Email directo</Text>
          </TouchableOpacity>
        </View>

        {/* Preguntas frecuentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤔 Preguntas Frecuentes</Text>
          <Text style={styles.sectionSubtitle}>
            Encuentra respuestas a las preguntas más comunes
          </Text>
          
          <View style={styles.faqList}>
            {faqData.map(renderFAQItem)}
          </View>
        </View>

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contáctanos</Text>
          <Text style={styles.sectionSubtitle}>
            Elige la forma que prefieras para contactarnos
          </Text>
          
          <View style={styles.contactList}>
            {contactInfo.map(renderContactCard)}
          </View>
        </View>

        {/* Recursos útiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Recursos Útiles</Text>
          <Text style={styles.sectionSubtitle}>
            Herramientas adicionales para aprovechar mejor la app
          </Text>
          
          <View style={styles.resourceGrid}>
            {resources.map(renderResourceCard)}
          </View>
        </View>

        {/* Información de la app */}
        <View style={styles.section}>
          <View style={styles.appInfoCard}>
            <Text style={styles.appInfoTitle}>📱 Información de la App</Text>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Versión:</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Última actualización:</Text>
              <Text style={styles.appInfoValue}>Enero 2025</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Plataforma:</Text>
              <Text style={styles.appInfoValue}>iOS / Android</Text>
            </View>
            
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => Alert.alert('Actualizaciones', 'La app está actualizada a la última versión')}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Buscar Actualizaciones</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No encuentras lo que buscas?
          </Text>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => Linking.openURL('mailto:soporte@reportesapp.com?subject=Consulta General - ReportesApp')}
            activeOpacity={0.8}
          >
            <Text style={styles.footerButtonText}>Contáctanos Directamente</Text>
          </TouchableOpacity>
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
  searchButton: {
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  faqList: {
    gap: 8,
  },
  faqContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    marginRight: 12,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundPrimary,
  },
  faqAnswerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  contactList: {
    gap: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    width: '48%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceInfo: {
    alignItems: 'center',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  resourceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  appInfoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  footerButton: {
    backgroundColor: colors.accent,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HelpScreen;