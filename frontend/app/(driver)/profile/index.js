import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../src/components/GlassCard';
import api from "../../../src/utils/api";
import { useAuthStore } from "../../../src/store/authStore";
import storage from "../../../src/utils/storage";

const ROLE_COLOR = { driver: '#3B82F6', admin: '#1D9E75', superadmin: '#854F0B' };

const ACTION_ITEMS = [
  { icon: 'car-outline', label: 'My Vehicles', route: '/(driver)/profile/vehicles', bg: '#E0F2FE', color: '#0EA5E9' },
  { icon: 'warning-outline', label: 'Fines', route: '/(driver)/profile/fines', bg: '#FEE2E2', color: '#EF4444' },
  { icon: 'flag-outline',   label: 'Report Incident', route: '/(driver)/profile/incident',      bg: '#FFFBEB', color: '#F59E0B' },
];


export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateName = (val) => {
    setName(val);
    if (!val.trim()) {
      setNameError('Full Name is required.');
    } else if (val.trim().length < 2) {
      setNameError('Full Name must be at least 2 characters.');
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

  const handleUpdate = async () => {
    if (!name.trim() || !phoneNumber.trim() || nameError || phoneError) {
      Alert.alert('Error', 'Please fix any errors before saving changes.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.put(`/api/users/${user._id}`, { name, phoneNumber });
      updateUser(res.data.user);
      Alert.alert('Success', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed.');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: async () => {
          try {
            await api.delete('/api/users/me');
            Alert.alert('Account Deleted', 'Your account has been successfully removed.');
            logout();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to delete account.');
          }
        }}
      ]
    );
  };

  const roleColor = ROLE_COLOR[user?.role] || '#3B82F6';

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* User Info — distinct treatment with larger avatar */}
        <GlassCard style={styles.userCard}>
          <View style={[styles.avatar, { borderColor: roleColor }]}>
            <Ionicons name="person" size={36} color={roleColor} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </GlassCard>

        {/* Edit Profile */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <View style={[styles.inputContainer, nameError ? { borderColor: '#ef4444' } : (name ? { borderColor: '#10b981' } : {})]}>
            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={validateName} placeholderTextColor="#9CA3AF" />
          </View>
          {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

          <View style={[styles.inputContainer, phoneError ? { borderColor: '#ef4444' } : (phoneNumber ? { borderColor: '#10b981' } : {})]}>
            <TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={validatePhone} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
          </View>
          {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

          <View style={[styles.inputContainer, styles.disabledInput]}>
            <TextInput style={[styles.input, { color: '#64748b' }]} value={user?.email} editable={false} placeholderTextColor="#9CA3AF" />
          </View>
          <TouchableOpacity style={[styles.saveBtn, (loading || !!nameError || !!phoneError) && { opacity: 0.75 }]} onPress={handleUpdate} disabled={loading || !!nameError || !!phoneError} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </GlassCard>

        {/* Action Items */}
        <GlassCard style={styles.card}>
          {ACTION_ITEMS.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, i < ACTION_ITEMS.length - 1 && styles.menuItemBorder]} onPress={() => router.push(item.route)} activeOpacity={0.75}>
              <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </GlassCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.75}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },

  // User info card
  userCard: { padding: 28, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, borderWidth: 2.5,
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 3, marginBottom: 10 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: 12, fontWeight: '700', color: '#fff', textTransform: 'capitalize', letterSpacing: 0.5 },

  // Generic card
  card: { padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  inputContainer: {
    backgroundColor: '#f1f5f9', borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 10, height: 50,
    justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  disabledInput: {
    backgroundColor: '#e2e8f0', borderColor: '#cbd5e1',
  },
  input: { fontSize: 15, color: '#1a1a2e' },
  saveBtn: {
    backgroundColor: '#3B82F6', borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -6, marginBottom: 10, marginLeft: 4 },

  // Menu items
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  menuIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a2e' },

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
  deleteBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  testBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  testText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
});
