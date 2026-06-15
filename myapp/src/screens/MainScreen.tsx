import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, AppState, AppStateStatus, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../components/AppLogo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Import Redux hooks & actions
import { useAppDispatch } from '../hooks/storeHooks';
import { incrementBlocksCount, logBlockedDomainEvent, updateStreak } from '../store/slices';

// Import Native Service
import HayaShieldService from '../services/HayaShieldService';

// Import Tab Screens
import DashboardScreen from './DashboardScreen';
import ProtectionScreen from './ProtectionScreen';
import FocusScreen from './FocusScreen';
import AppBlockingScreen from './AppBlockingScreen';
import StatsScreen from './StatsScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function MainScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(0);
  const headerLogoSize = Math.min(screenWidth * 0.58, 260);

  // Check for app blocking alerts from accessibility service on startup and resume
  const checkPendingAppBlocks = () => {
    try {
      const blockedApp = HayaShieldService.getPendingBlockedApp();
      if (blockedApp) {
        dispatch(incrementBlocksCount());
        navigation.navigate('Reminder', { blockedApp });
      }
    } catch (e) {
      console.log('Error checking pending apps', e);
    }
  };

  useEffect(() => {
    // 1. Initial check
    checkPendingAppBlocks();
    dispatch(updateStreak());

    // 2. Add AppState change listener (handles resume from background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPendingAppBlocks();
        dispatch(updateStreak());
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // 3. Register native listener for VPN blocked domain events
    let vpnBlockSub: any = null;
    try {
      vpnBlockSub = HayaShieldService.addBlockedDomainListener((event) => {
        const { domain, timestamp } = event;
        // Update Redux state
        dispatch(incrementBlocksCount());
        dispatch(logBlockedDomainEvent({ domain, timestamp }));
        // Open Islamic block screen
        navigation.navigate('Reminder', { blockedDomain: domain });
      });
    } catch (e) {
      console.log('Failed to start VPN block listener. Might be on non-Android device.', e);
    }

    return () => {
      appStateSub.remove();
      if (vpnBlockSub) {
        vpnBlockSub.remove();
      }
    };
  }, []);

  // Render the selected tab screen
  const renderScreen = () => {
    switch (activeTab) {
      case 0:
        return <DashboardScreen onNavigateToTab={setActiveTab} />;
      case 1:
        return <ProtectionScreen />;
      case 2:
        return <FocusScreen />;
      case 3:
        return <AppBlockingScreen />;
      case 4:
        return <StatsScreen />;
      default:
        return <DashboardScreen onNavigateToTab={setActiveTab} />;
    }
  };

  const tabs = [
    { name: 'Home', icon: 'home-outline', iconActive: 'home' },
    { name: 'Shield', icon: 'shield-outline', iconActive: 'shield' },
    { name: 'Focus', icon: 'timer-outline', iconActive: 'timer' },
    { name: 'Apps', icon: 'apps-outline', iconActive: 'apps' },
    { name: 'Stats', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <AppLogo width={headerLogoSize} height={headerLogoSize} />
        </View>
        <View style={styles.headerDivider} />
      </View>

      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Floating Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.tabItem}
                onPress={() => setActiveTab(idx)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? (tab.iconActive as any) : (tab.icon as any)}
                  size={24}
                  color={isActive ? '#ECCF8E' : '#A0A0A0'}
                />
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#112D2D',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(236, 207, 142, 0.2)',
    marginTop: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#112D2D',
  },
  tabBarContainer: {
    backgroundColor: '#112D2D',
    paddingBottom: Platform.OS === 'ios' ? 10 : 15,
    paddingTop: 5,
    paddingHorizontal: 15,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1B443E',
    borderRadius: 25,
    height: 65,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ECCF8E',
    fontWeight: 'bold',
  },
});
