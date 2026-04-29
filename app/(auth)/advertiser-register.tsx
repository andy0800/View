import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/lib/theme';

const schema = z.object({
  company_name: z.string().min(2, 'Company legal name is required'),
  commercial_license_number: z.string().min(4, 'License number is required'),
  authorized_signatory: z.string().min(3, 'Authorized signatory name is required'),
  phone: z.string().length(8, 'Phone must be exactly 8 digits').regex(/^[0-9]+$/, 'Phone must be numeric'),
});
type FormValues = z.infer<typeof schema>;

const InputField = ({ control, name, label, placeholder, keyboardType, error, prefix, maxLength }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <Controller control={control} name={name} render={({ field: { onChange, value } }) => (
        <TextInput
          style={styles.inputFlex}
          onChangeText={onChange} value={value}
          placeholder={placeholder} placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
        />
      )} />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function AdvertiserRegisterScreen() {
  const router = useRouter();
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const pickLicenseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!result.canceled) setLicenseImage(result.assets[0].uri);
  };

  const onSubmit = async (data: FormValues) => {
    if (!licenseImage) { Alert.alert('Missing Document', 'Please upload your Commercial License.'); return; }
    try {
      const formattedPhone = `+965${data.phone}`;
      const email = `${formattedPhone.replace('+', '')}@viewapp.com`;
      const password = 'ViewApp123!';

      let authUser = null;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          authUser = signInData.user;
        } else {
          throw signUpError;
        }
      } else {
        authUser = signUpData.user;
      }

      if (!authUser) throw new Error('Authentication failed');

      const { error: profileError } = await supabase.from('users').upsert({
        id: authUser.id, role: 'advertiser', status: 'pending',
        company_name: data.company_name,
        commercial_license_number: data.commercial_license_number,
        authorized_signatory: data.authorized_signatory,
        phone_number: formattedPhone,
      }, { onConflict: 'id' });
      
      if (profileError) throw profileError;
      
      await supabase.from('wallets').insert({ user_id: authUser.id, balance: 0 }).select().maybeSingle();
      
      Alert.alert('Account Submitted', 'Your account is under review.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/pending-approval') }]);
    } catch (err: any) { Alert.alert('Registration Failed', err.message); }
    finally { setLoading(false); }
  };



  return (
    <View style={styles.container}>
      <LinearGradient colors={['#060F22', '#0A1F44', '#060F22']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <View style={[styles.roleTag, { backgroundColor: Colors.accent + '22' }]}>
          <Text style={[styles.roleTagText, { color: Colors.accent }]}>📣 Advertiser Account</Text>
        </View>
        <Text style={styles.heading}>Create Advertiser Account</Text>
        <Text style={styles.subheading}>Your account will be reviewed by our team before activation.</Text>
        <InputField control={control} name="company_name" label="Company Legal Name" placeholder="As on commercial license" error={errors.company_name?.message} />
        <InputField control={control} name="commercial_license_number" label="Commercial License Number" placeholder="Enter license number" error={errors.commercial_license_number?.message} />
        <InputField control={control} name="authorized_signatory" label="Authorized Signatory Name" placeholder="Full name" error={errors.authorized_signatory?.message} />
        <InputField control={control} name="phone" label="Phone Number" placeholder="12345678" keyboardType="phone-pad" prefix="+965" maxLength={8} error={errors.phone?.message} />
        <Text style={styles.fieldLabel}>Commercial License (Photo)</Text>
        <TouchableOpacity style={[styles.imagePicker, licenseImage ? styles.imagePickerFilled : null]} onPress={pickLicenseImage}>
          {licenseImage ? <Image source={{ uri: licenseImage }} style={styles.previewImage} /> : <Text style={styles.imagePickerText}>📋  Upload Commercial License</Text>}
        </TouchableOpacity>
        <View style={styles.reviewNote}>
          <Text style={styles.reviewNoteText}>ℹ️  After OTP verification, your documents will be manually reviewed. You'll be notified when approved.</Text>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit(onSubmit)} disabled={loading}>
          <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.btnText}>Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, gap: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  backBtnText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  roleTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
  roleTagText: { fontFamily: FontFamily.semiBold, fontSize: 13 },
  heading: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white },
  subheading: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  fieldContainer: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md },
  inputPrefix: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.textSecondary, marginRight: 8 },
  inputFlex: { flex: 1, paddingVertical: Spacing.md, color: Colors.white, fontFamily: FontFamily.regular, fontSize: 15 },
  inputError: { borderColor: Colors.error },
  errorText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.error },
  imagePicker: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, height: 160, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', marginBottom: Spacing.sm },
  imagePickerFilled: { borderStyle: 'solid', borderColor: Colors.accent },
  imagePickerText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  previewImage: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  reviewNote: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  reviewNoteText: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  btnPrimary: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.md, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  btnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: BorderRadius.lg },
  btnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.primary },
  otpInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, padding: Spacing.lg, color: Colors.white, fontFamily: FontFamily.bold, fontSize: 32, textAlign: 'center', letterSpacing: 12 },
});
