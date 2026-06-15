import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../components/AppLogo';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// State & Utilities
import { useAppDispatch } from '../hooks/storeHooks';
import { incrementDhikr } from '../store/slices';
import { getRandomAyah, getRandomHadith, getRandomMotivation, QuranVerse, Hadith } from '../utils/islamicData';
import { getAppDisplayName } from '../constants/blockApps';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reminder'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Reminder'>;

export default function ReminderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const dispatch = useAppDispatch();

  // Params
  const { blockedApp, blockedDomain } = route.params || {};

  // Random Content
  const [ayah, setAyah] = useState<QuranVerse | null>(null);
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [motivation, setMotivation] = useState('');
  
  // Local Dhikr Counter
  const [localDhikr, setLocalDhikr] = useState(0);
  const [activeTab, setActiveTab] = useState<'ayah' | 'hadith'>('ayah');

  useEffect(() => {
    setAyah(getRandomAyah());
    setHadith(getRandomHadith());
    setMotivation(getRandomMotivation());
  }, []);

  const handleDhikrPress = () => {
    setLocalDhikr(prev => prev + 1);
    dispatch(incrementDhikr());
  };

  const handleClose = () => {
    navigation.replace('Main');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 1. Header Alert */}
      <View style={styles.alertHeader}>
        <AppLogo width={160} height={160} style={styles.alertLogo} />
        <Text style={styles.alertTitle}>Harmful Content Intercepted</Text>
        <Text style={styles.alertSub}>
          {blockedApp 
            ? `${getAppDisplayName(blockedApp)} has been closed.` 
            : blockedDomain 
              ? `Connection to "${blockedDomain}" was blocked.`
              : 'Harmful distraction was successfully blocked.'}
        </Text>
      </View>

      {/* 2. Toggle Tab between Quran and Hadith */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'ayah' ? styles.tabBtnActive : null]}
          onPress={() => setActiveTab('ayah')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ayah' ? styles.tabBtnTextActive : null]}>Quran Verse</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'hadith' ? styles.tabBtnActive : null]}
          onPress={() => setActiveTab('hadith')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'hadith' ? styles.tabBtnTextActive : null]}>Prophetic Hadith</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Islamic Reminders Content */}
      <View style={styles.contentCard}>
        {activeTab === 'ayah' && ayah ? (
          <View>
            <Text style={styles.arabicText}>{ayah.arabic}</Text>
            <Text style={styles.translationText}>"{ayah.translation}"</Text>
            <Text style={styles.referenceText}>— {ayah.reference}</Text>
          </View>
        ) : hadith ? (
          <View>
            <Text style={styles.hadithText}>"{hadith.text}"</Text>
            <Text style={styles.narratorText}>Narrated by {hadith.narrator}</Text>
            <Text style={styles.referenceText}>— {hadith.source}</Text>
          </View>
        ) : null}
        
        <View style={styles.divider} />
        <Text style={styles.motivationText}>{motivation}</Text>
      </View>

      {/* 4. Interactive Dhikr Section */}
      <View style={styles.dhikrCard}>
        <Text style={styles.dhikrTitle}>Redirect Your Mind</Text>
        <Text style={styles.dhikrDesc}>
          Recite: "SubhanAllah", "Alhamdulillah" or "Allahu Akbar". Tapping the counter strengthens your heart.
        </Text>
        
        <TouchableOpacity 
          style={styles.dhikrBtn} 
          onPress={handleDhikrPress}
          activeOpacity={0.8}
        >
          <Text style={styles.dhikrCount}>{localDhikr}</Text>
          <Text style={styles.dhikrBtnSub}>TAP TO RECITE</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeBtnText}>Back to Safety</Text>
          <Ionicons name="arrow-back" size={18} color="#1B443E" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  alertLogo: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  alertSub: {
    fontSize: 13,
    color: '#ECCF8E',
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1B443E',
    borderRadius: 20,
    height: 40,
    padding: 3,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.2)',
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17,
  },
  tabBtnActive: {
    backgroundColor: '#ECCF8E',
  },
  tabBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#1B443E',
    fontWeight: 'bold',
  },
  contentCard: {
    backgroundColor: '#1B443E',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.25)',
  },
  arabicText: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 36,
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'sans-serif',
  },
  translationText: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  hadithText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  narratorText: {
    fontSize: 12,
    color: '#ECCF8E',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  referenceText: {
    fontSize: 11,
    color: '#ECCF8E',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(236, 207, 142, 0.15)',
    marginVertical: 15,
  },
  motivationText: {
    fontSize: 13,
    color: '#ECCF8E',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  dhikrCard: {
    backgroundColor: '#1C2727',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dhikrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dhikrDesc: {
    fontSize: 11,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 15,
  },
  dhikrBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1B443E',
    borderWidth: 3,
    borderColor: '#ECCF8E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dhikrCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dhikrBtnSub: {
    fontSize: 8,
    color: '#ECCF8E',
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: 'bold',
  },
  footer: {
    width: '100%',
  },
  closeBtn: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#ECCF8E',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B443E',
  },
});
