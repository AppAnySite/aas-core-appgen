# AAS Core AppGen

High-performance CLI tool for generating React Native apps using cookiecutter templates with Clean Architecture.

## 🚀 Quick Start

### Build
```bash
# Manual build process (recommended)
rm -rf .template
ncc build index.js -o build/lib
git clone https://github.com/AppAnySite/aas-app-template.git .template
```

### Run
```bash
# Create project in current directory
node build/lib/index.js create --config-file app-config.json

# Create project in specific directory
node build/lib/index.js create --config-file app-config.json --output-path ./my-projects
```

### Test
```bash
# Test with sample config
node build/lib/index.js create --config-file /Users/hvetagir/Documents/aas-app-template/hooks/source/app-config.json
```

## 📋 Usage

### Configuration File Format
```json
{
  "app": {
    "name": "MyApp",
    "bundleId": "com.company.myapp",
    "androidPackageName": "com.company.myapp"
  }
}
```

### CLI Options
- `--config-file`: Path to JSON configuration file (required)
- `--output-path`: Path where project should be created (optional, default: current directory)
- `--verbose`: Enable verbose mode
- `--debug`: Enable debug mode

## 🏗️ Architecture

### System Overview
```mermaid
graph TB
    %% Main Entry Point
    MAIN[main.js<br/>CLI Entry Point<br/>Command Line Interface]
    
    %% Command Layer
    CREATE_CMD[CreateCommand<br/>Command Implementation<br/>Option Validation & Execution]
    
    %% Application Layer
    APP_SERVICE[AppGenerationService<br/>Business Logic Orchestration<br/>Progress Tracking & Error Handling]
    
    %% Domain Layer
    APP_CONFIG[AppConfig<br/>Domain Entity<br/>Configuration Validation<br/>Business Rules]
    
    %% Repository Interfaces (Domain)
    I_CONFIG_REPO[IConfigRepository<br/>Configuration Interface]
    I_TEMPLATE_REPO[ITemplateRepository<br/>Template Interface]
    I_EXECUTOR_REPO[IExecutorRepository<br/>Execution Interface]
    
    %% Infrastructure Layer (Implementations)
    CONFIG_REPO[ConfigRepository<br/>File-based Configuration<br/>Caching & Error Handling]
    TEMPLATE_REPO[TemplateRepository<br/>Template Management<br/>Path Discovery & Validation]
    EXECUTOR_REPO[ExecutorRepository<br/>Command Execution<br/>Process Management & Timeouts]
    
    %% Flow Connections
    MAIN --> CREATE_CMD
    CREATE_CMD --> APP_SERVICE
    APP_SERVICE --> APP_CONFIG
    APP_SERVICE --> CONFIG_REPO
    APP_SERVICE --> TEMPLATE_REPO
    APP_SERVICE --> EXECUTOR_REPO
    
    %% Interface Implementations
    CONFIG_REPO -.->|implements| I_CONFIG_REPO
    TEMPLATE_REPO -.->|implements| I_TEMPLATE_REPO
    EXECUTOR_REPO -.->|implements| I_EXECUTOR_REPO
    
    %% External Dependencies
    EXECUTOR_REPO --> COOKIECUTER[cookiecutter<br/>External Tool<br/>Template Processing]
    CONFIG_REPO --> FILE_SYSTEM[File System<br/>Configuration Files<br/>Template Files<br/>Generated Projects]
    TEMPLATE_REPO --> FILE_SYSTEM
    
    %% Styling
    classDef entryPoint fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef commandLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef applicationLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef domainLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef infrastructureLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class MAIN entryPoint
    class CREATE_CMD commandLayer
    class APP_SERVICE applicationLayer
    class APP_CONFIG,I_CONFIG_REPO,I_TEMPLATE_REPO,I_EXECUTOR_REPO domainLayer
    class CONFIG_REPO,TEMPLATE_REPO,EXECUTOR_REPO infrastructureLayer
```

### Execution Flow
```mermaid
sequenceDiagram
    participant User as User
    participant Main as main.js
    participant Cmd as CreateCommand
    participant Service as AppGenerationService
    participant Config as AppConfig
    participant ConfigRepo as ConfigRepository
    participant TemplateRepo as TemplateRepository
    participant ExecutorRepo as ExecutorRepository
    participant Cookie as cookiecutter
    participant FS as File System
    
    User->>Main: create --config-file app-config.json
    Main->>Cmd: execute(options)
    Cmd->>Service: generateApp(configFilePath, outputPath, progressCallback)
    
    %% Configuration Loading
    Service->>ConfigRepo: loadConfig(configFilePath)
    ConfigRepo->>FS: readFile(configFilePath)
    FS-->>ConfigRepo: configData
    Service->>Config: new AppConfig(configData)
    
    %% Environment Preparation
    Service->>ExecutorRepo: installCookiecutter()
    Service->>TemplateRepo: getTemplatePath()
    
    %% Project Generation
    Service->>ExecutorRepo: executeCookiecutter(templatePath, outputPath)
    ExecutorRepo->>Cookie: cookiecutter template --no-input
    Cookie->>FS: create project structure
    Cookie-->>ExecutorRepo: success
    
    %% Post-processing
    Service->>Service: validateGeneratedProject()
    Service-->>Cmd: result
    Cmd-->>Main: success
    Main-->>User: Project generated successfully
```

## 📁 Project Structure

```
src/
├── domain/                 # Business logic and entities
│   ├── entities/          # AppConfig domain entity
│   └── repositories/      # Repository interfaces
├── application/           # Application services
│   └── services/         # AppGenerationService
├── infrastructure/        # External concerns
│   └── repositories/     # Repository implementations
├── modules/              # Command modules
│   └── create/          # CreateCommand implementation
└── utils/               # Shared utilities
```

## ⚡ Performance

- **Generation Time**: ~500ms (0.5 seconds)
- **Build Time**: ~650ms
- **Memory Usage**: ~50MB
- **Template Processing**: < 100ms

## 🔧 Features

- **Clean Architecture**: Clear separation of concerns
- **Progress Tracking**: Real-time progress with timestamps
- **Error Handling**: Comprehensive error management and cleanup
- **Output Path Support**: Create projects in any directory
- **Template Cloning**: Always uses latest template from GitHub
- **High Performance**: Optimized for speed and efficiency

## 📦 Build Process

### Manual Build (Recommended)
```bash
# Remove existing template
rm -rf .template

# Build with ncc
ncc build index.js -o build/lib

# Clone template
git clone https://github.com/AppAnySite/aas-app-template.git .template
```

### npm Scripts
```bash
# Shows manual commands
npm run build

# Build ncc only
npm run build:ncc
```

## 🧪 Testing

```bash
# Test basic functionality
node build/lib/index.js create --config-file app-config.json

# Test with custom output path
node build/lib/index.js create --config-file app-config.json --output-path ./test-output

# Test with nested directory (auto-created)
node build/lib/index.js create --config-file app-config.json --output-path ./projects/react-native
```

## 📄 License

MIT License

## 🆘 Support

- GitHub Issues: [Create an issue](https://github.com/AppAnySite/aas-core-appgen/issues)
- Email: dev@appanysite.com
