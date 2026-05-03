import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";

const METHOD_ICON = { card: 'card', cash: 'cash', stripe: 'card' };
const STATUS_COLORS = { completed: '#22C55E', pending: '#F59E0B', failed: '#EF4444' };

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/api/payments/my');
      setPayments(res.data.payments);
    } catch (e) { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchPayments(); }, []));

  const renderItem = ({ item }) => {
    const isFine = !!item.fineId;
    const iconName = isFine ? 'alert-circle' : (METHOD_ICON[item.method] || 'card');
    const iconColor = isFine ? '#EF4444' : '#3B82F6';
    const iconBg = isFine ? '#FEE2E2' : '#EFF6FF';
    const statusColor = STATUS_COLORS[item.status] || '#9CA3AF';

    return (
      <GlassCard style={styles.card} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
        <View style={styles.cardHeader}>
          {/* Consistent icon circle across all rows */}
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{isFine ? 'Fine Payment' : 'Booking Payment'}</Text>
            <Text style={styles.cardDate}>{new Date(item.paidAt || item.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={styles.cardAmount}>LKR {item.amount}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.methodRow}>
          <Ionicons name="wallet-outline" size={13} color="#8896b0" />
          <Text style={styles.methodText}>{item.method || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusLabel}>{item.status}</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={56} color="#c7d2fe" />
      <Text style={styles.emptyTitle}>No Payments Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your payment history will appear here once you complete a booking.
      </Text>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Payment History</Text>
        <FlatList
          data={payments}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} tintColor="#3B82F6" />}
          ListEmptyComponent={<EmptyState />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  list: { padding: 16, paddingBottom: 120 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cardDate: { fontSize: 12, color: '#8896b0', marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodText: { fontSize: 12, color: '#8896b0', flex: 1, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.4 },
  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
