import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";

const VEHICLE_TYPES = ['Car', 'Bike', 'EV', 'Disabled'];
const ZONES = ['A', 'B', 'C'];
const DEFAULT_RATES = { Car: 150, Bike: 50, EV: 200, Disabled: 0 };
const ZONE_COLORS = { A: '#3B82F6', B: '#22C55E', C: '#F59E0B' };

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const [pricing, setPricing] = useState([]);
  const [editRates, setEditRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  const fetchPricing = async () => {
    try {
      const res = await api.get('/api/pricing');
      const pricingData = res.data.pricing || [];

      const allCombinations = [];
      const initialEditRates = {};
      VEHICLE_TYPES.forEach(vType => {
        ZONES.forEach(zone => {
          const rule = pricingData.find(p => p.vehicleType === vType && p.zone === zone);
          const currentRate = rule ? rule.ratePerHour : (DEFAULT_RATES[vType] || 0);
          const key = `${vType}-${zone}`;

          allCombinations.push({ vehicleType: vType, zone, key, currentRate });
          initialEditRates[key] = String(currentRate);
        });
      });
      setPricing(allCombinations);
      setEditRates(initialEditRates);
    } catch (e) {
      console.log('Error fetching pricing:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPricing();
  }, []));

  const adjustRate = (key, delta) => {
    setEditRates(prev => {
      const current = parseFloat(prev[key]) || 0;
      const nextValue = Math.max(0, current + delta);
      return { ...prev, [key]: String(nextValue) };
    });
  };

  const handleSaveAll = async () => {
    const updates = [];
    for (const item of pricing) {
      const newRate = parseFloat(editRates[item.key]);
      if (isNaN(newRate) || newRate < 0) {
        Alert.alert('Error', `Please enter a valid rate for ${item.vehicleType} - Zone ${item.zone}`);
        return;
      }
      updates.push({
        vehicleType: item.vehicleType,
        zone: item.zone,
        ratePerHour: newRate,
      });
    }

    try {
      setSavingAll(true);
      await api.put('/api/pricing', { updates });
      Alert.alert('Success', 'All pricing rules updated successfully!');
      fetchPricing();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed.');
    } finally {
      setSavingAll(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#854F0B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Pricing Config</Text>
        <Text style={styles.sectionSubtitle}>Directly update pricing for each vehicle type and zone combination</Text>

        <View style={styles.pricingGrid}>
          {pricing.map((item) => {
            const zoneColor = ZONE_COLORS[item.zone] || '#854F0B';
            return (
              <GlassCard key={item.key} style={styles.pricingCard} intensity={45}>
                <View style={styles.cardHeader}>
                  <Text style={styles.vType}>{item.vehicleType}</Text>
                  <View style={[styles.zoneBadge, { backgroundColor: zoneColor }]}>
                    <Text style={styles.zoneText}>Zone {item.zone}</Text>
                  </View>
                </View>

                {/* Adjustable Rate Section */}
                <View style={styles.rateContainer}>
                  <Text style={styles.rateLabel}>LKR / Hr</Text>
                  <View style={styles.rateRow}>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => adjustRate(item.key, -10)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove-circle-outline" size={24} color="#854F0B" />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.rateInput}
                      value={editRates[item.key]}
                      onChangeText={(txt) => setEditRates(prev => ({ ...prev, [item.key]: txt }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />

                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => adjustRate(item.key, 10)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#854F0B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Save All Changes Action Button */}
        <TouchableOpacity
          style={styles.saveAllBtn}
          onPress={handleSaveAll}
          disabled={savingAll}
          activeOpacity={0.85}
        >
          {savingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
              <Text style={styles.saveAllBtnText}>Save All Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 2 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pricingCard: { width: '48.5%', padding: 12, marginBottom: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vType: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  zoneBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  zoneText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  rateContainer: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  rateLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  adjustBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  rateInput: {
    fontSize: 15, fontWeight: '800', color: '#1a1a2e',
    flex: 1, textAlign: 'center', paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 6, height: 32,
  },

  saveAllBtn: {
    backgroundColor: '#854F0B', borderRadius: 12, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 24, gap: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5,
  },
  saveAllBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
