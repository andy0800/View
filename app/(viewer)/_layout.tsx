import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily } from '../../src/lib/theme';

export default function ViewerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Watch',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    minHeight: 65,
    paddingTop: 8,
    paddingBottom: 8, // Expo automatically adds safe area padding on top of this
  },
  tabLabel: { fontFamily: FontFamily.medium, fontSize: 11, paddingBottom: 4 },
  tabIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  tabIconFocused: {},
});
