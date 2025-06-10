import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  BackHandler,
  AppState,
  InteractionManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Menu from '../../../Component/Menu/Menu';
import MovimientoList from './MovimientoList';

// Professional color palette
const PRIMARY_BLUE = '#4F85C5';
const DARK_BLUE = '#3B6596';
const LIGHT_BLUE = '#F0F7FF';
const ACCENT_COLOR = '#FF8E53';
const ERROR_COLOR = '#FF5A5F';
const SUCCESS_COLOR = '#2ECC71';

// Platform-specific styles
const PLATFORM_STYLES = {
  ios: {
    shadowProps: {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
    buttonRadius: 10,
  },
  android: {
    shadowProps: {
      elevation: 3,
    },
    buttonRadius: 8,
  }
};

// Loading states
enum LoadingState {
  INITIAL_LOADING = 'INITIAL_LOADING',
  REFRESHING = 'REFRESHING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

const Supervisor = () => {
  // Core states
  const [menuVisible, setMenuVisible] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pendientes');
  type UserData = { nombre?: string; [key: string]: any };
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIAL_LOADING);
  const [appActive, setAppActive] = useState(true);
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);
  
  // Animation refs
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  
  // Derived state
  const isRefreshing = useMemo(() => 
    loadingState === LoadingState.REFRESHING, 
  [loadingState]);
  
  const isLoading = useMemo(() => 
    loadingState === LoadingState.INITIAL_LOADING, 
  [loadingState]);
  
  // AppState listener to refresh data when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const isActive = nextAppState === 'active';
      setAppActive(isActive);
      
      // If app becomes active and we have loaded before, refresh data
      if (isActive && initialSetupComplete) {
        refreshData(false); // Refresh without showing the full loader
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [initialSetupComplete]);
  
  // Handle back button on Android to close menu if it's open
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menuVisible) {
        toggleMenu();
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, [menuVisible]);
  
  // Initial setup
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    // Load data using InteractionManager to ensure animations complete first
    InteractionManager.runAfterInteractions(() => {
      loadUserData(true);
    });
  }, []);
  
  // Load user data with better error handling
  const loadUserData = async (isInitialLoad = false) => {
    try {
      setLoadingState(isInitialLoad ? LoadingState.INITIAL_LOADING : LoadingState.REFRESHING);
      setError(null);
      
      // Use Promise.all for concurrent requests
      const [storedToken, userDataJson] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userData')
      ]);
      
      // Check if token exists
      if (!storedToken) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      setToken(storedToken);
      
      // Parse user data if available
      if (userDataJson) {
        setUserData(JSON.parse(userDataJson));
      } else {
        console.warn('No user data found in storage');
      }
      
      setLoadingState(LoadingState.SUCCESS);
      setInitialSetupComplete(true);
      
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError(error.message || 'No se pudieron cargar los datos. Intente nuevamente.');
      setLoadingState(LoadingState.ERROR);
    }
  };
  
  // Toggle menu with improved animations
  const toggleMenu = useCallback(() => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Menu open animation
    if (!menuVisible) {
      setMenuVisible(true);
      Animated.spring(menuAnimation, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      // Menu close animation
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
      });
    }
  }, [menuVisible, menuAnimation]);
  
  // Refresh data with optional force refresh
  const refreshData = useCallback((showRefreshIndicator = true) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Only set loading state to refreshing if we want to show the indicator
    if (showRefreshIndicator) {
      setLoadingState(LoadingState.REFRESHING);
    }
    
    loadUserData(false);
  }, []);
  
  // Change active tab
  const handleTabChange = useCallback((tab: string) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setActiveTab(tab);
  }, []);
  
  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      <Text style={styles.loadingText}>Cargando datos...</Text>
    </View>
  );
  
  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <FontAwesome5 name="exclamation-circle" size={40} color={ERROR_COLOR} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => refreshData()}
        activeOpacity={0.7}
      >
        <FontAwesome5 name="sync" size={14} color="#fff" />
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render content based on loading state
  const renderContent = () => {
    // Initial loading state
    if (loadingState === LoadingState.INITIAL_LOADING) {
      return renderLoading();
    }
    
    // Error state
    if (loadingState === LoadingState.ERROR) {
      return renderError();
    }
    
    // Success state - show MovimientoList
    return (
      <MovimientoList
        activeTab={activeTab}
        onTabChange={handleTabChange}
        token={token}
        isRefreshing={isRefreshing}
        onRefresh={refreshData}
      />
    );
  };
  
  // Main render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BLUE} />
      
      <Animated.View style={[
        styles.container, 
        { opacity: fadeAnim }
      ]}>
        <LinearGradient
          colors={[PRIMARY_BLUE, DARK_BLUE]}
          style={styles.gradientContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              onPress={toggleMenu} 
              style={styles.menuButton}
              activeOpacity={0.7}
              disabled={loadingState === LoadingState.INITIAL_LOADING}
            >
              <FontAwesome5 
                name={menuVisible ? "times" : "bars"} 
                size={22} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <Text style={styles.pageTitle}>Panel de Supervisor</Text>
            
            {/* Connection status indicator */}
            <View style={[
              styles.connectionIndicator, 
              { backgroundColor: appActive ? SUCCESS_COLOR : '#999' }
            ]} />
          </View>
          
          {/* Main content with animations */}
          {menuVisible ? (
            <Menu 
              visible={menuVisible} 
              onClose={toggleMenu} 
            />
          ) : (
            <Animated.View style={[
              styles.contentContainer,
              {
                transform: [
                  { 
                    translateX: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 300],
                    })
                  },
                  {
                    translateY: contentTranslateY
                  }
                ]
              }
            ]}>
              {renderContent()}
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Supervisor;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK_BLUE,
  },
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    padding: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SUCCESS_COLOR,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: LIGHT_BLUE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: -3 },
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: LIGHT_BLUE,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: LIGHT_BLUE,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Platform.select({
      ios: PLATFORM_STYLES.ios.buttonRadius,
      android: PLATFORM_STYLES.android.buttonRadius,
    }),
    ...Platform.select({
      ios: PLATFORM_STYLES.ios.shadowProps,
      android: {
        // Provide all required shadow properties for Android
      
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});