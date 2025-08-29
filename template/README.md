# React Native Cookiecutter Template

A professional template for generating React Native applications with customizable configurations for both Android and iOS platforms.

## 📋 Prerequisites

Before using this template, ensure you have:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [React Native CLI](https://reactnative.dev/docs/environment-setup)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)
- [Cookiecutter](https://cookiecutter.readthedocs.io/) installed

## 🚀 Quick Start

### Option 1: Using GitHub Repository
```bash
cookiecutter https://github.com/AppAnySite/aas-app-template.git
```

### Option 2: Using Local Template
```bash
# Clone the repository first
git clone https://github.com/AppAnySite/aas-app-template.git
cd aas-app-template

# Generate project
cookiecutter .
```

## 📝 Template Variables

When prompted, provide the following information:

| Variable | Description | Example |
|----------|-------------|---------|
| `project_name` | Directory name for your project | `MyAwesomeApp` |
| `app_name` | Display name shown on device | `My Awesome App` |
| `bundle_identifier` | iOS bundle identifier | `com.company.myapp` |
| `android_package_name` | Android package name | `com.company.myapp` |

## 🛠️ Development Setup

### Android Development

**Step-by-step process:**

1. **Generate the project:**
   ```bash
   cookiecutter https://github.com/AppAnySite/aas-app-template.git
   ```

2. **Navigate to project directory:**
   ```bash
   cd [Your-App-Name]
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run on Android:**
   ```bash
   npx react-native run-android
   ```

### iOS Development

**Step-by-step process:**

1. **Generate the project:**
   ```bash
   cookiecutter https://github.com/AppAnySite/aas-app-template.git
   ```

2. **Navigate to project directory:**
   ```bash
   cd [Your-App-Name]
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Setup iOS dependencies:**
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

5. **Run on iOS:**
   ```bash
   npx react-native run-ios
   ```

## ✅ Features

- **React Native 0.81.0** with TypeScript support
- **Cross-platform** (Android & iOS)
- **Customizable configurations** for both platforms
- **Automatic package structure** creation
- **Pre-configured** build settings
- **Clean project structure** following React Native best practices

## 📞 Support

For issues or questions:
- Create an issue on [GitHub](https://github.com/AppAnySite/aas-app-template/issues)
- Check the [React Native documentation](https://reactnative.dev/docs/getting-started)