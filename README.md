# Mobile App Generation

## Table of Contents

1. [Creating a Mobile App Project](#creating-a-mobile-app-project)
2. [Testing the Application - Mobile](#testing-the-application---mobile)

## Creating a Mobile App Project

To create a mobile app project, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/AppAnySite/aas-core-appgen.git
    ```

2. Navigate to the CLI tool directory:
    ```bash
    cd aas-core-appgen/
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
    pkg build/lib/index.js --target node16-macos-arm64 --output bin/aas-core-appgen # MacOSX-ARM
    pkg build/lib/index.js --target node16-win-x64 --output bin/aas-core-appgen # Windows-X64
    ```

6. Create a new project:
    ```bash
    ./bin/aas-core-appgen create --name PROJECT_NAME --platform-ios --platform-android --url WEBSITE_URL --directory PROJECT_DESTINATION_PATH
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
