import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TextInput, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../hooks/storeHooks';
import { setBlockedAppsList, setAccessibilityEnabled } from '../store/slices';
import HayaShieldService, { InstalledApp } from '../services/HayaShieldService';
import {
  QUICK_BLOCK_APPS,
  isQuickBlockActive,
  toggleQuickBlock,
} from '../constants/blockApps';

export default function AppBlockingScreen() {
  const dispatch = useAppDispatch();
  const { blockedApps, accessibilityEnabled } = useAppSelector((state) => state.protection);

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceActive, setServiceActive] = useState(false);

  const checkAccessibilityStatus = () => {
    try {
      const active = HayaShieldService.isAccessibilityEnabled();
      setServiceActive(active);
      dispatch(setAccessibilityEnabled(active));
    } catch (e) {
      console.log('Error checking accessibility', e);
    }
  };

  const loadInstalledApps = () => {
    try {
      setLoading(true);
      const list = HayaShieldService.getInstalledApps();
      setApps(list || []);
    } catch (e) {
      console.log('Failed to fetch installed apps', e);
      // Fallback for non-Android devices or testing
      setApps([
        { name: 'Google Chrome', packageName: 'com.android.chrome' },
        { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
        { name: 'Instagram', packageName: 'com.instagram.android' },
        { name: 'YouTube', packageName: 'com.google.android.youtube' },
        { name: 'Facebook', packageName: 'com.facebook.katana' },
        { name: 'Snapchat', packageName: 'com.snapchat.android' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccessibilityStatus();
    loadInstalledApps();
    HayaShieldService.setBlockedApps(blockedApps);

    // Check accessibility status when the app resumes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAccessibilityStatus();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSub.remove();
    };
  }, []);

  const updateBlockedApps = (updatedList: string[]) => {
    dispatch(setBlockedAppsList(updatedList));
    HayaShieldService.setBlockedApps(updatedList);
  };

  const toggleAppBlocked = (packageName: string) => {
    const updatedList = blockedApps.includes(packageName)
      ? blockedApps.filter((p) => p !== packageName)
      : [...blockedApps, packageName];
    updateBlockedApps(updatedList);
  };

  const toggleQuickBlockApp = (app: (typeof QUICK_BLOCK_APPS)[number], enable: boolean) => {
    updateBlockedApps(toggleQuickBlock(blockedApps, app, enable));
  };

  const handleOpenSettings = () => {
    HayaShieldService.openAccessibilitySettings();
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const listHeader = (
    <>
      <View style={[styles.statusCard, serviceActive ? styles.activeCard : styles.inactiveCard]}>
        <View style={styles.cardHeader}>
          <Ionicons 
            name={serviceActive ? "checkmark-circle" : "warning"} 
            size={28} 
            color={serviceActive ? "#ECCF8E" : "#FF6B6B"} 
          />
          <Text style={styles.cardTitle}>App Blocker Service</Text>
        </View>
        
        <Text style={styles.cardDesc}>
          {serviceActive 
            ? 'Service is running. Distracting applications will be closed immediately.'
            : 'Required to block selected apps. Tap below to enable the Haya Shield service in system accessibility settings.'}
        </Text>

        {!serviceActive && (
          <TouchableOpacity style={styles.settingsBtn} onPress={handleOpenSettings}>
            <Text style={styles.settingsBtnText}>Enable App Blocker</Text>
            <Ionicons name="open" size={16} color="#1B443E" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Block</Text>
        <Text style={styles.sectionSub}>One-tap toggles for common browsers and apps</Text>
      </View>

      <View style={styles.quickBlockList}>
        {QUICK_BLOCK_APPS.map((app) => {
          const isBlocked = isQuickBlockActive(blockedApps, app);
          return (
            <View key={app.packageName} style={styles.quickBlockItem}>
              <View style={styles.quickBlockInfo}>
                <View style={styles.quickBlockIcon}>
                  <Ionicons name={app.icon as any} size={20} color="#ECCF8E" />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appPackage} numberOfLines={1}>{app.packageName}</Text>
                </View>
              </View>
              <Switch
                value={isBlocked}
                onValueChange={(value) => toggleQuickBlockApp(app, value)}
                trackColor={{ false: '#3A4B4B', true: 'rgba(236, 207, 142, 0.4)' }}
                thumbColor={isBlocked ? '#ECCF8E' : '#A0A0A0'}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Installed Apps</Text>
        <Text style={styles.sectionCount}>{blockedApps.length} Blocked</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#80A0A0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps by name..."
          placeholderTextColor="#80A0A0"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close" size={18} color="#80A0A0" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ECCF8E" />
          <Text style={styles.loadingText}>Reading installed apps...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredApps}
          keyExtractor={(item) => item.packageName}
          renderItem={({ item }) => {
            const isBlocked = blockedApps.includes(item.packageName);
            return (
              <View style={styles.appItem}>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appPackage} numberOfLines={1}>{item.packageName}</Text>
                </View>
                <Switch
                  value={isBlocked}
                  onValueChange={() => toggleAppBlocked(item.packageName)}
                  trackColor={{ false: '#3A4B4B', true: 'rgba(236, 207, 142, 0.4)' }}
                  thumbColor={isBlocked ? '#ECCF8E' : '#A0A0A0'}
                />
              </View>
            );
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No applications match your search.</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statusCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  activeCard: {
    backgroundColor: '#1B443E',
    borderColor: 'rgba(236, 207, 142, 0.25)',
  },
  inactiveCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#E0E0E0',
    lineHeight: 18,
    opacity: 0.9,
  },
  settingsBtn: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#ECCF8E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B443E',
    marginRight: 6,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  quickBlockList: {
    marginBottom: 20,
  },
  quickBlockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B443E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  quickBlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  quickBlockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 207, 142, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionCount: {
    fontSize: 12,
    color: '#ECCF8E',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C2727',
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#ECCF8E',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C2727',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  appInfo: {
    flex: 1,
    marginRight: 15,
  },
  appName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appPackage: {
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: '#A0A0A0',
  },
});
