<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	Project requirements are clear: LedgerWell debt/credit tracking app with Expo, multi-language support, and currency conversion.

- [x] Scaffold the Project
	Expo project structure has been created with all necessary folders and configuration files.

- [x] Customize the Project
	Complete LedgerWell app has been implemented with all requested features including multi-language support, currency conversion, and account management.

- [x] Install Required Extensions
	No specific extensions required. Project uses standard Expo/React Native development setup.

- [x] Compile the Project
	TypeScript compilation successful. All dependencies installed and configured properly.

- [x] Create and Run Task
	Expo development server is running successfully with npm start script.

- [x] Launch the Project
	Project is successfully launched and running on Expo development server. QR code available for testing on mobile devices.

- [x] Ensure Documentation is Complete
	README.md file created with comprehensive documentation. Project structure and setup instructions provided.

## Custom Instructions

### Version Management
- When updating the app, use the centralized version update system: `npm run update-version <new-version>`
- Follow semantic versioning rules: patch for fixes, minor for features, major for breaking changes
- Never manually update version files individually - always use the centralized script

### Git Commit Policy
- **NEVER commit automatically** - Only commit when explicitly requested by the developer
- Wait for explicit commit requests like "Commit these changes", "Please commit", "Ready to commit"
- Always run version update script BEFORE committing if version changed
- Use conventional commit format: `<type>: <description>`

### Testing
- Always test the app with `npm start` after making changes
- Ensure QR code works for mobile testing before considering work complete