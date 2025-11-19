const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');

// Translation mapping for new backup keys
const translations = {
  en: {
    exportBackup: "Export Backup (CSV)",
    importBackup: "Import Backup (CSV)",
    selectBackupFile: "Please select a CSV backup file to restore data from",
    customCurrencies: "Custom Currencies",
    dateRange: "Date Range",
    backupVersion: "Backup Version",
    restored: "Restored",
    added: "Added",
    restoreFailed: "Failed to restore backup data"
  },
  ar: {
    exportBackup: "تصدير النسخة الاحتياطية (CSV)",
    importBackup: "استيراد النسخة الاحتياطية (CSV)",
    selectBackupFile: "الرجاء تحديد ملف CSV لاستعادة البيانات منه",
    customCurrencies: "العملات المخصصة",
    dateRange: "نطاق التاريخ",
    backupVersion: "إصدار النسخة الاحتياطية",
    restored: "تم الاستعادة",
    added: "تم الإضافة",
    restoreFailed: "فشل استعادة بيانات النسخة الاحتياطية"
  },
  de: {
    exportBackup: "Backup exportieren (CSV)",
    importBackup: "Backup importieren (CSV)",
    selectBackupFile: "Bitte wählen Sie eine CSV-Backup-Datei zum Wiederherstellen der Daten aus",
    customCurrencies: "Benutzerdefinierte Währungen",
    dateRange: "Datumsbereich",
    backupVersion: "Backup-Version",
    restored: "Wiederhergestellt",
    added: "Hinzugefügt",
    restoreFailed: "Fehler beim Wiederherstellen der Backup-Daten"
  },
  es: {
    exportBackup: "Exportar copia de seguridad (CSV)",
    importBackup: "Importar copia de seguridad (CSV)",
    selectBackupFile: "Seleccione un archivo CSV de copia de seguridad para restaurar los datos",
    customCurrencies: "Monedas personalizadas",
    dateRange: "Rango de fechas",
    backupVersion: "Versión de copia de seguridad",
    restored: "Restaurado",
    added: "Agregado",
    restoreFailed: "Error al restaurar los datos de copia de seguridad"
  },
  fa: {
    exportBackup: "صادرات پشتیبان (CSV)",
    importBackup: "وارد کردن پشتیبان (CSV)",
    selectBackupFile: "لطفاً یک فایل CSV برای بازیابی داده‌ها انتخاب کنید",
    customCurrencies: "ارزهای سفارشی",
    dateRange: "بازه زمانی",
    backupVersion: "نسخه پشتیبان",
    restored: "بازیابی شد",
    added: "اضافه شد",
    restoreFailed: "خطا در بازیابی داده‌های پشتیبان"
  },
  fr: {
    exportBackup: "Exporter la sauvegarde (CSV)",
    importBackup: "Importer la sauvegarde (CSV)",
    selectBackupFile: "Veuillez sélectionner un fichier CSV de sauvegarde pour restaurer les données",
    customCurrencies: "Devises personnalisées",
    dateRange: "Plage de dates",
    backupVersion: "Version de sauvegarde",
    restored: "Restauré",
    added: "Ajouté",
    restoreFailed: "Échec de la restauration des données de sauvegarde"
  },
  id: {
    exportBackup: "Ekspor Cadangan (CSV)",
    importBackup: "Impor Cadangan (CSV)",
    selectBackupFile: "Silakan pilih file CSV cadangan untuk memulihkan data",
    customCurrencies: "Mata Uang Kustom",
    dateRange: "Rentang Tanggal",
    backupVersion: "Versi Cadangan",
    restored: "Dipulihkan",
    added: "Ditambahkan",
    restoreFailed: "Gagal memulihkan data cadangan"
  },
  it: {
    exportBackup: "Esporta backup (CSV)",
    importBackup: "Importa backup (CSV)",
    selectBackupFile: "Seleziona un file CSV di backup per ripristinare i dati",
    customCurrencies: "Valute personalizzate",
    dateRange: "Intervallo di date",
    backupVersion: "Versione backup",
    restored: "Ripristinato",
    added: "Aggiunto",
    restoreFailed: "Impossibile ripristinare i dati di backup"
  },
  ja: {
    exportBackup: "バックアップをエクスポート (CSV)",
    importBackup: "バックアップをインポート (CSV)",
    selectBackupFile: "データを復元するCSVバックアップファイルを選択してください",
    customCurrencies: "カスタム通貨",
    dateRange: "期間",
    backupVersion: "バックアップバージョン",
    restored: "復元済み",
    added: "追加済み",
    restoreFailed: "バックアップデータの復元に失敗しました"
  },
  ko: {
    exportBackup: "백업 내보내기 (CSV)",
    importBackup: "백업 가져오기 (CSV)",
    selectBackupFile: "데이터를 복원할 CSV 백업 파일을 선택하세요",
    customCurrencies: "사용자 정의 통화",
    dateRange: "날짜 범위",
    backupVersion: "백업 버전",
    restored: "복원됨",
    added: "추가됨",
    restoreFailed: "백업 데이터 복원 실패"
  },
  pt: {
    exportBackup: "Exportar backup (CSV)",
    importBackup: "Importar backup (CSV)",
    selectBackupFile: "Selecione um arquivo CSV de backup para restaurar os dados",
    customCurrencies: "Moedas personalizadas",
    dateRange: "Intervalo de datas",
    backupVersion: "Versão do backup",
    restored: "Restaurado",
    added: "Adicionado",
    restoreFailed: "Falha ao restaurar dados de backup"
  },
  ru: {
    exportBackup: "Экспорт резервной копии (CSV)",
    importBackup: "Импорт резервной копии (CSV)",
    selectBackupFile: "Пожалуйста, выберите CSV-файл резервной копии для восстановления данных",
    customCurrencies: "Пользовательские валюты",
    dateRange: "Диапазон дат",
    backupVersion: "Версия резервной копии",
    restored: "Восстановлено",
    added: "Добавлено",
    restoreFailed: "Не удалось восстановить данные резервной копии"
  },
  zh: {
    exportBackup: "导出备份 (CSV)",
    importBackup: "导入备份 (CSV)",
    selectBackupFile: "请选择CSV备份文件以恢复数据",
    customCurrencies: "自定义货币",
    dateRange: "日期范围",
    backupVersion: "备份版本",
    restored: "已恢复",
    added: "已添加",
    restoreFailed: "恢复备份数据失败"
  }
};

// Update each language file
Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update translations
    Object.assign(content, translations[lang]);
    
    // Also update existing keys that changed
    if (content.exportToExcel) {
      delete content.exportToExcel;
    }
    if (content.importFromExcel) {
      delete content.importFromExcel;
    }
    if (content.selectExcelFile) {
      delete content.selectExcelFile;
    }
    if (content.importExecutionFailed) {
      delete content.importExecutionFailed;
    }
    
    // Update success messages to be simpler
    if (lang === 'en') {
      content.exportSuccess = "Backup exported successfully!";
    }
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`✓ Updated ${lang}.json`);
  }
});

console.log('\nBackup translation update complete!');
