import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from "../../../src/utils/api";

const STATUS_COLORS = { Open: '#ff9800', Investigating: '#1a6bff', Resolved: '#4caf50' };

export default function IncidentAdminScreen({ navigation }) {
  const router = useRouter();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = async () => {
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

  useFocusEffect(useCallback(() => { setLoading(true); fetch_(); }, []));

  const assignToMe = async (id) => {
    try {
      await api.put(`/api/incidents/${id}/assign`);
      Alert.alert('Success', 'Incident assigned to you.');
      fetch_();
    } catch (e) {
      Alert.alert('Error', 'Failed to assign incident.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/incidents/${id}/status`, { status });
      Alert.alert('Success', `Incident status updated to ${status}.`);
      fetch_();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.ticketId}>{item.ticketId}</Text>
        <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.reporter}>By: {item.userId?.name || 'N/A'} · Slot: {item.slotId?.slotNumber || '-'}</Text>
      {item.assignedAdminId ? <Text style={styles.assigned}>Assigned to: {item.assignedAdminId.name}</Text> : null}

      {item.evidenceImageUrl ? (
        <Image source={{ uri: item.evidenceImageUrl }} style={styles.evidenceImage} />
      ) : null}

      <View style={styles.actionRow}>
        {!item.assignedAdminId && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => assignToMe(item._id)}>
            <Text style={styles.actionBtnText}>Assign to Me</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Open' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1a6bff' }]} onPress={() => updateStatus(item._id, 'Investigating')}>
            <Text style={styles.actionBtnText}>Investigate</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'Resolved' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4caf50' }]} onPress={() => updateStatus(item._id, 'Resolved')}>
            <Text style={styles.actionBtnText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1a1a2e" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Incidents</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList data={incidents} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch_(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No incidents.</Text>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  category: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4a5568', marginBottom: 8, lineHeight: 18 },
  reporter: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  assigned: { fontSize: 11, color: '#1a6bff', marginTop: 4, fontWeight: '500' },
  evidenceImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 10, marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { backgroundColor: '#ff9800', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },
});
