import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { WEATHER_API_KEY } from '@env';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather'; // Feather'ı da kullanalım çeşitlilik için
import OutfitVisualizer from '../components/OutfitVisualizer';

// --- Renk Paleti (Kullanıcının tercih ettiği mor tonları baz alınarak geliştirildi) ---
const COLORS = {
  primaryDark: '#4A00E0', // Derin, zengin bir mor
  primaryLight: '#8E2DE2', // Daha canlı bir mor (gradient için)
  accent: '#C9A7EB',      // Yumuşak lavanta (vurgu ve ikincil elemanlar için)
  accentBright: '#D2B4DE', // Biraz daha canlı lavanta
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textPlaceholder: 'rgba(255, 255, 255, 0.5)',
  cardBackground: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.15)',
  success: '#76D7C4', // Yeşilimsi bir başarı rengi
  warning: '#F7DC6F', // Yumuşak sarı (hava durumu için)
  danger: '#F1948A',   // Yumuşak kırmızı (çıkış için)
  white: '#FFFFFF',
  transparent: 'transparent',
};

// --- Yardımcı Fonksiyonlar ---
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın!";
  if (hour < 18) return "İyi Günler!";
  return "İyi Akşamlar!";
};

// --- Ana Ekran Komponenti ---
export default function MainScreen({ changeScreen }) {
  const [weather, setWeather] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email] = useState("ozgun541108@gmail.com");
  const [userPrompt, setUserPrompt] = useState("");
  const [outfitImages, setOutfitImages] = useState(null); // Kombin görselleri için state

  const fetchWeatherAndSuggestion = async () => {
    if (!userPrompt.trim()) {
      Alert.alert("Ne Planlıyorsun?", "Kombin önerebilmem için bugünkü planını benimle paylaşmalısın.");
      return;
    }
    if (!WEATHER_API_KEY) {
      Alert.alert("Teknik Bir Aksaklık", "Hava durumu servisine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
      return;
    }

    setLoading(true);
    setSuggestion(null);
    setWeather(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Konum İzni",
          "Sana özel hava durumu ve kombin önerileri için konumuna ihtiyacımız var. Ayarlardan izin verebilir misin?",
          [
            { text: "Vazgeç", style: "cancel" },
            { text: "Ayarlara Git", onPress: () => Linking.openSettings() }
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lon } = location.coords;

      const weatherRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&lang=tr`);
      if (!weatherRes.ok) throw new Error(`Hava durumu alınamadı (${weatherRes.status})`);
      const weatherData = await weatherRes.json();
      setWeather(weatherData);

      const backendUrl = "http://172.20.10.2:5001/generate-outfit";
      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, style: "günlük", usage: userPrompt,
          subcategory: "günlük", city: weatherData.location.name,
        }),
      });
      if (!res.ok) throw new Error(`Kombin önerisi alınamadı (${res.status})`);
      const data = await res.json();
      setSuggestion(data.suggestion || "Bugün için sana özel bir kombin bulamadık, belki farklı bir anahtar kelime denersin?");

      // Backend'den gelen kombin görsellerini ayarla
      // Backend'inizin { outfit_images: { top: 'url', bottom: 'url', shoes: 'url' } } formatında dönmesini sağlayın
      if (data.outfit_images) {
        setOutfitImages({
          top: data.outfit_images.top,
          bottom: data.outfit_images.bottom,
          shoes: data.outfit_images.shoes
        });
      }
      
      // *** TEST AMAÇLI ÖRNEK VERİ (Backend hazır değilse bunu aktif edin) ***
      // setOutfitImages({
      //   top: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      //   bottom: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      //   shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
      // });

    } catch (error) {
      console.error("❌ Hata:", error);
      Alert.alert("Bir Sorun Oluştu", error.message || "Beklenmedik bir hata. Lütfen internet bağlantını kontrol et.");
      setSuggestion("Öneri alınırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined} // Android'de height'a gerek yok, scrollview hallediyor
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.title}>Stil Asistanın</Text>
            <Text style={styles.subtitle}>Bugün ne giyeceğine birlikte karar verelim mi?</Text>
          </View>

          <View style={styles.promptSection}>
            <FeatherIcon name="edit" size={24} color={COLORS.accentBright} style={styles.promptIcon} />
            <TextInput
              style={styles.promptInput}
              placeholder="Bugünkü planın nedir? (örn: Kahve içmeye, iş toplantısına...)"
              placeholderTextColor={COLORS.textPlaceholder}
              value={userPrompt}
              onChangeText={setUserPrompt}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={fetchWeatherAndSuggestion}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.primaryDark} size="small" />
            ) : (
              <>
                <Icon name="creation" size={22} color={COLORS.primaryDark} />
                <Text style={styles.actionButtonText}>Kombin Öner</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sonuç Kartları */}
          {weather && !loading && (
            <View style={[styles.resultCard, { borderColor: COLORS.warning }]}>
              <View style={styles.resultCardHeader}>
                <Icon name="weather-partly-cloudy" size={28} color={COLORS.warning} />
                <Text style={[styles.resultCardTitle, { color: COLORS.warning }]}>Hava Durumu</Text>
              </View>
              <Text style={styles.resultCardContent}>
                <Text style={styles.bold}>{weather.location.name}:</Text> {weather.current.temp_c}°C, {weather.current.condition.text}
              </Text>
            </View>
          )}

          {suggestion && !loading && (
            <View style={[styles.resultCard, { borderColor: COLORS.success }]}>
              <View style={styles.resultCardHeader}>
                <Icon name="hanger" size={28} color={COLORS.success} />
                <Text style={[styles.resultCardTitle, { color: COLORS.success }]}>Stil Önerin</Text>
              </View>
              <Text style={styles.resultCardContent}>{suggestion}</Text>
            </View>
          )}

          {/* Kombin Görseli - OutfitVisualizer Kullanımı */}
          {outfitImages && !loading && (
            <View style={{ marginBottom: 20 }}>
              <View style={styles.resultCardHeader}>
                <Icon name="hanger" size={28} color={COLORS.accent} />
                <Text style={[styles.resultCardTitle, { color: COLORS.accent }]}>Kombin Önizlemesi</Text>
              </View>
              <OutfitVisualizer outfitData={outfitImages} />
            </View>
          )}
           {!suggestion && !loading && userPrompt && (
             <View style={[styles.resultCard, { borderColor: COLORS.accent, alignItems:'center' }]}>
                <Icon name="emoticon-sad-outline" size={32} color={COLORS.accent} style={{marginBottom:8}}/>
                <Text style={[styles.resultCardContent, {textAlign: 'center', color: COLORS.accent}]}>
                    Bu plana uygun bir öneri bulamadık. Belki biraz daha detay verebilirsin?
                </Text>
             </View>
          )}


          {/* Menü */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Hızlı İşlemler</Text>
            <View style={styles.menuGrid}>
              {[
                { title: 'Dolabım', icon: 'wardrobe-outline', screen: 'Wardrobe', color: COLORS.accentBright },
                { title: 'Kıyafet Ekle', icon: 'plus-circle-multiple-outline', screen: 'AddClothing', color: COLORS.accentBright },
                { title: 'Profil', icon: 'account-cog-outline', screen: 'Profile', color: COLORS.accentBright },
                { title: 'Çıkış Yap', icon: 'logout-variant', screen: 'Login', color: COLORS.danger }
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={styles.menuItem}
                  onPress={() => changeScreen(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIconWrapper, { backgroundColor: `${item.color}20` }]}> {/* %20 opacity */}
                    <Icon name={item.icon} size={30} color={item.color} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// --- Stil Tanımları ---
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  // Header Stilleri
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 22,
  },
  // Prompt Stilleri
  promptSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minHeight: 100, // Daha fazla alan
  },
  promptIcon: {
    marginRight: 15,
    marginTop: Platform.OS === 'ios' ? 2 : 5,
  },
  promptInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
    lineHeight: 22,
    minHeight: 60, // TextInput'un kendi minimum yüksekliği
  },
  // Eylem Butonu Stilleri
  actionButton: {
    backgroundColor: COLORS.accentBright, // Buton ana rengi
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: `${COLORS.primaryLight}80`, // Gradientin açık tonundan gölge
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  actionButtonDisabled: {
    backgroundColor: `${COLORS.accentBright}99`, // Opaklık azaltılmış
  },
  actionButtonText: {
    color: COLORS.primaryDark, // Kontrast için koyu renk metin
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  // Sonuç Kartı Stilleri
  resultCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5, // Daha belirgin kenarlık
    // borderColor: COLORS.cardBorder, // Dinamik olarak atanacak
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    // color: COLORS.textPrimary, // Dinamik olarak atanacak
    marginLeft: 12,
  },
  resultCardContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bold: { fontWeight: 'bold', color: COLORS.textPrimary },

  // Menü Stilleri
  menuContainer: {
    marginTop: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
    marginLeft: 5, // Hafif içe
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    paddingVertical: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  menuItemIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30, // Tam daire
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // backgroundColor: `${COLORS.accent}20`, // Dinamik
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});