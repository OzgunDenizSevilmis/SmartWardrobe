import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BACKEND ENTEGRASYON ÖRNEĞİ:
 * 
 * Backend'inizin şu formatta JSON dönmesini sağlayın:
 * {
 *   "suggestion": "Bugün için önerim...",
 *   "outfit_images": {
 *     "top": "https://yourbackend.com/images/top-123.jpg",
 *     "bottom": "https://yourbackend.com/images/bottom-456.jpg", 
 *     "shoes": "https://yourbackend.com/images/shoes-789.jpg"
 *   }
 * }
 * 
 * Kullanım:
 * const [outfitImages, setOutfitImages] = useState(null);
 * 
 * Backend'den gelen veriyi işleyin:
 * if (data.outfit_images) {
 *   setOutfitImages(data.outfit_images);
 * }
 * 
 * Render:
 * <OutfitVisualizer outfitData={outfitImages} />
 */

const OutfitVisualizer = ({ outfitData, isLoading = false }) => {
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 180, 230, 0.2)', 'rgba(150, 120, 200, 0.1)']}
          style={styles.background}
        >
          <ActivityIndicator size="large" color="#8E2DE2" />
          <Text style={styles.loadingText}>Kombin hazırlanıyor...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Güvenli prop kontrolü
  if (!outfitData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 180, 230, 0.2)', 'rgba(150, 120, 200, 0.1)']}
          style={styles.background}
        >
          <Text style={styles.emptyText}>Henüz kombin önerisi yok</Text>
        </LinearGradient>
      </View>
    );
  }

  const { top, bottom, shoes } = outfitData;

  // Hiçbir parça yoksa
  if (!top && !bottom && !shoes) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(200, 180, 230, 0.2)', 'rgba(150, 120, 200, 0.1)']}
          style={styles.background}
        >
          <Text style={styles.emptyText}>Kombin parçaları yok</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Arka plan - Gradient */}
      <LinearGradient
        colors={['rgba(200, 180, 230, 0.2)', 'rgba(150, 120, 200, 0.1)']}
        style={styles.background}
      >
        {/* Askılık simgesi */}
        <View style={styles.hangerContainer}>
          <View style={styles.hangerHook} />
          <View style={styles.hangerBar} />
        </View>

        {/* Kıyafet katmanları - Z-index ile sıralama */}
        <View style={styles.outfitContainer}>
          {/* Ayakkabı - En alt katman (z-index: 1) */}
          {shoes && (
            <Image
              source={{ uri: shoes }}
              style={[styles.clothingItem, styles.shoes]}
              resizeMode="contain"
              defaultSource={require('../assets/images/placeholder.png')} // Placeholder ekleyin
            />
          )}

          {/* Alt Giyim (Pantolon/Etek) - Orta katman (z-index: 2) */}
          {bottom && (
            <Image
              source={{ uri: bottom }}
              style={[styles.clothingItem, styles.bottom]}
              resizeMode="contain"
              defaultSource={require('../assets/images/placeholder.png')}
            />
          )}

          {/* Üst Giyim (Tişört/Gömlek) - En üst katman (z-index: 3) */}
          {top && (
            <Image
              source={{ uri: top }}
              style={[styles.clothingItem, styles.top]}
              resizeMode="contain"
              defaultSource={require('../assets/images/placeholder.png')}
            />
          )}
        </View>

        {/* Parça sayısı göstergesi */}
        <View style={styles.itemCounter}>
          <Text style={styles.itemCounterText}>
            {[top, bottom, shoes].filter(Boolean).length}/3 parça
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5, // Ekranın %50'si
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  hangerContainer: {
    position: 'absolute',
    top: '5%',
    alignItems: 'center',
    zIndex: 0,
  },
  hangerHook: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderRadius: 1,
  },
  hangerBar: {
    width: SCREEN_WIDTH * 0.4,
    height: 3,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
    borderRadius: 2,
    marginTop: 2,
  },
  outfitContainer: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: '10%',
  },
  clothingItem: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.25,
  },
  // Z-index sıralaması: shoes(1) < bottom(2) < top(3)
  top: {
    top: '5%',
    zIndex: 3,
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_HEIGHT * 0.22,
  },
  bottom: {
    top: '30%',
    zIndex: 2,
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_HEIGHT * 0.25,
  },
  shoes: {
    bottom: '5%',
    zIndex: 1,
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_HEIGHT * 0.15,
  },
  emptyText: {
    color: 'rgba(100, 100, 100, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    color: 'rgba(100, 100, 100, 0.7)',
    fontSize: 14,
    marginTop: 10,
  },
  itemCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  itemCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default OutfitVisualizer;
