import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const STATUS_COLORS = {
  'Available': { bg: '#e8f5e9', border: '#81c784', icon: '#a5d6a7' },
  'Reserved': { bg: '#fff8e1', border: '#ffd54f', icon: '#ffe082' },
  'Occupied': { bg: '#eeeeee', border: '#bdbdbd', icon: '#aaaaaa' },
  'Selected': { bg: '#1a6bff', border: '#1a6bff', icon: '#ffffff' },
  'Out-of-Service': { bg: '#e0e0e0', border: '#9e9e9e', icon: '#757575' },
};

export default function SlotCard({ slot, isSelected, onPress }) {
  const statusKey = isSelected ? 'Selected' : slot.status;
  const colors = STATUS_COLORS[statusKey] || STATUS_COLORS['Available'];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={() => onPress(slot)}
      activeOpacity={0.7}
    >
      {slot.status === 'Out-of-Service' ? (
        <Ionicons name="close-circle" size={28} color={colors.icon} />
      ) : (
        <>
          {slot.type === 'Car' && <FontAwesome5 name="car" size={24} color={colors.icon} />}
          {slot.type === 'Bike' && <FontAwesome5 name="motorcycle" size={24} color={colors.icon} />}
          {slot.type === 'EV' && <FontAwesome5 name="bolt" size={24} color={colors.icon} />}
          {slot.type === 'Disabled' && <FontAwesome5 name="wheelchair" size={24} color={colors.icon} />}
        </>
      )}
      <Text style={[styles.slotNumber, isSelected && { color: '#fff' }]}>{slot.slotNumber}</Text>
      <Text style={[styles.slotType, isSelected && { color: '#dce6ff' }]}>{slot.type}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 72, height: 85, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', margin: 4,
  },
  slotNumber: { fontSize: 10, fontWeight: '700', color: '#333', marginTop: 4 },
  slotType: { fontSize: 9, color: '#666' },
});
