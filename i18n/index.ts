import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './translations/fr';

// Create instance
const i18n = new I18n({
  fr,
});

// Set locale
i18n.locale = 'fr';
i18n.defaultLocale = 'fr';

// Enable fallbacks
i18n.enableFallback = true;

// Constants
export const STORAGE_KEY = '@hydracare/language';

// Initialize language
export async function initializeI18n() {
  try {
    i18n.locale = 'fr';
    await AsyncStorage.setItem(STORAGE_KEY, 'fr');
  } catch (error) {
    console.error('Error initializing i18n:', error);
    i18n.locale = 'fr';
  }
}

export { i18n };
