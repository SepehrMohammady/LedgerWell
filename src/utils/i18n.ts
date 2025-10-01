import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Import language resources
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import ar from '../locales/ar.json';
import fa from '../locales/fa.json';
import it from '../locales/it.json';
import pt from '../locales/pt.json';
import ru from '../locales/ru.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import id from '../locales/id.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ar: { translation: ar },
  fa: { translation: fa },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  id: { translation: id },
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'fa'];

// Function to check if a language is RTL
export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};

// Function to set RTL layout
export const setRTL = (language: string) => {
  const shouldBeRTL = isRTL(language);
  
  // Always update RTL settings, even if they seem the same
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  
  // Force layout update by swapping the RTL state briefly
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.swapLeftAndRightInRTL(shouldBeRTL);
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Set up language change listener to handle RTL
i18n.on('languageChanged', (language: string) => {
  setRTL(language);
});

export default i18n;