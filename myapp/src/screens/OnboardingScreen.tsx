import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../components/AppLogo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import db from '../utils/db';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: 'shield-half',
    title: 'Protect Your Modesty',
    description: 'Haya Shield is your local offline protector. We block pornography, explicit websites, gambling, and unsafe ads entirely on your device.',
    color: '#ECCF8E',
  },
  {
    icon: 'apps',
    title: 'Block Distracting Apps',
    description: 'Focus on what matters. Select social media or entertainment apps (like TikTok, Instagram, YouTube) to block on demand or set Focus schedules.',
    color: '#ECCF8E',
  },
  {
    icon: 'heart-half',
    title: 'Purify Your Heart',
    description: 'When temptation is blocked, we guide you back. Receive elegant Quran verses, authentic Hadiths, and practice Dhikr with our interactive counter.',
    color: '#ECCF8E',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveSlide(slideIndex);
  };

  const handleFinish = () => {
    db.set('completedOnboarding', true);
    navigation.replace('Main');
  };

  return (
    <LinearGradient colors={['#1B443E', '#112D2D']} style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, idx) => (
          <View key={idx} style={styles.slide}>
            <View style={styles.iconContainer}>
              {idx === 0 ? (
                <AppLogo width={width * 0.82} height={width * 0.82} />
              ) : (
                <Ionicons name={slide.icon} size={100} color={slide.color} />
              )}
              <View style={styles.circleBg} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              activeSlide === idx ? styles.activeDot : null,
            ]}
          />
        ))}
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {activeSlide === slides.length - 1 ? (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#1B443E" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.swipeText}>Swipe to continue</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  circleBg: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ECCF8E',
    opacity: 0.1,
    zIndex: -1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: '#ECECEC',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.85,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginHorizontal: 5,
  },
  activeDot: {
    opacity: 1,
    backgroundColor: '#ECCF8E',
    width: 20,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 50,
    height: 55,
    justifyContent: 'center',
  },
  finishBtn: {
    flexDirection: 'row',
    backgroundColor: '#ECCF8E',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#ECCF8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B443E',
    marginRight: 10,
  },
  swipeText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.6,
  },
});
