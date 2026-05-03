import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import storage from '../../src/utils/storage';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    icon: 'car-sport',
    title: 'Welcome to HelaParking',
    description: 'Find real-time smart parking slots, reserve instantly, and never wander for parking again.',
    color: '#3B82F6',
  },
  {
    id: 2,
    icon: 'card',
    title: 'Seamless Payments',
    description: 'Secure, contactless payments powered by Stripe. Pay once, park anywhere with zero hassle.',
    color: '#10B981',
  },
  {
    id: 3,
    icon: 'checkmark-circle',
    title: 'Easy Management',
    description: 'Track bookings, receive updates, and effortlessly view past histories within your profile.',
    color: '#8B5CF6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = async () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      await storage.setItemAsync('has_completed_onboarding', 'true');
      setOnboardingCompleted(true);
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    await storage.setItemAsync('has_completed_onboarding', 'true');
    setOnboardingCompleted(true);
    router.replace('/(auth)/login');
  };

  const onScrollEnd = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== currentIndex && index >= 0 && index < ONBOARDING_DATA.length) {
      setCurrentIndex(index);
    }
  };

  const currentSlide = ONBOARDING_DATA[currentIndex];

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.iconWrapper, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={76} color={item.color} />
      </View>
      <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={(item) => item.id.toString()}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_DATA.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? { backgroundColor: currentSlide.color, width: 22 } : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === ONBOARDING_DATA.length - 1 ? 'rocket' : 'arrow-forward'}
            size={18}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
  skipText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  flatList: { flex: 1 },
  slide: {
    width: width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 36,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  description: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 32, paddingBottom: 40 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 32 },
  dot: { height: 7, borderRadius: 3.5 },
  dotInactive: { backgroundColor: '#E5E7EB', width: 7 },
  btn: {
    height: 52, borderRadius: 26, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
