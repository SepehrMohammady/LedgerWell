const fs = require('fs');
const path = require('path');

// Keys only used in excelExport.ts and excelImport.ts (obsolete files)
const obsoleteKeys = [
  'exportConfirmation',
  'exportMetadata',
  'exportDescription',
  'exportContent',
  'exportContentDescription',
  'accountSheets',
  'accountSheetsDescription',
  'summarySheet',
  'summarySheetDescription',
  'sheetStructure'
];

const localesPath = 'c:/Users/SMoha/Desktop/Temporary/LedgerWell/src/locales';
const languageFiles = fs.readdirSync(localesPath).filter(f => f.endsWith('.json'));

console.log(`Found ${obsoleteKeys.length} obsolete keys to remove:`, obsoleteKeys);
console.log(`\nProcessing ${languageFiles.length} language files...\n`);

let totalRemoved = 0;

languageFiles.forEach(file => {
  const filePath = path.join(localesPath, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let removed = 0;
  obsoleteKeys.forEach(key => {
    if (content[key]) {
      delete content[key];
      removed++;
    }
  });
  
  if (removed > 0) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`${file}: Removed ${removed} obsolete keys`);
    totalRemoved += removed;
  } else {
    console.log(`${file}: No obsolete keys found`);
  }
});

console.log(`\nTotal keys removed: ${totalRemoved}`);
