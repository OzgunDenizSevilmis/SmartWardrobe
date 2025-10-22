import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, // Pressable kullanıyoruz
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView // ScrollView eklendi
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // İkonlar için
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
  danger: '#F1948A',
  transparent: 'transparent',
};

export default function RegisterScreen({ changeScreen }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    // Basit e-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
    }
    // Basit şifre uzunluk kontrolü
    if (password.length < 6) {
        Alert.alert('Kısa Şifre', 'Şifreniz en az 6 karakter olmalıdır.');
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, email, password }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (response.ok) {
        Alert.alert("Kayıt Başarılı!", data.message || "Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.");
        changeScreen('Login');
      } else {
        Alert.alert("Kayıt Başarısız", data.message || "Bir sorun oluştu. Lütfen bilgilerinizi kontrol edin.");
      }
    } catch (error) {
      console.error('Kayıt Hata:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  // Input referansları (opsiyonel, klavyede "next" ile geçiş için)
  const surnameInputRef = React.createRef();
  const emailInputRef = React.createRef();
  const passwordInputRef = React.createRef();

  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.primaryLight]}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer} // Dikeyde ortalamak için flexGrow
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Icon name="account-plus-outline" size={50} color={COLORS.accentBright} />
            <Text style={styles.mainTitle}>Yeni Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Stil yolculuğuna başla!</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <FeatherIcon name="user" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adınız"
                placeholderTextColor={COLORS.textPlaceholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => surnameInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <FeatherIcon name="user" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                ref={surnameInputRef}
                style={styles.input}
                placeholder="Soyadınız"
                placeholderTextColor={COLORS.textPlaceholder}
                value={surname}
                onChangeText={setSurname}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <FeatherIcon name="mail" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="E-posta Adresiniz"
                placeholderTextColor={COLORS.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputContainer}>
              <FeatherIcon name="lock" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Şifreniz (en az 6 karakter)"
                placeholderTextColor={COLORS.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.buttonTextDark} />
            ) : (
              <Text style={styles.actionButtonText}>Hesap Oluştur</Text>
            )}
          </Pressable>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Zaten bir hesabın var mı? </Text>
            <Pressable onPress={() => !loading && changeScreen('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: { // ScrollView content container
    flexGrow: 1, // İçeriğin tamamını kaplaması ve dikeyde ortalaması için
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20, // Üst ve alt boşluk
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30, // Inputlardan önce daha fazla boşluk
  },
  mainTitle: {
    fontSize: 32, // Biraz daha küçük
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.accent,
    marginTop: 8,
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
    backgroundColor: COLORS.accentBright,
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Inputlardan sonra boşluk
    shadowColor: `${COLORS.primaryLight}90`,
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
    backgroundColor: `${COLORS.accentBright}99`,
  },
  actionButtonText: {
    color: COLORS.buttonTextDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, // Butondan sonra daha fazla boşluk
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.accentBright,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
});