import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Animated, Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/components/GlassCard';
import api from "../../src/utils/api";

function ScanCorners({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const corner = (position) => {
    const posStyle = {
      topLeft:     { top: 0, left: 0 },
      topRight:    { top: 0, right: 0, transform: [{ rotate: '90deg' }] },
      bottomLeft:  { bottom: 0, left: 0, transform: [{ rotate: '-90deg' }] },
      bottomRight: { bottom: 0, right: 0, transform: [{ rotate: '180deg' }] },
    }[position];
    return (
      <Animated.View key={position} style={[styles.corner, posStyle, { opacity: pulse }]}>
        <View style={[styles.cornerH, { borderColor: color }]} />
        <View style={[styles.cornerV, { borderColor: color }]} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.cornersContainer}>
      {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(corner)}
    </View>
  );
}

export default function GateScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    try {
      const payload = JSON.parse(data);
      if (!payload.bookingId) { Alert.alert('Invalid QR', 'No bookingId found.'); return; }
      setLoading(true);
      const res = await api.post('/api/gate/scan', { bookingId: payload.bookingId });
      setResult(res.data);
      Alert.alert('Success', res.data.message);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Scan failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  if (!permission.granted) {
    return (
      <View collapsable={false} style={{ flex: 1 }}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={64} color="#8896b0" />
            <Text style={styles.permText}>Camera permission is needed for QR scanning</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const modeColor = '#1D9E75';

  return (
    <View collapsable={false} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Gate Scanner</Text>
          <View style={[styles.modePill, { backgroundColor: modeColor + '20' }]}>
            <View style={[styles.modePillDot, { backgroundColor: modeColor }]} />
            <Text style={[styles.modePillText, { color: modeColor }]}>Automated Scan</Text>
          </View>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <ScanCorners color={modeColor} />
            </View>
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={modeColor} style={{ marginTop: 16 }} />}

        {result && (
          <GlassCard style={styles.resultCard} intensity={50} fallbackColor="rgba(255,255,255,0.9)">
            <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
            <Text style={styles.resultText}>{result.message}</Text>
            {result.fine && <Text style={styles.fineText}>Fine: LKR {result.fine.amount}</Text>}
            {result.overstays && result.overstays.length > 0 && (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, width: '100%' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ef4444' }}>Driver's Active Overstays:</Text>
                {result.overstays.map((o) => (
                  <Text key={o._id} style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>
                    • Slot {o.slotId?.slotNumber || 'N/A'}: {Math.floor((Date.now() - new Date(o.endTime).getTime()) / 60000)} min past due
                  </Text>
                ))}
              </View>
            )}
            {result.existingFines && result.existingFines.length > 0 && (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, width: '100%' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ef4444' }}>Driver's Unpaid Overstay Fines:</Text>
                {result.existingFines.map((f) => (
                  <Text key={f._id} style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>
                    • {f.reason || 'Overstay'}: LKR {f.amount} ({f.status})
                  </Text>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {scanned && !loading && (
          <TouchableOpacity
            style={[styles.rescanBtn, { backgroundColor: modeColor }]}
            onPress={() => { setScanned(false); setResult(null); }}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-outline" size={18} color="#fff" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE      = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  modePillDot: { width: 7, height: 7, borderRadius: 3.5 },
  modePillText: { fontSize: 12, fontWeight: '700' },
  cameraContainer: { marginHorizontal: 20, height: 270, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 200, height: 200, position: 'relative' },
  cornersContainer: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerH: { position: 'absolute', top: 0, left: 0, width: CORNER_SIZE, height: CORNER_THICKNESS, borderTopWidth: CORNER_THICKNESS, borderColor: '#1D9E75' },
  cornerV: { position: 'absolute', top: 0, left: 0, width: CORNER_THICKNESS, height: CORNER_SIZE, borderLeftWidth: CORNER_THICKNESS, borderColor: '#1D9E75' },
  resultCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  resultText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  fineText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12, borderRadius: 14, height: 48,
  },
  rescanText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  permText: { fontSize: 16, color: '#555', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  permBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
