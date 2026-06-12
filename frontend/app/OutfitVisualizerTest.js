import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OutfitVisualizer from '../components/OutfitVisualizer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * OutfitVisualizer Test Ekranı
 * Bu ekranı test amaçlı kullanabilirsiniz
 */
const OutfitVisualizerTestScreen = ({ changeScreen }) => {
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  // Test için örnek kombin verileri
  const sampleOutfits = [
    {
      id: 1,
      name: 'Günlük Şık',
      data: {
        top: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        bottom: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      },
    },
    {
      id: 2,
      name: 'Spor Rahat',
      data: {
        top: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
        bottom: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400',
        shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      },
    },
    {
      id: 3,
      name: 'Sadece Üst',
      data: {
        top: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400',
        bottom: null,
        shoes: null,
      },
    },
    {
      id: 4,
      name: 'Alt ve Ayakkabı',
      data: {
        top: null,
        bottom: 'https://images.unsplash.com/photo-1624378440070-7ad4b1c7c46a?w=400',
        shoes: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
      },
    },
  ];

  return (
    <LinearGradient colors={['#4A00E0', '#8E2DE2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => changeScreen && changeScreen('MainScreen')}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>OutfitVisualizer Test</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Açıklama */}
          <View style={styles.infoCard}>
            <Icon name="information-outline" size={24} color="#fff" />
            <Text style={styles.infoText}>
              Aşağıdaki butonlardan birini seçerek OutfitVisualizer'ın nasıl çalıştığını test edebilirsiniz.
            </Text>
          </View>

          {/* Kombin Seçenekleri */}
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Test Kombinleri</Text>
            {sampleOutfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[
                  styles.optionButton,
                  selectedOutfit?.id === outfit.id && styles.optionButtonActive,
                ]}
                onPress={() => setSelectedOutfit(outfit)}
              >
                <Icon
                  name="hanger"
                  size={24}
                  color={selectedOutfit?.id === outfit.id ? '#4A00E0' : '#fff'}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedOutfit?.id === outfit.id && styles.optionTextActive,
                  ]}
                >
                  {outfit.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.optionButton, styles.clearButton]}
              onPress={() => setSelectedOutfit(null)}
            >
              <Icon name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.optionText}>Temizle</Text>
            </TouchableOpacity>
          </View>

          {/* Visualizer */}
          {selectedOutfit ? (
            <View style={styles.visualizerContainer}>
              <Text style={styles.sectionTitle}>Önizleme</Text>
              <OutfitVisualizer outfitData={selectedOutfit.data} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="tshirt-crew-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>Bir kombin seç</Text>
            </View>
          )}

          {/* Kullanım Bilgisi */}
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>💡 Kullanım Örneği:</Text>
            <Text style={styles.usageCode}>
              {`<OutfitVisualizer\n  outfitData={{\n    top: 'url',\n    bottom: 'url',\n    shoes: 'url'\n  }}\n/>`}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#C9A7EB',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  optionTextActive: {
    color: '#4A00E0',
  },
  clearButton: {
    backgroundColor: 'rgba(241, 148, 138, 0.3)',
  },
  visualizerContainer: {
    marginBottom: 25,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginBottom: 25,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 10,
  },
  usageCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  usageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  usageCode: {
    color: '#C9A7EB',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

export default OutfitVisualizerTestScreen;
