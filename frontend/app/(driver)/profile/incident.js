import { useRouter } from "expo-router";
import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import GlassCard from '../../../src/components/GlassCard';
import api from "../../../src/utils/api";
import storage from '../../../src/utils/storage';

const CATEGORIES = ['Blocked Car', 'Equipment Failure', 'Theft', 'Oil Spill', 'Other'];

export default function IncidentReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [slotId, setSlotId] = useState('');
  const [slots, setSlots] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/slots')
      .then((res) => {
        const activeSlots = (res.data.slots || []).filter(s => s.status !== 'Out-of-Service' && !s.isDisabled);
        setSlots(activeSlots);
      })
      .catch(() => {});
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Description is required.'); return; }
    if (!slotId) { Alert.alert('Error', 'Please select a related slot.'); return; }

    try {
      setLoading(true);

      // Step 1 — create incident
      const res = await api.post('/api/incidents', {
        category,
        description: description.trim(),
        slotId,
      });

      // Step 2 — upload image if selected (image is optional)
      // Use native fetch for FormData uploads in React Native to avoid axios serialization bugs
      if (image && res.data.incident?._id) {
        const formData = new FormData();
        formData.append('image', {
          uri: image.uri,
          name: 'evidence.jpg',
          type: 'image/jpeg',
        });
        
        const token = await storage.getItemAsync('token');
        const uploadRes = await fetch(`${api.defaults.baseURL}/api/incidents/${res.data.incident._id}/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Do NOT set Content-Type; fetch automatically adds the multipart boundary
          },
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Image upload failed on the server.');
        }
      }

      Alert.alert(
        'Report Submitted',
        `Ticket: ${res.data.incident.ticketId}\nWe'll look into this shortly.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category */}
        <GlassCard style={styles.section} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
          <Text style={styles.sectionLabel}>Category *</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Description */}
        <GlassCard style={styles.section} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
          <Text style={styles.sectionLabel}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the incident in detail..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </GlassCard>

        {/* Related Slot */}
        <GlassCard style={styles.section} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
          <Text style={styles.sectionLabel}>Related Slot *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {slots.slice(0, 30).map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[styles.slotChip, slotId === s._id && styles.slotChipActive]}
                onPress={() => setSlotId(slotId === s._id ? '' : s._id)}
              >
                <Text style={[styles.slotChipText, slotId === s._id && { color: '#fff' }]}>
                  {s.slotNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Evidence Photo (optional) */}
        <GlassCard style={styles.section} intensity={45} fallbackColor="rgba(255,255,255,0.85)">
          <Text style={styles.sectionLabel}>Evidence Photo <Text style={styles.optional}>(Optional)</Text></Text>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage} activeOpacity={0.8}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewThumb} />
            ) : (
              <Ionicons name="camera-outline" size={24} color="#8896b0" />
            )}
            <Text style={styles.imageBtnText}>
              {image ? '✓ Image Selected — tap to change' : 'Add Evidence Photo'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Report</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  content: { padding: 16, paddingBottom: 60 },

  // Sections
  section: { padding: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  optional: { fontSize: 12, fontWeight: '500', color: '#9CA3AF', textTransform: 'none', letterSpacing: 0 },

  // Category chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(240,244,255,0.8)', borderWidth: 1, borderColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive: { color: '#fff' },

  // Text area
  textArea: {
    backgroundColor: 'rgba(247,249,252,0.85)', borderRadius: 12,
    padding: 12, fontSize: 15, minHeight: 100,
    borderWidth: 1, borderColor: 'rgba(232,236,244,0.9)',
    color: '#1a1a2e',
  },

  // Slot chips
  slotChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(240,244,255,0.8)', borderWidth: 1, borderColor: '#e0e0e0', marginRight: 6 },
  slotChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  slotChipText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Image picker
  imageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(247,249,252,0.85)', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: 'rgba(232,236,244,0.9)',
    borderStyle: 'dashed',
  },
  previewThumb: { width: 40, height: 40, borderRadius: 8 },
  imageBtnText: { fontSize: 14, color: '#8896b0', fontWeight: '500', flex: 1 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F59E0B', borderRadius: 14, height: 54, marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
