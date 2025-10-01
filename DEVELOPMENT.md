# Development Guidelines

## Version Management

This project uses a centralized version update system to ensure all version numbers stay synchronized across different configuration files.

### Files that contain version information:
- `package.json` 
- `package-lock.json`
- `app.json` (Expo configuration)
- `android/app/build.gradle` (Android native build)

### How to update versions:

1. **Using the centralized script (RECOMMENDED):**
   ```bash
   npm run update-version <new-version>
   ```
   Example:
   ```bash
   npm run update-version 0.3.0
   ```

2. **Manual updates (NOT RECOMMENDED):**
   If you must update manually, ensure you update ALL four files above with the same version number.

### Semantic Versioning Rules:
- **Patch** (0.2.0 → 0.2.1): Bug fixes, translations, minor improvements
- **Minor** (0.2.1 → 0.3.0): New features, significant UX improvements
- **Major** (0.3.0 → 1.0.0): Breaking changes, complete rewrites

## Git Commit Guidelines

### ⚠️ IMPORTANT: No Auto-Commits

**AI Assistant should NEVER commit automatically.** 

Commits should only happen when explicitly requested by the developer with phrases like:
- "Commit these changes"
- "Please commit"
- "Ready to commit"
- "Commit to GitHub"

### Commit Message Format:
```
<type>: <description>

<optional body>

<optional footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Before Committing:
1. Run version update script if version changed
2. Test the app to ensure it works
3. Review all changes
4. Only then request commit

## File Structure

```
scripts/
├── update-version.js     # Centralized version updater
└── ...

.github/
├── copilot-instructions.md  # AI Assistant guidelines
└── ...
```

## Testing After Changes

Always test the app after making changes:
```bash
npm start
```

Scan QR code with Expo Go to test on device.