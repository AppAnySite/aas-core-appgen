# AppAnySite Mobile App Project Creation and Testing

## Table of Contents

1. [Creating a Mobile App Project](#creating-a-mobile-app-project)
2. [Generating Splash and Icon Generator Library](#generating-splash-and-icon-generator-library)
   - [Setting Up the Environment](#setting-up-the-environment)
   - [Generating the Library](#generating-the-library)
3. [Testing the Library](#testing-the-library)
   - [Testing the Library using Node CLI Tool](#testing-the-library-using-node-cli-tool)
   - [Generating Icons and Splash Screen](#generating-icons-and-splash-screen-using-node-cli-tool-with-iconsplashlib-library)
4. [Testing the Application - Mobile](#testing-the-application---mobile)
5. [Documentation Links](#documentation-links)

## Creating a Mobile App Project

To create a mobile app project, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/AppAnySite/AppAnySite.git
    ```

2. Navigate to the CLI tool directory:
    ```bash
    cd AppAnySite/Utils/tools/my-node-cli-tool/
    ```

3. Install the necessary npm packages:
    ```bash
    npm install
    ```

4. Build the project using `ncc`:
    ```bash
    ncc build index.js -o build/lib
    ```

5. Package the project for the desired target:
    ```bash
    pkg build/lib/index.js --target node16-macos-arm64 --output build/APPANYSITE # MacOSX
    pkg build/lib/index.js --target node16-win-x64 --output build/APPANYSITE # Windows
    ```

6. Create a new project:
    ```bash
    ./build/APPANYSITE create --name PROJECT_NAME --platform-ios --platform-android --url WEBSITE_URL --directory PROJECT_DESTINATION_PATH
    ```

## Generating Splash and Icon Generator Library

### Setting Up the Environment

1. Navigate to the tools directory:
    ```bash
    cd AppAnySite/Utils/tools/
    ```

2. Create and activate a Python virtual environment:
    ```bash
    python3 -m venv IconSplashLib/
    cd IconSplashLib/
    source bin/activate # MacOSX/Linux
    source Scripts/activate # Windows
    ```

3. Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Generating the Library

1. Generate the library:
    ```bash
    ./generate_library.sh
    ```

## Testing the Library

### Testing the Library using Node CLI Tool

1. Navigate to the CLI tool directory:
    ```bash
    cd AppAnySite/Utils/tools/my-node-cli-tool/
    ```

2. Copy the generated libraries:
    ```bash
    npm run copy-libs
    ```

### Generating Icons and Splash Screen using Node CLI Tool with IconSplashLib Library

1. Update the icon in your project:
    ```bash
    ./build/APPANYSITE update-icon --directory CREATED_PROJECT_DIRECTORY --icon PNG_IMAGE_PATH
    ```

2. Update the splash screen in your project:
    ```bash
    ./build/APPANYSITE update-splash --directory CREATED_PROJECT_DIRECTORY --splash SVG_IMAGE_PATH
    ```

## Testing the Application - Mobile

To test the mobile application, follow these steps:

1. Navigate to your project directory:
    ```bash
    cd CREATED_PROJECT_DIRECTORY_PATH
    ```

2. Run the application on Android:
    ```bash
    npx react-native run-android
    ```

3. Run the application on iOS:
    ```bash
    npx react-native run-ios
    ```
