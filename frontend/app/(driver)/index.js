import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { io as socketIO } from 'socket.io-client';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import api from "../../src/utils/api";
import SlotGrid from "../../src/components/SlotGrid";
import BookingBottomSheet from "../../src/components/BookingBottomSheet";
import NotificationBell from "../../src/components/NotificationBell";
import GlassCard from "../../src/components/GlassCard";

const FILTERS = [
  { name: 'All', icon: 'apps' },
  { name: 'Car', icon: 'car' },
  { name: 'Bike', icon: 'motorcycle' },
  { name: 'EV', icon: 'bolt' },
  { name: 'Disabled', icon: 'wheelchair' },
];
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.24:4000';

export default function MapScreen({ navigation }) {
  const isFocused = useIsFocused();
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchSlots = async () => {
    try {
      setError(null);
      const res = await api.get('/api/slots');
      setSlots(res.data.slots);
    } catch (e) {
      setError('Failed to load slots.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchSlots(); }, []));

  // Socket.io
  useEffect(() => {
    const socket = socketIO(API_URL);
    socket.on('slot:updated', (updatedSlot) => {
      setSlots((prev) => prev.map((s) => (s._id === updatedSlot._id ? updatedSlot : s)));
    });
    return () => socket.disconnect();
  }, []);

  const filteredSlots = filter === 'All' ? slots : slots.filter((s) => s.type === filter);

  const handleSlotPress = (slot) => {
    setSelectedSlot(slot);
    setSheetVisible(true);
  };

  if (!isFocused) return <View style={{ flex: 1 }} />;
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 8 }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchSlots}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View collapsable={false} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>HelaParking</Text>
            <Text style={styles.headerSubtitle}>Discover available parking slots</Text>
          </View>
          <NotificationBell onPress={() => router.push('/global-notifications')} />
        </View>

        {/* Filter chips */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {FILTERS.map((f) => {
              const active = filter === f.name;
              return (
                <TouchableOpacity
                  key={f.name}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f.name)}
                  activeOpacity={0.85}
                >
                  {f.name === 'All' ? (
                    <Ionicons name={f.icon} size={14} color={active ? '#fff' : '#4B5563'} />
                  ) : (
                    <FontAwesome5 name={f.icon} size={13} color={active ? '#fff' : '#4B5563'} />
                  )}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Premium legend section with glass card wrapper */}
        <View style={styles.legendWrapper}>
          <GlassCard style={styles.legendCard} intensity={55}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Reserved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </GlassCard>
        </View>

        <SlotGrid slots={filteredSlots} selectedSlot={selectedSlot} onSlotPress={handleSlotPress} />

        <BookingBottomSheet
          visible={sheetVisible}
          slot={selectedSlot}
          onClose={() => { setSheetVisible(false); setSelectedSlot(null); }}
          onBookingCreated={fetchSlots}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  errorText: { fontSize: 15, color: '#EF4444', marginBottom: 16, fontWeight: '500' },
  retryBtn: { backgroundColor: '#1E40AF', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, marginBottom: 14 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  filterSection: { marginBottom: 14 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  chipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },

  legendWrapper: { paddingHorizontal: 20, marginBottom: 16 },
  legendCard: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
});