import React, { useState } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";
import { useAuthStore } from "../../src/store/authStore";

export default function SystemSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuthStore();
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminPhone, setAdminPhone] = useState(user?.phoneNumber || '');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

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
      Alert.alert('Error', 'Please fix any errors before saving profile.');
      return;
    }
    try {
      setUpdatingProfile(true);
      const res = await api.put(`/api/users/${user._id}`, { name: adminName, phoneNumber: adminPhone });
      updateUser(res.data.user);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [maxVehicles, setMaxVehicles] = useState('5');
  const [maxActiveVehicles, setMaxActiveVehicles] = useState('1');
  const [safeTime, setSafeTime] = useState('10');
  const [maxBookingHours, setMaxBookingHours] = useState('24');
  const [maxEarlyCheckIn, setMaxEarlyCheckIn] = useState('5');
  const [updatingSettings, setUpdatingSettings] = useState(false);

  React.useEffect(() => {
    api.get('/api/settings').then(res => {
      if (res.data.settings) {
        setMaxVehicles(String(res.data.settings.maxVehiclesPerUser || 5));
        setMaxActiveVehicles(String(res.data.settings.maxActiveVehiclesPerUser || 1));
        setSafeTime(String(res.data.settings.safeTimeDuration || 10));
        setMaxBookingHours(String(res.data.settings.maxBookingHours || 24));
        setMaxEarlyCheckIn(String(res.data.settings.maxEarlyCheckInMinutes || 5));
      }
    }).catch(e => console.log('Error fetching settings:', e));
  }, []);

  const handleUpdateSettings = async () => {
    try {
      setUpdatingSettings(true);
      await api.put('/api/settings', {
        maxVehiclesPerUser: parseInt(maxVehicles),
        maxActiveVehiclesPerUser: parseInt(maxActiveVehicles),
        safeTimeDuration: parseInt(safeTime),
        maxBookingHours: parseInt(maxBookingHours),
        maxEarlyCheckInMinutes: parseInt(maxEarlyCheckIn),
      });
      Alert.alert('Success', 'System constraints updated successfully!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update settings.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) { Alert.alert('Error', 'Message is required.'); return; }
    try {
      setSending(true);
      await api.post('/api/notifications/broadcast', { message: broadcastMsg.trim(), type: 'system' });
      Alert.alert('Success', 'Broadcast sent to all drivers.');
      setBroadcastMsg('');
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed.'); }
    finally { setSending(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>System Settings</Text>

          {/* Profile card */}
          <GlassCard style={styles.profileCard} intensity={55}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={30} color="#854F0B" />
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Super Admin</Text>
            </View>
          </GlassCard>

          {/* Edit Profile card */}
          <GlassCard style={styles.card} intensity={45}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-outline" size={17} color="#854F0B" />
              <Text style={styles.sectionTitle}>Edit Profile</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Change your name and phone number</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputWrap, nameError ? { borderColor: '#ef4444', borderWidth: 1 } : (adminName ? { borderColor: '#10b981', borderWidth: 1 } : {})]}>
              <TextInput
                style={styles.textInput}
                value={adminName}
                onChangeText={validateName}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={[styles.inputWrap, phoneError ? { borderColor: '#ef4444', borderWidth: 1 } : (adminPhone ? { borderColor: '#10b981', borderWidth: 1 } : {})]}>
              <TextInput
                style={styles.textInput}
                value={adminPhone}
                onChangeText={validatePhone}
                placeholder="Phone Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrap, { backgroundColor: '#e2e8f0' }]}>
              <TextInput
                style={[styles.textInput, { color: '#64748b' }]}
                value={user?.email}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (updatingProfile || !!nameError || !!phoneError) && { opacity: 0.75 }]}
              onPress={handleUpdateProfile}
              disabled={updatingProfile || !!nameError || !!phoneError}
              activeOpacity={0.85}
            >
              {updatingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* Broadcast card */}
          <GlassCard style={styles.card} intensity={45}>
            <View style={styles.cardTitleRow}>
              <FontAwesome5 name="bullhorn" size={15} color="#854F0B" />
              <Text style={styles.sectionTitle}>Broadcast Notification</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Send a message to all drivers</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your announcement..."
              placeholderTextColor="#9CA3AF"
              value={broadcastMsg}
              onChangeText={setBroadcastMsg}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.broadcastBtn}
              onPress={handleBroadcast}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="megaphone" size={17} color="#fff" />
                    <Text style={styles.broadcastBtnText}>Send Broadcast</Text>
                  </>
                )}
            </TouchableOpacity>
          </GlassCard>

          {/* System Constraints card */}
          <GlassCard style={styles.card} intensity={45}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="options" size={17} color="#854F0B" />
              <Text style={styles.sectionTitle}>System Constraints</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Define limits on vehicles per user and active bookings</Text>
            
            <Text style={styles.inputLabel}>Maximum Vehicle Count Per User</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={maxVehicles}
                onChangeText={setMaxVehicles}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={styles.inputLabel}>Maximum Active Vehicles In Slots At Once</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={maxActiveVehicles}
                onChangeText={setMaxActiveVehicles}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={styles.inputLabel}>Safe Time Duration (minutes)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={safeTime}
                onChangeText={setSafeTime}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={styles.inputLabel}>Maximum Booking Duration (hours)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={maxBookingHours}
                onChangeText={setMaxBookingHours}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text style={styles.inputLabel}>Maximum Early Check-in (minutes)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={maxEarlyCheckIn}
                onChangeText={setMaxEarlyCheckIn}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleUpdateSettings}
              disabled={updatingSettings}
              activeOpacity={0.85}
            >
              {updatingSettings ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Constraints</Text>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* System info card */}
          <GlassCard style={styles.card} intensity={45}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>System Info</Text>
            {[
              ['App Version', '1.0.0'],
              ['Environment', 'Production'],
              ['API URL', process.env.EXPO_PUBLIC_API_URL || 'localhost'],
            ].map(([label, value]) => (
              <View key={label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
              </View>
            ))}
          </GlassCard>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },

  profileCard: { padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: 'rgba(133,79,11,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#854F0B', paddingHorizontal: 16, paddingVertical: 4,
    borderRadius: 12, marginTop: 10,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { padding: 20, marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  textArea: {
    width: '100%', backgroundColor: '#f7f9fc',
    borderRadius: 12, padding: 12, fontSize: 14,
    minHeight: 80, borderWidth: 1, borderColor: '#e8ecf4',
    color: '#1a1a2e', marginBottom: 14,
  },
  broadcastBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#854F0B', borderRadius: 12,
    paddingVertical: 13, justifyContent: 'center',
  },
  broadcastBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', maxWidth: '55%' },

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

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 4 },
  inputWrap: {
    backgroundColor: '#f7f9fc', borderRadius: 12,
    paddingHorizontal: 12, marginBottom: 14, height: 46, justifyContent: 'center',
    borderWidth: 1, borderColor: '#e8ecf4',
  },
  textInput: { fontSize: 14, color: '#1a1a2e' },
  saveBtn: {
    backgroundColor: '#854F0B', borderRadius: 12, height: 46,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: -10, marginBottom: 12, marginLeft: 2 },
});
