#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Export-related translations for each language
const exportTranslations = {
  en: {
    "exportToExcel": "Export to Excel",
    "exportData": "Export Data",
    "preparingExport": "Preparing export...",
    "noData": "No Data",
    "noDataToExport": "No data available to export. Please add some accounts and transactions first.",
    "exportConfirmation": "Export {{accounts}} accounts with {{transactions}} transactions using currencies: {{currencies}}?",
    "export": "Export",
    "exportSuccess": "Data exported successfully!",
    "exportFailed": "Export failed. Please try again.",
    "exportPreparationFailed": "Failed to prepare export data.",
    "exportMetadata": "Export Information",
    "appName": "App Name",
    "exportDate": "Export Date",
    "exportDescription": "Export Description",
    "exportContent": "Export Content",
    "exportContentDescription": "This file contains all your account and transaction data",
    "dataPrivacy": "Data Privacy",
    "dataPrivacyNote": "All data is exported locally. Nothing is sent to external servers.",
    "sheetStructure": "Sheet Structure",
    "summarySheet": "Summary Sheet",
    "summarySheetDescription": "Overview of all accounts and their statistics",
    "accountSheets": "Account Sheets",
    "accountSheetsDescription": "Individual sheets for each account with detailed transactions",
    "metadata": "Metadata",
    "summary": "Summary",
    "accountInformation": "Account Information",
    "runningBalance": "Running Balance",
    "finalBalance": "Final Balance",
    "totalTransactions": "Total Transactions",
    "totalAmount": "Total Amount",
    "lastTransaction": "Last Transaction",
    "createdDate": "Created Date"
  },
  ar: {
    "exportToExcel": "تصدير إلى Excel",
    "exportData": "تصدير البيانات",
    "preparingExport": "جاري تحضير التصدير...",
    "noData": "لا توجد بيانات",
    "noDataToExport": "لا توجد بيانات متاحة للتصدير. يرجى إضافة بعض الحسابات والمعاملات أولاً.",
    "exportConfirmation": "تصدير {{accounts}} حسابات مع {{transactions}} معاملات باستخدام العملات: {{currencies}}؟",
    "export": "تصدير",
    "exportSuccess": "تم تصدير البيانات بنجاح!",
    "exportFailed": "فشل التصدير. يرجى المحاولة مرة أخرى.",
    "exportPreparationFailed": "فشل في تحضير بيانات التصدير.",
    "exportMetadata": "معلومات التصدير",
    "appName": "اسم التطبيق",
    "exportDate": "تاريخ التصدير",
    "exportDescription": "وصف التصدير",
    "exportContent": "محتوى التصدير",
    "exportContentDescription": "يحتوي هذا الملف على جميع بيانات حساباتك ومعاملاتك",
    "dataPrivacy": "خصوصية البيانات",
    "dataPrivacyNote": "يتم تصدير جميع البيانات محلياً. لا يتم إرسال أي شيء إلى خوادم خارجية.",
    "sheetStructure": "هيكل الأوراق",
    "summarySheet": "ورقة الملخص",
    "summarySheetDescription": "لمحة عامة عن جميع الحسابات وإحصائياتها",
    "accountSheets": "أوراق الحسابات",
    "accountSheetsDescription": "أوراق فردية لكل حساب مع المعاملات التفصيلية",
    "metadata": "البيانات التعريفية",
    "summary": "الملخص",
    "accountInformation": "معلومات الحساب",
    "runningBalance": "الرصيد الجاري",
    "finalBalance": "الرصيد النهائي",
    "totalTransactions": "إجمالي المعاملات",
    "totalAmount": "إجمالي المبلغ",
    "lastTransaction": "آخر معاملة",
    "createdDate": "تاريخ الإنشاء"
  },
  fa: {
    "exportToExcel": "صدور به اکسل",
    "exportData": "صدور داده‌ها",
    "preparingExport": "در حال آماده‌سازی صدور...",
    "noData": "داده‌ای وجود ندارد",
    "noDataToExport": "داده‌ای برای صدور در دسترس نیست. لطفاً ابتدا چند حساب و تراکنش اضافه کنید.",
    "exportConfirmation": "صدور {{accounts}} حساب با {{transactions}} تراکنش با استفاده از ارزهای: {{currencies}}؟",
    "export": "صدور",
    "exportSuccess": "داده‌ها با موفقیت صادر شدند!",
    "exportFailed": "صدور ناموفق بود. لطفاً دوباره تلاش کنید.",
    "exportPreparationFailed": "آماده‌سازی داده‌های صدور ناموفق بود.",
    "exportMetadata": "اطلاعات صدور",
    "appName": "نام برنامه",
    "exportDate": "تاریخ صدور",
    "exportDescription": "شرح صدور",
    "exportContent": "محتوای صدور",
    "exportContentDescription": "این فایل شامل تمام داده‌های حساب‌ها و تراکنش‌های شما است",
    "dataPrivacy": "حریم خصوصی داده‌ها",
    "dataPrivacyNote": "همه داده‌ها به صورت محلی صادر می‌شوند. هیچ چیز به سرورهای خارجی ارسال نمی‌شود.",
    "sheetStructure": "ساختار برگه‌ها",
    "summarySheet": "برگه خلاصه",
    "summarySheetDescription": "نمای کلی از همه حساب‌ها و آمارهای آن‌ها",
    "accountSheets": "برگه‌های حساب",
    "accountSheetsDescription": "برگه‌های جداگانه برای هر حساب با تراکنش‌های تفصیلی",
    "metadata": "متادیتا",
    "summary": "خلاصه",
    "accountInformation": "اطلاعات حساب",
    "runningBalance": "موجودی جاری",
    "finalBalance": "موجودی نهایی",
    "totalTransactions": "کل تراکنش‌ها",
    "totalAmount": "مقدار کل",
    "lastTransaction": "آخرین تراکنش",
    "createdDate": "تاریخ ایجاد"
  },
  es: {
    "exportToExcel": "Exportar a Excel",
    "exportData": "Exportar Datos",
    "preparingExport": "Preparando exportación...",
    "noData": "Sin Datos",
    "noDataToExport": "No hay datos disponibles para exportar. Por favor añade algunas cuentas y transacciones primero.",
    "exportConfirmation": "¿Exportar {{accounts}} cuentas con {{transactions}} transacciones usando monedas: {{currencies}}?",
    "export": "Exportar",
    "exportSuccess": "¡Datos exportados exitosamente!",
    "exportFailed": "Falló la exportación. Por favor inténtalo de nuevo.",
    "exportPreparationFailed": "Falló la preparación de datos de exportación.",
    "exportMetadata": "Información de Exportación",
    "appName": "Nombre de la App",
    "exportDate": "Fecha de Exportación",
    "exportDescription": "Descripción de Exportación",
    "exportContent": "Contenido de Exportación",
    "exportContentDescription": "Este archivo contiene todos los datos de tus cuentas y transacciones",
    "dataPrivacy": "Privacidad de Datos",
    "dataPrivacyNote": "Todos los datos se exportan localmente. Nada se envía a servidores externos.",
    "sheetStructure": "Estructura de Hojas",
    "summarySheet": "Hoja de Resumen",
    "summarySheetDescription": "Vista general de todas las cuentas y sus estadísticas",
    "accountSheets": "Hojas de Cuentas",
    "accountSheetsDescription": "Hojas individuales para cada cuenta con transacciones detalladas",
    "metadata": "Metadatos",
    "summary": "Resumen",
    "accountInformation": "Información de Cuenta",
    "runningBalance": "Balance Corriente",
    "finalBalance": "Balance Final",
    "totalTransactions": "Total de Transacciones",
    "totalAmount": "Cantidad Total",
    "lastTransaction": "Última Transacción",
    "createdDate": "Fecha de Creación"
  },
  fr: {
    "exportToExcel": "Exporter vers Excel",
    "exportData": "Exporter les Données",
    "preparingExport": "Préparation de l'exportation...",
    "noData": "Aucune Donnée",
    "noDataToExport": "Aucune donnée disponible à exporter. Veuillez d'abord ajouter des comptes et des transactions.",
    "exportConfirmation": "Exporter {{accounts}} comptes avec {{transactions}} transactions utilisant les devises: {{currencies}} ?",
    "export": "Exporter",
    "exportSuccess": "Données exportées avec succès !",
    "exportFailed": "Échec de l'exportation. Veuillez réessayer.",
    "exportPreparationFailed": "Échec de la préparation des données d'exportation.",
    "exportMetadata": "Informations d'Exportation",
    "appName": "Nom de l'Application",
    "exportDate": "Date d'Exportation",
    "exportDescription": "Description de l'Exportation",
    "exportContent": "Contenu de l'Exportation",
    "exportContentDescription": "Ce fichier contient toutes les données de vos comptes et transactions",
    "dataPrivacy": "Confidentialité des Données",
    "dataPrivacyNote": "Toutes les données sont exportées localement. Rien n'est envoyé vers des serveurs externes.",
    "sheetStructure": "Structure des Feuilles",
    "summarySheet": "Feuille de Résumé",
    "summarySheetDescription": "Vue d'ensemble de tous les comptes et leurs statistiques",
    "accountSheets": "Feuilles de Comptes",
    "accountSheetsDescription": "Feuilles individuelles pour chaque compte avec transactions détaillées",
    "metadata": "Métadonnées",
    "summary": "Résumé",
    "accountInformation": "Informations du Compte",
    "runningBalance": "Solde Courant",
    "finalBalance": "Solde Final",
    "totalTransactions": "Total des Transactions",
    "totalAmount": "Montant Total",
    "lastTransaction": "Dernière Transaction",
    "createdDate": "Date de Création"
  }
};

// Languages to add minimal translations (English for now)
const minimalLanguages = ['de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'id'];

function addExportTranslations() {
  const localesDir = path.join(__dirname, '..', 'src', 'locales');
  
  // Add full translations for major languages
  Object.keys(exportTranslations).forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Add new translations
      Object.assign(content, exportTranslations[lang]);
      
      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`✓ Updated ${lang}.json with export translations`);
    } catch (error) {
      console.error(`✗ Failed to update ${lang}.json:`, error.message);
    }
  });
  
  // Add English translations to remaining languages
  minimalLanguages.forEach(lang => {
    const filePath = path.join(localesDir, `${lang}.json`);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Add English translations as fallback
      Object.assign(content, exportTranslations.en);
      
      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`✓ Updated ${lang}.json with export translations (English fallback)`);
    } catch (error) {
      console.error(`✗ Failed to update ${lang}.json:`, error.message);
    }
  });
}

console.log('Adding export translations to all language files...');
addExportTranslations();
console.log('Export translations added successfully!');