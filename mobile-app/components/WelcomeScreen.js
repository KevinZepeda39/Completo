// components/WelcomeScreen.js - Pantalla de bienvenida con carrusel funcional
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Reportes Fáciles",
    subtitle: "y Efectivos",
    description: "La mejor plataforma para que ciudadanos comprometidos reporten problemas y mejoren su ciudad",
    illustration: "reports"
  },
  {
    id: 2,
    title: "Seguimiento",
    subtitle: "en Tiempo Real",
    description: "Mantente informado sobre el progreso de tus reportes y las mejoras en tu comunidad",
    illustration: "tracking"
  },
  {
    id: 3,
    title: "Comunidad",
    subtitle: "Activa",
    description: "Únete a otros ciudadanos comprometidos en hacer de tu ciudad un mejor lugar para vivir",
    illustration: "community"
  }
];

const WelcomeScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true
      });
      setCurrentIndex(nextIndex);
    }
  };

  const goToSlide = (index) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true
    });
    setCurrentIndex(index);
  };

  const renderIllustration = (type) => {
    switch (type) {
      case 'reports':
        return (
          <View style={styles.illustrationContainer}>
            <View style={styles.backgroundShapes}>
              <View style={styles.yellowShape} />
              <View style={styles.lightShape} />
              <View style={styles.grayBuilding} />
            </View>
            
            <View style={styles.characterContainer}>
              <View style={styles.characterHead} />
              <View style={styles.characterBody}>
                <View style={styles.characterShirt} />
                <View style={styles.characterArms}>
                  <View style={styles.leftArm} />
                  <View style={styles.rightArm} />
                </View>
                <View style={styles.laptop}>
                  <View style={styles.laptopScreen} />
                  <View style={styles.laptopBase} />
                </View>
              </View>
              <View style={styles.characterLegs} />
            </View>
            
            <View style={styles.floatingElements}>
              <View style={[styles.floatingIcon, styles.icon1]}>
                <Text style={styles.iconText}>📊</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon2]}>
                <Text style={styles.iconText}>🏙️</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon3]}>
                <Text style={styles.iconText}>📱</Text>
              </View>
            </View>
          </View>
        );
      
      case 'tracking':
        return (
          <View style={styles.illustrationContainer}>
            <View style={styles.backgroundShapes}>
              <View style={[styles.yellowShape, { backgroundColor: '#DBEAFE' }]} />
              <View style={[styles.lightShape, { backgroundColor: '#FEF3C7' }]} />
              <View style={styles.grayBuilding} />
            </View>
            
            <View style={styles.characterContainer}>
              <View style={[styles.characterHead, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.characterBody}>
                <View style={[styles.characterShirt, { backgroundColor: '#60A5FA' }]} />
                <View style={styles.characterArms}>
                  <View style={[styles.leftArm, { backgroundColor: '#3B82F6' }]} />
                  <View style={[styles.rightArm, { backgroundColor: '#3B82F6' }]} />
                </View>
                <View style={styles.laptop}>
                  <View style={styles.laptopScreen} />
                  <View style={styles.laptopBase} />
                </View>
              </View>
              <View style={[styles.characterLegs, { backgroundColor: '#1E40AF' }]} />
            </View>
            
            <View style={styles.floatingElements}>
              <View style={[styles.floatingIcon, styles.icon1]}>
                <Text style={styles.iconText}>🔍</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon2]}>
                <Text style={styles.iconText}>📈</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon3]}>
                <Text style={styles.iconText}>✅</Text>
              </View>
            </View>
          </View>
        );
      
      case 'community':
        return (
          <View style={styles.illustrationContainer}>
            <View style={styles.backgroundShapes}>
              <View style={[styles.yellowShape, { backgroundColor: '#DCFCE7' }]} />
              <View style={[styles.lightShape, { backgroundColor: '#FEF3C7' }]} />
              <View style={styles.grayBuilding} />
            </View>
            
            <View style={styles.characterContainer}>
              <View style={[styles.characterHead, { backgroundColor: '#10B981' }]} />
              <View style={styles.characterBody}>
                <View style={[styles.characterShirt, { backgroundColor: '#34D399' }]} />
                <View style={styles.characterArms}>
                  <View style={[styles.leftArm, { backgroundColor: '#10B981' }]} />
                  <View style={[styles.rightArm, { backgroundColor: '#10B981' }]} />
                </View>
                <View style={styles.laptop}>
                  <View style={styles.laptopScreen} />
                  <View style={styles.laptopBase} />
                </View>
              </View>
              <View style={[styles.characterLegs, { backgroundColor: '#047857' }]} />
            </View>
            
            <View style={styles.floatingElements}>
              <View style={[styles.floatingIcon, styles.icon1]}>
                <Text style={styles.iconText}>👥</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon2]}>
                <Text style={styles.iconText}>🤝</Text>
              </View>
              <View style={[styles.floatingIcon, styles.icon3]}>
                <Text style={styles.iconText}>❤️</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide} key={item.id}>
      {renderIllustration(item.illustration)}
      
             <View style={styles.textSection}>
         <Text style={styles.mainTitle}>{item.title}</Text>
         <Text style={styles.mainSubtitle}>{item.subtitle}</Text>
         <Text style={styles.description}>{item.description}</Text>
       </View>
    </View>
  );

  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
         <SafeAreaView style={styles.container}>
       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
                 <TouchableOpacity 
           style={styles.skipButton}
           onPress={() => navigation.navigate('Login')}
         >
           <Text style={styles.skipText}>Omitir</Text>
         </TouchableOpacity>
      </View>

      {/* Carrusel principal */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderSlide({ item, index }))}
      </ScrollView>

      {/* Indicadores de página */}
      <View style={styles.pageIndicatorContainer}>
        <View style={styles.pageIndicator}>
          {onboardingData.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToSlide(index)}
                                              style={[
                   styles.dot,
                   index === currentIndex ? styles.activeDot : styles.inactiveDot
                 ]}
            />
          ))}
        </View>
      </View>

      {/* Botones de navegación */}
      <View style={styles.navigationContainer}>
        {!isLastSlide ? (
          <View style={styles.actionButtons}>
                                        <TouchableOpacity
                 style={styles.nextButton}
                 onPress={goToNext}
                 activeOpacity={0.8}
               >
                 <Text style={styles.nextButtonText}>Siguiente</Text>
                 <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
             </TouchableOpacity>
            
                         <TouchableOpacity
               style={styles.secondaryButton}
               onPress={() => navigation.navigate('Login')}
               activeOpacity={0.8}
             >
                                <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
               </TouchableOpacity>
             </View>
           ) : (
             <View style={styles.actionButtons}>
               <TouchableOpacity
                 style={styles.primaryButton}
                 onPress={() => navigation.navigate('Register')}
                 activeOpacity={0.8}
               >
                 <Text style={styles.primaryButtonText}>Comenzar</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={styles.secondaryButton}
                 onPress={() => navigation.navigate('Login')}
                 activeOpacity={0.8}
               >
                 <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
             </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 20,
  },
  backgroundShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowShape: {
    position: 'absolute',
    top: 20,
    right: 40,
    width: 120,
    height: 80,
    backgroundColor: '#FEF3C7',
    borderRadius: 40,
    transform: [{ rotate: '15deg' }],
  },
  lightShape: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
  },
  grayBuilding: {
    position: 'absolute',
    top: 30,
    left: 60,
    width: 40,
    height: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  characterContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  characterHead: {
    width: 50,
    height: 50,
    backgroundColor: '#FBBF24',
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  characterBody: {
    alignItems: 'center',
    position: 'relative',
  },
  characterShirt: {
    width: 70,
    height: 60,
    backgroundColor: '#FCD34D',
    borderRadius: 15,
    marginBottom: 10,
  },
  characterArms: {
    position: 'absolute',
    top: 10,
    width: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftArm: {
    width: 15,
    height: 40,
    backgroundColor: '#FBBF24',
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
  },
  rightArm: {
    width: 15,
    height: 40,
    backgroundColor: '#FBBF24',
    borderRadius: 8,
    transform: [{ rotate: '20deg' }],
  },
  laptop: {
    alignItems: 'center',
    marginTop: 15,
  },
  laptopScreen: {
    width: 45,
    height: 30,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#374151',
  },
  laptopBase: {
    width: 50,
    height: 8,
    backgroundColor: '#9CA3AF',
    borderRadius: 4,
    marginTop: -2,
  },
  characterLegs: {
    width: 40,
    height: 30,
    backgroundColor: '#92400E',
    borderRadius: 15,
    marginTop: 5,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingIcon: {
    position: 'absolute',
    width: 35,
    height: 35,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon1: {
    top: 80,
    right: 20,
  },
  icon2: {
    bottom: 100,
    left: 30,
  },
  icon3: {
    top: 120,
    left: 20,
  },
  iconText: {
    fontSize: 16,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 38,
  },
  mainSubtitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  pageIndicatorContainer: {
    paddingVertical: 20,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    backgroundColor: '#FBBF24',
  },
  inactiveDot: {
    width: 8,
    height: 8,
    backgroundColor: '#E5E7EB',
  },
  navigationContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  actionButtons: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FBBF24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#FBBF24',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;