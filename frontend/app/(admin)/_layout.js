import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        labelStyle={{ color: DynamicColorIOS({ dark: 'white', light: 'black' }) }}
        tintColor={DynamicColorIOS({ dark: '#1D9E75', light: '#1D9E75' })}
      >
        <NativeTabs.Trigger name="index">
          <Label>Overview</Label>
          <Icon sf="square.grid.2x2" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="slots">
          <Label>Slots</Label>
          <Icon sf="car" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="gate">
          <Label>Scanner</Label>
          <Icon sf="qrcode.viewfinder" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="incidents">
          <Label>Incidents</Label>
          <Icon sf="exclamationmark.triangle" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="reports">
          <Label>Reports</Label>
          <Icon sf="doc.text" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>Profile</Label>
          <Icon sf="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Fallback to standard, aesthetic React Navigation tabs for Android
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D9E75',
        tabBarInactiveTintColor: '#8896b0',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e8ecf4',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="slots" 
        options={{ 
          title: 'Slots',
          tabBarIcon: ({ color, size }) => <Ionicons name="car" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="gate" 
        options={{ 
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="incidents" 
        options={{ 
          title: 'Incidents',
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="reports" 
        options={{ 
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="overstays" 
        options={{ 
          href: null 
        }} 
      />
    </Tabs>
  );
}
