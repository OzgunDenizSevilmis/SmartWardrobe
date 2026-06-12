import { API_URL } from '@env';

// API configuration
export const apiConfig = {
  baseURL: API_URL || 'http://172.20.10.2:5001', // Fallback URL
  endpoints: {
    login: '/login',
    register: '/register',
    passwordReset: '/password-reset',
    resetPassword: '/reset-password',
    getPreferences: '/get-preferences',
    getWardrobe: '/get-wardrobe',
    addWardrobeItem: '/add-wardrobe-item',
    upload: '/upload',
    predictColour: '/predict-colour',
    geminiSuggestion: '/gemini-suggestion',
    profile: '/profile',
    updateProfile: '/update-profile'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};