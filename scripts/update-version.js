#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define all files that contain version information
const VERSION_FILES = [
  {
    file: 'package.json',
    paths: [['version']]
  },
  {
    file: 'package-lock.json', 
    paths: [['version'], ['packages', '', 'version']]
  },
  {
    file: 'app.json',
    paths: [['expo', 'version']]
  },
  {
    file: 'android/app/build.gradle',
    type: 'gradle',
    patterns: [
      { key: 'versionName', regex: /versionName\s+"([^"]+)"/, replacement: 'versionName "{VERSION}"' }
    ]
  }
];

function updateVersion(newVersion) {
  console.log(`Updating all version files to: ${newVersion}`);
  
  VERSION_FILES.forEach(({ file, paths, type, patterns }) => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${file}`);
      return;
    }
    
    try {
      if (type === 'gradle') {
        // Handle Gradle files
        let content = fs.readFileSync(filePath, 'utf8');
        patterns.forEach(({ key, regex, replacement }) => {
          const newReplacement = replacement.replace('{VERSION}', newVersion);
          content = content.replace(regex, newReplacement);
        });
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${file} (${patterns.map(p => p.key).join(', ')})`);
      } else {
        // Handle JSON files
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        paths.forEach(pathArray => {
          let current = data;
          for (let i = 0; i < pathArray.length - 1; i++) {
            if (!current[pathArray[i]]) {
              current[pathArray[i]] = {};
            }
            current = current[pathArray[i]];
          }
          current[pathArray[pathArray.length - 1]] = newVersion;
        });
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`✓ Updated ${file} (${paths.map(p => p.join('.')).join(', ')})`);
      }
    } catch (error) {
      console.error(`✗ Failed to update ${file}:`, error.message);
    }
  });
  
  console.log('\nVersion update complete!');
  console.log(`All files should now be at version: ${newVersion}`);
}

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node update-version.js <version>');
  console.error('Example: node update-version.js 0.2.1');
  process.exit(1);
}

// Validate semantic version format
if (!/^\d+\.\d+\.\d+(-.*)?$/.test(newVersion)) {
  console.error('Invalid version format. Use semantic versioning (e.g., 1.0.0)');
  process.exit(1);
}

updateVersion(newVersion);