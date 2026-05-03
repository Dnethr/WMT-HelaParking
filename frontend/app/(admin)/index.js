import React, { useState, useCallback } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";
import { useAuthStore } from "../../src/store/authStore";

export default function DashboardScreen() {
  const isFocused = useIsFocused();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [slotsRes, bookingsRes, finesRes] = await Promise.all([
        api.get('/api/slots'),
        api.get('/api/bookings'),
        api.get('/api/fines'),
      ]);
      const slots = slotsRes.data.slots;
      const todayStart = new Date().setHours(0, 0, 0, 0);
      setStats({
        totalSlots: slots.length,
        available: slots.filter((s) => s.status === 'Available').length,
        reserved: slots.filter((s) => s.status === 'Reserved').length,
        occupied: slots.filter((s) => s.status === 'Occupied').length,
        outOfService: slots.filter((s) => s.status === 'Out-of-Service').length,
        activeBookings: bookingsRes.data.bookings.filter((b) => b.status === 'active').length,
        totalBookings: bookingsRes.data.bookings.filter((b) => new Date(b.createdAt).setHours(0, 0, 0, 0) === todayStart).length,
        unpaidFines: finesRes.data.fines.filter((f) => f.status === 'unpaid').length,
      });
    } catch (e) { /* silent */ } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchStats(); }, []));

  const StatCard = ({ icon, label, value, color }) => (
    <GlassCard style={[styles.statCard, { borderLeftColor: color }]} intensity={45} fallbackColor="rgba(255,255,255,0.82)">
      {/* Icon background tint matches the card's border color */}
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );

  if (!isFocused) return <View style={{ flex: 1 }} />;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <View collapsable={false} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.greeting}>
            Hello, {user?.name} <FontAwesome5 name="hand-paper" solid size={18} color="#ffb74d" />
          </Text>
          <Text style={styles.subGreeting}>Admin Dashboard</Text>

          <View style={styles.grid}>
            <StatCard icon="car-sport"       label="Total Slots"     value={stats?.totalSlots || 0}      color="#1a6bff" />
            <StatCard icon="checkmark-circle" label="Available"      value={stats?.available || 0}       color="#22C55E" />
            <StatCard icon="time"             label="Reserved"       value={stats?.reserved || 0}        color="#F59E0B" />
            <StatCard icon="location"         label="Occupied"       value={stats?.occupied || 0}        color="#9e9e9e" />
            <StatCard icon="calendar"         label="Active Bookings" value={stats?.activeBookings || 0} color="#1D9E75" />
            <StatCard icon="warning"          label="Unpaid Fines"   value={stats?.unpaidFines || 0}     color="#EF4444" />
            <StatCard icon="construct"        label="Out of Service" value={stats?.outOfService || 0}    color="#795548" />
            <StatCard icon="documents"        label="Today's Bookings" value={stats?.totalBookings || 0}   color="#9c27b0" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 100 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  subGreeting: { fontSize: 14, color: '#8896b0', marginBottom: 24, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%', borderRadius: 16, padding: 16, borderLeftWidth: 4,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#8896b0', fontWeight: '600', marginTop: 4 },
});
