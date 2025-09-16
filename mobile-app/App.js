// App.js - IMPORTACIÓN CORREGIDA PARA REPORTLISTSCREEN ESPECÍFICO
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, ActivityIndicator } from 'react-native';

// Suprimir errores específicos de login
LogBox.ignoreLogs([
  'Login error:',
  'Login failed',
  'Credenciales inválidas'
]);
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';


// 🔧 Servicio de comunidades
import communityService from './services/communityService';

// Contexto de autenticación
import { AuthProvider, useAuth } from './hooks/useAuth';



// Pantallas de autenticación
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import VerificationScreen from './components/VerificationScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';

// Pantallas principales
import HomeScreen from './components/HomeScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// 🆕 PANTALLA DE INFORMACIÓN PERSONAL
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';

// 🔧 PANTALLAS DE REPORTES - IMPORTACIÓN ESPECÍFICA Y CORREGIDA
import ReportListScreen from './components/reports/ReportListScreen'; // ✅ Esta es la pantalla específica
import CreateReportScreen from './components/reports/CreateReportScreen';
import ReportDetailScreen from './components/reports/ReportDetailScreen';
import ReportSuccessScreen from './components/reports/ReportSuccessScreen';

// Otras pantallas
import ChangePasswordScreen from './components/ChangePasswordScreen';
import EditProfileScreen from './components/EditProfileScreen';
import CommunitiesScreen from './components/CommunitiesScreen';
import CommunityDetailScreen from './components/CommunityDetailScreen';
import CommunityInfoScreen from './components/CommunityInfoScreen';

// Pantallas adicionales
import TipsScreen from './components/TipsScreen';
import HelpScreen from './components/HelpScreen';

// Crear navegadores
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ignorar advertencias específicas de desarrollo
LogBox.ignoreLogs([
  'Warning: ...',
  'AsyncStorage has been extracted from react-native',
]);

// Pantalla de carga mientras se verifica la autenticación
const LoadingScreen = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }}>
    <ActivityIndicator size="large" color="#4B7BEC" />
    <Text style={{
      marginTop: 16,
      fontSize: 16,
      color: '#666666',
      fontWeight: '500',
    }}>Verificando sesión...</Text>
  </View>
);

// Componente para mostrar advertencia cuando no hay conexión
function OfflineNotice() {
  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={{
      backgroundColor: '#FF3B30',
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    }}>
      <Ionicons name="wifi-outline" size={16} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
        Sin conexión a Internet
      </Text>
    </View>
  );
}

// Stack de reportes para el Tab Navigator
const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen 
      name="ReportsList" 
      component={ReportListScreen} // ✅ Usando el componente específico
      options={{ 
        title: 'Todos los Reportes',
      }}
    />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ 
        headerShown: true,
        title: 'Detalle del Reporte',
        headerStyle: { backgroundColor: '#4B7BEC' },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen 
      name="ReportSuccess" 
      component={ReportSuccessScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Tabs principales (cuando está logueado)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'HomeTab':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'ActivityTab':
            iconName = focused ? 'analytics' : 'analytics-outline';
            break;
          case 'ReportsTab':
            iconName = focused ? 'document-text' : 'document-text-outline';
            break;
          case 'ProfileTab':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'circle';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4B7BEC',
      tabBarInactiveTintColor: 'gray',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen 
      name="HomeTab" 
      component={HomeScreen}
      options={{ tabBarLabel: 'Inicio' }}
    />
    <Tab.Screen 
      name="ActivityTab" 
      component={ActivityScreen}
      options={{ tabBarLabel: 'Actividad' }}
    />
    <Tab.Screen 
      name="ReportsTab" 
      component={ReportsStack}
      options={{ tabBarLabel: 'Reportes' }}
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Perfil' }}
    />
  </Tab.Navigator>
);

