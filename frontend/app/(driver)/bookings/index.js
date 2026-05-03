import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../src/components/GlassCard';
import api from "../../../src/utils/api";

// Status → color mapping (used by badge + left border)
const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', label: 'Pending' },
  active:    { color: '#3B82F6', label: 'Active' },
  completed: { color: '#22C55E', label: 'Completed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

const FILTERS = ['all', 'pending', 'active', 'completed', 'cancelled'];

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/api/bookings/my', { params });
      setBookings(res.data.bookings);
    } catch (e) { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchBookings(); }, [filter]));

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const renderItem = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || { color: '#9CA3AF', label: item.status };
    return (
      <GlassCard style={[styles.card, { borderLeftColor: cfg.color }]} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(driver)/bookings/detail', params: { booking: JSON.stringify(item) } })}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.slotNumber}>{item.slotId?.slotNumber || 'N/A'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
              <Text style={styles.statusText}>{cfg.label}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={13} color="#8896b0" />
              <Text style={styles.infoText}>{item.vehicleNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={13} color="#8896b0" />
              <Text style={styles.infoText}>{new Date(item.startTime).toLocaleString()}</Text>
            </View>
            <Text style={styles.cost}>LKR {item.totalCost}</Text>
          </View>
        </TouchableOpacity>
      </GlassCard>
    );
  };

  // Empty state per filter
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={56} color="#c7d2fe" />
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No Bookings Yet' : `No ${STATUS_CONFIG[filter]?.label || filter} Bookings`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'Head to the Map tab to reserve a parking slot.'
          : `You have no ${filter} bookings. Try a different filter.`}
      </Text>
    </View>
  );

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>My Bookings</Text>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            const cfg = STATUS_CONFIG[f];
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, active && { backgroundColor: cfg?.color || '#1a6bff', borderColor: cfg?.color || '#1a6bff' }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f === 'all' ? 'All' : cfg?.label || f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5, borderColor: '#d1d5db',
  },
  chipTextActive: { color: '#fff' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  list: { padding: 16, paddingBottom: 120 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  slotNumber: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: '#5c6b8a' },
  cost: { fontSize: 16, fontWeight: '800', color: '#3B82F6', marginTop: 8 },
  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
