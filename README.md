# LedgerWell - Personal Debt & Credit Tracker

A comprehensive React Native Expo app for tracking personal debts and credits with extensive multi-currency support and full internationalization.

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/SepehrMohammady/LedgerWell)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue.svg)](https://expo.dev)

## Features

### 🏦 Account Management
- Create and manage multiple accounts for different people/entities
- Track money you owe to others (debts)
- Track money others owe to you (credits)
- View net balance for each account
- Comprehensive transaction history per account

### 💰 Multi-Currency Support
- Support for **39 international currencies** including major and regional currencies
- Add unlimited custom currencies with manual exchange rates
- Automatic currency conversion using live exchange rates
- Manual exchange rate override option
- Currency-specific formatting and symbols

### 🌍 Complete Internationalization
- **13 language support**: English, Spanish, French, German, Arabic, Persian, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Indonesian
- Right-to-left (RTL) language support for Arabic and Persian
- Easy language switching in settings with instant app reload
- Fully localized UI with 124+ translation keys per language
- **Native numeral system support**: Arabic-Indic numerals for Arabic (٠١٢٣٤٥٦٧٨٩), Persian numerals for Farsi (۰۱۲۳۴۵۶۷۸۹)
- Localized number input and display throughout the app
- Localized currency formatting with proper numeral systems

### 📱 Modern UI/UX
- Clean, intuitive Material Design interface
- Bottom tab navigation with smooth transitions
- Search and filter functionality across all screens
- Dark/Light theme support with system preference detection
- Responsive design optimized for all screen sizes
- Consistent iconography using Ionicons

### 💾 Data Management & Privacy
- **100% local data storage** using AsyncStorage - no cloud dependencies
- Complete privacy - your data never leaves your device
- Robust data persistence and recovery
- Reset all data functionality with confirmation
- No tracking, no analytics, no data collection

### ⚙️ Settings & Customization
- Comprehensive settings screen with organized sections
- Auto-update exchange rates toggle
- Custom currency creation and management
- About section with app info and developer links
- Language persistence across app restarts

## Tech Stack

- **Framework**: React Native with Expo Development Build
- **Language**: TypeScript with strict type checking
- **Navigation**: React Navigation v6 with TypeScript support
- **Internationalization**: react-i18next with namespace support
- **Storage**: AsyncStorage for persistence
- **Currency API**: ExchangeRate-API for live rates
- **State Management**: React Hooks with custom storage utilities
- **Build System**: EAS Build for production builds
- **Icons**: Expo Vector Icons (Ionicons)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SepehrMohammady/LedgerWell.git
cd LedgerWell
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device or emulator:
- **iOS**: Press `i` in the terminal or use the Expo Go app
- **Android**: Press `a` in the terminal or use the Expo Go app  
- **Web**: Press `w` in the terminal

## Project Structure

```
LedgerWell/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AddAccountModal.tsx
│   │   ├── AddTransactionModal.tsx
│   │   └── CustomCurrencyModal.tsx
│   ├── screens/            # Main app screens
│   │   ├── HomeScreen.tsx     # Dashboard with summary
│   │   ├── AccountsScreen.tsx # Account management
│   │   ├── TransactionsScreen.tsx # Transaction history
│   │   └── SettingsScreen.tsx # App settings & about
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts          # Core app types
│   ├── utils/              # Utility functions
│   │   ├── currency.ts       # Currency conversion & 39 currency definitions
│   │   ├── storage.ts        # Data persistence layer
│   │   ├── theme.ts          # Theme management
│   │   └── i18n.ts          # Internationalization setup
│   └── locales/            # Translation files (112+ keys each)
│       ├── en.json           # English
│       ├── es.json           # Spanish
│       ├── fr.json           # French
│       ├── de.json           # German
│       ├── ar.json           # Arabic (RTL)
│       ├── fa.json           # Persian (RTL)
│       ├── it.json           # Italian
│       ├── pt.json           # Portuguese
│       ├── ru.json           # Russian
│       ├── zh.json           # Chinese
│       ├── ja.json           # Japanese
│       ├── ko.json           # Korean
│       └── id.json           # Indonesian
├── assets/                 # App assets
├── android/               # Android native code
├── scripts/               # Build and utility scripts
│   └── update-version.js    # Centralized version management
└── .github/               # GitHub configuration
    └── copilot-instructions.md
```

## Usage

### Adding an Account
1. Navigate to the "Accounts" tab
2. Tap the "+" button
3. Enter account name, description, and select currency
4. Choose account type (debt or credit)
5. Save the account

### Adding a Transaction
1. Go to the "Transactions" tab or select an account
2. Tap the "+" button  
3. Choose transaction type (debt or credit)
4. Enter amount, description, and date
5. Save the transaction

### Language Management
1. Go to "Settings" tab
2. Select your preferred language from the alphabetically sorted list
3. The app will immediately restart with the selected language
4. Language preference is saved and persists across app launches

### Currency Management
1. Go to "Settings" tab
2. Set your default currency from 39 available options
3. Toggle auto-update for exchange rates
4. Create custom currencies with manual exchange rates
5. Manage and delete custom currencies

## API Integration

The app uses [ExchangeRate-API](https://exchangerate-api.com/) for fetching live currency exchange rates. The API is free and doesn't require authentication for basic usage.

**Supported base currencies**: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, TRY, RUB, INR, BRL, ZAR, KRW, PLN, THB, IDR, HUF, CZK, ILS, CLP, PHP, AED, COP, SAR, MYR, VND, ARS, EGP, NGN, KES, DKK, PEN

## Development

### Version Management System

This project uses a **centralized version update system** to ensure all version numbers stay synchronized across different configuration files.

**Files automatically updated:**
- `package.json` 
- `package-lock.json`
- `app.json` (Expo configuration)
- `android/app/build.gradle` (Android native build)

**How to update versions:**

1. **Using the centralized script (REQUIRED):**
   ```bash
   npm run update-version <new-version>
   ```
   Example:
   ```bash
   npm run update-version 0.3.0
   ```

2. **Manual updates are NOT RECOMMENDED** - use the script to avoid inconsistencies.

### Semantic Versioning Rules:
- **Patch** (0.2.3 → 0.2.4): Bug fixes, translations, minor improvements  
- **Minor** (0.2.3 → 0.3.0): New features, significant UX improvements
- **Major** (0.3.0 → 1.0.0): Breaking changes, complete rewrites

### Git Commit Guidelines

**Commit Message Format:**
```
<type>: <description>

<optional body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Before Committing:**
1. Run version update script if version changed: `npm run update-version <version>`
2. Test the app: `npm start`
3. Review all changes

### Testing After Changes

Always test the app after making changes:
```bash
npm start
```
Scan QR code with Expo Go to test on device.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Follow the development guidelines above
4. Commit your changes with proper commit message format
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Sepehr Mohammady**
- Website: [sepehrmohammady.ir](https://sepehrmohammady.ir/)
- Email: SMohammady@outlook.com
- GitHub: [@SepehrMohammady](https://github.com/SepehrMohammady)

## Roadmap

### Planned Features
- [ ] Data export/import functionality (JSON/CSV)
- [ ] Cloud backup options (Google Drive/iCloud)
- [ ] Expense categories and tags system
- [ ] Advanced reporting and analytics dashboard
- [ ] Push notifications for payment reminders
- [ ] Multiple user profiles support
- [ ] Photo attachments for transactions
- [ ] Web dashboard companion app

### Completed Recently
- [x] **Localized number input system** - Native numeral support for Arabic and Farsi
- [x] Complete 13-language internationalization
- [x] 39-currency support with live exchange rates
- [x] Custom currency editing functionality
- [x] Dark/Light theme system
- [x] Custom currency creation and management
- [x] About section with developer info
- [x] Comprehensive settings screen
- [x] RTL language support
- [x] Language persistence across app launches

## Support

If you encounter any issues or have suggestions:

1. **GitHub Issues**: [Open an issue](https://github.com/SepehrMohammady/LedgerWell/issues)
2. **Documentation**: Check this README and code comments
3. **Development**: See development guidelines above

---

## Privacy & Security

🔒 **Your privacy is guaranteed:**
- **No data collection** - we don't track or store any user data
- **Local storage only** - all data stays on your device
- **No analytics** - no usage tracking or telemetry  
- **No ads** - clean, ad-free experience
- **Open source** - full transparency of code and functionality

---

**Made with ❤️ using React Native and Expo**

*LedgerWell helps you track debts and credits with multi-currency support and complete privacy.*

© 2025 Sepehr Mohammady. Open source under MIT License.