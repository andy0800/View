import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
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
  full_name: z.string().min(3, 'Full legal name is required'),
  civil_id_number: z
    .string()
    .min(12, 'Civil ID must be 12 digits')
    .max(12, 'Civil ID must be 12 digits')
    .regex(/^\d+$/, 'Civil ID must be numeric'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  phone: z
    .string()
    .length(8, 'Phone must be exactly 8 digits')
    .regex(/^[0-9]+$/, 'Phone must be numeric'),
});

type FormValues = z.infer<typeof schema>;

export default function ViewerRegisterScreen() {
  const router = useRouter();
  const [civilIdFront, setCivilIdFront] = useState<string | null>(null);
  const [civilIdBack, setCivilIdBack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      if (side === 'front') setCivilIdFront(result.assets[0].uri);
      else setCivilIdBack(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!civilIdFront || !civilIdBack) {
      Alert.alert('Missing Documents', 'Please upload both sides of your Civil ID.');
      return;
    }
    try {
      const formattedPhone = `+965${data.phone}`;
      const email = `${formattedPhone.replace('+', '')}@viewapp.com`;
      const password = 'ViewApp123!';

      // 1. Authenticate using email/password under the hood
      let authUser = null;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          // If already registered, sign in
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

      // 2. Create user profile
      const { error: profileError } = await supabase.from('users').upsert({
        id: authUser.id,
        role: 'viewer',
        status: 'active',
        full_name: data.full_name,
        username: data.username,
        phone_number: formattedPhone,
        civil_id_number: data.civil_id_number,
      }, { onConflict: 'id' });
      
      if (profileError) {
        if (profileError.code === '23505') throw new Error('An account with this Civil ID or username already exists.');
        throw profileError;
      }

      // 3. Create wallet (ignoring conflict if already exists)
      await supabase.from('wallets').insert({ user_id: authUser.id, balance: 0 }).select().maybeSingle();

      router.replace('/(viewer)/feed');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <LinearGradient colors={['#060F22', '#0A1F44', '#060F22']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={[styles.roleTag, { backgroundColor: Colors.success + '22' }]}>
          <Text style={[styles.roleTagText, { color: Colors.success }]}>👁 Viewer Account</Text>
        </View>

        <Text style={styles.heading}>Create Viewer Account</Text>
        <Text style={styles.subheading}>Your information is secured and used for KYC compliance only.</Text>

        {/* Full Legal Name */}
        <InputField
          control={control}
          name="full_name"
          label="Full Legal Name"
          placeholder="As on your Civil ID"
          error={errors.full_name?.message}
        />

        {/* Civil ID Number */}
        <InputField
          control={control}
          name="civil_id_number"
          label="Civil ID Number"
          placeholder="12 digits"
          keyboardType="number-pad"
          error={errors.civil_id_number?.message}
        />

        {/* Username */}
        <InputField
          control={control}
          name="username"
          label="Username"
          placeholder="Unique username"
          error={errors.username?.message}
        />

        {/* Phone */}
        <InputField
          control={control}
          name="phone"
          label="Phone Number"
          placeholder="12345678"
          keyboardType="phone-pad"
          prefix="+965"
          maxLength={8}
          error={errors.phone?.message}
        />

        {/* Civil ID Front */}
        <Text style={styles.fieldLabel}>Civil ID – Front Side</Text>
        <TouchableOpacity
          style={[styles.imagePicker, civilIdFront ? styles.imagePickerFilled : null]}
          onPress={() => pickImage('front')}
        >
          {civilIdFront ? (
            <Image source={{ uri: civilIdFront }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imagePickerText}>📷  Upload Front of Civil ID</Text>
          )}
        </TouchableOpacity>

        {/* Civil ID Back */}
        <Text style={styles.fieldLabel}>Civil ID – Back Side</Text>
        <TouchableOpacity
          style={[styles.imagePicker, civilIdBack ? styles.imagePickerFilled : null]}
          onPress={() => pickImage('back')}
        >
          {civilIdBack ? (
            <Image source={{ uri: civilIdBack }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imagePickerText}>📷  Upload Back of Civil ID</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit(onSubmit)} disabled={loading}>
          <LinearGradient colors={['#F5B400', '#D49E00']} style={styles.btnGradient}>
            {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.btnText}>Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const InputField = ({ control, name, label, placeholder, keyboardType, error, prefix, maxLength }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
      {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.inputFlex}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            keyboardType={keyboardType || 'default'}
            maxLength={maxLength}
          />
        )}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  backBtn: { marginBottom: Spacing.sm },
  backBtnText: { fontFamily: FontFamily.medium, fontSize: 15, color: Colors.textSecondary },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  roleTagText: { fontFamily: FontFamily.semiBold, fontSize: 13 },
  heading: { fontFamily: FontFamily.bold, fontSize: 26, color: Colors.white },
  subheading: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  fieldContainer: { gap: 6 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  inputPrefix: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.white,
    fontFamily: FontFamily.regular,
    fontSize: 15,
  },
  inputError: { borderColor: Colors.error },
  errorText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.error },
  imagePicker: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
  },
  imagePickerFilled: { borderStyle: 'solid', borderColor: Colors.success },
  imagePickerText: { fontFamily: FontFamily.medium, fontSize: 14, color: Colors.textSecondary },
  previewImage: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  btnPrimary: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  btnGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: BorderRadius.lg },
  btnText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.primary },
  otpHeader: { gap: Spacing.xs, marginBottom: Spacing.lg },
  otpInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    color: Colors.white,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 12,
  },
});
