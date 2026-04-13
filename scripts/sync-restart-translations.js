const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'locales');

const translations = {
  ar: 'سيتم إعادة تشغيل التطبيق الآن لتطبيق تخطيط اللغة الجديدة.',
  cs: 'Aplikace se nyní restartuje pro použití nového rozložení jazyka.',
  da: 'Appen genstarter nu for at anvende det nye sproglayout.',
  de: 'Die App wird jetzt neu gestartet, um das neue Sprachlayout anzuwenden.',
  el: 'Η εφαρμογή θα επανεκκινήσει τώρα για να εφαρμόσει τη νέα διάταξη γλώσσας.',
  es: 'La aplicación se reiniciará ahora para aplicar el nuevo diseño de idioma.',
  fa: 'برنامه اکنون برای اعمال چیدمان زبان جدید مجدداً راه‌اندازی می‌شود.',
  fi: 'Sovellus käynnistyy nyt uudelleen uuden kieliasettelun käyttöönottamiseksi.',
  fr: "L'application va maintenant redémarrer pour appliquer la nouvelle disposition de langue.",
  he: 'האפליקציה תופעל מחדש כעת כדי להחיל את פריסת השפה החדשה.',
  hi: 'नई भाषा लेआउट लागू करने के लिए ऐप अब पुनः आरंभ होगा।',
  hu: 'Az alkalmazás most újraindul az új nyelvi elrendezés alkalmazásához.',
  id: 'Aplikasi akan dimulai ulang sekarang untuk menerapkan tata letak bahasa baru.',
  it: "L'app si riavvierà ora per applicare il nuovo layout della lingua.",
  ja: '新しい言語レイアウトを適用するためにアプリを再起動します。',
  ko: '새 언어 레이아웃을 적용하기 위해 앱이 지금 다시 시작됩니다.',
  nl: 'De app wordt nu opnieuw gestart om de nieuwe taalindeling toe te passen.',
  pl: 'Aplikacja zostanie teraz ponownie uruchomiona, aby zastosować nowy układ języka.',
  pt: 'O aplicativo será reiniciado agora para aplicar o novo layout de idioma.',
  ro: 'Aplicația se va reporni acum pentru a aplica noul aspect al limbii.',
  ru: 'Приложение сейчас перезапустится для применения нового языкового макета.',
  sv: 'Appen startas nu om för att tillämpa den nya språklayouten.',
  sw: 'Programu itaanza upya sasa kutumia mpangilio mpya wa lugha.',
  th: 'แอปจะรีสตาร์ทตอนนี้เพื่อใช้เลย์เอาต์ภาษาใหม่',
  tl: 'Ang app ay magre-restart ngayon upang ilapat ang bagong layout ng wika.',
  tr: 'Uygulama şimdi yeni dil düzenini uygulamak için yeniden başlatılacak.',
  uk: 'Додаток зараз перезапуститься для застосування нового мовного макету.',
  vi: 'Ứng dụng sẽ khởi động lại ngay để áp dụng bố cục ngôn ngữ mới.',
  zh: '应用程序现在将重新启动以应用新的语言布局。'
};

for (const [lang, text] of Object.entries(translations)) {
  const fp = path.join(dir, lang + '.json');
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  data.restartRequired = text;
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log('Updated restartRequired in ' + Object.keys(translations).length + ' locale files');
