import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../hooks/storeHooks';
import { incrementDhikr, resetDhikr, setNotificationsEnabled } from '../store/slices';
import safeNotifications from '../utils/notifications';

export default function StatsScreen() {
  const dispatch = useAppDispatch();
  const { dhikrCount, notificationsEnabled, morningReminderTime, eveningReminderTime } = useAppSelector((state) => state.settings);
  const { daysProtected, totalWebsitesBlocked } = useAppSelector((state) => state.streak);
  const { focusSessionsCompleted } = useAppSelector((state) => state.focus);

  const handleDhikrPress = () => {
    dispatch(incrementDhikr());
  };

  const handleDhikrReset = () => {
    Alert.alert(
      'Reset Counter',
      'Are you sure you want to reset your Dhikr counter?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => dispatch(resetDhikr()) }
      ]
    );
  };

  const toggleNotifications = async (value: boolean) => {
    dispatch(setNotificationsEnabled(value));
    if (value) {
      // Request permission
      try {
        const { status } = await safeNotifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable notifications in system settings to receive reminders.');
          dispatch(setNotificationsEnabled(false));
          return;
        }
        
        // Schedule daily reminders
        await scheduleDailyReminders();
      } catch (e) {
        console.log(e);
      }
    } else {
      // Cancel all scheduled notifications
      await safeNotifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const scheduleDailyReminders = async () => {
    // Cancel any existing first
    await safeNotifications.cancelAllScheduledNotificationsAsync();

    // Morning Reminder
    const [mHrs, mMins] = morningReminderTime.split(':').map(Number);
    await safeNotifications.scheduleNotificationAsync({
      content: {
        title: 'Morning Reminder ☀️',
        body: 'Lower your gaze and guard your chastity. Have a pure and productive day!',
        sound: true,
      },
      trigger: {
        hour: mHrs,
        minute: mMins,
        repeats: true,
      } as any,
    });

    // Evening Reminder
    const [eHrs, eMins] = eveningReminderTime.split(':').map(Number);
    await safeNotifications.scheduleNotificationAsync({
      content: {
        title: 'Evening Reminder 🌙',
        body: 'Reflect on your day. Seek forgiveness (Istighfar) and protect your heart.',
        sound: true,
      },
      trigger: {
        hour: eHrs,
        minute: eMins,
        repeats: true,
      } as any,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* 1. Interactive Dhikr Counter */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dhikr Counter</Text>
        <Text style={styles.cardSub}>Engage your tongue and heart in remembrance to resist temptation.</Text>
        
        <View style={styles.dhikrContainer}>
          <TouchableOpacity 
            style={styles.dhikrBtn} 
            onPress={handleDhikrPress}
            activeOpacity={0.85}
          >
            <Text style={styles.dhikrCount}>{dhikrCount}</Text>
            <Text style={styles.dhikrLabel}>Tap to count</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetBtn} onPress={handleDhikrReset}>
            <Ionicons name="refresh" size={16} color="#ECCF8E" style={{ marginRight: 4 }} />
            <Text style={styles.resetBtnText}>Reset Counter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Notification Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Reminders</Text>
        <Text style={styles.cardSub}>Schedule morning and evening notifications of Quran verses and Hadith.</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Text style={styles.settingSub}>Receive daily reminders on your device</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#3A4B4B', true: 'rgba(236, 207, 142, 0.4)' }}
            thumbColor={notificationsEnabled ? '#ECCF8E' : '#A0A0A0'}
          />
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <Text style={styles.timeTitle}>Morning</Text>
            <Text style={styles.timeValue}>{morningReminderTime}</Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeTitle}>Evening</Text>
            <Text style={styles.timeValue}>{eveningReminderTime}</Text>
          </View>
        </View>
      </View>

      {/* 3. About Section */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Haya Shield</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0 (Offline MVP)</Text>
        <Text style={styles.aboutDesc}>
          Haya Shield is built completely offline to ensure 100% privacy. No cloud databases, no trackers, and no external requests. All lists, logs, and statistics are stored securely on your device.
        </Text>
        <Text style={styles.aboutFooter}>
          "Modesty is part of Faith." — Prophet Muhammad (ﷺ)
        </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1B443E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 11,
    color: '#ECCF8E',
    marginTop: 2,
    opacity: 0.85,
    marginBottom: 15,
  },
  dhikrContainer: {
    alignItems: 'center',
  },
  dhikrBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#112D2D',
    borderWidth: 4,
    borderColor: '#ECCF8E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 15,
  },
  dhikrCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dhikrLabel: {
    fontSize: 10,
    color: '#ECCF8E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: 'rgba(236, 207, 142, 0.1)',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#ECCF8E',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 11,
    color: '#A0A0A0',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#112D2D',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.1)',
  },
  timeTitle: {
    fontSize: 11,
    color: '#ECCF8E',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  aboutCard: {
    backgroundColor: '#1C2727',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  aboutVersion: {
    fontSize: 11,
    color: '#ECCF8E',
    marginTop: 2,
    fontWeight: '600',
  },
  aboutDesc: {
    fontSize: 12,
    color: '#A0A0A0',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 15,
  },
  aboutFooter: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#ECCF8E',
    textAlign: 'center',
    fontWeight: '500',
  },
});
