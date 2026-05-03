import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal, TextInput, Animated, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";

const STATUS_OPTS = ['Available', 'Reserved', 'Occupied', 'Out-of-Service'];
const TYPE_OPTS   = ['Car', 'Bike', 'EV', 'Disabled'];
const ZONE_OPTS   = ['A', 'B', 'C'];

const STATUS_CONFIG = {
  Available:        { color: '#22C55E' },
  Reserved:         { color: '#F59E0B' },
  Occupied:         { color: '#EF4444' },
  'Out-of-Service': { color: '#9e9e9e' },
};

// ─── Floating Glass Popup ────────────────────────────────────────────────────
function SlotFormPopup({ visible, editSlot, form, setForm, onSave, onCancel }) {
  // Scale + translateY spring — applied on parent wrapper, NOT on GlassCard
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, useNativeDriver: true,
          damping: 18, stiffness: 260, mass: 0.7,
        }),
        Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true,
          damping: 18, stiffness: 260, mass: 0.7,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      translateY.setValue(20);
    }
  }, [visible]);

  const ChipSelect = ({ options, selected, onSelect }) => (
    <View style={popupStyles.chipRow}>
      {options.map((o) => (
        <Pressable key={o} style={[popupStyles.chip, selected === o && popupStyles.chipActive]} onPress={() => onSelect(o)}>
          <Text style={[popupStyles.chipTxt, selected === o && { color: '#fff' }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Dim backdrop */}
      <Pressable style={popupStyles.backdrop} onPress={onCancel}>
        {/* Stop propagation so tapping inside the card doesn't dismiss */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={popupStyles.centerWrap}
        >
          <Pressable onPress={() => {}}>
            {/* Spring wrapper — scale + translateY on parent, never on GlassCard */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY }] }}>
              <GlassCard style={popupStyles.card} intensity={70} fallbackColor="rgba(255,255,255,0.97)">
                {/* Header */}
                <View style={popupStyles.header}>
                  <Text style={popupStyles.title}>{editSlot ? 'Edit Slot' : 'New Slot'}</Text>
                  <Pressable onPress={onCancel} style={popupStyles.closeBtn} hitSlop={8}>
                    <Ionicons name="close-circle" size={26} color="#6B7280" />
                  </Pressable>
                </View>

                {/* Fields */}
                <TextInput
                  style={popupStyles.input}
                  placeholder="Slot Number  e.g. P1-A01"
                  placeholderTextColor="#9CA3AF"
                  value={form.slotNumber}
                  onChangeText={(v) => setForm({ ...form, slotNumber: v })}
                />
                <TextInput
                  style={popupStyles.input}
                  placeholder="Parking Area  e.g. 1"
                  placeholderTextColor="#9CA3AF"
                  value={form.floor}
                  onChangeText={(v) => setForm({ ...form, floor: v })}
                  keyboardType="numeric"
                />

                <Text style={popupStyles.label}>Type</Text>
                <ChipSelect options={TYPE_OPTS} selected={form.type} onSelect={(v) => setForm({ ...form, type: v })} />

                <Text style={popupStyles.label}>Zone</Text>
                <ChipSelect options={ZONE_OPTS} selected={form.zone} onSelect={(v) => setForm({ ...form, zone: v })} />

                <Text style={popupStyles.label}>Status</Text>
                <ChipSelect options={STATUS_OPTS} selected={form.status} onSelect={(v) => setForm({ ...form, status: v })} />

                {/* Actions */}
                <View style={popupStyles.actions}>
                  <TouchableOpacity style={popupStyles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
                    <Text style={popupStyles.cancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={popupStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={popupStyles.saveTxt}>Save</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SlotManagerScreen() {
  const insets = useSafeAreaInsets();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [form, setForm] = useState({ slotNumber: '', type: 'Car', floor: '1', zone: 'A', status: 'Available' });

  const fetchSlots = async () => {
    try { const res = await api.get('/api/slots'); setSlots(res.data.slots); }
    catch (e) { /* */ } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchSlots(); }, []));

  const openCreate = () => {
    setEditSlot(null);
    setForm({ slotNumber: '', type: 'Car', floor: '1', zone: 'A', status: 'Available' });
    setModalVisible(true);
  };

  const openEdit = (s) => {
    setEditSlot(s);
    setForm({ slotNumber: s.slotNumber, type: s.type, floor: s.floor, zone: s.zone, status: s.status });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const regex = /^P[1-2]-[A-C]\d{2}$/;
    if (!regex.test(form.slotNumber)) {
      Alert.alert('Invalid Format', 'Slot number must be in the format P(1/2)-(A/B/C)(01-99).\nExample: P1-A01, P2-C05.');
      return;
    }
    try {
      if (editSlot) { await api.put(`/api/slots/${editSlot._id}`, form); }
      else { await api.post('/api/slots', form); }
      setModalVisible(false);
      fetchSlots();
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to save slot.'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Slot', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try { await api.delete(`/api/slots/${id}`); fetchSlots(); }
        catch (e) { Alert.alert('Error', 'Delete failed.'); }
      }},
    ]);
  };

  const renderItem = ({ item }) => {
    const statusColor = STATUS_CONFIG[item.status]?.color || '#9e9e9e';
    return (
      <GlassCard style={styles.card} intensity={42} fallbackColor="rgba(255,255,255,0.82)">
        <View style={styles.cardRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.slotNum}>{item.slotNumber}</Text>
          <Text style={styles.slotInfo}>{item.type} · Zone {item.zone} · P{item.floor}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="create-outline" size={18} color="#1a6bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  const fabBottom = insets.bottom + 12;

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Slot Manager</Text>

        <FlatList
          data={slots}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No slots yet.</Text>}
        />

        {/* FAB — shadow wrapper sits outside GlassCard so overflow:hidden doesn't clip it */}
        <View style={[styles.fabShadow, { bottom: fabBottom }]}>
          <GlassCard
            style={styles.fab}
            intensity={72}
            fallbackColor="rgba(255,255,255,0.88)"
          >
            <TouchableOpacity onPress={openCreate} activeOpacity={0.8} style={styles.fabInner}>
              <Ionicons name="add" size={26} color="#1D9E75" />
              <Text style={styles.fabLabel}>New Slot</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>

      <SlotFormPopup
        visible={modalVisible}
        editSlot={editSlot}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
}

// ─── List screen styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  list: { padding: 16, paddingBottom: 140 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  slotNum: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  slotInfo: { fontSize: 12, color: '#8896b0', flex: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  empty: { textAlign: 'center', color: '#8896b0', marginTop: 40 },
  // Pill FAB
  // Shadow wrapper — carries depth shadow (outside overflow:hidden)
  fabShadow: {
    position: 'absolute', right: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  // Glass pill — no border, overflow hidden for blur
  fab: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, overflow: 'hidden',
  },
  fabInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
    // No solid backgroundColor — GlassCard handles the frosted appearance
  },
  fabLabel: { color: '#1D9E75', fontSize: 14, fontWeight: '800' },
});

// ─── Floating popup styles ────────────────────────────────────────────────────
const popupStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  closeBtn: { padding: 2 },
  input: {
    backgroundColor: 'rgba(247,249,252,0.9)',
    borderRadius: 12, padding: 13, marginBottom: 12,
    fontSize: 15, borderWidth: 1, borderColor: 'rgba(232,236,244,0.9)',
    color: '#1a1a2e',
  },
  label: { fontSize: 12, fontWeight: '700', color: '#4a5568', marginBottom: 8, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    backgroundColor: 'rgba(240,244,255,0.85)', borderWidth: 1, borderColor: '#e0e0e0',
  },
  chipActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#555' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(240,244,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  saveBtn: {
    flex: 2, height: 48, borderRadius: 12,
    backgroundColor: '#1D9E75',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  saveTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
