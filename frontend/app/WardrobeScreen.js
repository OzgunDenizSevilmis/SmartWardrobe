import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, ActivityIndicator, Platform, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  textSecondary: 'rgba(255, 255, 255, 0.75)', // Biraz daha görünür ikincil metin
  textPlaceholder: 'rgba(255, 255, 255, 0.6)',
  cardBackground: 'rgba(255, 255, 255, 0.09)', // Kartlar için hafif transparan
  cardBorder: 'rgba(255, 255, 255, 0.18)',
  buttonTextDark: '#301934',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export default function WardrobeScreen({ changeScreen }) {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Yenileme durumu için
  const email = 'ozgun541108@gmail.com'; // Bu dinamik olmalı

  const fetchWardrobe = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await fetch(`${getApiUrl('/get-wardrobe')}?email=${email}`);
      if (!response.ok) throw new Error('Dolap verileri alınamadı.');
      const json = await response.json();
      setClothes(json.items || []);
    } catch (error) {
      console.error('Dolap yüklenemedi:', error);
      // Kullanıcıya bir hata mesajı gösterilebilir (Alert vb.)
    } finally {
      if (!isRefresh) setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWardrobe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWardrobe(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardText}>Stil: {item.style}</Text>
        <View style={styles.colorContainer}>
          <Text style={styles.cardText}>Renk: </Text>
          <View style={[styles.colorDot, { backgroundColor: item.base_color?.toLowerCase() || COLORS.accent }]} />
          <Text style={[styles.cardText, { fontWeight: '600' }]}>{item.base_color}</Text>
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="hanger-off" size={70} color={COLORS.accent} />
      <Text style={styles.emptyText}>Dolabınızda henüz hiç kıyafet yok.</Text>
      <Text style={styles.emptySubText}>Yeni kıyafetler ekleyerek stilinizi oluşturmaya başlayın!</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => changeScreen('AddClothing')}
      >
        <FeatherIcon name="plus-circle" size={20} color={COLORS.primaryDark} />
        <Text style={styles.emptyButtonText}>Kıyafet Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flex}>
      <View style={styles.screenContainer}>
        <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => changeScreen('Main')} style={styles.backIconContainer}>
                <FeatherIcon name="arrow-left" size={26} color={COLORS.accentBright} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Dolabım</Text>
            <View style={styles.backIconContainer} /> {/* Sağ tarafı boş bırakarak başlığı ortalamak için */}
        </View>


        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBright} />
            <Text style={styles.loaderText}>Kıyafetler Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={clothes}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()} // item.id varsa kullan
            contentContainerStyle={styles.listContentContainer}
            numColumns={2} // İki sütunlu görünüm
            columnWrapperStyle={styles.row} // Sütunlar arası boşluk için
            ListEmptyComponent={ListEmptyComponent}
            refreshControl={ // Pull-to-refresh özelliği
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.accentBright]} // iOS için spinner rengi
                tintColor={COLORS.accentBright} // Android için spinner rengi
                progressBackgroundColor={COLORS.primaryLight} // Android için spinner arkaplanı
              />
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 45, // Status bar için boşluk
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    marginBottom: 10,
    // borderBottomWidth: 1, // İsteğe bağlı: başlık altına ince bir çizgi
    // borderBottomColor: COLORS.cardBorder,
  },
  backIconContainer: {
      padding: 5, // Dokunma alanını genişletmek için
      width: 40, // Ortalama için sabit genişlik
      alignItems: 'flex-start', // İkonu sola yasla
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContentContainer: {
    paddingHorizontal: 15, // Kartların kenarlardan taşmaması için
    paddingBottom: 30, // Listenin sonuna boşluk
  },
  row: {
    flex: 1,
    justifyContent: 'space-between', // İki kart arasına boşluk bırak
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18, // Daha yuvarlak köşeler
    marginBottom: 15,
    width: '48%', // İki sütun için, aradaki boşluğu hesaba kat
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden', // Resmin kart dışına taşmasını engelle
  },
  image: {
    height: 180, // Resim yüksekliği
    width: '100%',
    // borderRadius: 10, // Artık kartın kendisi yuvarlak
  },
  cardInfo: {
    padding: 12, // Kart içi boşluklar
  },
  cardCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 3,
    lineHeight: 18,
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 50, // Başlıktan biraz aşağıda başlasın
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accentBright,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentBright,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.buttonTextDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});