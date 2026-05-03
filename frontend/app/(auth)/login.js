import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import storage from "../../src/utils/storage";
import api from "../../src/utils/api";
import { useAuthStore } from "../../src/store/authStore";
import { useRouter } from 'expo-router';

const showAlert = (title, msg) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n${msg}`); }
  else { Alert.alert(title, msg); }
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const validateEmail = (val) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError('Email is required.');
    } else if (!/^\S+@\S+\.\S+$/.test(val)) {
      setEmailError('Please enter a valid email.');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordError('Password is required.');
    } else if (val.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || emailError || passwordError) {
      showAlert('Error', 'Please fix any errors before signing in.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/auth/login', { email: email.trim().toLowerCase(), password });
      const { token, role, user } = res.data;
      await storage.setItemAsync('token', token);
      setAuth(token, role, user);
    } catch (error) {
      showAlert('Login Failed', error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnboarding = async () => {
    await storage.deleteItemAsync('has_completed_onboarding');
    useAuthStore.getState().setOnboardingCompleted(false);
    router.replace('/(auth)/onboarding');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Ionicons name="car-sport" size={32} color="#1a6bff" />
          </View>
          <Text style={styles.appName}>HelaParking</Text>
          <Text style={styles.tagline}>Smart Parking Reservation</Text>
        </View>

        {/* Glass form card — light tint on white background */}
        <GlassCard style={styles.form} intensity={40} fallbackColor="rgba(255,255,255,0.9)">
          <Text style={styles.formTitle}>Sign In</Text>

          <View style={[styles.field, emailError ? { borderColor: '#ef4444' } : (email ? { borderColor: '#10b981' } : {})]}>
            <Ionicons name="mail-outline" size={18} color="#8896b0" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#adb5bd"
              value={email}
              onChangeText={validateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

          <View style={[styles.field, passwordError ? { borderColor: '#ef4444' } : (password ? { borderColor: '#10b981' } : {})]}>
            <Ionicons name="lock-closed-outline" size={18} color="#8896b0" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#adb5bd"
              value={password}
              onChangeText={validatePassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#adb5bd"
              />
            </Pressable>
          </View>
          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.signInText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>

          <View style={[styles.footerRow, { marginTop: 14 }]}>
            <Pressable onPress={handleViewOnboarding}>
              <Text style={styles.footerLink}>View Onboarding Screen</Text>
            </Pressable>
          </View>
        </GlassCard>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  brand: { alignItems: 'center', marginBottom: 36 },
  logoWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: '#eef3ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.3 },
  tagline: { fontSize: 13, color: '#8896b0', marginTop: 4 },

  form: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 6,
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 20 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f7f9fc', borderRadius: 12,
    paddingHorizontal: 14, height: 50,
    borderWidth: 1, borderColor: '#e8ecf4', marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#1a1a2e' },

  forgotWrap: { alignItems: 'flex-end', marginBottom: 20 },
  forgot: { fontSize: 13, color: '#1a6bff', fontWeight: '500' },

  signInBtn: {
    backgroundColor: '#1a6bff', borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  signInText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerHint: { fontSize: 13, color: '#8896b0' },
  footerLink: { fontSize: 13, color: '#1a6bff', fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -8, marginBottom: 10, marginLeft: 4 },
});
