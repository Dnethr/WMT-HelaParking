import React, { useState } from 'react';
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import api from "../../../src/utils/api";
import GlassCard from "../../../src/components/GlassCard";

export default function BookingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [booking, setBooking] = useState(params.booking ? JSON.parse(params.booking) : null);
  const [loading, setLoading] = useState(false);

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Booking details not found.</Text>
      </View>
    );
  }

  const handleCancel = async () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          const res = await api.put(`/api/bookings/${booking._id}/cancel`);
          setBooking(res.data.booking);
          Alert.alert('Success', 'Booking cancelled successfully.');
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to cancel booking.');
        } finally {
          setLoading(false);
        }
      }},
    ]);
  };

  const handleExtend = async () => {
    try {
      setLoading(true);
      const newEndTime = new Date(new Date(booking.endTime).getTime() + 60 * 60 * 1000); // add 1 hour
      const res = await api.put(`/api/bookings/${booking._id}/extend`, { newEndTime: newEndTime.toISOString() });
      setBooking(res.data.booking);
      Alert.alert('Success', 'Booking extended by 1 hour.');
    } catch (e) {
      Alert.alert('Extension Failed', e.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = { pending: '#F59E0B', active: '#1E40AF', completed: '#10B981', cancelled: '#6B7280' };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'Booking Details',
          headerShown: true,
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#111827',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* QR Code Section */}
          {booking.status === 'completed' ? (
            <GlassCard style={[styles.qrContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text style={[styles.qrHint, { color: '#10b981', fontWeight: '700', fontSize: 16 }]}>Booking Completed</Text>
            </GlassCard>
          ) : booking.status === 'cancelled' ? (
            <GlassCard style={[styles.qrContainer, { backgroundColor: 'rgba(254, 226, 226, 0.45)' }]}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
              <Text style={[styles.qrHint, { color: '#ef4444', fontWeight: '700', fontSize: 16 }]}>Booking Cancelled</Text>
            </GlassCard>
          ) : (
            booking.qrCode && (
              <GlassCard style={styles.qrContainer}>
                <QRCode value={booking.qrCode} size={180} />
                <Text style={styles.qrHint}>Present this QR code at the entrance gate</Text>
              </GlassCard>
            )
          )}

          {/* Details Card */}
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>Slot Number</Text>
              <Text style={styles.value}>{booking.slotId?.slotNumber || 'N/A'}</Text>
            </View>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[booking.status] || '#999') + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[booking.status] || '#999' }]}>{booking.status}</Text>
              </View>
            </View>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>Vehicle</Text>
              <Text style={styles.value}>{booking.vehicleNumber}</Text>
            </View>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>Start</Text>
              <Text style={styles.value}>{new Date(booking.startTime).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>End</Text>
              <Text style={styles.value}>{new Date(booking.endTime).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRowBetween}>
              <Text style={styles.label}>Total Fee</Text>
              <Text style={styles.costValue}>LKR {booking.totalCost?.toFixed(2)}</Text>
            </View>
          </GlassCard>

          {/* Actions */}
          {booking.status === 'pending' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cancelBtnText}>Cancel Booking</Text>}
            </TouchableOpacity>
          )}

          {booking.status === 'active' && (
            <TouchableOpacity style={styles.extendBtn} onPress={handleExtend} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.extendBtnText}>Extend by 1 Hour</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  errorText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  content: { padding: 20, paddingTop: 10 },
  qrContainer: { alignItems: 'center', padding: 24, marginBottom: 16 },
  qrHint: { fontSize: 13, color: '#4B5563', marginTop: 14, fontWeight: '500', textAlign: 'center' },
  infoCard: { padding: 20, gap: 14 },
  infoRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  value: { fontSize: 14, color: '#111827', fontWeight: '700' },
  costValue: { fontSize: 18, color: '#1E40AF', fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cancelBtn: { backgroundColor: '#ef4444', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  cancelBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  extendBtn: { backgroundColor: '#10b981', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  extendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
