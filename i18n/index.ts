import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './translations/fr';
import en from './translations/en';

// Create instance
const i18n = new I18n({
  fr,
  en,
});

// Set fallback language
i18n.defaultLocale = 'fr';

// Enable fallbacks
i18n.enableFallback = true;

// Constants
export const STORAGE_KEY = '@hydracare/language';

// Initialize language
export async function initializeI18n() {
  try {
    // Try to get saved language
    const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);

    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Use device language if available, otherwise French
      const deviceLanguage = Localization.locale.split('-')[0];
      i18n.locale = ['fr', 'en'].includes(deviceLanguage)
        ? deviceLanguage
        : 'fr';
      await AsyncStorage.setItem(STORAGE_KEY, i18n.locale);
    }
  } catch (error) {
    console.error('Error initializing i18n:', error);
    i18n.locale = 'fr';
  }
}

// Change language
export async function changeLanguage(language: 'fr' | 'en') {
  i18n.locale = language;
  await AsyncStorage.setItem(STORAGE_KEY, language);
}

export { i18n };