// Stack Navigator principal (cuando está logueado)
const MainStack = () => (
  <Stack.Navigator>
    {/* Tab Navigator es una pantalla del Stack principal */}
    <Stack.Screen 
      name="Main" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    
    {/* ========================================= */}
    {/* 🆕 PANTALLAS AGREGADAS PARA NAVEGACIÓN DESDE HOME */}
    {/* ========================================= */}
    
    {/* 🔧 PANTALLA DE TODOS LOS REPORTES - USANDO COMPONENTE ESPECÍFICO */}
    <Stack.Screen 
      name="Reports" 
      component={ReportListScreen} // ✅ Este es el componente específico de components/reports/ReportListScreen.js
      options={{ 
        headerShown: true,
        title: 'Todos los Reportes',
        headerStyle: { backgroundColor: '#1e40af' }, // Color consistente con HomeScreen
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false, // Ocultar texto "Back" en iOS
      }}
    />
    
    {/* Pantalla de Mi Actividad - desde "Mi Actividad" en Home */}
    <Stack.Screen 
      name="Activity" 
      component={ActivityScreen} 
      options={{ 
        headerShown: true,
        title: 'Mi Actividad',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    />
    
    {/* Pantalla de Consejos - desde "Consejos" en Home */}
    <Stack.Screen 
      name="Tips" 
      component={TipsScreen} 
      options={{ 
        headerShown: true,
        title: 'Consejos y Ayuda',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    />
    
    {/* Pantalla de Ayuda - desde "Ayuda" en Home */}
    <Stack.Screen 
      name="Help" 
      component={HelpScreen} 
      options={{ 
        headerShown: true,
        title: 'Ayuda y Soporte',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    />
    
    {/* ========================================= */}
    {/* 🆕 PANTALLAS DE PERFIL Y CONFIGURACIÓN */}
    {/* ========================================= */}
    
    {/* 🆕 Pantalla de Información Personal - desde "Editar Perfil" en Profile */}
    <Stack.Screen 
      name="PersonalInfo" 
      component={PersonalInfoScreen} 
      options={{ 
        headerShown: false, // Header personalizado en el componente
        presentation: 'card', // Animación de slide desde la derecha
      }}
    />
    
    {/* 🆕 Pantalla de Editar Perfil - desde "Editar Perfil" en Profile */}
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen} 
      options={{ 
        headerShown: false,
        presentation: 'card', // Animación de slide desde la derecha
      }}
    />
    
    {/* Pantalla de Cambio de Contraseña - desde "Cambiar Contraseña" en Profile */}
    <Stack.Screen 
      name="ChangePassword" 
      component={ChangePasswordScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal', // Modal en iOS
      }}
    />
    
    {/* ========================================= */}
    {/* PANTALLAS MODALES Y OVERLAY EXISTENTES */}
    {/* ========================================= */}
    
    {/* Pantallas modales/overlay que se abren encima del Tab Navigator */}
    <Stack.Screen 
      name="CreateReport" 
      component={CreateReportScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal', // Modal en iOS
      }}
    />
    
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen} 
      options={{ 
        headerShown: true, 
        title: 'Detalle del Reporte',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen 
      name="ReportSuccess" 
      component={ReportSuccessScreen} 
      options={{ 
        headerShown: false,
        gestureEnabled: false, // Evitar deslizar para cerrar
      }}
    />
    
    <Stack.Screen 
      name="Communities" 
      component={CommunitiesScreen} 
      options={{ 
        headerShown: true,
        title: 'Comunidades',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    />
    
    <Stack.Screen 
      name="CommunityDetail" 
      component={CommunityDetailScreen} 
      options={({ route }) => ({
        headerShown: true,
        title: route.params?.communityName || 'Chat',
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      })}
    />
    
    <Stack.Screen 
      name="CommunityInfo" 
      component={CommunityInfoScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal',
      }}
    />
    
    {/* Pantalla de Verificación de Email - disponible desde múltiples lugares */}
    <Stack.Screen 
      name="Verification" 
      component={VerificationScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal',
      }}
    />
    
    
  </Stack.Navigator>
);

// Stack de autenticación (cuando no está logueado)
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Welcome"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Verification" component={VerificationScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Componente principal App Content
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 🔔 Inicializar notificaciones y usuario cuando esté autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('🔔 Inicializando servicios para usuario autenticado...');
      
      // 🆕 Inicializar usuario en communityService
      communityService.initializeUser().then(user => {
        if (user) {
          console.log('✅ Usuario inicializado en communityService:', user.name);
        } else {
          console.log('⚠️ No se pudo inicializar usuario en communityService');
        }
      });
      
    }
    
  }, [isAuthenticated]);
  
  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <OfflineNotice />
      
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Componente principal App con AuthProvider y ThemeProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}