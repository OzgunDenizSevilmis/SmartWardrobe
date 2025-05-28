import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, // Pressable kullanıyoruz
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

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
  transparent: 'transparent',
};

export default function PasswordResetScreen({ changeScreen }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false); // Yükleme durumu için

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta adresinizi girin.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
    }
    setLoading(true);
    try {
      // API endpoint'ini kontrol edin, bir önceki kodda 192.168.40.37 kullanılmış,
      // diğerlerinde 192.168.1.103. Tutarlı olduğundan emin olun.
      const response = await fetch("http://192.168.40.37:5001/password-reset", { // IP Adresini kontrol ettim
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (response.ok) {
        Alert.alert("Başarılı", data.message || "Şifre sıfırlama linki e-posta adresinize gönderildi.");
        changeScreen("Login");
      } else {
        Alert.alert("Hata", data.message || "Şifre sıfırlama isteği başarısız oldu. Lütfen e-postanızı kontrol edin.");
      }
    } catch (error) {
      console.error("Şifre Sıfırlama Hatası:", error);
      Alert.alert("Bağlantı Hatası", "Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Icon name="lock-reset" size={60} color={COLORS.accentBright} />
            <Text style={styles.mainTitle}>Şifre Sıfırlama</Text>
            <Text style={styles.subtitle}>
              Endişelenmeyin! Kayıtlı e-posta adresinize bir sıfırlama bağlantısı göndereceğiz.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <FeatherIcon name="mail" size={20} color={COLORS.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta Adresiniz"
              placeholderTextColor={COLORS.textPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.buttonTextDark} />
            ) : (
              <Text style={styles.actionButtonText}>Sıfırlama Linki Gönder</Text>
            )}
          </Pressable>

          <Pressable onPress={() => !loading && changeScreen('Login')} disabled={loading} style={styles.backButton}>
            <FeatherIcon name="arrow-left-circle" size={20} color={COLORS.accent} />
            <Text style={styles.backButtonText}>Giriş Ekranına Dön</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 30, // Biraz daha küçük
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 15,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22, // Okunabilirliği artır
    paddingHorizontal:10, // Uzun metinler için
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 15,
    marginBottom: 25, // Butondan önce daha fazla boşluk
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30, // Butondan sonra daha fazla boşluk
    paddingVertical: 10,
  },
  backButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});