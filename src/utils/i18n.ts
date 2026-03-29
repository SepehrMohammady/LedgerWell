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
import hi from '../locales/hi.json';
import tr from '../locales/tr.json';
import vi from '../locales/vi.json';
import th from '../locales/th.json';
import pl from '../locales/pl.json';
import uk from '../locales/uk.json';
import nl from '../locales/nl.json';
import tl from '../locales/tl.json';
import sw from '../locales/sw.json';
import ro from '../locales/ro.json';
import cs from '../locales/cs.json';
import hu from '../locales/hu.json';
import el from '../locales/el.json';
import he from '../locales/he.json';
import sv from '../locales/sv.json';
import da from '../locales/da.json';
import fi from '../locales/fi.json';

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
  hi: { translation: hi },
  tr: { translation: tr },
  vi: { translation: vi },
  th: { translation: th },
  pl: { translation: pl },
  uk: { translation: uk },
  nl: { translation: nl },
  tl: { translation: tl },
  sw: { translation: sw },
  ro: { translation: ro },
  cs: { translation: cs },
  hu: { translation: hu },
  el: { translation: el },
  he: { translation: he },
  sv: { translation: sv },
  da: { translation: da },
  fi: { translation: fi },
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'fa', 'he'];

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