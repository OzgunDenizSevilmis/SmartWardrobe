import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ changeScreen }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OutfitApp</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => changeScreen('Login')}
      >
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => changeScreen('Register')}
      >
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#E6E6FA' 
  },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    color: '#3A3A3A', 
    marginBottom: 50 
  },
  button: { 
    backgroundColor: '#4A90E2', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    borderRadius: 25, 
    marginVertical: 10 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: '600' 
  }
});

export default HomeScreen;