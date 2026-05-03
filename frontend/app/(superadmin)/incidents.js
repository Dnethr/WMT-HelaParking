import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from '../../src/utils/api';

const STATUS_COLORS = { Open: '#ff9800', Investigating: '#1a6bff', Resolved: '#4caf50' };

export default function IncidentsSuperAdminScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/api/incidents');
      setIncidents(res.data.incidents);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchIncidents();
    }, [])
  );

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/incidents/${id}/status`, { status });
      Alert.alert('Success', `Incident status updated to ${status}.`);
      fetchIncidents();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update incident.');
    }
  };

  const renderItem = ({ item }) => (
    <GlassCard style={styles.card} intensity={40} fallbackColor="rgba(255,255,255,0.85)">
      <View style={styles.cardHeader}>
        <Text style={styles.ticketId}>{item.ticketId}</Text>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.reporter}>
        By: {item.userId?.name || 'N/A'} · Slot: {item.slotId?.slotNumber || 'General / None'}
      </Text>
      {item.assignedAdminId ? <Text style={styles.assigned}>Assigned to: {item.assignedAdminId.name}</Text> : null}

      {item.evidenceImageUrl ? (
        <Image source={{ uri: item.evidenceImageUrl }} style={styles.evidenceImage} />
      ) : null}

      <View style={styles.actionRow}>
        {item.status === 'Open' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1a6bff' }]}
            onPress={() => updateStatus(item._id, 'Investigating')}
          >
            <Text style={styles.actionBtnText}>Investigate</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'Resolved' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#4caf50' }]}
            onPress={() => updateStatus(item._id, 'Resolved')}
          >
            <Text style={styles.actionBtnText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );

  if (!isFocused) return <View style={{ flex: 1 }} />;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#854F0B" /></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reports</Text>
      </View>
      <FlatList
        data={incidents}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchIncidents(); }} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No incidents reported.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  list: { padding: 16, paddingBottom: 100 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  category: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4a5568', marginBottom: 8, lineHeight: 18 },
  reporter: { fontSize: 11, color: '#8896b0', marginBottom: 4 },
  assigned: { fontSize: 11, color: '#1a6bff', marginTop: 4, fontWeight: '500' },
  evidenceImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 10, marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },
});
