import React, { useRef, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions,
  AccessibilityInfo,
  Platform
} from 'react-native';

// Color palette aligned with the app's design system
const COLORS = {
  primary: '#2D6A4F',
  border: '#E0E0E0',
  background: '#FFFFFF',
  inactive: '#F5F5F5',
  textPrimary: '#FFFFFF',
  textInactive: '#757575',
  shadow: '#000000',
};

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  iconMap?: {[key: string]: React.ReactNode};
  badges?: {[key: string]: number};
  style?: object;
}

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabPress, 
  iconMap = {}, 
  badges = {}, 
  style
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const tabWidth = (screenWidth - 32) / tabs.length;
  
  // Find the index of active tab for animation
  const activeIndex = tabs.indexOf(activeTab);
  
  useEffect(() => {
    // Calculate position for the active indicator
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: activeIndex * tabWidth,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  }, [activeTab, activeIndex, slideAnim, fadeAnim, tabWidth]);

  // Announce tab changes for screen readers
  const announceTabChange = (tab: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(`${tab} tab selected`);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.slider, 
          { 
            opacity: fadeAnim,
            width: tabWidth,
            transform: [{ translateX: slideAnim }] 
          }
        ]} 
      />
      
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => {
              onTabPress(tab);
              announceTabChange(tab);
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab} tab${badges[tab] ? `, ${badges[tab]} notifications` : ''}`}
          >
            {iconMap[tab] && (
              <View style={styles.iconContainer}>
                {iconMap[tab]}
              </View>
            )}
            
            <Text style={[
              styles.tabText, 
              isActive && styles.activeTabText
            ]}>
              {tab}
            </Text>
            
            {badges[tab] && badges[tab] > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {badges[tab] > 99 ? '99+' : badges[tab]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Tabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 10,
    position: 'relative',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  slider: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textInactive,
  },
  activeTabText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  iconContainer: {
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  }
});