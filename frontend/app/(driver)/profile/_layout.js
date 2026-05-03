import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="vehicles" options={{ headerShown: false }} />
      <Stack.Screen name="fines" options={{ headerShown: false }} />
      <Stack.Screen name="incident" options={{ headerShown: false }} />
    </Stack>
  );
}
