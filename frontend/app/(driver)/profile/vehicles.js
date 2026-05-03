import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GlassCard from '../../../src/components/GlassCard';
import api from '../../../src/utils/api';

const VEHICLE_TYPES = ['Car', 'Bike', 'EV', 'Disabled'];

export default function MyVehiclesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchVehicles = async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/users/me/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to fetch vehicles.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter a vehicle number.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/users/vehicles', {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
      });
      setVehicles(res.data.vehicles || []);
      setVehicleNumber('');
      setVehicleType('Car');
      Alert.alert('Success', 'Vehicle added successfully!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vNum) => {
    Alert.alert('Delete', 'Remove this vehicle?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.delete(`/api/users/vehicles/${vNum}`);
            setVehicles(res.data.vehicles || []);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to remove vehicle.');
          }
        },
      },
    ]);
  };

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicles</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add New Vehicle */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Add New Vehicle</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number (e.g. WP-CAS 1234)"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Text style={styles.subLabel}>Vehicle Type</Text>
          <View style={styles.typeSelector}>
            {VEHICLE_TYPES.map((type) => {
              const active = type === vehicleType;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setVehicleType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddVehicle} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Add Vehicle</Text>}
          </TouchableOpacity>
        </GlassCard>

        {/* Existing Vehicles List */}
        <Text style={[styles.sectionTitle, { marginLeft: 4, marginTop: 12, marginBottom: 10 }]}>Registered Vehicles</Text>
        {fetching ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
        ) : vehicles.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="car-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>No vehicles registered yet.</Text>
          </GlassCard>
        ) : (
          vehicles.map((item) => (
            <GlassCard key={item.vehicleNumber} style={styles.vehicleCard}>
              <View style={styles.vehicleInfo}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="car" size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.vNum}>{item.vehicleNumber}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.vehicleType}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteVehicle(item.vehicleNumber)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  content: { padding: 20, paddingBottom: 60 },

  card: { padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  subLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 8, marginTop: 4 },

  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 12, height: 50,
    justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  input: { fontSize: 15, color: '#1a1a2e' },

  typeSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },

  addBtn: {
    backgroundColor: '#3B82F6', borderRadius: 12, height: 48,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  vehicleCard: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center' },
  vNum: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  badge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  deleteBtn: { padding: 8 },

  emptyCard: { padding: 28, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: '#6B7280', fontSize: 14, fontWeight: '500' }
});
