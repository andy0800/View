import { Stack } from 'expo-router';
import { Colors } from '../../src/lib/theme';
import { StyleSheet } from 'react-native';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
