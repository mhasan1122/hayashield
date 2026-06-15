import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../hooks/storeHooks';
import { setVpnEnabled } from '../store/slices';
import HayaShieldService from '../services/HayaShieldService';
import { getRandomAyah, QuranVerse } from '../utils/islamicData';

interface DashboardProps {
  onNavigateToTab: (index: number) => void;
}

export default function DashboardScreen({ onNavigateToTab }: DashboardProps) {
  const dispatch = useAppDispatch();
  
  // Select state from slices
  const { vpnEnabled, blockedDomains } = useAppSelector((state) => state.protection);
  const { daysProtected, totalWebsitesBlocked, dailyBlocksCount } = useAppSelector((state) => state.streak);
  const { focusSessionsCompleted } = useAppSelector((state) => state.focus);

  // Daily Ayah
  const [dailyAyah, setDailyAyah] = useState<QuranVerse | null>(null);

  useEffect(() => {
    setDailyAyah(getRandomAyah());
  }, []);

  const toggleProtection = async () => {
    try {
      if (vpnEnabled) {
        HayaShieldService.stopVpn();
        dispatch(setVpnEnabled(false));
      } else {
        // Sync blocklist to native file before starting
        HayaShieldService.setBlockedDomains(blockedDomains);
        const hasPermission = HayaShieldService.checkVpnPermission();
        if (hasPermission) {
          HayaShieldService.startVpn();
          dispatch(setVpnEnabled(true));
        } else {
          HayaShieldService.requestVpnPermission();
        }
      }
    } catch (e) {
      console.log('Error toggling VPN', e);
    }
  };

  const shareAyah = async () => {
    if (!dailyAyah) return;
    try {
      await Share.share({
        message: `"${dailyAyah.translation}"\n- ${dailyAyah.reference}\n\nShared via Haya Shield app.`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 1. Protection Toggle Card */}
      <View style={[styles.card, vpnEnabled ? styles.activeCard : styles.inactiveCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.shieldIconWrapper}>
            <Ionicons 
              name={vpnEnabled ? "shield-checkmark" : "shield-outline"} 
              size={60} 
              color={vpnEnabled ? "#ECCF8E" : "#A0A0A0"} 
            />
          </View>
          <View style={styles.protectionDetails}>
            <Text style={styles.protectionLabel}>SHIELD STATUS</Text>
            <Text style={styles.protectionStatus}>
              {vpnEnabled ? "Active & Filtering" : "Protection Disabled"}
            </Text>
            <Text style={styles.protectionSub}>
              {vpnEnabled ? "DNS requests intercepted offline" : "Your device is currently exposed"}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.toggleBtn, vpnEnabled ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={toggleProtection}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={vpnEnabled ? "power" : "play"} 
            size={20} 
            color={vpnEnabled ? "#1B443E" : "#FFFFFF"} 
          />
          <Text style={[styles.toggleBtnText, vpnEnabled ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
            {vpnEnabled ? "Disable Shield" : "Enable Shield"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Stats Grid */}
      <View style={styles.gridContainer}>
        {/* Streak Stat */}
        <View style={styles.gridCard}>
          <View style={styles.gridHeader}>
            <Ionicons name="flame" size={24} color="#ECCF8E" />
            <Text style={styles.gridTitle}>Streak</Text>
          </View>
          <Text style={styles.gridValue}>{daysProtected} Days</Text>
          <Text style={styles.gridSub}>Protected clean</Text>
        </View>

        {/* Blocks Count */}
        <View style={styles.gridCard}>
          <View style={styles.gridHeader}>
            <Ionicons name="close-circle" size={24} color="#ECCF8E" />
            <Text style={styles.gridTitle}>Blocked Today</Text>
          </View>
          <Text style={styles.gridValue}>{dailyBlocksCount}</Text>
          <Text style={styles.gridSub}>{totalWebsitesBlocked} total</Text>
        </View>
      </View>

      {/* 3. Focus Mode Shortcut Card */}
      <TouchableOpacity 
        style={styles.focusCard} 
        onPress={() => onNavigateToTab(2)}
        activeOpacity={0.9}
      >
        <View style={styles.focusCardLeft}>
          <Ionicons name="timer" size={32} color="#ECCF8E" />
          <View style={styles.focusCardText}>
            <Text style={styles.focusCardTitle}>Focus Session</Text>
            <Text style={styles.focusCardSub}>
              {focusSessionsCompleted} session{focusSessionsCompleted !== 1 ? 's' : ''} completed today
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ECCF8E" />
      </TouchableOpacity>

      {/* 4. Daily Ayah Card */}
      {dailyAyah && (
        <View style={styles.ayahCard}>
          <View style={styles.ayahHeader}>
            <View style={styles.ayahHeaderLeft}>
              <Ionicons name="book" size={20} color="#ECCF8E" />
              <Text style={styles.ayahTitle}>Daily Verse</Text>
            </View>
            <TouchableOpacity onPress={shareAyah}>
              <Ionicons name="share-social-outline" size={20} color="#ECCF8E" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.arabicText}>{dailyAyah.arabic}</Text>
          <Text style={styles.translationText}>"{dailyAyah.translation}"</Text>
          <Text style={styles.referenceText}>— {dailyAyah.reference}</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  activeCard: {
    backgroundColor: '#1B443E',
    borderColor: 'rgba(236, 207, 142, 0.4)',
  },
  inactiveCard: {
    backgroundColor: '#1C2727',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldIconWrapper: {
    marginRight: 15,
  },
  protectionDetails: {
    flex: 1,
  },
  protectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ECCF8E',
    letterSpacing: 1.5,
  },
  protectionStatus: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  protectionSub: {
    fontSize: 12,
    color: '#E0E0E0',
    marginTop: 4,
    opacity: 0.8,
  },
  toggleBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#ECCF8E',
  },
  toggleBtnInactive: {
    backgroundColor: '#1B443E',
    borderWidth: 1,
    borderColor: '#ECCF8E',
  },
  toggleBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  toggleBtnTextActive: {
    color: '#1B443E',
  },
  toggleBtnTextInactive: {
    color: '#ECCF8E',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#1B443E',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '600',
    opacity: 0.8,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ECCF8E',
  },
  gridSub: {
    fontSize: 10,
    color: '#E0E0E0',
    marginTop: 4,
    opacity: 0.6,
  },
  focusCard: {
    flexDirection: 'row',
    backgroundColor: '#1B443E',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  focusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusCardText: {
    marginLeft: 12,
  },
  focusCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  focusCardSub: {
    fontSize: 11,
    color: '#ECCF8E',
    marginTop: 2,
    opacity: 0.8,
  },
  ayahCard: {
    backgroundColor: '#1A3330',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.2)',
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ayahHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ayahTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ECCF8E',
    marginLeft: 8,
  },
  arabicText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'sans-serif',
  },
  translationText: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ECCF8E',
    textAlign: 'right',
  },
});
