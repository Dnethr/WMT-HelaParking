import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import { useAuthStore } from "../../src/store/authStore";
import api from "../../src/utils/api";

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuthStore();
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminPhone, setAdminPhone] = useState(user?.phoneNumber || '');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [updating, setUpdating] = useState(false);

  const validateName = (val) => {
    setAdminName(val);
    if (!val.trim()) {
      setNameError('Full Name is required.');
    } else if (val.trim().length < 2) {
      setNameError('Full Name must be at least 2 characters.');
    } else {
      setNameError('');
    }
  };

  const validatePhone = (val) => {
    setAdminPhone(val);
    if (!val.trim()) {
      setPhoneError('Phone number is required.');
    } else if (val.trim().length !== 10 || !/^\d{10}$/.test(val.trim())) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleUpdateProfile = async () => {
    if (!adminName.trim() || !adminPhone.trim() || nameError || phoneError) {
      Alert.alert('Error', 'Please fix any errors before saving changes.');
      return;
    }
    try {
      setUpdating(true);
      const res = await api.put(`/api/users/${user._id}`, { name: adminName, phoneNumber: adminPhone });
      updateUser(res.data.user);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>Admin Profile</Text>

          {/* Profile card */}
          <GlassCard style={styles.profileCard} intensity={55} fallbackColor="rgba(255,255,255,0.88)">
            <View style={styles.avatar}>
              <Ionicons name="person" size={34} color="#1D9E75" />
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </GlassCard>

          {/* Edit Profile Card */}
          <GlassCard style={[styles.infoCard, { padding: 20 }]} intensity={45} fallbackColor="rgba(255,255,255,0.82)">
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 }}>Edit Profile</Text>
            <View style={[styles.inputContainer, nameError ? { borderColor: '#ef4444', borderWidth: 1 } : (adminName ? { borderColor: '#10b981', borderWidth: 1 } : {})]}>
              <TextInput style={styles.inputField} value={adminName} onChangeText={validateName} placeholder="Full Name" placeholderTextColor="#9CA3AF" />
            </View>
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

            <View style={[styles.inputContainer, phoneError ? { borderColor: '#ef4444', borderWidth: 1 } : (adminPhone ? { borderColor: '#10b981', borderWidth: 1 } : {})]}>
              <TextInput style={styles.inputField} value={adminPhone} onChangeText={validatePhone} placeholder="Phone Number" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
            </View>
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            <View style={[styles.inputContainer, { backgroundColor: '#e2e8f0' }]}>
              <TextInput style={[styles.inputField, { color: '#64748b' }]} value={user?.email} editable={false} />
            </View>
            <TouchableOpacity style={[styles.saveBtn, (updating || !!nameError || !!phoneError) && { opacity: 0.75 }]} onPress={handleUpdateProfile} disabled={updating || !!nameError || !!phoneError} activeOpacity={0.85}>
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </GlassCard>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },

  // Profile card
  profileCard: { padding: 28, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(29,158,117,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 2.5, borderColor: '#1D9E75',
  },
  name: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 10 },
  roleBadge: {
    backgroundColor: '#1D9E75', paddingHorizontal: 18, paddingVertical: 5, borderRadius: 12,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'capitalize', letterSpacing: 0.5 },

  // Info card
  infoCard: { padding: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(29,158,117,0.1)', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },

  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  inputContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputField: {
    fontSize: 14,
    color: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -8, marginBottom: 10, marginLeft: 4 },
});
