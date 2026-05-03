import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SlotCard from './SlotCard';

export default function SlotGrid({ slots, selectedSlot, onSlotPress }) {
  // Group slots by floor and then by zone for proper layout
  const floors = [...new Set(slots.map((s) => s.floor))].sort();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Entry label */}
      <View style={styles.entryLabel}>
        <Text style={styles.entryText}>ENTRY</Text>
        <Text style={styles.entryArrows}>⌄ ⌄ ⌄</Text>
      </View>

      {floors.map((floor) => {
        const floorSlots = slots.filter((s) => s.floor === floor);
        const zones = [...new Set(floorSlots.map((s) => s.zone))].sort();

        return (
          <View key={floor} style={styles.floorSection}>
            <View style={styles.floorHeader}>
              <Text style={styles.floorLabel}>P{floor}</Text>
              <View style={styles.floorLine} />
            </View>

            {zones.map((zone) => {
              const zoneSlots = floorSlots.filter((s) => s.zone === zone);
              const halfIdx = Math.ceil(zoneSlots.length / 2);
              const leftSlots = zoneSlots.slice(0, halfIdx);
              const rightSlots = zoneSlots.slice(halfIdx);

              return (
                <View key={`${floor}-${zone}`}>
                  <Text style={styles.zoneLabel}>Zone {zone}</Text>
                  <View style={styles.row}>
                    <View style={styles.slotColumn}>
                      {leftSlots.map((s) => (
                        <SlotCard key={s._id} slot={s} isSelected={selectedSlot?._id === s._id} onPress={onSlotPress} />
                      ))}
                    </View>

                    <View style={styles.drivingLane}>
                      <Ionicons name="arrow-up" size={16} color="#aaa" />
                      <View style={styles.laneCenter}>
                        <View style={styles.dashLine} />
                      </View>
                      <Ionicons name="arrow-down" size={16} color="#aaa" />
                    </View>

                    <View style={styles.slotColumn}>
                      {rightSlots.map((s) => (
                        <SlotCard key={s._id} slot={s} isSelected={selectedSlot?._id === s._id} onPress={onSlotPress} />
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.exitLabel}>
        <Text style={styles.entryArrows}>⌃ ⌃ ⌃</Text>
        <Text style={styles.entryText}>EXIT</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef3fb' },
  entryLabel: { alignItems: 'center', paddingVertical: 12 },
  entryText: { fontSize: 14, fontWeight: '800', color: '#5c6b8a', letterSpacing: 4 },
  entryArrows: { fontSize: 18, color: '#8896b0', marginTop: 2 },
  exitLabel: { alignItems: 'center', paddingVertical: 16 },
  floorSection: { marginBottom: 16 },
  floorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  floorLabel: { fontSize: 18, fontWeight: '800', color: '#3a4a6b', marginRight: 12 },
  floorLine: { flex: 1, height: 2, backgroundColor: '#c5d0e6', borderRadius: 1 },
  zoneLabel: { fontSize: 12, fontWeight: '700', color: '#7a8aaa', textAlign: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 },
  slotColumn: { flexDirection: 'column', alignItems: 'center' },
  drivingLane: {
    width: 40, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8,
    backgroundColor: '#dde3ef', borderRadius: 6, marginHorizontal: 6, minHeight: 100,
  },
  laneCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dashLine: { width: 2, flex: 1, backgroundColor: '#b0bdd0', borderRadius: 1 },
});
