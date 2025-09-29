# LedgerWell - Personal Debt & Credit Tracker

A comprehensive React Native Expo app for tracking personal debts and credits with multi-currency support and internationalization.

## Features

### 🏦 Account Management
- Create and manage multiple accounts for different people/entities
- Track money you owe to others (debts)
- Track money others owe to you (credits)
- View net balance for each account

### 💰 Multi-Currency Support
- Support for 10+ major currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, KRW)
- Add custom currencies with manual exchange rates
- Automatic currency conversion using live exchange rates
- Manual exchange rate override option

### 🌍 Internationalization
- Support for 5 languages: English, Spanish, French, German, Arabic
- Easy language switching in settings
- Localized number and currency formatting

### 📱 Modern UI/UX
- Clean, intuitive interface
- Bottom tab navigation
- Search and filter functionality
- Responsive design for all screen sizes

### 💾 Data Management
- Local data storage using AsyncStorage
- Export/import functionality (planned)
- Data backup and restore options (planned)

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Internationalization**: react-i18next
- **Storage**: AsyncStorage
- **Currency API**: ExchangeRate-API
- **State Management**: React Hooks

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
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
│   ├── HomeScreen.tsx     # Dashboard with summary
│   ├── AccountsScreen.tsx # Account management
│   ├── TransactionsScreen.tsx # Transaction history
│   └── SettingsScreen.tsx # App settings
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── currency.ts       # Currency conversion logic
│   ├── storage.ts        # Data persistence
│   └── i18n.ts          # Internationalization setup
└── locales/            # Translation files
    ├── en.json           # English
    ├── es.json           # Spanish
    ├── fr.json           # French
    ├── de.json           # German
    └── ar.json           # Arabic
```

## Usage

### Adding an Account
1. Go to the "Accounts" tab
2. Tap the "+" button
3. Enter account name, description, and select currency
4. Save the account

### Adding a Transaction
1. Go to the "Transactions" tab or select an account
2. Tap the "+" button
3. Choose transaction type (debt or credit)
4. Enter amount, description, and date
5. Save the transaction

### Changing Language
1. Go to "Settings" tab
2. Select your preferred language from the dropdown
3. The app will immediately switch to the selected language

### Managing Currencies
1. Go to "Settings" tab
2. Set your default currency
3. Update exchange rates manually or enable auto-update
4. Add custom currencies if needed

## API Integration

The app uses [ExchangeRate-API](https://exchangerate-api.com/) for fetching live currency exchange rates. The API is free and doesn't require authentication for basic usage.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Sepehr Mohammady**
- Email: SMohammady@outlook.com
- GitHub: [@SepehrMohammady](https://github.com/SepehrMohammady)

## Roadmap

- [ ] Add data export/import functionality
- [ ] Implement cloud backup options
- [ ] Add expense categories and tags
- [ ] Create detailed reporting and analytics
- [ ] Add push notifications for payment reminders
- [ ] Implement multiple user profiles
- [ ] Add photo attachments for transactions
- [ ] Create web dashboard companion

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/SepehrMohammady/LedgerWell/issues) on GitHub.

---

Made with ❤️ using React Native and Expo