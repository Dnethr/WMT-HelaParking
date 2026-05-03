import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";
import { useAuthStore } from "../../src/store/authStore";

const ROLE_COLORS = { driver: '#3B82F6', admin: '#1D9E75', superadmin: '#854F0B' };
const ROLES = ['driver', 'admin', 'superadmin'];

export default function UserManagerScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user: currentUser } = useAuthStore();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('driver');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  // States for adding a new Admin
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [newAdminNameError, setNewAdminNameError] = useState('');
  const [newAdminEmailError, setNewAdminEmailError] = useState('');
  const [newAdminPhoneError, setNewAdminPhoneError] = useState('');
  const [newAdminPasswordError, setNewAdminPasswordError] = useState('');
  const [newAdminConfirmPasswordError, setNewAdminConfirmPasswordError] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);

  // States for updating superadmin password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordError, setOldPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const validateNewAdminName = (val) => {
    setNewAdminName(val);
    if (!val.trim()) setNewAdminNameError('Name is required.');
    else setNewAdminNameError('');
  };

  const validateNewAdminEmail = (val) => {
    setNewAdminEmail(val);
    if (!val.trim()) setNewAdminEmailError('Email is required.');
    else if (!/^\S+@\S+\.\S+$/.test(val)) setNewAdminEmailError('Invalid email format.');
    else setNewAdminEmailError('');
  };

  const validateNewAdminPhone = (val) => {
    setNewAdminPhone(val);
    if (!val.trim()) setNewAdminPhoneError('Phone number is required.');
    else if (!/^\d{10}$/.test(val)) setNewAdminPhoneError('Phone must be 10 numeric digits.');
    else setNewAdminPhoneError('');
  };

  const validateNewAdminPassword = (val) => {
    setNewAdminPassword(val);
    if (!val) setNewAdminPasswordError('Password is required.');
    else if (val.length < 8) setNewAdminPasswordError('Must be at least 8 characters.');
    else setNewAdminPasswordError('');

    if (newAdminConfirmPassword && val !== newAdminConfirmPassword) {
      setNewAdminConfirmPasswordError('Passwords do not match.');
    } else if (newAdminConfirmPassword && val === newAdminConfirmPassword) {
      setNewAdminConfirmPasswordError('');
    }
  };

  const validateNewAdminConfirmPassword = (val) => {
    setNewAdminConfirmPassword(val);
    if (!val) setNewAdminConfirmPasswordError('Confirm password is required.');
    else if (val !== newAdminPassword) setNewAdminConfirmPasswordError('Passwords do not match.');
    else setNewAdminConfirmPasswordError('');
  };

  const validateOldPassword = (val) => {
    setOldPassword(val);
    if (!val) {
      setOldPasswordError('Current password is required.');
    } else {
      setOldPasswordError('');
    }
  };

  const validateNewPassword = (val) => {
    setNewPassword(val);
    if (!val) {
      setNewPasswordError('New password is required.');
    } else if (val.length < 8) {
      setNewPasswordError('New password must be at least 8 characters.');
    } else {
      setNewPasswordError('');
    }
    if (confirmPassword && val !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else if (confirmPassword && val === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const validateConfirmPassword = (val) => {
    setConfirmPassword(val);
    if (!val) {
      setConfirmPasswordError('Confirm password is required.');
    } else if (val !== newPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users', { params: { role: roleFilter } });
      setUsers(res.data.users || []);
    } catch (e) {
      /* */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (roleFilter !== 'superadmin') {
      setLoading(true);
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [roleFilter]));

  const confirmDeleteUser = async () => {
    if (!pendingDelete) return;
    if (pendingDelete._id === currentUser?._id) {
      Alert.alert('Error', 'You cannot delete yourself.');
      setPendingDelete(null);
      return;
    }
    try {
      await api.delete(`/api/users/${pendingDelete._id}`);
      Alert.alert('Success', 'User deleted successfully.');
      fetchUsers();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete user.');
    }
    setPendingDelete(null);
  };

  const handleCreateAdmin = async () => {
    if (!newAdminName || !newAdminEmail || !newAdminPhone || !newAdminPassword || !newAdminConfirmPassword ||
        newAdminNameError || newAdminEmailError || newAdminPhoneError || newAdminPasswordError || newAdminConfirmPasswordError) {
      Alert.alert('Error', 'Please fix all errors before submitting.');
      return;
    }
    try {
      setCreatingAdmin(true);
      await api.post('/api/auth/register-admin', {
        name: newAdminName,
        email: newAdminEmail,
        phoneNumber: newAdminPhone,
        password: newAdminPassword,
      });
      Alert.alert('Success', 'Admin created successfully.');
      setShowAddAdmin(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminPassword('');
      setNewAdminConfirmPassword('');
      fetchUsers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword || oldPasswordError || newPasswordError || confirmPasswordError) {
      Alert.alert('Error', 'Please fix all input errors before updating.');
      return;
    }
    try {
      setUpdatingPassword(true);
      await api.put('/api/auth/change-password', { oldPassword, newPassword });
      Alert.alert('Success', 'Your password has been updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Password update failed.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const renderItem = ({ item }) => {
    const roleColor = ROLE_COLORS[item.role] || '#666';
    const isSelf = item._id === currentUser?._id;

    return (
      <GlassCard style={styles.card} intensity={42} fallbackColor="rgba(255,255,255,0.82)">
        <View style={styles.cardRow}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '18' }]}>
            <Ionicons name="person" size={20} color={roleColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              {item.isBanned && <FontAwesome5 name="ban" size={12} color="#EF4444" style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.email}>{item.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </View>

          {/* Action Button: omit if it is current user */}
          {!isSelf && (
            <TouchableOpacity
              style={styles.deleteUserBtn}
              onPress={() => setPendingDelete(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trash-outline"
                size={15}
                color="#EF4444"
              />
              <Text style={styles.deleteUserBtnText}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
          {isSelf && (
            <View style={styles.selfBadge}>
              <Text style={styles.selfText}>You</Text>
            </View>
          )}
        </View>
      </GlassCard>
    );
  };

  if (!isFocused) return <View style={{ flex: 1 }} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>User Management</Text>

      {/* Modern 3-Way Role Filter Toggle */}
      <View style={styles.toggleRow}>
        {ROLES.map((r) => {
          const active = roleFilter === r;
          const bg = active ? ROLE_COLORS[r] : 'transparent';
          return (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, active && { backgroundColor: bg }]}
              onPress={() => setRoleFilter(r)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                {r === 'superadmin' ? 'Super Admin' : `${r}s`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Screen contents: when Super Admin is selected vs others */}
      {roleFilter === 'superadmin' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.passwordCard} intensity={45}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="key-outline" size={18} color="#854F0B" />
                <Text style={styles.sectionTitle}>Change Super Admin Password</Text>
              </View>
              <Text style={styles.sectionSubtitle}>You can update your login password here</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={[styles.textInput, oldPasswordError ? { borderColor: '#ef4444' } : (oldPassword ? { borderColor: '#10b981' } : {})]}
                  value={oldPassword}
                  onChangeText={validateOldPassword}
                  secureTextEntry
                  placeholder="Required to change password"
                  placeholderTextColor="#9CA3AF"
                />
                {!!oldPasswordError && <Text style={styles.errorText}>{oldPasswordError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={[styles.textInput, newPasswordError ? { borderColor: '#ef4444' } : (newPassword ? { borderColor: '#10b981' } : {})]}
                  value={newPassword}
                  onChangeText={validateNewPassword}
                  secureTextEntry
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9CA3AF"
                />
                {!!newPasswordError && <Text style={styles.errorText}>{newPasswordError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={[styles.textInput, confirmPasswordError ? { borderColor: '#ef4444' } : (confirmPassword ? { borderColor: '#10b981' } : {})]}
                  value={confirmPassword}
                  onChangeText={validateConfirmPassword}
                  secureTextEntry
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9CA3AF"
                />
                {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (updatingPassword || !!oldPasswordError || !!newPasswordError || !!confirmPasswordError) && { opacity: 0.75 }]}
                onPress={handleUpdatePassword}
                disabled={updatingPassword || !!oldPasswordError || !!newPasswordError || !!confirmPasswordError}
                activeOpacity={0.85}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search Text Input & Add Admin Button */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 10 }}>
            <View style={[styles.searchContainer, { flex: 1, marginHorizontal: 0, marginBottom: 0 }]}>
              <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search ${roleFilter}s...`}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {roleFilter === 'admin' && (
              <TouchableOpacity
                style={styles.addAdminBtn}
                onPress={() => setShowAddAdmin(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addAdminBtnText}>Add Admin</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#854F0B" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(i) => i._id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
              ListEmptyComponent={<Text style={styles.empty}>No {roleFilter}s found.</Text>}
            />
          )}
        </View>
      )}

      {/* Delete User Confirmation Bottom Sheet */}
      <Modal visible={!!pendingDelete} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Ionicons
              name="trash-outline"
              size={40}
              color="#EF4444"
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />
            <Text style={styles.modalTitle}>
              Delete User
            </Text>
            <Text style={styles.modalSubtitle}>
              {`This will permanently remove ${pendingDelete?.name || 'this user'}'s account and all their data.`}
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#EF4444' }]}
              onPress={confirmDeleteUser}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>
                Delete User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPendingDelete(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Admin Modal */}
      <Modal visible={showAddAdmin} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Register New Admin</Text>
            <Text style={styles.modalSubtitle}>Fill in the details to create a new admin account.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={[styles.textInput, newAdminNameError ? { borderColor: '#ef4444' } : (newAdminName ? { borderColor: '#10b981' } : {})]} value={newAdminName} onChangeText={validateNewAdminName} placeholder="Jane Doe" placeholderTextColor="#9CA3AF" />
              {!!newAdminNameError && <Text style={styles.errorText}>{newAdminNameError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={[styles.textInput, newAdminEmailError ? { borderColor: '#ef4444' } : (newAdminEmail ? { borderColor: '#10b981' } : {})]} value={newAdminEmail} onChangeText={validateNewAdminEmail} placeholder="jane@helaparking.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
              {!!newAdminEmailError && <Text style={styles.errorText}>{newAdminEmailError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={[styles.textInput, newAdminPhoneError ? { borderColor: '#ef4444' } : (newAdminPhone ? { borderColor: '#10b981' } : {})]} value={newAdminPhone} onChangeText={validateNewAdminPhone} placeholder="07XXXXXXXX" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={10} />
              {!!newAdminPhoneError && <Text style={styles.errorText}>{newAdminPhoneError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.passwordWrap, newAdminPasswordError ? { borderColor: '#ef4444' } : (newAdminPassword ? { borderColor: '#10b981' } : {})]}>
                <TextInput style={styles.passwordInput} value={newAdminPassword} onChangeText={validateNewAdminPassword} placeholder="At least 8 characters" placeholderTextColor="#9CA3AF" secureTextEntry={!showNewAdminPassword} />
                <TouchableOpacity onPress={() => setShowNewAdminPassword(!showNewAdminPassword)} hitSlop={8}>
                  <Ionicons name={showNewAdminPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#adb5bd" />
                </TouchableOpacity>
              </View>
              {!!newAdminPasswordError && <Text style={styles.errorText}>{newAdminPasswordError}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput style={[styles.textInput, newAdminConfirmPasswordError ? { borderColor: '#ef4444' } : (newAdminConfirmPassword ? { borderColor: '#10b981' } : {})]} value={newAdminConfirmPassword} onChangeText={validateNewAdminConfirmPassword} placeholder="Re-enter password" placeholderTextColor="#9CA3AF" secureTextEntry={!showNewAdminPassword} />
              {!!newAdminConfirmPasswordError && <Text style={styles.errorText}>{newAdminConfirmPasswordError}</Text>}
            </View>

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#1D9E75' }]} onPress={handleCreateAdmin} disabled={creatingAdmin} activeOpacity={0.85}>
              {creatingAdmin ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Create Admin</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddAdmin(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  toggleRow: {
    flexDirection: 'row', backgroundColor: '#e2e8f0',
    borderRadius: 12, padding: 4, marginHorizontal: 16, marginBottom: 14, height: 44,
  },
  toggleBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'capitalize' },
  toggleBtnTextActive: { color: '#fff' },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, height: 44,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a2e', paddingHorizontal: 10, height: 44 },

  addAdminBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D9E75',
    borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 4,
  },
  addAdminBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  email: { fontSize: 12, color: '#8896b0', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, marginTop: 5 },
  roleText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'capitalize', letterSpacing: 0.4 },

  selfBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  selfText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  deleteUserBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  deleteUserBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },

  scrollContent: { padding: 16, paddingBottom: 110 },
  passwordCard: { padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  textInput: {
    backgroundColor: '#f7f9fc', borderRadius: 10,
    paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e8ecf4',
    fontSize: 14, color: '#1a1a2e',
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f7f9fc', borderRadius: 10,
    paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e8ecf4',
  },
  passwordInput: { flex: 1, fontSize: 14, color: '#1a1a2e' },
  submitBtn: {
    backgroundColor: '#854F0B', borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, marginLeft: 2 },

  // Ban confirmation modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  confirmBtn: { borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { height: 48, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
});
