import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.match(/^[0-9]{8}$/)) {
      Alert.alert('Invalid Phone', 'Enter your 8-digit Kuwait number');
      return;
    }
    setLoading(true);
    const formattedPhone = `+965${phone}`;
    const email = `${formattedPhone.replace('+', '')}@viewapp.com`;
    const password = 'ViewApp123!';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      setLoading(false); 
      Alert.alert('Error', 'Account not found. Please register first.'); 
      return; 
    }
    if (!data.user) { setLoading(false); return; }

    const { data: profile } = await supabase.from('users').select('role, status').eq('id', data.user.id).single();
    setLoading(false);

    if (!profile) { Alert.alert('Account not found', 'Please register first.'); return; }
    if (profile.status === 'pending') { router.replace('/(auth)/pending-approval'); return; }
    if (profile.role === 'admin') router.replace('/(admin)/dashboard');
    else if (profile.role === 'advertiser') router.replace('/(advertiser)/dashboard');
    else router.replace('/(viewer)/feed');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#060F22', '#0A1F44', '#060F22']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>V</Text></View>
          <Text style={styles.brandName}>VIEW</Text>
        </View>

        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subheading}>Enter your Kuwait phone number to log in.</Text>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputPrefix}>+965</Text>
          <TextInput
            style={styles.inputFlex}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={8}
            placeholder="12345678"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.btnText}>Log In</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/role-select')} style={styles.registerBtn}>
          <Text style={styles.registerText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, gap: Spacing.md },
  backBtn: { marginBottom: Spacing.sm },
  backBtnText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.primary },
  brandName: { fontFamily: FontFamily.bold, fontSize: 24, color: Colors.white, letterSpacing: 6 },
  heading: { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.white },
  subheading: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md },
  inputPrefix: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textSecondary, marginRight: 8 },
  inputFlex: { flex: 1, paddingVertical: Spacing.md, color: Colors.white, fontFamily: FontFamily.regular, fontSize: 15 },
  otpInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.lg, color: Colors.white, fontFamily: FontFamily.bold, fontSize: 32, textAlign: 'center', letterSpacing: 12 },
  btnPrimary: { borderRadius: BorderRadius.lg, overflow: 'hidden', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.primary },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.accent },
  registerBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: 'auto' },
  registerText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
});
