import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

// --- MainScreen'den Gelen Renk Paleti ---
const COLORS = {
  primaryDark: '#4A00E0',
  primaryLight: '#8E2DE2',
  accent: '#C9A7EB',
  accentBright: '#D2B4DE',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textPlaceholder: 'rgba(255, 255, 255, 0.6)', // Biraz daha belirgin placeholder
  inputBackground: 'rgba(255, 255, 255, 0.12)', // Inputlar için hafif transparan
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  buttonTextDark: '#301934', // Koyu mor, buton metni için
  white: '#FFFFFF',
  danger: '#F1948A',
  transparent: 'transparent',
};

export default function LoginScreen({ changeScreen }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Yükleme durumu için state

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi girin.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://192.168.40.37:5001/login", {
        email, password
      });

      if (response.status === 200) {
        const prefRes = await fetch(`http://192.168.40.37:5001/get-preferences?email=${email}`);
        if (prefRes.status === 200) {
          changeScreen("Main", { email });
        } else {
          changeScreen("Main", { email });
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.";
      Alert.alert("Giriş Başarısız", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.primaryLight]}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Icon name="hanger" size={60} color={COLORS.accentBright} />
            <Text style={styles.mainTitle}>OutfitApp</Text>
            <Text style={styles.subtitle}>Tarzına Giriş Yap</Text>
          </View>

          <View style={styles.inputGroup}>
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
                returnKeyType="next"
                // onSubmitEditing={() => passwordInputRef.current.focus()} // Şifre inputuna odaklanma
              />
            </View>

            <View style={styles.inputContainer}>
              <FeatherIcon name="lock" size={20} color={COLORS.accent} style={styles.inputIcon} />
              <TextInput
                // ref={passwordInputRef} // Odaklanma için ref
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor={COLORS.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin} // Enter ile giriş
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled, // Yükleme durumunda stil
            ]}
            onPress={handleLogin}
            disabled={loading} // Yükleme sırasında butonu devre dışı bırak
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.buttonTextDark} />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </Pressable>

          <Pressable onPress={() => !loading && changeScreen('PasswordReset')} disabled={loading}>
            <Text style={styles.forgotPasswordText}>Şifreni mi unuttun?</Text>
          </Pressable>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <Pressable onPress={() => !loading && changeScreen('Register')} disabled={loading}>
              <Text style={styles.signUpLink}>Hemen Kayıt Ol</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// const passwordInputRef = React.createRef(); // Odaklanma için

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingBottom: 20, // Klavye için biraz daha boşluk
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.accent,
    marginTop: 8,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 15, // Daha yuvarlak
    marginBottom: 18, // Inputlar arası boşluk
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55, // Biraz daha yüksek input
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.accentBright, // MainScreen'deki gibi canlı bir renk
    borderRadius: 15,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: `${COLORS.primaryLight}90`,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ translateY: 2 }], // Hafif basılma efekti
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    backgroundColor: `${COLORS.accentBright}99`, // Opaklık azaltılmış
  },
  loginButtonText: {
    color: COLORS.buttonTextDark, // Kontrast için koyu metin
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 25, // Daha fazla boşluk
    fontSize: 15,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40, // En alta daha fazla boşluk
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // iOS için altta ekstra boşluk
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  signUpLink: {
    color: COLORS.accentBright, // Kayıt ol linki daha canlı
    fontWeight: 'bold',
    fontSize: 16, // Biraz daha büyük
    marginLeft: 5,
  },
});