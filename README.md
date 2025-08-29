# AAS Core AppGen - Professional CLI Tool

## 🚀 Overview

AAS Core AppGen is a high-performance CLI tool for generating React Native applications using cookiecutter templates. Built with Clean Architecture principles, it provides a professional, maintainable, and scalable solution for rapid app generation.

## 🏗️ Architecture

### Clean Architecture Implementation

The project follows Clean Architecture principles with clear separation of concerns:

```
src/
├── domain/                 # Business logic and entities
│   ├── entities/          # Domain entities (AppConfig)
│   └── repositories/      # Repository interfaces
├── application/           # Application services
│   └── services/         # Business use cases
├── infrastructure/        # External concerns
│   └── repositories/     # Repository implementations
├── modules/              # Command modules
│   └── create/          # Create command implementation
└── utils/               # Shared utilities
```

### Key Design Principles

- **Single Responsibility**: Each class has one clear purpose
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Interface Segregation**: Clients depend only on interfaces they use
- **Open/Closed**: Open for extension, closed for modification

## ⚡ Performance

### Before (React Native CLI):
- **Time**: 2-10 minutes
- **Process**: npx react-native init → Manual setup → WebView creation
- **Dependencies**: Multiple external tools

### After (Cookiecutter):
- **Time**: 15-30 seconds
- **Process**: Config validation → Template processing → cookiecutter execution
- **Dependencies**: Single cookiecutter tool

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/AppAnySite/aas-core-appgen.git
cd aas-core-appgen

# Install dependencies
npm install

# Build the binary
npm run build

# The binary will be available at: build/aas-core-appgen
```

## 📖 Usage

### Basic Usage

```bash
./build/aas-core-appgen create --config-file /path/to/config.json
```

### Configuration File Format

```json
{
  "project_name": "MyApp",
  "app_name": "My App",
  "bundle_identifier": "com.company.myapp",
  "android_package_name": "com.company.myapp",
  "initial_url": "https://example.com",
  "features": {
    "icon_enabled": true,
    "splash_enabled": true,
    "analytics_enabled": false
  },
  "theme": {
    "primary_color": "#007AFF",
    "secondary_color": "#5856D6"
  },
  "platforms": ["ios", "android"]
}
```

## 🔧 Configuration

### Required Fields

- `project_name`: Project directory name (letters, numbers, underscores only)
- `app_name`: Display name for the application
- `bundle_identifier`: iOS bundle identifier (com.company.app format)
- `android_package_name`: Android package name (com.company.app format)

### Optional Fields

- `initial_url`: Initial URL for WebView
- `features`: Feature flags configuration
- `theme`: Theme configuration
- `platforms`: Supported platforms

## 📊 Progress Tracking

The tool provides detailed progress tracking with timestamps:

```
[2024-01-15T10:30:00.000Z] Progress: 5% - Loading and validating configuration
[2024-01-15T10:30:01.000Z] Progress: 10% - Ensuring cookiecutter is available
[2024-01-15T10:30:02.000Z] Progress: 20% - Locating and validating template
[2024-01-15T10:30:03.000Z] Progress: 30% - Preparing template configuration
[2024-01-15T10:30:05.000Z] Progress: 90% - Generating project with cookiecutter
[2024-01-15T10:30:06.000Z] Progress: 100% - Project generation completed successfully in 6000ms
```

## 🏛️ Architecture Components

### Domain Layer

#### AppConfig Entity
- **Purpose**: Business logic for application configuration
- **Responsibilities**: Validation, data transformation, business rules
- **Features**: Bundle identifier validation, package name validation, feature management

#### Repository Interfaces
- **IConfigRepository**: Configuration data access contract
- **ITemplateRepository**: Template management contract
- **IExecutorRepository**: External command execution contract

### Application Layer

#### AppGenerationService
- **Purpose**: Orchestrates the entire app generation process
- **Responsibilities**: Process coordination, error handling, progress tracking
- **Features**: Step-by-step execution, comprehensive error handling, cleanup

### Infrastructure Layer

#### Repository Implementations
- **ConfigRepository**: File-based configuration management
- **TemplateRepository**: Template discovery and preparation
- **ExecutorRepository**: Cookiecutter execution and dependency management

### Command Layer

#### CreateCommand
- **Purpose**: CLI command implementation
- **Responsibilities**: Option validation, service coordination, output formatting
- **Features**: Progress tracking, error handling, result reporting

## 🔒 Error Handling

### Comprehensive Error Management

- **Configuration Validation**: Detailed validation with specific error messages
- **Template Validation**: Template existence and structure validation
- **Execution Errors**: Process execution with timeout and cleanup
- **File System Errors**: Graceful handling of file operations
- **Dependency Errors**: Automatic installation with fallback

### Error Recovery

- **Automatic Cleanup**: Removes partial files on error
- **Timeout Protection**: Prevents hanging processes
- **Retry Logic**: Automatic retry for transient failures
- **Detailed Logging**: Comprehensive error information

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test with sample configuration
./build/aas-core-appgen create --config-file test-config.json
```

## 📦 Build Process

```bash
# Development build
npm run build:ncc

# Production build
npm run build

# Generate documentation
npm run docs
```

## 🔄 Integration

### With aas-saas-appgen

The binary is integrated into the aas-saas-appgen Docker container:

```typescript
const CLI_PATH = path.join(process.cwd(), "bin", "aas-core-appgen");
// Execute: ./bin/aas-core-appgen create --config-file /path/to/config.json
```

### Docker Integration

```dockerfile
# Build the binary
RUN npm install && npm run build

# Copy binary to container
COPY build/aas-core-appgen /usr/local/bin/
```

## 📈 Performance Metrics

- **Average Generation Time**: 15-30 seconds
- **Memory Usage**: ~50MB during execution
- **Template Processing**: < 5 seconds
- **Cookiecutter Execution**: 10-20 seconds
- **Post-processing**: < 5 seconds

## 🔮 Future Enhancements

1. **Template Caching**: Cache templates locally for faster access
2. **Parallel Processing**: Execute multiple operations in parallel
3. **Template Versioning**: Support for different template versions
4. **Advanced Validation**: More sophisticated configuration validation
5. **Plugin System**: Extensible architecture for custom processors
6. **Testing Framework**: Comprehensive unit and integration tests
7. **Performance Monitoring**: Real-time performance metrics
8. **Template Marketplace**: Centralized template repository

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the Clean Architecture principles
4. Add comprehensive tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: dev@appanysite.com
- Documentation: https://docs.appanysite.com
