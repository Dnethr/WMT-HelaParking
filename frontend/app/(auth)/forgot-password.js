import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";
import { useRouter } from 'expo-router';

const showAlert = (title, msg) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n${msg}`); }
  else { Alert.alert(title, msg); }
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
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
      setOtpError('Reset code is required.');
    } else if (val.trim().length !== 6) {
      setOtpError('Reset code must be exactly 6 digits.');
    } else {
      setOtpError('');
    }
  };

  const validatePassword = (val) => {
    setNewPassword(val);
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
    } else if (val !== newPassword) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError('');
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim() || emailError) {
      showAlert('Error', 'Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      showAlert('Success', res.data.message || 'A reset code has been sent to your email.');
      setStep(2);
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword || otpError || passwordError || confirmError) {
      showAlert('Error', 'Please fix any errors before continuing.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword
      });
      showAlert('Success', 'Password has been reset successfully. Please sign in with your new password.');
      router.replace('/(auth)/login');
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code and set your new password'}
          </Text>
        </View>

        <GlassCard style={styles.form} intensity={40} fallbackColor="rgba(255,255,255,0.9)">
          {step === 1 ? (
            <>
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

              <TouchableOpacity
                style={[styles.submitBtn, (loading || !!emailError) && { opacity: 0.75 }]}
                onPress={handleSendOtp}
                disabled={loading || !!emailError}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Get Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={[styles.field, otpError ? { borderColor: '#ef4444' } : (otp ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="keypad-outline" size={18} color="#8896b0" />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit reset code"
                  placeholderTextColor="#adb5bd"
                  value={otp}
                  onChangeText={validateOtp}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
              </View>
              {!!otpError && <Text style={styles.errorText}>{otpError}</Text>}

              <View style={[styles.field, passwordError ? { borderColor: '#ef4444' } : (newPassword ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8896b0" />
                <TextInput
                  style={styles.input}
                  placeholder="New Password (min 8 chars)"
                  placeholderTextColor="#adb5bd"
                  value={newPassword}
                  onChangeText={validatePassword}
                  secureTextEntry
                />
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              <View style={[styles.field, confirmError ? { borderColor: '#ef4444' } : (confirmPassword ? { borderColor: '#10b981' } : {})]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8896b0" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#adb5bd"
                  value={confirmPassword}
                  onChangeText={validateConfirmPassword}
                  secureTextEntry
                />
              </View>
              {!!confirmError && <Text style={styles.errorText}>{confirmError}</Text>}

              <TouchableOpacity
                style={[styles.submitBtn, (loading || !!otpError || !!passwordError || !!confirmError) && { opacity: 0.75 }]}
                onPress={handleResetPassword}
                disabled={loading || !!otpError || !!passwordError || !!confirmError}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>Remember password? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },

  header: { marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f9fc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#8896b0', marginTop: 4 },

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
  input: { flex: 1, fontSize: 15, color: '#1a1a2e' },

  submitBtn: {
    backgroundColor: '#1a6bff', borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 20,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerHint: { fontSize: 13, color: '#8896b0' },
  footerLink: { fontSize: 13, color: '#1a6bff', fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -8, marginBottom: 10, marginLeft: 4 },
});
