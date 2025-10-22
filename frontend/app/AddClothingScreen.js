import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Pressable // HATA BURADAYDI, Pressable'ı import ediyoruz
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { getApiUrl } from '../config/config';

// --- Diğer Ekranlardan Gelen Renk Paleti ---
const COLORS = {
  primaryDark: '#4A00E0',
  primaryLight: '#8E2DE2',
  accent: '#C9A7EB',
  accentBright: '#D2B4DE',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textPlaceholder: 'rgba(255, 255, 255, 0.6)',
  inputBackground: 'rgba(255, 255, 255, 0.12)',
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  buttonTextDark: '#301934',
  white: '#FFFFFF',
  success: '#76D7C4', // Başarı rengi
  cardBackground: 'rgba(0,0,0,0.1)', // Resim kutusu için koyu transparan
  transparent: 'transparent',
};

export default function AddClothingScreen({ changeScreen }) {
  const [imageUri, setImageUri] = useState(null);
  const [category, setCategory] = useState('');
  const [styleType, setStyleType] = useState('');
  const [baseColor, setBaseColor] = useState('');
  const [email] = useState('ozgun541108@gmail.com'); // Bu dinamik olmalı
  const [loadingImage, setLoadingImage] = useState(false); // Resim yükleme ve renk tahmini için
  const [saving, setSaving] = useState(false); // Kaydetme işlemi için

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kıyafet ekleyebilmek için galeri erişim izni vermeniz gerekiyor.');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoadingImage(true);
    setImageUri(null);
    setBaseColor('');

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 5],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);

        const formData = new FormData();
        formData.append('image', {
          uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });

        const res = await fetch(getApiUrl('/predict-colour'), {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!res.ok) throw new Error('Renk tahmini API hatası');
        const data = await res.json();
        setBaseColor(data.baseColour || 'Belirlenemedi');
      }
    } catch (err) {
      console.error('🖼️ Resim seçme veya renk tahmini hatası:', err);
      Alert.alert('Hata', 'Resim seçilemedi veya renk tahmini yapılamadı. Lütfen tekrar deneyin.');
      setImageUri(null);
    } finally {
      setLoadingImage(false);
    }
  };

  const saveToWardrobe = async () => {
    if (!category.trim() || !styleType.trim() || !baseColor.trim() || !imageUri) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun ve bir kıyafet görseli seçin.');
      return;
    }
    setSaving(true);
    try {
      const uploadForm = new FormData();
      const filename = `clothing_${email.split('@')[0]}_${Date.now()}.jpg`;
      uploadForm.append('image', { uri: imageUri, name: filename, type: 'image/jpeg' });

      const uploadRes = await fetch(getApiUrl('/upload'), {
        method: 'POST', body: uploadForm, headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!uploadRes.ok) throw new Error('Görsel yükleme API hatası');
      const uploadResult = await uploadRes.json();
      if (!uploadResult.image_url) throw new Error('Görsel yüklenemedi, sunucudan URL alınamadı.');

      const payload = {
        email, image: uploadResult.image_url, category,
        style: styleType, baseColour: baseColor,
      };

      const res = await fetch(getApiUrl('/add-wardrobe-item'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({message: 'Kayıt API bilinmeyen hata'}));
        throw new Error(errorData.message || 'Kıyafet kaydedilemedi.');
      }
      // const data = await res.json(); // data değişkeni zaten yukarıda tanımlı, gerek yok

      Alert.alert('Başarılı!', 'Kıyafetiniz başarıyla dolabınıza eklendi.');
      changeScreen('Main');

    } catch (err) {
      console.error('💾 Kaydetme hatası:', err);
      Alert.alert('Kayıt Hatası', err.message || 'Bir sorun oluştu, kıyafet kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Icon name="hanger" size={40} color={COLORS.accentBright} />
            <Text style={styles.mainTitle}>Yeni Kıyafet Ekle</Text>
            <Text style={styles.subtitle}>Gardırobunu zenginleştir!</Text>
          </View>

          <TouchableOpacity // Resim seçme alanı için TouchableOpacity kalabilir, Pressable şart değil
            style={styles.imagePickerBox}
            onPress={pickImage}
            disabled={loadingImage || saving}
          >
            {loadingImage ? (
              <ActivityIndicator size="large" color={COLORS.accentBright} />
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <FeatherIcon name="camera" size={40} color={COLORS.accent} />
                <Text style={styles.imagePickerText}>Kıyafet Görseli Seç</Text>
                <Text style={styles.imagePickerSubtext}>(Galeriden Yükle)</Text>
              </View>
            )}
          </TouchableOpacity>

          {baseColor && !loadingImage && (
            <View style={styles.colorInfoChip}>
                <View style={[styles.colorDot, {backgroundColor: baseColor.toLowerCase() === 'unknown' || baseColor === 'Belirlenemedi' ? '#ccc' : baseColor.toLowerCase() }]} />
                <Text style={styles.colorInfoText}>Tahmini Ana Renk: {baseColor}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <FeatherIcon name="tag" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kategori (Örn: Tişört, Pantolon)"
                placeholderTextColor={COLORS.textPlaceholder}
                value={category}
                onChangeText={setCategory}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="creation" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Stil (Örn: Günlük, Resmi, Spor)"
                placeholderTextColor={COLORS.textPlaceholder}
                value={styleType}
                onChangeText={setStyleType}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Pressable // KAYDET BUTONU İÇİN Pressable KULLANILMIŞTI
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
              (saving || loadingImage) && styles.buttonDisabled,
            ]}
            onPress={saveToWardrobe}
            disabled={saving || loadingImage}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.buttonTextDark} />
            ) : (
              <Text style={styles.actionButtonText}>Dolaba Kaydet</Text>
            )}
          </Pressable>

          <Pressable // ANA SAYFAYA DÖN BUTONU İÇİN Pressable KULLANILMIŞTI
            style={styles.backButton}
            onPress={() => changeScreen('Main')}
            disabled={saving || loadingImage}
          >
            <FeatherIcon name="arrow-left-circle" size={20} color={COLORS.accent} />
            <Text style={styles.backButtonText}>Ana Sayfaya Dön</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 6,
    fontWeight: '500',
  },
  imagePickerBox: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    color: COLORS.accentBright,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  imagePickerSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  colorInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)'
  },
  colorInfoText: {
    fontSize: 15,
    color: COLORS.accentBright,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 15,
    marginBottom: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: COLORS.success,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: `${COLORS.success}90`,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    paddingVertical: 10,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});