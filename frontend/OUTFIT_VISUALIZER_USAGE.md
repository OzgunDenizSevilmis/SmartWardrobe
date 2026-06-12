# OutfitVisualizer Kullanım Kılavuzu

## 📦 Kurulum

OutfitVisualizer bileşeni `components/OutfitVisualizer.js` dosyasında oluşturuldu.

## 🎯 Kullanım Örneği

### 1. MainScreen'e Ekleme

```javascript
// mainscreen.js dosyasının başına ekle:
import OutfitVisualizer from '../components/OutfitVisualizer';

// MainScreen fonksiyonu içinde state ekle:
const [outfitImages, setOutfitImages] = useState(null);

// fetchWeatherAndSuggestion fonksiyonu içinde backend'den gelen cevabı işle:
const fetchWeatherAndSuggestion = async () => {
  // ... mevcut kodlar ...
  
  // Backend'den gelen yanıtta eğer görsel URL'leri varsa:
  if (data.outfit_images) {
    setOutfitImages({
      top: data.outfit_images.top,
      bottom: data.outfit_images.bottom,
      shoes: data.outfit_images.shoes
    });
  }
};

// Render kısmında kullan:
{outfitImages && !loading && (
  <OutfitVisualizer outfitData={outfitImages} />
)}
```

### 2. Test Amaçlı Kullanım (Hardcoded)

```javascript
// Test için örnek veri:
const testOutfitData = {
  top: 'https://example.com/images/tshirt.png',
  bottom: 'https://example.com/images/jeans.png',
  shoes: 'https://example.com/images/sneakers.png'
};

// Kullanım:
<OutfitVisualizer outfitData={testOutfitData} />
```

### 3. Dinamik Kullanım (Backend'den gelen veri ile)

Backend'inizin şu formatta veri döndürmesini sağlayın:

```json
{
  "suggestion": "Bugün için rahat bir kombin...",
  "outfit_images": {
    "top": "https://your-backend.com/images/top-123.jpg",
    "bottom": "https://your-backend.com/images/bottom-456.jpg",
    "shoes": "https://your-backend.com/images/shoes-789.jpg"
  }
}
```

## 🎨 Özelleştirme

### Boyutları Değiştirme

`OutfitVisualizer.js` dosyasındaki styles içinde:

```javascript
// Container yüksekliğini ayarla:
container: {
  height: SCREEN_HEIGHT * 0.5, // %50 -> İstediğin yüzdeyi değiştir
}

// Kıyafet boyutlarını ayarla:
top: {
  width: SCREEN_WIDTH * 0.55,  // %55
  height: SCREEN_HEIGHT * 0.22, // %22
}
```

### Konumları Ayarlama

```javascript
top: {
  top: '5%', // Yukarıdan mesafe
  zIndex: 3,
}

bottom: {
  top: '30%', // Yukarıdan mesafe
  zIndex: 2,
}

shoes: {
  bottom: '5%', // Aşağıdan mesafe
  zIndex: 1,
}
```

### Arka Plan Renklerini Değiştirme

```javascript
<LinearGradient
  colors={['#YOURCOLOR1', '#YOURCOLOR2']} // İstediğin renkleri ekle
  style={styles.background}
>
```

## 🔧 Hata Ayıklama

### Görsel Yüklenmiyor
- URL'lerin geçerli olduğundan emin ol
- Console'da hata mesajlarını kontrol et
- Görsellerin HTTPS ile sunulduğunu doğrula

### Görsel Hizalaması Bozuk
- `resizeMode` prop'unu değiştir: `'contain'`, `'cover'`, `'stretch'`
- `top`, `bottom` yüzde değerlerini ayarla

### Performans Sorunları
- Görselleri optimize et (max 500KB)
- React Native'in Image caching mekanizmasını kullan

## 📱 Responsive Davranış

Bileşen, `Dimensions.get('window')` kullanarak ekran boyutuna göre otomatik olarak ölçeklenir:
- Küçük ekranlarda (iPhone SE): Görseller küçülür
- Büyük ekranlarda (iPad): Görseller büyür
- Her zaman orantılı kalır

## 🚀 Gelişmiş Kullanım

### Animasyon Ekleme

```javascript
import { Animated } from 'react-native';

// Fade-in animasyonu için:
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: true,
  }).start();
}, []);
```

### Loading State

```javascript
{loading ? (
  <ActivityIndicator size="large" color="#fff" />
) : (
  <OutfitVisualizer outfitData={outfitImages} />
)}
```
