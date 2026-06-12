import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// İkon kütüphanesini ekliyoruz
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

const OutfitVisualizer = ({ outfitData }) => {
  if (!outfitData || (!outfitData.top && !outfitData.bottom && !outfitData.shoes)) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Kombin bekleniyor...</Text>
      </View>
    );
  }

  const { top, bottom, shoes } = outfitData;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.09)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.card}
      >
        {/* --- YENİ EKLEME: ARKA PLAN ASKISI --- */}
        {/* Bu kısım kıyafetlerin arkasında, dekoratif bir silüet olarak duracak */}
        <View style={styles.hangerBackground}>
            <Icon name="hanger" size={120} color="rgba(255,255,255,0.15)" />
        </View>

        {/* Kıyafetler (Mevcut Düzen) */}
        <View style={styles.outfitColumn}>
          {top && (
            <View style={styles.itemWrapper}>
              <Image source={{ uri: top }} style={styles.image} resizeMode="contain" />
            </View>
          )}

          {bottom && (
            <View style={styles.itemWrapper}>
              <Image source={{ uri: bottom }} style={styles.image} resizeMode="contain" />
            </View>
          )}

          {shoes && (
            <View style={styles.itemWrapper}>
              <Image source={{ uri: shoes }} style={styles.shoesImage} resizeMode="contain" />
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
  card: {
    width: CARD_WIDTH,
    paddingVertical: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative', // Arka plan öğesi için gerekli
    overflow: 'hidden',
  },
  // --- YENİ STİL: Askı Arka Planı ---
  hangerBackground: {
    position: 'absolute', // Kartın içinde bağımsız hareket etsin
    top: 10,              // En tepeye yakın
    zIndex: -1,           // Kıyafetlerin ARKASINDA kalsın
    opacity: 0.8,         // Biraz daha silik dursun
    transform: [{ rotate: '-5deg' }] // Hafif eğik dursun, havalı görünsün
  },
  outfitColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20, // Askının altından başlasın
  },
  itemWrapper: {
    width: '90%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -15,
    // Arka planlı resimler için hafif bir çerçeve efekti
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  image: {
    width: '95%',
    height: '95%',
  },
  shoesImage: {
    width: '95%',
    height: 140,
    marginTop: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default OutfitVisualizer;