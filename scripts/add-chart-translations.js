const fs = require('fs');
const path = require('path');

// Translations for short chart labels
const translations = {
  en: {
    creditShort: "Owes Me",
    debtShort: "I Owe"
  },
  ar: {
    creditShort: "مدين لي",
    debtShort: "أنا مدين"
  },
  de: {
    creditShort: "Schuldet mir",
    debtShort: "Ich schulde"
  },
  es: {
    creditShort: "Me debe",
    debtShort: "Yo debo"
  },
  fa: {
    creditShort: "بدهکار من",
    debtShort: "بدهکار هستم"
  },
  fr: {
    creditShort: "Me doit",
    debtShort: "Je dois"
  },
  id: {
    creditShort: "Hutang ke saya",
    debtShort: "Saya berhutang"
  },
  it: {
    creditShort: "Mi deve",
    debtShort: "Devo"
  },
  ja: {
    creditShort: "貸し",
    debtShort: "借り"
  },
  ko: {
    creditShort: "받을 돈",
    debtShort: "갚을 돈"
  },
  pt: {
    creditShort: "Me deve",
    debtShort: "Eu devo"
  },
  ru: {
    creditShort: "Мне должны",
    debtShort: "Я должен"
  },
  zh: {
    creditShort: "应收",
    debtShort: "应付"
  }
};

const localesDir = path.join(__dirname, '..', 'src', 'locales');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add new translations
    Object.assign(content, translations[lang]);
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`Updated ${lang}.json`);
  } catch (error) {
    console.error(`Error updating ${lang}.json:`, error.message);
  }
});

console.log('Done adding chart translations!');
