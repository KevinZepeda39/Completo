// components/CommunityInfoScreen.js - Pantalla de información de comunidad estilo WhatsApp
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import communityService from '../services/communityService';
import CommunityDeleteModal from './CommunityDeleteModal';
import CommunityDeletedModal from './CommunityDeletedModal';
import SuccessModal from './SuccessModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CommunityInfoScreen = ({ route, navigation }) => {
  const { community } = route.params;
  
  const [communityInfo, setCommunityInfo] = useState(community);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  // 🆕 Estados para editar comunidad
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [newName, setNewName] = useState(community.name || '');
  const [newDescription, setNewDescription] = useState(community.description || '');
  const [newCategory, setNewCategory] = useState(community.categoria || '');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [expulsionAlertShown, setExpulsionAlertShown] = useState(false);

  // 🗑️ ESTADO PARA MODAL DE ELIMINACIÓN
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🚫 ESTADO PARA MODAL DE COMUNIDAD ELIMINADA/EXPULSADA
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deletedCommunityInfo, setDeletedCommunityInfo] = useState(null);

  // ✅ ESTADO PARA MODAL DE ÉXITO GENERAL
  const [showGeneralSuccessModal, setShowGeneralSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // 🆕 VERIFICAR INMEDIATAMENTE SI EL USUARIO FUE EXPULSADO
        console.log('🔍 Verificando expulsión al cargar pantalla de información...');
        const wasExpelled = await checkIfUserWasExpelled();
        if (wasExpelled) {
          console.log('🚫 Usuario expulsado detectado al cargar pantalla - Redirigiendo inmediatamente...');
          // 🆕 REDIRIGIR INMEDIATAMENTE SIN MOSTRAR LA PANTALLA
          navigation.reset({
            index: 0,
            routes: [{ name: 'Communities' }],
          });
          return; // Salir sin cargar más datos
        }
        
        // Cargar información de la comunidad
        loadCommunityInfo();
        loadCategories();
      } catch (error) {
        console.error('❌ Error inicializando pantalla de información:', error);
      }
    };

    initializeScreen();
    
    // 🆕 Verificar periódicamente si el usuario fue expulsado
    const checkExpulsionInterval = setInterval(async () => {
      // 🆕 Solo verificar si no se ha mostrado la alerta
      if (!expulsionAlertShown) {
        await checkIfUserWasExpelled();
      }
    }, 5000); // Verificar cada 5 segundos
    
    return () => {
      clearInterval(checkExpulsionInterval);
    };
  }, [expulsionAlertShown]); // 🆕 Agregar dependencia

  const loadCommunityInfo = async () => {
    try {
      console.log('🔄 loadCommunityInfo: Iniciando carga de información...');
      setLoading(true);
      
      // Cargar información detallada de la comunidad
      console.log('🔍 Obteniendo detalles de la comunidad...');
      const details = await communityService.getCommunityDetails(community.id);
      if (details) {
        console.log('✅ Detalles obtenidos:', details);
        setCommunityInfo(details);
      } else {
        console.warn('⚠️ No se obtuvieron detalles de la comunidad');
      }
      
      // Cargar miembros de la comunidad
      console.log('👥 Cargando miembros de la comunidad...');
      await loadCommunityMembers();
      
      console.log('✅ loadCommunityInfo: Carga completada');
      
    } catch (error) {
      console.error('❌ Error cargando información de comunidad:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🔍 Cargando categorías disponibles...');
      const availableCategories = await communityService.getCategories();
      setCategories(availableCategories);
      console.log(`✅ ${availableCategories.length} categorías cargadas`);
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      // Usar categorías por defecto
      setCategories([
        'General',
        'Seguridad Ciudadana',
        'Medio Ambiente',
        'Educación',
        'Salud',
        'Transporte',
        'Cultura',
        'Deportes',
        'Tecnología',
        'Negocios',
        'Turismo',
        'Servicios Públicos',
        'Eventos',
        'Voluntariado',
        'Otros'
      ]);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Verificar si el usuario actual fue expulsado
  const checkIfUserWasExpelled = async () => {
    try {
      // 🆕 Si ya se mostró la alerta, no verificar más
      if (expulsionAlertShown) {
        console.log('🔇 Alerta ya mostrada, no verificar más');
        return true;
      }
      
      console.log('🔍 Verificando si el usuario fue expulsado...');
      
      const expulsionStatus = await communityService.checkIfUserWasExpelled(community.id);
      
      if (expulsionStatus.wasExpelled) {
        console.log(`🚫 Usuario fue expulsado/eliminado de "${expulsionStatus.communityName}"`);
        
        // 🆕 Marcar que la alerta ya se mostró INMEDIATAMENTE
        setExpulsionAlertShown(true);
        
        // Determinar la razón para el modal
        const isCommunityDeleted = expulsionStatus.reason === 'Comunidad eliminada por el administrador';
        const reason = isCommunityDeleted ? 'deleted' : 'expelled';
        
        // Mostrar modal bonito en lugar del Alert
        handleShowDeletedModal(expulsionStatus.communityName, reason);
        
        return true;
      }
      
      return false;
    } catch (error) {
      // Solo mostrar error en consola si no es relacionado con expulsión/eliminación
      if (!error.message.includes('Comunidad no encontrada') && 
          !error.message.includes('404') && 
          !error.message.includes('403') && 
          !error.message.includes('No autorizado')) {
        console.error('❌ Error verificando expulsión:', error);
      }
      return false;
    }
  };

  const loadCommunityMembers = async () => {
    try {
      console.log('🔄 loadCommunityMembers: Obteniendo miembros...');
      
      // Usar el servicio real para obtener miembros
      const realMembers = await communityService.getCommunityMembers(community.id);
      
      if (realMembers && realMembers.length > 0) {
        console.log(`✅ ${realMembers.length} miembros obtenidos del backend:`, realMembers);
        setMembers(realMembers);
      } else {
        console.warn('⚠️ No se obtuvieron miembros del backend, usando datos simulados');
        
        // Fallback con datos simulados si no hay miembros
        const mockMembers = [
          {
            id: communityInfo.creadorId || 1,
            name: communityInfo.creadorNombre || 'Usuario',
            role: 'Admin del grupo',
            status: 'En línea',
            isAdmin: true,
            isCreator: communityInfo.isCreator || false,
          }
        ];
        
        // Agregar miembros adicionales si existen
        if (communityInfo.memberCount > 1) {
          for (let i = 2; i <= Math.min(communityInfo.memberCount, 10); i++) {
            mockMembers.push({
              id: i,
              name: `Miembro ${i}`,
              role: 'Miembro',
              status: 'Última vez hace 2h',
              isAdmin: false,
              isCreator: false,
            });
          }
        }
        
        setMembers(mockMembers);
        console.log(`⚠️ Datos simulados configurados: ${mockMembers.length} miembros`);
      }
    } catch (error) {
      console.error('❌ Error cargando miembros:', error);
      
      // En caso de error, usar datos básicos
      const fallbackMembers = [
        {
          id: communityInfo.creadorId || 1,
          name: communityInfo.creadorNombre || 'Usuario',
          role: 'Admin del grupo',
          status: 'En línea',
          isAdmin: true,
          isCreator: communityInfo.isCreator || false,
        }
      ];
      setMembers(fallbackMembers);
      console.log('⚠️ Usando datos de respaldo debido al error');
    }
  };

  const handleLeaveCommunity = () => {
    if (communityInfo.isCreator) {
      Alert.alert(
        'No puedes salir',
        'Eres el creador de esta comunidad. No puedes abandonarla.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Salir de la comunidad',
      `¿Estás seguro de que quieres salir de "${communityInfo.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              const result = await communityService.toggleMembership('leave', communityInfo.id);
              
              Alert.alert(
                'Has salido',
                'Has salido de la comunidad exitosamente',
                [
                                      {
                      text: 'OK',
                      onPress: () => {
                        // Navegar a la pantalla de todas las comunidades
                        // después de salir de la comunidad
                        navigation.navigate('Communities');
                      }
                    }
                ]
              );
            } catch (error) {
              console.error('Error al salir:', error);
              Alert.alert('Error', 'No se pudo salir de la comunidad');
            } finally {
              setLeaving(false);
            }
          }
        }
      ]
    );
  };

  // 🆕 NUEVA FUNCIÓN: Expulsar usuario de la comunidad
  const handleExpelUser = async (member) => {
    if (!communityInfo.isCreator) {
      Alert.alert('Error', 'Solo el creador puede expulsar usuarios');
      return;
    }

    Alert.alert(
      '🚫 Expulsar Usuario',
      `¿Estás seguro de que quieres expulsar a "${member.name}" de la comunidad?\n\n⚠️ Esta acción es irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🚫 Expulsando usuario ${member.name} (ID: ${member.id}) de comunidad ${community.id}...`);
              
              await communityService.expelUserFromCommunity(community.id, member.id);
              
              console.log(`✅ Usuario ${member.name} expulsado exitosamente`);
              
              showGeneralSuccess('✅ Éxito', `${member.name} ha sido expulsado de la comunidad`, 'person-remove', '#F59E0B');
              
              // 🆕 RECARGAR INFORMACIÓN COMPLETA DE LA COMUNIDAD
              console.log('🔄 Recargando información de la comunidad...');
              await loadCommunityInfo();
              
              console.log('✅ Información de la comunidad recargada');
              
            } catch (error) {
              console.error('❌ Error expulsando usuario:', error);
              Alert.alert('Error', error.message || 'No se pudo expulsar al usuario');
            }
          }
        }
      ]
    );
  };

  // 🆕 NUEVA FUNCIÓN: Editar nombre de la comunidad
  const handleEditName = () => {
    if (!communityInfo.isCreator) {
      Alert.alert('Error', 'Solo el creador puede editar el nombre de la comunidad');
      return;
    }
    setEditingName(true);
    setNewName(communityInfo.name || '');
  };

  // 🆕 NUEVA FUNCIÓN: Guardar nombre de la comunidad
  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      setSaving(true);
      console.log(`✏️ Guardando nuevo nombre: "${newName.trim()}" para comunidad ${community.id}`);
      
      // 🆕 LLAMADA REAL AL BACKEND
      const result = await communityService.updateCommunity(community.id, {
        name: newName.trim()
      });
      
      if (result.success) {
        // Actualizar el estado local con los datos del backend
        setCommunityInfo(prev => ({ ...prev, name: newName.trim() }));
        setEditingName(false);
        showGeneralSuccess('✅ Éxito', 'Nombre de la comunidad actualizado en la base de datos', 'create', '#10B981');
        console.log('✅ Nombre actualizado exitosamente en el backend');
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error actualizando nombre:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar el nombre');
    } finally {
      setSaving(false);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Cancelar edición de nombre
  const handleCancelName = () => {
    setEditingName(false);
    setNewName(communityInfo.name || '');
  };

  // 🆕 NUEVA FUNCIÓN: Editar descripción de la comunidad
  const handleEditDescription = () => {
    if (!communityInfo.isCreator) {
      Alert.alert('Error', 'Solo el creador puede editar la descripción de la comunidad');
      return;
    }
    setEditingDescription(true);
    setNewDescription(communityInfo.description || '');
  };

  // 🆕 NUEVA FUNCIÓN: Guardar descripción de la comunidad
  const handleSaveDescription = async () => {
    try {
      setSaving(true);
      console.log(`✏️ Guardando nueva descripción: "${newDescription.trim()}" para comunidad ${community.id}`);
      
      // 🆕 LLAMADA REAL AL BACKEND
      const result = await communityService.updateCommunity(community.id, {
        description: newDescription.trim()
      });
      
      if (result.success) {
        // Actualizar el estado local con los datos del backend
        setCommunityInfo(prev => ({ ...prev, description: newDescription.trim() }));
        setEditingDescription(false);
        showGeneralSuccess('✅ Éxito', 'Descripción de la comunidad actualizada en la base de datos', 'document-text', '#10B981');
        console.log('✅ Descripción actualizada exitosamente en el backend');
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error actualizando descripción:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la descripción');
    } finally {
      setSaving(false);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Cancelar edición de descripción
  const handleCancelDescription = () => {
    setEditingDescription(false);
    setNewDescription(communityInfo.description || '');
  };

  // 🆕 NUEVA FUNCIÓN: Editar categoría de la comunidad
  const handleEditCategory = () => {
    if (!communityInfo.isCreator) {
      Alert.alert('Error', 'Solo el creador puede editar la categoría de la comunidad');
      return;
    }
    setEditingCategory(true);
    setNewCategory(communityInfo.categoria || '');
  };

  // 🆕 NUEVA FUNCIÓN: Guardar categoría de la comunidad
  const handleSaveCategory = async () => {
    try {
      setSaving(true);
      console.log(`✏️ Guardando nueva categoría: "${newCategory.trim()}" para comunidad ${community.id}`);
      
      // 🆕 LLAMADA REAL AL BACKEND
      const result = await communityService.updateCommunity(community.id, {
        categoria: newCategory.trim()
      });
      
      if (result.success) {
        // Actualizar el estado local con los datos del backend
        setCommunityInfo(prev => ({ ...prev, categoria: newCategory.trim() }));
        setEditingCategory(false);
        showGeneralSuccess('✅ Éxito', 'Categoría de la comunidad actualizada en la base de datos', 'pricetag', '#10B981');
        console.log('✅ Categoría actualizada exitosamente en el backend');
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error actualizando categoría:', error);
      Alert.alert('Error', error.message || 'No se pudo actualizar la categoría');
    } finally {
      setSaving(false);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Cancelar edición de categoría
  const handleCancelCategory = () => {
    setEditingCategory(false);
    setNewCategory(communityInfo.categoria || '');
  };

  // 🗑️ FUNCIONES PARA EL MODAL DE ELIMINACIÓN
  const handleShowDeleteModal = () => {
    if (!communityInfo.isCreator) {
      Alert.alert('Error', 'Solo el creador puede eliminar la comunidad');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await communityService.deleteCommunity(communityInfo.id);
      
      // Cerrar modal y mostrar mensaje de éxito
      handleCloseDeleteModal();
      showGeneralSuccess('✅ Éxito', 'La comunidad ha sido eliminada exitosamente', 'trash', '#EF4444');
      
      // Navegar de vuelta a la pantalla de comunidades
      navigation.navigate('Communities');
    } catch (error) {
      console.error('Error eliminando comunidad:', error);
      Alert.alert('Error', error.message || 'No se pudo eliminar la comunidad');
      setIsDeleting(false);
    }
  };

  // 🚫 FUNCIONES PARA EL MODAL DE COMUNIDAD ELIMINADA/EXPULSADA
  const handleShowDeletedModal = (communityName, reason) => {
    setDeletedCommunityInfo({ name: communityName, reason });
    setShowDeletedModal(true);
  };

  const handleCloseDeletedModal = () => {
    setShowDeletedModal(false);
    setDeletedCommunityInfo(null);
    
    // Navegar de vuelta a comunidades
    navigation.reset({
      index: 0,
      routes: [{ name: 'Communities' }],
    });
  };

  // ✅ FUNCIONES PARA EL MODAL DE ÉXITO GENERAL
  const showGeneralSuccess = (title, message, icon = 'checkmark-circle', iconColor = '#10B981') => {
    setSuccessInfo({ title, message, icon, iconColor });
    setShowGeneralSuccessModal(true);
  };

  const handleCloseGeneralSuccess = () => {
    setShowGeneralSuccessModal(false);
    setSuccessInfo(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Info. del grupo</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                 {/* Información general del grupo */}
         <View style={styles.groupInfoSection}>
           <View style={styles.groupAvatar}>
             <Text style={styles.groupAvatarText}>
               {communityInfo.name ? communityInfo.name[0].toUpperCase() : 'C'}
             </Text>
           </View>
           
           {/* 🆕 NOMBRE EDITABLE */}
           {editingName ? (
             <View style={styles.editNameContainer}>
               <TextInput
                 style={styles.editNameInput}
                 value={newName}
                 onChangeText={setNewName}
                 placeholder="Nombre de la comunidad"
                 autoFocus
               />
               <View style={styles.editNameActions}>
                 <TouchableOpacity
                   style={styles.editNameButton}
                   onPress={handleSaveName}
                   disabled={saving}
                 >
                   {saving ? (
                     <ActivityIndicator size="small" color="#007AFF" />
                   ) : (
                     <Ionicons name="checkmark" size={20} color="#007AFF" />
                   )}
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.editNameButton}
                   onPress={handleCancelName}
                   disabled={saving}
                 >
                   <Ionicons name="close" size={20} color="#FF3B30" />
                 </TouchableOpacity>
               </View>
             </View>
           ) : (
             <View style={styles.nameContainer}>
               <Text style={styles.groupName}>{communityInfo.name}</Text>
               {communityInfo.isCreator && (
                 <TouchableOpacity
                   style={styles.editIconButton}
                   onPress={handleEditName}
                 >
                   <Ionicons name="create-outline" size={16} color="#007AFF" />
                 </TouchableOpacity>
               )}
             </View>
           )}
           
           <Text style={styles.groupMembers}>
             Grupo • {communityInfo.memberCount || 0} miembros
           </Text>
           
           {/* 🆕 DESCRIPCIÓN EDITABLE */}
           {editingDescription ? (
             <View style={styles.editDescriptionContainer}>
               <TextInput
                 style={styles.editDescriptionInput}
                 value={newDescription}
                 onChangeText={setNewDescription}
                 placeholder="Descripción de la comunidad"
                 multiline
                 numberOfLines={3}
                 autoFocus
               />
               <View style={styles.editDescriptionActions}>
                 <TouchableOpacity
                   style={styles.editDescriptionButton}
                   onPress={handleSaveDescription}
                   disabled={saving}
                 >
                   {saving ? (
                     <ActivityIndicator size="small" color="#007AFF" />
                   ) : (
                     <Ionicons name="checkmark" size={20} color="#007AFF" />
                   )}
                 </TouchableOpacity>
                 <TouchableOpacity
                   style={styles.editDescriptionButton}
                   onPress={handleCancelDescription}
                   disabled={saving}
                 >
                   <Ionicons name="close" size={20} color="#FF3B30" />
                 </TouchableOpacity>
               </View>
             </View>
           ) : (
             <TouchableOpacity
               style={styles.descriptionButton}
               onPress={handleEditDescription}
             >
               <Text style={styles.descriptionText}>
                 {communityInfo.description || 'Añade una descripción del grupo'}
               </Text>
               {communityInfo.isCreator && (
                 <Ionicons name="create-outline" size={16} color="#007AFF" />
               )}
             </TouchableOpacity>
                       )}
            
            {/* 🆕 CATEGORÍA EDITABLE */}
            {editingCategory ? (
              <View style={styles.editCategoryContainer}>
                <TouchableOpacity
                  style={styles.editCategoryInput}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text style={styles.editCategoryInputText}>
                    {newCategory || 'Seleccionar categoría'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#007AFF" />
                </TouchableOpacity>
                
                {/* Selector de categorías */}
                {showCategoryPicker && (
                  <View style={styles.categoryPickerContainer}>
                    <ScrollView style={styles.categoryPickerScroll} showsVerticalScrollIndicator={false}>
                      {categories.map((category, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.categoryOption}
                          onPress={() => {
                            setNewCategory(category);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={styles.categoryOptionText}>{category}</Text>
                          {newCategory === category && (
                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.editCategoryActions}>
                  <TouchableOpacity
                    style={styles.editCategoryButton}
                    onPress={handleSaveCategory}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editCategoryButton}
                    onPress={handleCancelCategory}
                    disabled={saving}
                  >
                    <Ionicons name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={handleEditCategory}
              >
                <Text style={styles.categoryText}>
                  {communityInfo.categoria || 'Sin categoría'}
                </Text>
                {communityInfo.isCreator && (
                  <Ionicons name="create-outline" size={16} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            
            <Text style={styles.creationInfo}>
              Grupo creado por {communityInfo.creadorNombre || 'Usuario'} el{' '}
              <Text>{new Date(communityInfo.fechaCreacion || Date.now()).toLocaleDateString('es-ES')}</Text>
            </Text>
         </View>

        {/* Opciones del chat */}
        <View style={styles.chatOptionsSection}>
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIcon}>
              <Ionicons name="star-outline" size={20} color="#8E8E93" />
            </View>
            <Text style={styles.optionText}>Mensajes destacados</Text>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
          
          
          <TouchableOpacity style={styles.optionItem}>
            <View style={styles.optionIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#8E8E93" />
            </View>
            <Text style={styles.optionText}>Cifrado</Text>
            <Text style={styles.optionSubtext}>
              Los mensajes están cifrados de extremo a extremo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de miembros */}
        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>
              {members.length} miembros
            </Text>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {members.map((member, index) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {member.photo ? (
                  <Image 
                    source={{ uri: member.photo }} 
                    style={styles.memberAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.memberAvatarText}>
                    {member.name[0].toUpperCase()}
                  </Text>
                )}
              </View>
              
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.role && (
                  <Text style={styles.memberRole}>{member.role}</Text>
                )}
                <Text style={styles.memberStatus}>{member.status}</Text>
              </View>
              
              <View style={styles.memberActions}>
                {member.isCreator && (
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorBadgeText}>👑</Text>
                  </View>
                )}
                
                {/* 🆕 BOTÓN DE EXPULSAR - Solo para creadores, no para el propio creador */}
                {communityInfo.isCreator && member.canBeExpelled && (
                  <TouchableOpacity
                    style={styles.expelButton}
                    onPress={() => handleExpelUser(member)}
                  >
                    <Ionicons name="remove-circle-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

                 {/* Botón de salir */}
         {!communityInfo.isCreator && (
           <TouchableOpacity
             style={[styles.leaveButton, leaving && styles.leaveButtonDisabled]}
             onPress={handleLeaveCommunity}
             disabled={leaving}
           >
             {leaving ? (
               <ActivityIndicator size="small" color="#FF3B30" />
             ) : (
               <>
                 <Ionicons name="exit-outline" size={20} color="#FF3B30" />
                 <Text style={styles.leaveButtonText}>Salir del grupo</Text>
               </>
             )}
           </TouchableOpacity>
         )}

         {/* 🆕 BOTÓN DE ELIMINAR COMUNIDAD - Solo para creadores */}
         {communityInfo.isCreator && (
           <TouchableOpacity
             style={styles.deleteCommunityButton}
             onPress={handleShowDeleteModal}
           >
             <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
             <Text style={styles.deleteCommunityButtonText}>Eliminar Comunidad</Text>
           </TouchableOpacity>
         )}
      </ScrollView>

      {/* 🗑️ Modal de eliminación */}
      <CommunityDeleteModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        communityName={communityInfo?.name || ''}
        isDeleting={isDeleting}
      />

      {/* 🚫 Modal de comunidad eliminada/expulsada */}
      <CommunityDeletedModal
        visible={showDeletedModal}
        onClose={handleCloseDeletedModal}
        communityName={deletedCommunityInfo?.name || ''}
        reason={deletedCommunityInfo?.reason || 'deleted'}
      />

      {/* ✅ Modal de éxito general */}
      <SuccessModal
        visible={showGeneralSuccessModal}
        onClose={handleCloseGeneralSuccess}
        title={successInfo?.title || '¡Éxito!'}
        message={successInfo?.message || ''}
        icon={successInfo?.icon || 'checkmark-circle'}
        iconColor={successInfo?.iconColor || '#10B981'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },

  // Group Info Section
  groupInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  groupMembers: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  descriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  descriptionText: {
    flex: 1,
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
  creationInfo: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Chat Options Section
  chatOptionsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  optionIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
  },
  optionSubtext: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  toggleSwitch: {
    marginLeft: 8,
  },
  toggleOff: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E5E5EA',
    position: 'relative',
  },

  // Members Section
  membersSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  membersTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  searchButton: {
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  creatorBadge: {
    marginRight: 8,
  },
  creatorBadgeText: {
    fontSize: 16,
  },
  expelButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
  },

  // Leave Button
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  leaveButtonDisabled: {
    opacity: 0.6,
  },
     leaveButtonText: {
     fontSize: 17,
     fontWeight: '600',
     color: '#FF3B30',
     marginLeft: 8,
   },

   // 🆕 Estilos para editar nombre
   nameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 4,
   },
   editIconButton: {
     marginLeft: 8,
     padding: 4,
   },
   editNameContainer: {
     width: '100%',
     marginBottom: 4,
   },
   editNameInput: {
     fontSize: 22,
     fontWeight: '600',
     color: '#000000',
     textAlign: 'center',
     borderWidth: 1,
     borderColor: '#007AFF',
     borderRadius: 8,
     paddingHorizontal: 16,
     paddingVertical: 8,
     marginBottom: 8,
   },
   editNameActions: {
     flexDirection: 'row',
     justifyContent: 'center',
     gap: 16,
   },
   editNameButton: {
     padding: 8,
     borderRadius: 20,
     backgroundColor: '#F2F2F7',
   },

   // 🆕 Estilos para editar descripción
   editDescriptionContainer: {
     width: '100%',
     marginBottom: 16,
   },
   editDescriptionInput: {
     fontSize: 16,
     color: '#8E8E93',
     textAlign: 'center',
     borderWidth: 1,
     borderColor: '#007AFF',
     borderRadius: 8,
     paddingHorizontal: 16,
     paddingVertical: 12,
     marginBottom: 8,
     minHeight: 60,
   },
   editDescriptionActions: {
     flexDirection: 'row',
     justifyContent: 'center',
     gap: 16,
   },
       editDescriptionButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#F2F2F7',
    },

    // 🆕 Estilos para editar categoría
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 16,
      minWidth: 200,
    },
    categoryText: {
      flex: 1,
      fontSize: 16,
      color: '#8E8E93',
      marginRight: 8,
    },
    editCategoryContainer: {
      width: '100%',
      marginBottom: 16,
    },
         editCategoryInput: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'space-between',
       fontSize: 16,
       color: '#8E8E93',
       textAlign: 'center',
       borderWidth: 1,
       borderColor: '#007AFF',
       borderRadius: 8,
       paddingHorizontal: 16,
       paddingVertical: 12,
       marginBottom: 8,
       minHeight: 50,
     },
     editCategoryInputText: {
       flex: 1,
       fontSize: 16,
       color: '#8E8E93',
       textAlign: 'center',
     },
     categoryPickerContainer: {
       position: 'absolute',
       top: 60,
       left: 0,
       right: 0,
       backgroundColor: '#FFFFFF',
       borderWidth: 1,
       borderColor: '#E5E5EA',
       borderRadius: 8,
       maxHeight: 200,
       zIndex: 1000,
       elevation: 5,
       shadowColor: '#000',
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.25,
       shadowRadius: 3.84,
     },
     categoryPickerScroll: {
       maxHeight: 200,
     },
     categoryOption: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'space-between',
       paddingHorizontal: 16,
       paddingVertical: 12,
       borderBottomWidth: 1,
       borderBottomColor: '#F2F2F7',
     },
     categoryOptionText: {
       fontSize: 16,
       color: '#000000',
     },
    editCategoryActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },
    editCategoryButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#F2F2F7',
    },

    // 🆕 Estilos para botón de eliminar comunidad
   deleteCommunityButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#FF3B30',
     paddingVertical: 16,
     marginHorizontal: 20,
     marginVertical: 20,
     borderRadius: 12,
   },
   deleteCommunityButtonText: {
     fontSize: 17,
     fontWeight: '600',
     color: '#FFFFFF',
     marginLeft: 8,
   },
 });

export default CommunityInfoScreen;
