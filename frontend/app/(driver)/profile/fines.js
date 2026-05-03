import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert,  } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import api from "../../../src/utils/api";

export default function FinesScreen({ navigation }) {
  const router = useRouter();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFines = async () => {
    try { const res = await api.get('/api/fines/my'); setFines(res.data.fines); }
    catch (e) { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchFines(); }, []));

  const handlePay = async (fine) => {
    try {
      await api.post('/api/payments', { fineId: fine._id, amount: fine.amount, method: 'card' });
      await api.put(`/api/fines/${fine._id}/pay`);
      Alert.alert('Success', 'Fine paid successfully.');
      fetchFines();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Payment failed.'); }
  };

  const handlePayAll = async () => {
    try {
      const unpaidFines = fines.filter(f => f.status === 'unpaid');
      if (unpaidFines.length === 0) return;
      const totalAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

      await api.post('/api/payments', { amount: totalAmount, method: 'card' });
      for (const fine of unpaidFines) {
        await api.put(`/api/fines/${fine._id}/pay`);
      }
      Alert.alert('Success', 'All outstanding fines paid successfully.');
      fetchFines();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Payment failed.');
    }
  };

  const renderItem = ({ item }) => {
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: item.status === 'paid' ? '#e8f5e9' : '#fce4ec' }]}>
            <Ionicons name={item.status === 'paid' ? 'checkmark-circle' : 'warning'} size={22} color={item.status === 'paid' ? '#4caf50' : '#ef4444'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reason}>{item.reason === 'Overstay' ? 'Overstay Fee' : item.reason}</Text>
            <Text style={styles.detail}>Time: {formattedDate}</Text>
            <Text style={styles.detail}>Duration: {item.overstayMinutes > 0 ? `${item.overstayMinutes} min` : 'N/A'}</Text>
          </View>
          <Text style={styles.amount}>LKR {item.amount}</Text>
        </View>
        {item.status === 'unpaid' && (
          <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(item)}>
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1a6bff" /></View>;

  const unpaidFinesAmount = fines.filter(f => f.status === 'unpaid').reduce((sum, f) => sum + f.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1a1a2e" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Fines</Text>
        <View style={{ width: 24 }} />
      </View>
      {unpaidFinesAmount > 0 && (
        <TouchableOpacity style={styles.payAllBtn} onPress={handlePayAll} activeOpacity={0.85}>
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.payAllBtnText}>Pay All Fines: LKR {unpaidFinesAmount}</Text>
        </TouchableOpacity>
      )}
      <FlatList data={fines} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFines(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No fines found.</Text>} />
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
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  reason: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  detail: { fontSize: 12, color: '#8896b0', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: '#ef4444' },
  payBtn: { backgroundColor: '#1a6bff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40, fontSize: 15 },
  payAllBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: '#EF4444', marginHorizontal: 16, marginTop: 4, marginBottom: 8,
    borderRadius: 14, paddingVertical: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  payAllBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
