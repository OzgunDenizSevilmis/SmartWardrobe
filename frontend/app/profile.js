import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Platform, TextInput, Alert, Modal // Modal ve TextInput eklendi
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
  textSecondary: 'rgba(255, 255, 255, 0.8)', // Biraz daha görünür
  textPlaceholder: 'rgba(255, 255, 255, 0.6)',
  cardBackground: 'rgba(255, 255, 255, 0.09)',
  cardBorder: 'rgba(255, 255, 255, 0.18)',
  inputBackgroundModal: 'rgba(0, 0, 0, 0.15)', // Modal içindeki inputlar için
  inputBorderModal: 'rgba(0, 0, 0, 0.25)',
  buttonTextDark: '#301934',
  white: '#FFFFFF',
  danger: '#F1948A', // Çıkış butonu için
  success: '#76D7C4', // Kaydet butonu için
  transparent: 'transparent',
};

export default function ProfileScreen({ changeScreen, email }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Düzenleme için state'ler
  const [editableName, setEditableName] = useState('');
  const [editableSurname, setEditableSurname] = useState('');
  const [editableStyle, setEditableStyle] = useState('');

  const fetchProfile = async () => {
    if (!email) {
      Alert.alert("Hata", "Kullanıcı e-postası bulunamadı.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log("🔄 Profil API çağrısı yapılıyor:", getApiUrl("/profile"));
      console.log("📧 Gönderilen email:", email);
      
      const requestBody = { email };
      console.log("📤 Request body:", JSON.stringify(requestBody));
      
      const response = await fetch(getApiUrl("/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      console.log("📊 Response status:", response.status);
      console.log("✅ Response ok:", response.ok);
      
      const responseText = await response.text();
      console.log("📥 Raw response text:", responseText);
      
      if (response.ok) {
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("✅ Parsed profile data:", data);
        } catch (parseError) {
          console.error("❌ JSON parse hatası:", parseError);
          throw new Error("Sunucudan geçersiz JSON yanıtı alındı: " + responseText);
        }
        
        if (data && data.email) {
          setProfile(data);
          setEditableName(data.name || '');
          setEditableSurname(data.surname || '');
          setEditableStyle(data.style || '');
          console.log("✅ Profil başarıyla yüklendi:", data);
        } else {
          throw new Error("API'den eksik profil verisi alındı: " + JSON.stringify(data));
        }
      } else {
        console.error("❌ API Error status:", response.status);
        console.error("❌ API Error response:", responseText);
        
        // Backend hatası varsa, geçici mock data göster
        if (response.status === 500) {
          console.log("🔧 Backend hatası tespit edildi, mock data kullanılıyor");
          const mockProfile = {
            email: email,
            name: "Test",
            surname: "Kullanıcı", 
            style: "Casual"
          };
          setProfile(mockProfile);
          setEditableName(mockProfile.name);
          setEditableSurname(mockProfile.surname);
          setEditableStyle(mockProfile.style);
          Alert.alert("Uyarı", "Backend hatası nedeniyle test profili gösteriliyor. Gerçek profil için backend'i düzeltin.");
          return;
        }
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(`Profil yüklenemedi: ${errorMessage}`);
      }
    } catch (err) {
      console.error("❌ Profil yükleme hatası:", err);
      console.error("❌ Hata detayı:", err.message);
      
      // Network hatası da olabilir, mock data göster
      const mockProfile = {
        email: email,
        name: "Test",
        surname: "Kullanıcı", 
        style: "Casual"
      };
      setProfile(mockProfile);
      setEditableName(mockProfile.name);
      setEditableSurname(mockProfile.surname);
      setEditableStyle(mockProfile.style);
      
      Alert.alert(
        "Bağlantı Hatası", 
        `Backend'e bağlanılamadı. Test profili gösteriliyor.\n\nHata: ${err.message}`,
        [
          { text: "Tekrar Dene", onPress: fetchProfile },
          { text: "Test Profiline Devam Et", style: "default" }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [email]);

  const handleLogout = () => {
    // Burada gerekirse token temizleme vb. işlemler yapılabilir
    changeScreen('Login');
  };

  const openEditModal = () => {
    if (profile) {
      setEditableName(profile.name || '');
      setEditableSurname(profile.surname || '');
      setEditableStyle(profile.style || '');
      setIsEditModalVisible(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editableName.trim() || !editableSurname.trim()) {
      Alert.alert('Eksik Bilgi', 'Ad ve soyad alanları boş bırakılamaz.');
      return;
    }

    try {
      setLoading(true);
      console.log("Profil güncelleme isteği gönderiliyor:", {
        email: profile.email,
        name: editableName.trim(),
        surname: editableSurname.trim(),
        style: editableStyle.trim() || ''
      });

      const response = await fetch(getApiUrl("/update-profile"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: editableName.trim(),
          surname: editableSurname.trim(),
          style: editableStyle.trim() || ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Update profile error response:", errorText);
        throw new Error(`Profil güncellenirken bir hata oluştu. Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Update profile response:", responseData);
      
      // Backend'den dönen veriyi kontrol et
      if (responseData.updatedUser) {
        // Backend'den dönen güncellenmiş veriyi kullan
        setProfile(responseData.updatedUser);
        setEditableName(responseData.updatedUser.name);
        setEditableSurname(responseData.updatedUser.surname);
        setEditableStyle(responseData.updatedUser.style);
      } else {
        // Fallback: Local state'i güncelle
        setProfile({
          ...profile,
          name: editableName.trim(),
          surname: editableSurname.trim(),
          style: editableStyle.trim() || ''
        });
      }
      
      Alert.alert('Başarılı', responseData.message || 'Profil bilgileriniz güncellendi.');
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      Alert.alert('Hata', error.message || 'Profil güncellenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flexCenter}>
        <ActivityIndicator size="large" color={COLORS.accentBright} />
        <Text style={styles.loaderText}>Profil Yükleniyor...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primaryLight]} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => changeScreen('Main')} style={styles.navIconContainer}>
                <FeatherIcon name="arrow-left" size={26} color={COLORS.accentBright} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Profilim</Text>
            <TouchableOpacity onPress={openEditModal} style={styles.navIconContainerRight} disabled={!profile}>
                <FeatherIcon name="edit-2" size={24} color={profile ? COLORS.accentBright : COLORS.textPlaceholder} />
            </TouchableOpacity>
        </View>

        {profile ? (
          <>
            <View style={styles.profileAvatarSection}>
              <View style={styles.avatarPlaceholder}>
                <Icon name="account-circle-outline" size={80} color={COLORS.accentBright} />
              </View>
              <Text style={styles.profileName}>{profile.name} {profile.surname}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
              <View style={styles.infoCard}>
                <InfoRow label="Ad Soyad" value={`${profile.name || '-'} ${profile.surname || '-'}`} icon="account-outline" />
                <InfoRow label="E-posta" value={profile.email || '-'} icon="email-outline" />
              </View>

              <Text style={styles.sectionTitle}>Stil Tercihleri</Text>
              <View style={styles.infoCard}>
                <InfoRow label="Ana Stil" value={profile.style || "Belirtilmemiş"} icon="hanger" />
                {/* Buraya daha fazla stil tercihi eklenebilir */}
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout-variant" size={22} color={COLORS.danger} />
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.flexCenter}>
            <Icon name="account-off-outline" size={70} color={COLORS.accent} />
            <Text style={styles.noProfileText}>Profil bilgileri bulunamadı.</Text>
            <Text style={styles.noProfileSubText}>Lütfen tekrar giriş yapmayı deneyin.</Text>
          </View>
        )}
      </ScrollView>

      {/* Profil Düzenleme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>

            <View style={styles.modalInputContainer}>
              <FeatherIcon name="user" size={20} color={COLORS.textSecondary} style={styles.modalInputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Adınız"
                placeholderTextColor={COLORS.textPlaceholder}
                value={editableName}
                onChangeText={setEditableName}
                editable={!loading}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <FeatherIcon name="user" size={20} color={COLORS.textSecondary} style={styles.modalInputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Soyadınız"
                placeholderTextColor={COLORS.textPlaceholder}
                value={editableSurname}
                onChangeText={setEditableSurname}
                editable={!loading}
              />
            </View>
            <View style={styles.modalInputContainer}>
              <Icon name="creation" size={20} color={COLORS.textSecondary} style={styles.modalInputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Stil Tercihiniz (örn: Günlük)"
                placeholderTextColor={COLORS.textPlaceholder}
                value={editableStyle}
                onChangeText={setEditableStyle}
                editable={!loading}
              />
            </View>

            <View style={styles.modalButtonRow}>
                <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => setIsEditModalVisible(false)}
                    disabled={loading}
                >
                    <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSaveChanges}
                    disabled={loading}
                >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.primaryDark} />
                    ) : (
                      <Text style={[styles.modalButtonText, styles.modalSaveButtonText]}>Kaydet</Text>
                    )}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Yardımcı Komponent (Opsiyonel, kodu daha okunabilir yapar)
const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={22} color={COLORS.accentBright} style={styles.infoIcon} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40, // En alta boşluk
  },
  loaderText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 45,
    paddingBottom: 15,
    marginBottom: 10,
  },
  navIconContainer: {
    padding: 8, // Dokunma alanını genişlet
    width: 44, // Ortalama için
    alignItems: 'flex-start',
  },
  navIconContainerRight: {
    padding: 8,
    width: 44,
    alignItems: 'flex-end',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  profileAvatarSection: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.accentBright,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accentBright,
    marginBottom: 10,
    marginTop: 15,
  },
  infoCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 18,
    paddingVertical: 10, // Daha az dikey padding
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Satır içi padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  infoRowNoBorder: { // Son eleman için
    borderBottomWidth: 0,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.danger}25`, // Hafif kırmızı arka plan
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  noProfileText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accentBright,
    textAlign: 'center',
    marginTop: 20,
  },
  noProfileSubText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Arka planı karart
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.primaryLight, // Modal arkaplanı
    borderRadius: 20,
    padding: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackgroundModal,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.inputBorderModal,
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    height: 50,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Butonları ayır
    marginTop: 20,
  },
  modalButton: {
    flex: 1, // Eşit genişlikte butonlar
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5, // Butonlar arası boşluk
  },
  modalSaveButton: {
    backgroundColor: COLORS.success,
  },
  modalSaveButtonText: {
    color: COLORS.primaryDark, // Kontrast
  },
  modalCancelButton: {
    backgroundColor: `${COLORS.textSecondary}30`, // Daha yumuşak
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  modalCancelButtonText: {
      color: COLORS.textPrimary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});