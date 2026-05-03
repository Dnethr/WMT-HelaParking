import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DriverLayout() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        labelStyle={{ color: DynamicColorIOS({ dark: 'white', light: 'black' }) }}
        tintColor={DynamicColorIOS({ dark: '#1a6bff', light: '#1a6bff' })}
      >
        <NativeTabs.Trigger name="index">
          <Label>Map</Label>
          <Icon sf="map" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bookings">
          <Label>Bookings</Label>
          <Icon sf="calendar" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="payments">
          <Label>Payments</Label>
          <Icon sf="creditcard" />
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
        tabBarActiveTintColor: '#1a6bff',
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
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="bookings" 
        options={{ 
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="payments" 
        options={{ 
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}
