import IPlatformSetup from './IPlatformSetup';
import { runCommand } from '../../utils/commandRunner';
import { log } from '../../utils/logger';
import { ensureDirectoryExists, writeFile } from '../../utils/fileUtils';
import { handleError } from '../../utils/errorHandler';
import path from 'path';

/**
 * PlatformSetup class.
 * Sets up the specified platform for a React Native project.
 * @extends IPlatformSetup
 */
class PlatformSetup extends IPlatformSetup {
  constructor(directory, name) {
    super();
    this.directory = directory;
    this.name = name;
  }

  async setupPlatform(platform, url) {
    try {
      const projectDir = path.join(this.directory, this.name);
      await runCommand('npm', ['install', '--save', 'react-native-webview'], {
        cwd: projectDir
      });

      if (platform === 'ios') {
        await this.setupIOS(projectDir);
      }

      this.createWebViewComponent(projectDir, url);
    } catch (error) {
      handleError(error);
    }
  }

  async setupIOS(projectDir) {
    try {
      await runCommand('pod', ['install'], { cwd: path.join(projectDir, 'ios') });
      log('INFO', 'CocoaPods dependencies installed successfully');
    } catch (error) {
      log('ERROR', `Failed to install CocoaPods dependencies: ${error.message}`);
    }
  }

  createWebViewComponent(projectDir, url) {
    const srcDir = path.join(projectDir, 'src');
    ensureDirectoryExists(srcDir);

    const webviewComponent = `
import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewScreen = ({ url }) => (
  <SafeAreaView style={styles.container}>
    <WebView source={{ uri: url }} style={styles.webview} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
    `;

    writeFile(path.join(srcDir, 'WebViewScreen.tsx'), webviewComponent);

    const appComponent = `
import React from 'react';
import { StyleSheet, View } from 'react-native';
import WebViewScreen from './src/WebViewScreen';

const App = () => {
  const websiteUrl = '${url}';

  return (
    <View style={styles.container}>
      <WebViewScreen url={websiteUrl} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
    `;

    writeFile(path.join(projectDir, 'App.tsx'), appComponent);

    const tsConfig = `
{
  "compilerOptions": {
    "jsx": "react"
  },
  "extends": "@react-native/typescript-config/tsconfig.json",
  "exclude": ["node_modules", "babel.config.js", "metro.config.js", "jest.config.js"]
}
    `;

    writeFile(path.join(projectDir, 'tsconfig.json'), tsConfig);

  }
}

export default PlatformSetup;
