import { useRouter } from "expo-router";
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,  } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from "../src/utils/api";

const TYPE_ICONS = { booking: 'calendar', fine: 'warning', overstay: 'time', payment: 'card', incident: 'alert-circle', system: 'information-circle' };

export default function NotificationsScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try { const res = await api.get('/api/notifications/my'); setNotifications(res.data.notifications); }
    catch (e) { /* silent */ } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchNotifications(); }, []));

  const markRead = async (id) => {
    try { await api.put(`/api/notifications/${id}/read`); setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n)); }
    catch (e) { /* silent */ }
  };

  const markAllRead = async () => {
    try { await api.put('/api/notifications/read-all'); setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true }))); }
    catch (e) { /* silent */ }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, !item.isRead && styles.unread]} onPress={() => markRead(item._id)}>
      <View style={styles.iconCircle}><Ionicons name={TYPE_ICONS[item.type] || 'information-circle'} size={20} color="#1a6bff" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1a6bff" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1a1a2e" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}><Text style={styles.markAll}>Read All</Text></TouchableOpacity>
      </View>
      <FlatList data={notifications} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications.</Text>} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  markAll: { fontSize: 13, color: '#1a6bff', fontWeight: '700' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  unread: { backgroundColor: '#f0f6ff', borderLeftWidth: 3, borderLeftColor: '#1a6bff' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center' },
  message: { fontSize: 14, color: '#1a1a2e', lineHeight: 20 },
  time: { fontSize: 11, color: '#8896b0', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a6bff' },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40, fontSize: 15 },
});
