import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert,
  ActivityIndicator, Platform, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import GlassCard from './GlassCard';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export default function BookingBottomSheet({ visible, slot, onClose, onBookingCreated }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maxBookingHours, setMaxBookingHours] = useState(24);
  const [earlyCheckIn, setEarlyCheckIn] = useState(5);
  const [safeTime, setSafeTime] = useState(10);

  const [startTime, setStartTime] = useState(new Date());
  const [hours, setHours] = useState('1');
  const [slotBookings, setSlotBookings] = useState([]);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    if (visible && slot) {
      Promise.all([
        api.get('/api/users/me/vehicles'),
        api.get('/api/bookings/my'),
        api.get('/api/settings'),
        api.get(`/api/bookings?slotId=${slot._id}`)
      ]).then(([resVehicles, resBookings, resSettings, resSlotBookings]) => {
        const allVehicles = resVehicles.data.vehicles || [];
        const allBookings = resBookings.data.bookings || [];

        if (resSettings.data.settings) {
          if (resSettings.data.settings.maxBookingHours) setMaxBookingHours(resSettings.data.settings.maxBookingHours);
          if (resSettings.data.settings.maxEarlyCheckInMinutes) setEarlyCheckIn(resSettings.data.settings.maxEarlyCheckInMinutes);
          if (resSettings.data.settings.safeTimeDuration) setSafeTime(resSettings.data.settings.safeTimeDuration);
        }

        if (resSlotBookings.data.bookings) {
          setSlotBookings(resSlotBookings.data.bookings);
        }

        const typeMatched = allVehicles.filter(v =>
          v.vehicleType && slot.type &&
          v.vehicleType.trim().toLowerCase() === slot.type.trim().toLowerCase()
        );

        const vehiclesToConsider = typeMatched.length > 0 ? typeMatched : allVehicles;

        const bookedVehicles = allBookings
          .filter(b => b.status === 'active' || b.status === 'pending')
          .map(b => b.vehicleNumber.toUpperCase());

        const availableVehicles = vehiclesToConsider.filter(v => !bookedVehicles.includes(v.vehicleNumber.toUpperCase()));
        setVehicles(availableVehicles);

        if (availableVehicles.length > 0) {
          setSelectedVehicle(availableVehicles[0].vehicleNumber);
          setVehicleNumber(availableVehicles[0].vehicleNumber);
        } else {
          setSelectedVehicle(null);
          setVehicleNumber('');
        }
      }).catch(e => console.log('Error fetching vehicles, bookings or settings:', e));
    }
  }, [visible, slot]);

  const handleBook = async () => {
    if (!vehicleNumber.trim()) { Alert.alert('Error', 'Vehicle number is required.'); return; }
    
    const h = parseFloat(hours);
    if (!h || h <= 0) { Alert.alert('Error', 'Enter a valid duration in hours.'); return; }
    if (h > maxBookingHours) { Alert.alert('Error', `Maximum allowed booking duration is ${maxBookingHours} hours.`); return; }
    
    const calculatedEndTime = new Date(startTime.getTime() + h * 60 * 60 * 1000);

    // Conflict Check
    const conflict = slotBookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return (startTime < bEnd && calculatedEndTime > bStart);
    });

    if (conflict) {
      Alert.alert('Unavailable Time', 'The selected time window overlaps with an existing booking.');
      return;
    }

    try {
      setLoading(true);

      // 1. Create pending booking
      const resBooking = await api.post('/api/bookings', {
        slotId: slot._id, 
        vehicleNumber: vehicleNumber.trim(), 
        startTime: startTime.toISOString(), 
        endTime: calculatedEndTime.toISOString(),
      });
      const booking = resBooking.data.booking;
      let paymentDone = false;

      try {
        // 2. Request Payment Intent
        const totalFee = booking.totalCost || (slot.price || 100) * h;
        const resIntent = await api.post('/api/payments/create-payment-intent', { amount: totalFee });
        const { clientSecret } = resIntent.data;

        // 3. Initialize Stripe Payment Sheet
        const initResponse = await initPaymentSheet({
          merchantDisplayName: 'HelaParking',
          paymentIntentClientSecret: clientSecret,
        });

        if (initResponse.error) {
          throw new Error(initResponse.error.message);
        }

        // 4. Present Payment Sheet
        const paymentResponse = await presentPaymentSheet();

        if (paymentResponse.error) {
          throw new Error(paymentResponse.error.message);
        } else {
          // 5. Confirm Payment with Backend
          await api.post('/api/payments/confirm-payment', { bookingId: booking._id, amount: totalFee });
          paymentDone = true;

          onBookingCreated && onBookingCreated(booking);
          onClose();

          router.push({
            pathname: '/(driver)/bookings/detail',
            params: { booking: JSON.stringify(booking) }
          });
        }
      } catch (err) {
        if (!paymentDone) {
          await api.put(`/api/bookings/${booking._id}/cancel`);
        }
        throw err;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Something went wrong.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    // On Android, we MUST close the picker immediately when they select a time
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (selectedTime) {
      if (selectedTime < new Date(Date.now() - 5 * 60 * 1000)) {
        Alert.alert('Invalid Time', 'Start time cannot be in the past.');
        setStartTime(new Date());
      } else {
        setStartTime(selectedTime);
      }
    }
  };

  const handleConfirmStartTime = () => {
    setShowStartTimePicker(false);
  };

  // Slide-up animation lives on the parent wrapper, NOT on GlassCard
  const slideAnim = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!slot) return null;
  const isAvailable = slot.status === 'Available';
  
  const h = parseFloat(hours) || 0;
  const totalFee = (slot.price || 100) * h;

  return (
    <Modal visible={visible} animationType="none" transparent>
      <View style={styles.overlay}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <GlassCard style={styles.sheet} intensity={65}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.slotNumber}>{slot.slotNumber}</Text>
            <View style={[styles.badge, { backgroundColor: isAvailable ? '#e8f5e9' : '#fff8e1' }]}>
              <Text style={[styles.badgeText, { color: isAvailable ? '#2e7d32' : '#f57f17' }]}>{slot.status}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}><Text style={styles.infoLabel}>Zone</Text><Text style={styles.infoValue}>{slot.zone}</Text></View>
              <View style={styles.infoItem}><Text style={styles.infoLabel}>Type</Text><Text style={styles.infoValue}>{slot.type}</Text></View>
              <View style={styles.infoItem}><Text style={styles.infoLabel}>Rate/Hr</Text><Text style={styles.infoValue}>LKR {slot.price || 100}</Text></View>
            </View>

            {isAvailable && (
              <>
                <Text style={styles.inputLabel}>Select Vehicle</Text>
                {vehicles.length === 0 ? (
                  <View style={[styles.inputContainer, { borderColor: '#ef4444' }]}>
                    <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.inputText, { color: '#ef4444' }]}>No matching available vehicles</Text>
                  </View>
                ) : (
                  <View style={styles.vehicleSelectRow}>
                    {vehicles.map((v) => {
                      const active = selectedVehicle === v.vehicleNumber;
                      return (
                        <TouchableOpacity
                          key={v.vehicleNumber}
                          style={[styles.vehicleBtn, active && styles.vehicleBtnActive]}
                          onPress={() => {
                            setSelectedVehicle(v.vehicleNumber);
                            setVehicleNumber(v.vehicleNumber);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.vehicleBtnText, active && styles.vehicleBtnTextActive]}>
                            {v.vehicleNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowStartTimePicker(true)}>
                  <Ionicons name="time-outline" size={18} color="#8896b0" />
                  <Text style={styles.inputText}>Start Time: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </TouchableOpacity>

                {showStartTimePicker && (
                  <View style={{ alignItems: 'center' }}>
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      is24Hour={true}
                      display="spinner"
                      textColor="#1a1a2e"
                      themeVariant="light"
                      onChange={onStartTimeChange}
                    />
                    <TouchableOpacity style={styles.confirmTimeBtn} onPress={handleConfirmStartTime}>
                      <Text style={styles.confirmTimeText}>Confirm Start Time</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="hourglass-outline" size={18} color="#8896b0" />
                  <Text style={{ fontSize: 15, color: '#8896b0', fontWeight: '500' }}>Duration:</Text>
                  <TextInput
                    style={styles.inputText}
                    placeholder="hours"
                    placeholderTextColor="#adb5bd"
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="alarm-outline" size={18} color="#8896b0" />
                  <Text style={styles.inputText}>End Time: {h > 0 ? new Date(startTime.getTime() + h * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
                </View>

                <View style={styles.feeContainer}>
                  <Text style={styles.feeLabel}>Total Fee:</Text>
                  <Text style={styles.feeValue}>LKR {totalFee.toFixed(2)}</Text>
                </View>

                <View style={styles.infoNotice}>
                  <View style={styles.infoNoticeRow}>
                    <Ionicons name="time-outline" size={15} color="#1D9E75" />
                    <Text style={styles.infoNoticeText}>You can enter the parking slot <Text style={styles.infoNoticeBold}>{earlyCheckIn} minutes</Text> before your start time.</Text>
                  </View>
                  <View style={styles.infoNoticeRow}>
                    <Ionicons name="checkmark-circle-outline" size={15} color="#1D9E75" />
                    <Text style={styles.infoNoticeText}>You can check out with no extra charges until <Text style={styles.infoNoticeBold}>{safeTime} minutes</Text> after end time.</Text>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.bookButton, !isAvailable && styles.bookButtonDisabled]}
              onPress={handleBook}
              disabled={!isAvailable || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bookButtonText}>{isAvailable ? 'Pay & Book Now' : 'Not Available'}</Text>}
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  handle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  slotNumber: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  badge: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: 8, marginBottom: 16 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#f7f9fc', borderRadius: 14, padding: 16 },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#8896b0', fontWeight: '600' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f9fc', borderRadius: 14, paddingHorizontal: 16, marginBottom: 12, height: 50, borderWidth: 1, borderColor: '#e8ecf4', gap: 10 },
  inputText: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  feeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 16 },
  feeLabel: { fontSize: 16, fontWeight: '600', color: '#5c6b8a' },
  feeValue: { fontSize: 20, fontWeight: '800', color: '#1D9E75' },
  bookButton: { backgroundColor: '#1a6bff', borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center' },
  bookButtonDisabled: { backgroundColor: '#bdbdbd' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  inputLabel: { fontSize: 12, fontWeight: '600', color: '#8896b0', marginBottom: 6, marginLeft: 4 },
  vehicleSelectRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  vehicleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f7f9fc', borderWidth: 1, borderColor: '#e8ecf4' },
  vehicleBtnActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  vehicleBtnText: { fontSize: 13, color: '#1a1a2e', fontWeight: '600' },
  vehicleBtnTextActive: { color: '#fff' },

  confirmTimeBtn: { backgroundColor: '#1a6bff', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },
  confirmTimeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  infoNotice: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  infoNoticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoNoticeText: { fontSize: 12, color: '#4b5563', flex: 1, lineHeight: 18 },
  infoNoticeBold: { fontWeight: '700', color: '#1D9E75' },
});
