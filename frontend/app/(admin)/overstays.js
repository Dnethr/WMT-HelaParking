import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl , ScrollView} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import api from "../../src/utils/api";

export default function OverstayScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const router = useRouter();
  const [overstays, setOverstays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverstays = async () => {
    try { const res = await api.get('/api/overstays'); setOverstays(res.data.overstays); }
    catch (e) { /* */ } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchOverstays(); }, []));

  const issueFine = async (booking) => {
    const overstayMinutes = Math.floor((Date.now() - new Date(booking.endTime).getTime()) / 60000);
    const amount = overstayMinutes * 10;
    try {
      await api.post('/api/fines', { bookingId: booking._id, userId: booking.userId?._id, amount, reason: 'Overstay', overstayMinutes });
      Alert.alert('Success', `Fine of LKR ${amount} issued.`);
      fetchOverstays();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed.'); }
  };

  const renderItem = ({ item }) => {
    const overMin = Math.floor((Date.now() - new Date(item.endTime).getTime()) / 60000);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconCircle}><Ionicons name="time" size={20} color="#ef4444" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.slotNum}>{item.slotId?.slotNumber || 'N/A'}</Text>
            <Text style={styles.info}>{item.userId?.name || 'N/A'} · {item.vehicleNumber}</Text>
            <Text style={styles.overText}>{overMin} min overstay</Text>
          </View>
          <TouchableOpacity style={styles.fineBtn} onPress={() => issueFine(item)}>
            <Text style={styles.fineBtnText}>Fine</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isFocused) return <View style={{ flex: 1 }} />;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Overstays</Text>
        </View>
        <FlatList data={overstays} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOverstays(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No overstays currently. <FontAwesome5 name="check-circle" size={14} color="#8896b0" /></Text>} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fce4ec', justifyContent: 'center', alignItems: 'center' },
  slotNum: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  info: { fontSize: 12, color: '#8896b0', marginTop: 2 },
  overText: { fontSize: 12, fontWeight: '700', color: '#ef4444', marginTop: 2 },
  fineBtn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  fineBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },
});
