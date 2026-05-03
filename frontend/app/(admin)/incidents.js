import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from "../../src/utils/api";
import { useAuthStore } from "../../src/store/authStore";

const STATUS_COLORS = { Open: '#ff9800', Investigating: '#1a6bff', Resolved: '#4caf50' };

export default function IncidentAdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
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

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/incidents/${id}/status`, { status });
      Alert.alert('Success', `Incident status updated to ${status}.`);
      fetch_();
    } catch (e) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const assignToMe = async (id) => {
    try {
      await api.put(`/api/incidents/${id}/assign`);
      Alert.alert('Success', 'Incident assigned to you.');
      fetch_();
    } catch (e) {
      Alert.alert('Error', 'Failed to assign incident.');
    }
  };

  const renderItem = ({ item }) => {
    const isAssignedToMe = item.assignedAdminId?._id === user?._id;
    const isUnassigned = !item.assignedAdminId;

    return (
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

        {item.assignedAdminId && (
          <View style={styles.assignmentBadge}>
            <Ionicons name="person-circle" size={16} color="#6B7280" />
            <Text style={styles.assignmentText}>
              {isAssignedToMe ? 'Assigned to: You' : `Assigned to: ${item.assignedAdminId.name}`}
            </Text>
          </View>
        )}

        {item.evidenceImageUrl ? (
          <Image source={{ uri: item.evidenceImageUrl }} style={styles.evidenceImage} />
        ) : null}

        <View style={styles.actionRow}>
          {isUnassigned && item.status !== 'Resolved' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => assignToMe(item._id)}>
              <Text style={styles.actionBtnText}>Assign to Me</Text>
            </TouchableOpacity>
          )}

          {(!item.assignedAdminId || isAssignedToMe) && item.status === 'Open' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1a6bff' }]} onPress={() => updateStatus(item._id, 'Investigating')}>
              <Text style={styles.actionBtnText}>Investigate</Text>
            </TouchableOpacity>
          )}
          {(!item.assignedAdminId || isAssignedToMe) && item.status !== 'Resolved' && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4caf50' }]} onPress={() => updateStatus(item._id, 'Resolved')}>
              <Text style={styles.actionBtnText}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Reports</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ticketId: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  category: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4a5568', marginBottom: 8, lineHeight: 18 },
  reporter: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  assignmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4, gap: 4 },
  assignmentText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  evidenceImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 10, marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { backgroundColor: '#ff9800', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },
});
