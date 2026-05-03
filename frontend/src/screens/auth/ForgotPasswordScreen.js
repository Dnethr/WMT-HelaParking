import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Email is required.'); return; }
    try {
      setLoading(true);
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="key-outline" size={48} color="#1a6bff" />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color="#1D9E75" />
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successText}>Check your inbox for the reset link.</Text>
            <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.goBack()}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8896b0" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#a0aec0" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#8896b0', marginTop: 4, textAlign: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f9fc', borderRadius: 14, paddingHorizontal: 16, marginBottom: 16, height: 54, borderWidth: 1, borderColor: '#e8ecf4' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  submitButton: { backgroundColor: '#1a6bff', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBox: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#1D9E75', marginTop: 16 },
  successText: { fontSize: 14, color: '#8896b0', marginTop: 8, textAlign: 'center' },
  backToLogin: { marginTop: 24, backgroundColor: '#1a6bff', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  backToLoginText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
