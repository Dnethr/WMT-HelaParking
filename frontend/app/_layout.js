import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, useColorScheme, StyleSheet } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from "../src/store/authStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import storage from "../src/utils/storage";

// Removed NavigationBar configuration to fix edge-to-edge warnings

export default function RootLayout() {
  const { token, role, user, onboardingCompleted, setOnboardingCompleted } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);
  const colorScheme = useColorScheme();

  usePushNotifications(user);

  useEffect(() => {
    storage.getItemAsync('has_completed_onboarding').then((val) => {
      setHasCompletedOnboarding(val === 'true');
      if (val === 'true') setOnboardingCompleted(true);
    }).catch(() => setHasCompletedOnboarding(false));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || hasCompletedOnboarding === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[1] === 'onboarding';

    if (!hasCompletedOnboarding && !onboardingCompleted) {
      if (!isOnboarding) router.replace('/(auth)/onboarding');
      return;
    }

    if (!token) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else {
      if (inAuthGroup) {
        if (role === 'driver') router.replace('/(driver)');
        else if (role === 'admin') router.replace('/(admin)');
        else if (role === 'superadmin') router.replace('/(superadmin)');
      }
    }
  }, [token, role, segments, isReady, hasCompletedOnboarding, onboardingCompleted]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={['#deeaff', '#f0f4ff', '#ede8ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ThemeProvider value={DefaultTheme}>
        <SafeAreaProvider>
          <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(driver)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(superadmin)" />
              <Stack.Screen name="global-notifications" options={{ presentation: 'modal' }} />
            </Stack>
          </StripeProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

