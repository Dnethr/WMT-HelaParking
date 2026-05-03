import React, { useState, useCallback } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";

const PERIOD_LABELS = { all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month' };

// Generates mock daily bars from byMethod data for demonstration
function buildChartData(byMethod) {
  if (!byMethod?.length) return [];
  return byMethod.map((m, i) => ({
    value: m.total || 0,
    label: m._id || `M${i + 1}`,
    frontColor: i === 0 ? '#854F0B' : '#D97706',
    topLabelComponent: () => (
      <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 2 }}>
        LKR {Math.round((m.total || 0) / 1000)}k
      </Text>
    ),
  }));
}

export default function RevenueScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [revenue, setRevenue] = useState(null);
  const [byMethod, setByMethod] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  const fetchRevenue = async () => {
    try {
      const params = {};
      if (period === 'today') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        params.from = today.toISOString();
      } else if (period === 'week') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        params.from = d.toISOString();
      } else if (period === 'month') {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        params.from = d.toISOString();
      }
      const res = await api.get('/api/payments/revenue', { params });
      setRevenue(res.data.revenue);
      setByMethod(res.data.byMethod || []);
    } catch (e) { /* */ } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchRevenue(); }, [period]));

  const PERIODS = ['all', 'today', 'week', 'month'];

  if (!isFocused) return <View style={{ flex: 1 }} />;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#854F0B" /></View>;

  const chartData = buildChartData(byMethod);

  return (
    <View collapsable={false} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>Revenue</Text>

          {/* Period filter chips */}
          <View style={styles.filterRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, period === p && styles.chipActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.chipText, period === p && { color: '#fff' }]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Main total card */}
          <GlassCard style={styles.mainCard} intensity={60}>
            <Ionicons name="wallet" size={32} color="#854F0B" />
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={styles.totalValue}>LKR {revenue?.totalRevenue?.toLocaleString() || 0}</Text>
          </GlassCard>

          {/* Stat cards */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} intensity={50}>
              <Text style={styles.statValue}>{revenue?.totalTransactions || 0}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity={50}>
              <Text style={styles.statValue}>LKR {Math.round(revenue?.avgTransaction || 0)}</Text>
              <Text style={styles.statLabel}>Avg Transaction</Text>
            </GlassCard>
          </View>

          {/* Bar chart — revenue by method */}
          {chartData.length > 0 && (
            <GlassCard style={styles.chartCard} intensity={50}>
              <Text style={styles.sectionTitle}>Revenue by Method</Text>
              <BarChart
                data={chartData}
                barWidth={52}
                barBorderRadius={8}
                frontColor="#854F0B"
                yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...chartData.map(d => d.value)) * 1.2}
                isAnimated
                animationDuration={600}
                hideRules
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#e5e7eb"
                showFractionalValues={false}
                roundToDigits={0}
                width={260}
              />
            </GlassCard>
          )}

          {/* By method breakdown */}
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Payment Methods</Text>
          {byMethod.map((m) => (
            <GlassCard key={m._id} style={styles.methodCard} intensity={40}>
              <Ionicons name={m._id === 'card' ? 'card' : 'cash'} size={22} color="#854F0B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.methodName}>{m._id}</Text>
                <Text style={styles.methodCount}>{m.count} transactions</Text>
              </View>
              <Text style={styles.methodTotal}>LKR {m.total?.toLocaleString()}</Text>
            </GlassCard>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 120 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: '#d1d5db',
  },
  chipActive: { backgroundColor: '#854F0B', borderColor: '#854F0B' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'capitalize' },
  mainCard: { padding: 28, alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  totalValue: { fontSize: 36, fontWeight: '800', color: '#1a1a2e', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  chartCard: { padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8 },
  methodName: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  methodCount: { fontSize: 12, color: '#6B7280' },
  methodTotal: { fontSize: 16, fontWeight: '800', color: '#854F0B' },
});
