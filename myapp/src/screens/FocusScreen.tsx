import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../hooks/storeHooks';
import { startFocusSession, stopFocusSession, completeFocusSession } from '../store/slices';
import HayaShieldService from '../services/HayaShieldService';

export default function FocusScreen() {
  const dispatch = useAppDispatch();
  const { inFocusMode, focusDuration, focusEndTime } = useAppSelector((state) => state.focus);
  const { blockedApps } = useAppSelector((state) => state.protection);

  const [timeLeft, setTimeLeft] = useState(0); // In seconds
  const timerRef = useRef<any>(null);

  // Sync remaining time
  useEffect(() => {
    if (inFocusMode && focusEndTime > 0) {
      const calculateTimeLeft = () => {
        const diff = Math.ceil((focusEndTime - Date.now()) / 1000);
        if (diff <= 0) {
          handleFocusCompleted();
        } else {
          setTimeLeft(diff);
        }
      };

      calculateTimeLeft();
      timerRef.current = setInterval(calculateTimeLeft, 1000);
    } else {
      setTimeLeft(focusDuration * 60);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inFocusMode, focusEndTime, focusDuration]);

  const handleFocusCompleted = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop native blocking
    HayaShieldService.setFocusMode(false, 0, []);
    dispatch(completeFocusSession());
    
    Alert.alert(
      'MashaAllah!',
      'You successfully completed your Focus Mode session. May Allah bless your efforts!',
      [{ text: 'Alhamdulillah' }]
    );
  };

  const startFocus = () => {
    // Check if accessibility service is enabled (required to block apps in focus mode)
    const isAccessEnabled = HayaShieldService.isAccessibilityEnabled();
    if (!isAccessEnabled) {
      Alert.alert(
        'Accessibility Required',
        'To block distracting apps during Focus Mode, please enable Haya Shield App Blocker in accessibility settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => HayaShieldService.openAccessibilitySettings() }
        ]
      );
      return;
    }

    if (blockedApps.length === 0) {
      Alert.alert(
        'No Apps Selected',
        'Please go to the Apps tab and select at least one application to block during your Focus Session.',
        [{ text: 'OK' }]
      );
      return;
    }

    const durationMs = focusDuration * 60 * 1000;
    const endTime = Date.now() + durationMs;
    
    // Start native focus mode app blocking
    HayaShieldService.setFocusMode(true, endTime, blockedApps);
    dispatch(startFocusSession({ duration: focusDuration, endTime }));
  };

  const cancelFocus = () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to stop your Focus Session? Self-discipline is a virtue.',
      [
        { text: 'Keep Focusing', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            HayaShieldService.setFocusMode(false, 0, []);
            dispatch(stopFocusSession());
          }
        }
      ]
    );
  };

  const changeDuration = (change: number) => {
    if (inFocusMode) return;
    const newDur = Math.max(5, Math.min(120, focusDuration + change));
    // Save to Redux (the slice handles saving to MMKV)
    dispatch(startFocusSession({ duration: newDur, endTime: 0 }));
    dispatch(stopFocusSession()); // Sets active to false
  };

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculate progress circle stroke
  const totalSecs = focusDuration * 60;
  const progress = totalSecs > 0 ? (totalSecs - timeLeft) / totalSecs : 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        {/* 1. Header Info */}
        <Text style={styles.title}>Focus Mode</Text>
        <Text style={styles.subtitle}>
          {inFocusMode 
            ? 'Stay disciplined. Your selected apps are blocked.' 
            : 'Set your focus timer to lock social media and stay productive.'}
        </Text>

        {/* 2. Circular Timer View */}
        <View style={styles.timerCircleOuter}>
          <View style={styles.timerCircleInner}>
            <Text style={styles.timerText}>{formatMinSec(timeLeft)}</Text>
            <Text style={styles.timerSub}>{inFocusMode ? 'FOCUSING' : 'MINUTES'}</Text>
          </View>
        </View>

        {/* 3. Duration Selectors (only visible when not active) */}
        {!inFocusMode && (
          <View style={styles.selectorContainer}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => changeDuration(-5)}>
              <Ionicons name="remove" size={24} color="#1B443E" />
            </TouchableOpacity>
            <Text style={styles.durationLabel}>{focusDuration} min</Text>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => changeDuration(5)}>
              <Ionicons name="add" size={24} color="#1B443E" />
            </TouchableOpacity>
          </View>
        )}

        {/* 4. Start / Stop Buttons */}
        <View style={styles.buttonContainer}>
          {inFocusMode ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelFocus}>
              <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              <Text style={styles.cancelBtnText}>Give Up Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={startFocus}>
              <Ionicons name="play" size={20} color="#1B443E" />
              <Text style={styles.startBtnText}>Start Focus Session</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  timerCircleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: '#1B443E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  timerCircleInner: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: '#1B443E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ECCF8E',
  },
  timerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  timerSub: {
    fontSize: 12,
    color: '#ECCF8E',
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 6,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECCF8E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 30,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  startBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#ECCF8E',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B443E',
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#C84040',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
