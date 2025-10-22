import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { getApiUrl } from '../config/config';

export default function MyStyleScreen() {
  const [style, setStyle] = useState('');
  const [category, setCategory] = useState('');
  const [situation, setSituation] = useState('');
  const [suggestion, setSuggestion] = useState('');

  const handleGetSuggestion = async () => {
    try {
      const response = await axios.post(getApiUrl('/gemini-suggestion'), {
        style,
        category,
        situation,
      });

      setSuggestion(response.data.suggestion);
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Öneri alınırken bir sorun oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Stil (casual, formal, sporty...)</Text>
      <TextInput style={styles.input} value={style} onChangeText={setStyle} placeholder="Örn: casual" />

      <Text style={styles.label}>Kategori (tshirt, pantolon, elbise...)</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Örn: tshirt" />

      <Text style={styles.label}>Kullanım Durumu</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={situation}
        onChangeText={setSituation}
        placeholder="Örn: Bugün arkadaşlarımla dışarı çıkacağım..."
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleGetSuggestion}>
        <Text style={styles.buttonText}>Öneri Al</Text>
      </TouchableOpacity>

      {suggestion ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Gemini'den Kombin Önerisi:</Text>
          <Text style={styles.resultText}>{suggestion}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginTop: 5 },
  button: {
    marginTop: 20,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  resultBox: { marginTop: 20, backgroundColor: '#eee', padding: 15, borderRadius: 5 },
  resultTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  resultText: { fontSize: 14 },
});
