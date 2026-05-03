import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, TouchableOpacity, StyleSheet,
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

const VEHICLE_TYPES = [
  { label: 'Car',      icon: 'car-outline' },
  { label: 'Bike',     icon: 'bicycle-outline' },
  { label: 'EV',       icon: 'flash-outline' },
  { label: 'Disabled', icon: 'accessibility-outline' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Please enter a valid email.');
    } else {
      setEmailError('');
    }
  };

  const validateOtp = (val) => {
    setOtp(val);
    if (!val.trim()) {
      setOtpError('Code is required.');
    } else if (val.trim().length !== 6) {
      setOtpError('Code must be 6 digits.');
    } else {
      setOtpError('');
    }
  };

  const validateName = (val) => {
    setName(val);
    if (!val.trim()) {
      setNameError('Full Name is required.');
    } else if (val.trim().length < 2) {
      setNameError('Please enter at least 2 characters.');
    } else {
      setNameError('');
    }
  };

  const validatePhone = (val) => {
    setPhoneNumber(val);
    if (!val.trim()) {
      setPhoneError('Phone number is required.');
    } else if (val.trim().length !== 10 || !/^\d{10}$/.test(val.trim())) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const validatePassword = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordError('Password is required.');
    } else if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
    } else {
      setPasswordError('');
    }
    if (confirmPassword && val !== confirmPassword) {
      setConfirmError('Passwords do not match.');
    } else if (confirmPassword && val === confirmPassword) {
      setConfirmError('');
    }
  };

  const validateConfirmPassword = (val) => {
    setConfirmPassword(val);
    if (!val) {
      setConfirmError('Confirm password is required.');
    } else if (val !== password) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError('');
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showAlert('Error', 'Please enter your email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Error', 'Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/auth/send-signup-otp', { email: email.trim().toLowerCase() });
      showAlert('Success', 'Verification code sent to your email.');
      setStep(2);
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showAlert('Error', 'Please enter the verification code.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/auth/verify-signup-otp', { email: email.trim().toLowerCase(), otp: otp.trim() });
      showAlert('Success', 'Email verified successfully.');
      setStep(3);
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Error', 'Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      showAlert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/auth/register', {
        name: name.trim(), email: email.trim().toLowerCase(), password, phoneNumber: phoneNumber.trim(),
      });
      showAlert('Success', 'Account created successfully! Redirecting to login.');
      router.replace('/login');
    } catch (error) {
      showAlert('Registration Failed', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Step 1: Enter your email'}
            {step === 2 && 'Step 2: Verify code'}
            {step === 3 && 'Step 3: Complete your details'}
          </Text>
        </View>

        <GlassCard style={styles.form} intensity={40} fallbackColor="rgba(255,255,255,0.9)">
          {step === 1 && (
            <>
              <View style={[styles.field, emailError ? { borderColor: '#ef4444' } : (email ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="mail-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#adb5bd" value={email} onChangeText={validateEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              <TouchableOpacity
                style={[styles.registerBtn, (loading || !!emailError) && { opacity: 0.75 }]}
                onPress={handleSendOtp}
                disabled={loading || !!emailError}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Send Verification Code</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.field}>
                <Ionicons name="mail-outline" size={18} color="#8896b0" />
                <TextInput style={[styles.input, { color: '#64748b' }]} value={email} editable={false} />
              </View>
              <View style={[styles.field, otpError ? { borderColor: '#ef4444' } : (otp ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="key-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Enter 6-digit code" placeholderTextColor="#adb5bd" value={otp} onChangeText={validateOtp} keyboardType="numeric" />
              </View>
              {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}
              <TouchableOpacity
                style={[styles.registerBtn, (loading || !!otpError) && { opacity: 0.75 }]}
                onPress={handleVerifyOtp}
                disabled={loading || !!otpError}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Verify Code</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <View style={[styles.field, { backgroundColor: '#e2e8f0' }]}>
                <Ionicons name="mail-outline" size={18} color="#8896b0" />
                <TextInput style={[styles.input, { color: '#64748b' }]} value={email} editable={false} />
              </View>
              <View style={[styles.field, nameError ? { borderColor: '#ef4444' } : (name ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="person-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#adb5bd" value={name} onChangeText={validateName} />
              </View>
              {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

              <View style={[styles.field, phoneError ? { borderColor: '#ef4444' } : (phoneNumber ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="call-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#adb5bd" value={phoneNumber} onChangeText={validatePhone} keyboardType="phone-pad" />
              </View>
              {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

              <View style={[styles.field, passwordError ? { borderColor: '#ef4444' } : (password ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#adb5bd" value={password} onChangeText={validatePassword} secureTextEntry />
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              <View style={[styles.field, confirmError ? { borderColor: '#ef4444' } : (confirmPassword ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8896b0" />
                <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#adb5bd" value={confirmPassword} onChangeText={validateConfirmPassword} secureTextEntry />
              </View>
              {!!confirmError && <Text style={styles.errorText}>{confirmError}</Text>}

              <TouchableOpacity
                style={[styles.registerBtn, (loading || !!nameError || !!phoneError || !!passwordError || !!confirmError) && { opacity: 0.75 }]}
                onPress={handleRegister}
                disabled={loading || !!nameError || !!phoneError || !!passwordError || !!confirmError}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </GlassCard>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#8896b0', marginTop: 4 },

  form: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 6,
  },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f7f9fc', borderRadius: 12,
    paddingHorizontal: 14, height: 50,
    borderWidth: 1, borderColor: '#e8ecf4', marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#1a1a2e', textAlign: 'left' },

  label: { fontSize: 12, fontWeight: '600', color: '#4a5568', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: '#e8ecf4',
  },
  chipActive: { backgroundColor: '#1a6bff', borderColor: '#1a6bff' },
  chipText: { fontSize: 13, color: '#5c6b8a', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  registerBtn: {
    backgroundColor: '#1a6bff', borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 20,
  },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerHint: { fontSize: 13, color: '#8896b0' },
  footerLink: { fontSize: 13, color: '#1a6bff', fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -8, marginBottom: 10, marginLeft: 4 },
});
