// components/CommunitiesScreen.js - Diseño moderno inspirado en apps educativas
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import communityService from '../services/communityService';
import { useFocusEffect } from '@react-navigation/native';
import CommunitySuccessModal from './CommunitySuccessModal';
import CommunityDeleteModal from './CommunityDeleteModal';
import SuccessModal from './SuccessModal';

const CommunitiesScreen = ({ navigation }) => {
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // 🆕 ESTADO PARA MODAL DE EXPULSIÓN
  const [showExpulsionModal, setShowExpulsionModal] = useState(false);
  const [expulsionInfo, setExpulsionInfo] = useState(null);
  
  // Estados para crear comunidad
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'general'
  });
  const [creating, setCreating] = useState(false);

  // 🎉 ESTADO PARA MODAL DE ÉXITO CON CONFETIS
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState(null);

  // 🗑️ ESTADO PARA MODAL DE ELIMINACIÓN
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ ESTADO PARA MODAL DE ÉXITO GENERAL
  const [showGeneralSuccessModal, setShowGeneralSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  // Datos de categorías con colores
  const categories = [
    { id: 'general', name: 'General', color: '#6366F1', emoji: '🏘️' },
    { id: 'deportes', name: 'Deportes', color: '#EF4444', emoji: '⚽' },
    { id: 'cultura', name: 'Cultura', color: '#8B5CF6', emoji: '🎭' },
    { id: 'negocios', name: 'Negocios', color: '#10B981', emoji: '💼' },
    { id: 'tecnologia', name: 'Tecnología', color: '#F59E0B', emoji: '💻' },
  ];

  useEffect(() => {
    loadCommunities();
  }, []);

  // Recargar comunidades cuando se regrese a la pantalla
  // pero preservar el estado de unión local
  useFocusEffect(
    React.useCallback(() => {
      loadCommunitiesWithSync();
    }, [])
  );

  useEffect(() => {
    filterCommunities();
  }, [communities, searchQuery, activeTab]);

  // Sincronizar filteredCommunities cuando communities cambie
  useEffect(() => {
    if (communities.length > 0) {
      filterCommunities();
    }
  }, [communities]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const data = await communityService.getAllCommunities();
      
      // Asegurar que los datos tengan el formato correcto
      let formattedData = data.map(community => ({
        ...community,
        memberCount: community.memberCount || 0,
        isJoined: community.isJoined || false,
        isCreator: community.isCreator || false,
        isExpelled: false // 🆕 Inicializar como no expulsado
      }));
      
      // 🆕 VERIFICAR ESTADO DE EXPULSIÓN PARA CADA COMUNIDAD
      console.log('🔍 Verificando estado de expulsión para cada comunidad...');
      for (let i = 0; i < formattedData.length; i++) {
        const community = formattedData[i];
        try {
          // Solo verificar si el usuario está unido a la comunidad
          if (community.isJoined && !community.isCreator) {
            console.log(`🔍 Verificando expulsión para comunidad "${community.name}" (ID: ${community.id})...`);
            const expulsionStatus = await communityService.checkIfUserWasExpelled(community.id);
            
            if (expulsionStatus.wasExpelled) {
              console.log(`🚫 Usuario expulsado de "${community.name}" - Marcando como expulsado`);
              formattedData[i] = {
                ...community,
                isJoined: false, // 🆕 Marcar como no unido
                isExpelled: true, // 🆕 Marcar como expulsado
                expulsionReason: expulsionStatus.reason
              };
            }
          }
        } catch (error) {
          // Solo mostrar error en consola si no es relacionado con expulsión/eliminación
          if (!error.message.includes('Comunidad no encontrada') && 
              !error.message.includes('404') && 
              !error.message.includes('403') && 
              !error.message.includes('No autorizado')) {
            console.error(`❌ Error verificando expulsión para comunidad ${community.id}:`, error);
          }
          // Continuar con el siguiente sin interrumpir el proceso
        }
      }
      
      setCommunities(formattedData);
      console.log('Comunidades cargadas:', formattedData);
      console.log(`🚫 Comunidades con acceso restringido: ${formattedData.filter(c => c.isExpelled).map(c => c.name).join(', ')}`);
    } catch (error) {
      console.error('Error cargando comunidades:', error);
      Alert.alert('Error', 'No se pudieron cargar las comunidades');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Cargar comunidades con sincronización del servidor
  const loadCommunitiesWithSync = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando comunidades con sincronización del servidor...');
      
      // 🆕 EL SERVICIO AHORA SINCRONIZA AUTOMÁTICAMENTE EL ESTADO
      const data = await communityService.getAllCommunities();
      
      // Asegurar que los datos tengan el formato correcto
      let formattedData = data.map(community => ({
        ...community,
        memberCount: community.memberCount || 0,
        isJoined: community.isJoined || false,
        isCreator: community.isCreator || false,
        isExpelled: false // 🆕 Inicializar como no expulsado
      }));
      
      // 🆕 VERIFICAR ESTADO DE EXPULSIÓN PARA CADA COMUNIDAD
      console.log('🔍 Verificando estado de expulsión para cada comunidad...');
      for (let i = 0; i < formattedData.length; i++) {
        const community = formattedData[i];
        try {
          // Solo verificar si el usuario está unido a la comunidad
          if (community.isJoined && !community.isCreator) {
            console.log(`🔍 Verificando expulsión para comunidad "${community.name}" (ID: ${community.id})...`);
            const expulsionStatus = await communityService.checkIfUserWasExpelled(community.id);
            
            if (expulsionStatus.wasExpelled) {
              console.log(`🚫 Usuario expulsado de "${community.name}" - Marcando como expulsado`);
              formattedData[i] = {
                ...community,
                isJoined: false, // 🆕 Marcar como no unido
                isExpelled: true, // 🆕 Marcar como expulsado
                expulsionReason: expulsionStatus.reason
              };
            }
          }
        } catch (error) {
          // Solo mostrar error en consola si no es relacionado con expulsión/eliminación
          if (!error.message.includes('Comunidad no encontrada') && 
              !error.message.includes('404') && 
              !error.message.includes('403') && 
              !error.message.includes('No autorizado')) {
            console.error(`❌ Error verificando expulsión para comunidad ${community.id}:`, error);
          }
          // Continuar con el siguiente sin interrumpir el proceso
        }
      }
      
      // 🆕 EL ESTADO isJoined YA VIENE SINCRONIZADO DEL SERVIDOR
      setCommunities(formattedData);
      
      console.log(`✅ ${formattedData.length} comunidades cargadas con estado sincronizado`);
      console.log(`🔗 Comunidades unidas: ${formattedData.filter(c => c.isJoined).map(c => c.name).join(', ')}`);
      console.log(`🚫 Comunidades con acceso restringido: ${formattedData.filter(c => c.isExpelled).map(c => c.name).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Error cargando comunidades:', error);
      Alert.alert('Error', 'No se pudieron cargar las comunidades');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    setRefreshing(false);
  };

  const filterCommunities = () => {
    let filtered = communities;

    if (activeTab === 'joined') {
      filtered = communities.filter(c => c.isJoined);
    } else if (activeTab === 'created') {
      filtered = communities.filter(c => c.isCreator);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.creadorNombre && community.creadorNombre.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCommunities(filtered);
  };

  const getCategoryData = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) {
      Alert.alert('Error', 'El nombre de la comunidad es obligatorio');
      return;
    }

    if (!newCommunity.description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    try {
      setCreating(true);
      const createdCommunity = await communityService.createCommunity(newCommunity);
      
      setCommunities(prev => [createdCommunity, ...prev]);
      
      setNewCommunity({ name: '', description: '', category: 'general' });
      setShowCreateModal(false);
      
      // 🎉 Mostrar modal de éxito con confetis
      setCreatedCommunity(createdCommunity);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error creando comunidad:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la comunidad');
    } finally {
      setCreating(false);
    }
  };

  // 🎉 FUNCIONES PARA EL MODAL DE ÉXITO
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedCommunity(null);
  };

  const handleViewCreatedCommunity = () => {
    if (createdCommunity) {
      navigation.navigate('CommunityDetail', { 
        community: createdCommunity 
      });
    }
  };

  // 🗑️ FUNCIONES PARA EL MODAL DE ELIMINACIÓN
  const handleShowDeleteModal = (community) => {
    if (!community.isCreator) {
      Alert.alert('Error', 'Solo el creador puede eliminar la comunidad');
      return;
    }
    setCommunityToDelete(community);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCommunityToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!communityToDelete) return;
    
    try {
      setIsDeleting(true);
      const result = await communityService.deleteCommunity(communityToDelete.id);
      
      // Remover la comunidad eliminada del estado
      setCommunities(prev => prev.filter(c => c.id !== communityToDelete.id));
      setFilteredCommunities(prev => prev.filter(c => c.id !== communityToDelete.id));
      
      // Cerrar modal y mostrar mensaje de éxito
      handleCloseDeleteModal();
      showGeneralSuccess('✅ Éxito', 'La comunidad ha sido eliminada exitosamente');
      
      // Recargar comunidades para asegurar sincronización
      await loadCommunitiesWithSync();
    } catch (error) {
      console.error('Error eliminando comunidad:', error);
      Alert.alert('Error', error.message || 'No se pudo eliminar la comunidad');
      setIsDeleting(false);
    }
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

  const getAvailableActions = (community) => {
    const actions = [];

    if (community.isCreator) {
      actions.push({
        id: 'chat',
        title: 'Chatear',
        icon: '💬',
        color: '#3B82F6'
      });
      actions.push({
        id: 'manage',
        title: 'Administrar',
        icon: '⚙️',
        color: '#F59E0B'
      });
      // 🆕 BOTÓN DE ELIMINAR PARA EL CREADOR
      actions.push({
        id: 'delete',
        title: 'Eliminar',
        icon: '🗑️',
        color: '#EF4444'
      });
    }
    else if (community.isJoined) {
      actions.push({
        id: 'chat',
        title: 'Chatear',
        icon: '💬',
        color: '#3B82F6'
      });
      actions.push({
        id: 'leave',
        title: 'Salir',
        icon: '🚪',
        color: '#EF4444'
      });
    }
    else {
      actions.push({
        id: 'join',
        title: 'Unirse',
        icon: '➕',
        color: '#10B981'
      });
    }

    return actions;
  };

  const handleCommunityAction = async (community, actionId) => {
    try {
      if (actionId === 'chat') {
        navigation.navigate('CommunityDetail', { community });
      } else if (actionId === 'join') {
        // Mostrar estado de carga
        setCommunities(prev => prev.map(c => 
          c.id === community.id 
            ? { ...c, _joining: true }
            : c
        ));

        try {
          const result = await communityService.toggleMembership('join', community.id);
          
          // 🆕 VERIFICAR SI EL USUARIO ESTÁ EXPULSADO
          if (result.isExpelled) {
            console.log('🚫 Usuario expulsado - Mostrando modal informativo');
            
            // Configurar información para el modal
            setExpulsionInfo({
              communityName: community.name,
              reason: result.reason || 'Expulsado por el creador',
              expulsionDate: result.expulsionDate || 'Fecha no disponible'
            });
            
            // Mostrar modal
            setShowExpulsionModal(true);
            
            // Quitar el estado de carga
            setCommunities(prev => prev.map(c => 
              c.id === community.id 
                ? { ...c, _joining: false }
                : c
            ));
            return; // Salir sin hacer nada más
          }
          
          // El backend devuelve success: true, pero el resultado está en result directamente
          console.log('Uniéndose a comunidad:', community.id, 'Resultado:', result);
          
          // Actualizar el estado local inmediatamente
          setCommunities(prev => {
            const updated = prev.map(c => 
              c.id === community.id 
                ? { 
                    ...c, 
                    isJoined: true, 
                    memberCount: (c.memberCount || 0) + 1, 
                    roleBadge: 'Miembro',
                    _joining: false 
                  }
                : c
            );
            console.log('Estado communities actualizado:', updated);
            return updated;
          });
          
          // También actualizar filteredCommunities para que se refleje en la UI
          setFilteredCommunities(prev => {
            const updated = prev.map(c => 
              c.id === community.id 
                ? { 
                    ...c, 
                    isJoined: true, 
                    memberCount: (c.memberCount || 0) + 1, 
                    roleBadge: 'Miembro',
                    _joining: false 
                  }
                : c
            );
            console.log('Estado filteredCommunities actualizado:', updated);
            return updated;
          });
          
          // 🆕 RECARGAR COMUNIDADES CON ESTADO SINCRONIZADO DEL SERVIDOR
          await loadCommunitiesWithSync();
          
          showGeneralSuccess('¡Éxito!', result.message || 'Te has unido a la comunidad exitosamente', 'people', '#10B981');
        } catch (error) {
          console.log('⚠️ No se pudo unir a la comunidad:', error.message);
          
          // Quitar el estado de carga en caso de error
          setCommunities(prev => prev.map(c => 
            c.id === community.id 
              ? { ...c, _joining: false }
              : c
          ));
          
          // 🆕 NO MOSTRAR NINGÚN ERROR EN PANTALLA - COMPLETAMENTE SILENCIOSO
          // El usuario expulsado ya ve "Acceso Restringido" en lugar del botón "Unirse"
          // No es necesario mostrar más mensajes
        }
      } else if (actionId === 'delete') {
        // 🗑️ NUEVA ACCIÓN: Eliminar comunidad con modal bonito
        handleShowDeleteModal(community);
      } else if (actionId === 'leave') {
        if (community.isCreator) {
          Alert.alert('Error', 'El creador no puede abandonar su propia comunidad');
          return;
        }
        
        Alert.alert(
          'Confirmar',
          `¿Estás seguro de que quieres salir de "${community.name}"?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
                              onPress: async () => {
                  try {
                    const result = await communityService.toggleMembership('leave', community.id);
                    
                    // El backend devuelve success: true, pero el resultado está en result directamente
                    // Actualizar ambos estados para mantener consistencia
                    setCommunities(prev => prev.map(c => 
                      c.id === community.id 
                        ? { ...c, isJoined: false, memberCount: Math.max(0, (c.memberCount || 1) - 1), roleBadge: null }
                        : c
                    ));
                    
                    setFilteredCommunities(prev => 
                      prev.map(c => 
                        c.id === community.id 
                          ? { ...c, isJoined: false, memberCount: Math.max(0, (c.memberCount || 1) - 1), roleBadge: null }
                          : c
                      )
                    );
                    
                    // 🆕 RECARGAR COMUNIDADES CON ESTADO SINCRONIZADO DEL SERVIDOR
                    await loadCommunitiesWithSync();
                    
                    showGeneralSuccess('Éxito', result.message || 'Has salido de la comunidad', 'exit', '#6B7280');
                  } catch (error) {
                    console.error('Error al salir de la comunidad:', error);
                    Alert.alert('Error', error.message || 'No se pudo salir de la comunidad');
                  }
                }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error en acción:', error);
      Alert.alert('Error', error.message || 'No se pudo realizar la acción');
      
      // Quitar el estado de carga en caso de error para todas las comunidades
      setCommunities(prev => prev.map(c => 
        c.id === community.id 
          ? { ...c, _joining: false }
          : c
      ));
    }
  };

  const renderHeroCard = () => (
    <View style={styles.heroCard}>
      <View style={styles.heroContent}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Únete a tu{'\n'}Comunidad</Text>
          <Text style={styles.heroSubtitle}>
            Conecta con vecinos y haz{'\n'}que tu voz sea escuchada
          </Text>
          <TouchableOpacity 
            style={styles.heroButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.heroButtonText}>Empezar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroIllustration}>
          {/* Personaje principal */}
          <View style={styles.heroCharacter}>
            <View style={styles.heroCharacterHead} />
            <View style={styles.heroCharacterBody} />
            <View style={styles.heroCharacterArms}>
              <View style={styles.heroCharacterLeftArm} />
              <View style={styles.heroCharacterRightArm} />
            </View>
          </View>
          {/* Elementos flotantes */}
          <View style={styles.heroFloatingElements}>
            <View style={[styles.heroFloatingIcon, { top: 10, right: 20 }]}>
              <Text style={styles.heroFloatingText}>🏘️</Text>
            </View>
            <View style={[styles.heroFloatingIcon, { bottom: 30, left: 10 }]}>
              <Text style={styles.heroFloatingText}>💬</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, { backgroundColor: category.color }]}
      onPress={() => {
        setSearchQuery('');
        setActiveTab('all');
        // Aquí podrías filtrar por categoría si quisieras
      }}
    >
      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );

  const renderCommunityCard = ({ item: community }) => {
    const categoryData = getCategoryData(community.category);
    
    return (
      <View style={styles.communityCard}>
        <View style={styles.communityCardHeader}>
          <View style={[styles.communityIcon, { backgroundColor: categoryData.color }]}>
            <Text style={styles.communityIconText}>{categoryData.emoji}</Text>
          </View>
          <View style={styles.communityMeta}>
            <View style={styles.communityRatingContainer}>
              <Text style={styles.communityRating}>⭐ 4.8</Text>
              <View style={styles.communityMemberBadge}>
                <Text style={styles.communityMemberText}>{community.memberCount || 0} miembros</Text>
              </View>
            </View>
            {community.isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>👑 Tuya</Text>
              </View>
            )}
            {community.isJoined && !community.isCreator && (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedBadgeText}>✓ Unido</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.communityInfo}>
          <Text style={styles.communityTitle}>{community.name}</Text>
          <Text style={styles.communityInstructor}>
            Por {community.creadorNombre || 'Usuario desconocido'}
          </Text>
          <Text style={styles.communityDescription} numberOfLines={2}>
            {community.description}
          </Text>
        </View>

        <View style={styles.communityActions}>
          {getAvailableActions(community).map((action, index) => (
            <TouchableOpacity
              key={`${action.id}-${index}`}
              style={[
                styles.communityActionButton,
                { backgroundColor: action.color },
                community._joining && action.id === 'join' && styles.disabledButton
              ]}
              onPress={() => handleCommunityAction(community, action.id)}
              disabled={community._joining && action.id === 'join'}
            >
              {community._joining && action.id === 'join' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.communityActionText}>
                  {action.icon} {action.title}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Cargando comunidades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allCount = communities.length;
  const joinedCount = communities.filter(c => c.isJoined).length;
  const createdCount = communities.filter(c => c.isCreator).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header con búsqueda */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar comunidades..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        {renderHeroCard()}

        {/* Sección de categorías */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.subjectsContainer}>
            {categories.slice(0, 5).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.subjectButton}
                onPress={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
              >
                <Text style={styles.subjectText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tabs de filtros */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              Todas ({allCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'joined' && styles.activeTab]}
            onPress={() => setActiveTab('joined')}
          >
            <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
              Mis Comunidades ({joinedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'created' && styles.activeTab]}
            onPress={() => setActiveTab('created')}
          >
            <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
              Creadas ({createdCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección de comunidades */}
        <View style={styles.communitiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Comunidades Disponibles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {filteredCommunities.length > 0 ? (
            <View style={styles.communitiesList}>
              {filteredCommunities.map((community) => (
                <View key={community.id} style={styles.communityItem}>
                  <View style={styles.communityItemHeader}>
                    <View style={[styles.communityIcon, { backgroundColor: getCategoryData(community.category).color }]}>
                      <Text style={styles.communityIconText}>{getCategoryData(community.category).emoji}</Text>
                    </View>
                    <View style={styles.communityItemInfo}>
                      <Text style={styles.communityItemTitle} numberOfLines={1}>
                        {community.name}
                      </Text>
                      <Text style={styles.communityItemDescription} numberOfLines={2}>
                        {community.description}
                      </Text>
                      <View style={styles.communityItemStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="people-outline" size={14} color="#6B7280" />
                          <Text style={styles.statText}>{community.memberCount || 0} miembros</Text>
                        </View>
                        {community.creadorNombre && (
                          <View style={styles.statItem}>
                            <Ionicons name="person-outline" size={14} color="#6B7280" />
                            <Text style={styles.statText}>Por {community.creadorNombre}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* Badges de estado */}
                    <View style={styles.badgesContainer}>
                      {community.isCreator && (
                        <View style={styles.creatorBadge}>
                          <Text style={styles.creatorBadgeText}>👑 Tuya</Text>
                        </View>
                      )}
                      {community.isJoined && !community.isCreator && (
                        <View style={styles.joinedBadge}>
                          <Text style={styles.joinedBadgeText}>✓ Unido</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Botones de acción */}
                  <View style={styles.communityItemActions}>
                    {community.isJoined ? (
                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => handleCommunityAction(community, 'chat')}
                      >
                        <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.chatButtonText}>Chat</Text>
                      </TouchableOpacity>
                    ) : community.isExpelled ? (
                      // 🆕 USUARIO EXPULSADO - MOSTRAR INFORMACIÓN EN LUGAR DE BOTÓN
                      <View style={styles.expelledInfoContainer}>
                        <Ionicons name="ban" size={16} color="#FF6B6B" />
                        <Text style={styles.expelledText}>Acceso Restringido</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.joinButton, community._joining && styles.disabledButton]}
                        onPress={() => handleCommunityAction(community, 'join')}
                        disabled={community._joining}
                      >
                        {community._joining ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="add-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.joinButtonText}>Unirse</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {activeTab === 'joined' ? 'No te has unido a ninguna comunidad aún' :
                 activeTab === 'created' ? 'No has creado ninguna comunidad aún' :
                 searchQuery ? 'No se encontraron comunidades' : 'No hay comunidades disponibles'}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => activeTab === 'created' ? setShowCreateModal(true) : setActiveTab('all')}
              >
                <Text style={styles.emptyStateButtonText}>
                  {activeTab === 'created' ? 'Crear Comunidad' : 'Ver Todas'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón flotante para crear */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para crear comunidad */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowCreateModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nueva Comunidad</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Nombre de la comunidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Vecinos de Colonia Escalón"
              value={newCommunity.name}
              onChangeText={(text) => setNewCommunity(prev => ({ ...prev, name: text }))}
            />

            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe de qué trata tu comunidad..."
              value={newCommunity.description}
              onChangeText={(text) => setNewCommunity(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    newCommunity.category === cat.id && [styles.selectedCategoryOption, { borderColor: cat.color }]
                  ]}
                  onPress={() => setNewCommunity(prev => ({ ...prev, category: cat.id }))}
                >
                  <Text style={styles.categoryOptionEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, creating && styles.disabledButton]}
              onPress={handleCreateCommunity}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Crear Comunidad</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 🆕 MODAL DE EXPULSIÓN */}
      <Modal
        visible={showExpulsionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowExpulsionModal(false)}
      >
        <View style={styles.expulsionModalOverlay}>
          <View style={styles.expulsionModalContainer}>
            <View style={styles.expulsionModalHeader}>
              <View style={styles.expulsionIconContainer}>
                <Ionicons name="ban" size={32} color="#FF6B6B" />
              </View>
              <Text style={styles.expulsionModalTitle}>Acceso Restringido</Text>
            </View>

            <View style={styles.expulsionModalContent}>
              <Text style={styles.expulsionModalMessage}>
                No puedes unirte a la comunidad
              </Text>
              
              {expulsionInfo && (
                <View style={styles.expulsionDetailsContainer}>
                  <View style={styles.expulsionDetailRow}>
                    <Ionicons name="people" size={16} color="#4B7BEC" />
                    <Text style={styles.expulsionDetailLabel}>Comunidad:</Text>
                    <Text style={styles.expulsionDetailValue}>{expulsionInfo.communityName}</Text>
                  </View>
                  
                  <View style={styles.expulsionDetailRow}>
                    <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                    <Text style={styles.expulsionDetailLabel}>Motivo:</Text>
                    <Text style={styles.expulsionDetailValue}>{expulsionInfo.reason}</Text>
                  </View>
                  
                  <View style={styles.expulsionDetailRow}>
                    <Ionicons name="calendar" size={16} color="#8E8E93" />
                    <Text style={styles.expulsionDetailLabel}>Fecha:</Text>
                    <Text style={styles.expulsionDetailValue}>{expulsionInfo.expulsionDate}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.expulsionModalSubtitle}>
                Si crees que esto es un error, contacta al creador de la comunidad.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.expulsionModalButton}
              onPress={() => setShowExpulsionModal(false)}
            >
              <Text style={styles.expulsionModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🆕 BARRA DE NAVEGACIÓN INFERIOR */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Main', { screen: 'HomeTab' })}
        >
          <Ionicons name="home-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Main', { screen: 'ActivityTab' })}
        >
          <Ionicons name="analytics-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Actividad</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.activeNavItem]}
          onPress={() => {}} // Ya estamos en Communities
        >
          <Ionicons name="people" size={24} color="#4B7BEC" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Comunidades</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Main', { screen: 'ReportsTab' })}
        >
          <Ionicons name="document-text-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Reportes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' })}
        >
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* 🎉 Modal de éxito con confetis */}
      <CommunitySuccessModal
        visible={showSuccessModal}
        onClose={handleCloseSuccessModal}
        communityName={createdCommunity?.name || ''}
        onViewCommunity={handleViewCreatedCommunity}
      />

      {/* 🗑️ Modal de eliminación */}
      <CommunityDeleteModal
        visible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        communityName={communityToDelete?.name || ''}
        isDeleting={isDeleting}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },

  // Hero Card
  heroCard: {
    margin: 20,
    backgroundColor: '#FFE4E1',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  heroIllustration: {
    width: 120,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCharacter: {
    alignItems: 'center',
  },
  heroCharacterHead: {
    width: 40,
    height: 40,
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    marginBottom: 5,
  },
  heroCharacterBody: {
    width: 50,
    height: 40,
    backgroundColor: '#FBBF24',
    borderRadius: 10,
  },
  heroCharacterArms: {
    position: 'absolute',
    top: 45,
    flexDirection: 'row',
    width: 70,
    justifyContent: 'space-between',
  },
  heroCharacterLeftArm: {
    width: 12,
    height: 25,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  heroCharacterRightArm: {
    width: 12,
    height: 25,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  heroFloatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroFloatingIcon: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroFloatingText: {
    fontSize: 12,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },

  // Subjects (Categories as horizontal buttons like in the image)
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Communities List (Nueva sección funcional)
  communitiesList: {
    gap: 16,
  },
  communityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  communityItemHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityIconText: {
    fontSize: 20,
  },
  communityItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  communityItemDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  communityItemStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  creatorBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  creatorBadgeText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  joinedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinedBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  communityItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  viewButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  // Communities Section
  communitiesSection: {
    paddingHorizontal: 20,
    paddingBottom: 80, // 🆕 Reducido para dar espacio a la barra de navegación
  },

  // Community Cards
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  communityCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  communityIconText: {
    fontSize: 20,
  },
  communityMeta: {
    flex: 1,
  },
  communityRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginRight: 8,
  },
  communityMemberBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  communityMemberText: {
    fontSize: 12,
    color: '#6B7280',
  },
  creatorBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  creatorBadgeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  joinedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  joinedBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  communityInfo: {
    marginBottom: 16,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  communityInstructor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  communityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  communityActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 80, // 🆕 Ajustado para estar por encima de la barra de navegación
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalHeaderRight: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  categoryOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  selectedCategoryOption: {
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  categoryOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  expelledInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  expelledText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 🆕 MODAL DE EXPULSIÓN
  expulsionModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  expulsionModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  expulsionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  expulsionIconContainer: {
    marginRight: 10,
  },
  expulsionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  expulsionModalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  expulsionModalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  expulsionDetailsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    width: '100%',
  },
  expulsionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  expulsionDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  expulsionDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 5,
  },
  expulsionModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  expulsionModalButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  expulsionModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 🆕 ESTILOS PARA BARRA DE NAVEGACIÓN INFERIOR
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#4B7BEC',
    fontWeight: '600',
  },
});

export default CommunitiesScreen;