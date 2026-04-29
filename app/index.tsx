import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
  const { session, profile } = useAuthStore();

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/welcome" />;

  if (profile.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
  if (profile.role === 'advertiser') return <Redirect href="/(advertiser)/dashboard" />;
  return <Redirect href="/(viewer)/feed" />;
}
