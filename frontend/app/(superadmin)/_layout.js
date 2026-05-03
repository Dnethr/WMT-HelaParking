import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SuperAdminLayout() {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        labelStyle={{ color: DynamicColorIOS({ dark: 'white', light: 'black' }) }}
        tintColor={DynamicColorIOS({ dark: '#854F0B', light: '#854F0B' })}
      >
        <NativeTabs.Trigger name="index">
          <Label>Dashboard</Label>
          <Icon sf="chart.bar" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="pricing">
          <Label>Pricing</Label>
          <Icon sf="dollarsign.circle" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="revenue">
          <Label>Revenue</Label>
          <Icon sf="chart.pie" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="incidents">
          <Label>Incidents</Label>
          <Icon sf="exclamationmark.triangle" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Label>Settings</Label>
          <Icon sf="gear" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Fallback to standard, aesthetic React Navigation tabs for Android
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#854F0B',
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="pricing" 
        options={{ 
          title: 'Pricing',
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="revenue" 
        options={{ 
          title: 'Revenue',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={24} color={color} /> 
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
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}
