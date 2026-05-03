/**
 * GlassCard — Reusable glass-style surface.
 *
 * This component provides a clean, glassy visual aesthetic with high reliability
 * across all platforms (iOS, Android, Web).
 */
import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';

export default function GlassCard({
  style,
  children,
  intensity = 50,
  fallbackColor,
  ...props
}) {
  const colorScheme = useColorScheme();

  // Premium fallback background tint matching color scheme
  const bg = fallbackColor ?? (
    colorScheme === 'dark'
      ? '#1e1e2d'
      : '#ffffff'
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    // High visibility shadows across platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
});
