# Architecture Overview - AAS Core AppGen

## System Architecture Diagram

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
    
    %% Utilities
    ERROR_HANDLER[ErrorHandler<br/>Error Management<br/>Context-aware Error Reporting]
    LOGGER[Logger<br/>High-performance Logging<br/>Environment-based Configuration]
    CONFIG[Config<br/>Environment Configuration<br/>Performance Tuning]
    
    %% Dependency Injection
    DI_CONTAINER[DIContainer<br/>Service Registration<br/>Dependency Resolution<br/>Singleton Management]
    
    %% External Dependencies
    COOKIECUTER[cookiecutter<br/>External Tool<br/>Template Processing]
    FILE_SYSTEM[File System<br/>Configuration Files<br/>Template Files<br/>Generated Projects]
    
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
    
    %% DI Container Connections
    DI_CONTAINER --> CREATE_CMD
    DI_CONTAINER --> ERROR_HANDLER
    DI_CONTAINER --> LOGGER
    DI_CONTAINER --> CONFIG
    
    %% External Dependencies
    EXECUTOR_REPO --> COOKIECUTER
    CONFIG_REPO --> FILE_SYSTEM
    TEMPLATE_REPO --> FILE_SYSTEM
    
    %% Styling
    classDef entryPoint fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef commandLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef applicationLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef domainLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef infrastructureLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef utilityLayer fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef externalLayer fill:#fafafa,stroke:#424242,stroke-width:2px
    
    class MAIN entryPoint
    class CREATE_CMD commandLayer
    class APP_SERVICE applicationLayer
    class APP_CONFIG,I_CONFIG_REPO,I_TEMPLATE_REPO,I_EXECUTOR_REPO domainLayer
    class CONFIG_REPO,TEMPLATE_REPO,EXECUTOR_REPO infrastructureLayer
    class ERROR_HANDLER,LOGGER,CONFIG,DI_CONTAINER utilityLayer
    class COOKIECUTER,FILE_SYSTEM externalLayer
```

## Architecture Layers

### 1. **Entry Point Layer**
- **main.js**: CLI entry point with command parsing and error handling

### 2. **Command Layer**
- **CreateCommand**: Handles CLI command execution and option validation

### 3. **Application Layer**
- **AppGenerationService**: Orchestrates the entire app generation process

### 4. **Domain Layer**
- **AppConfig**: Business entity with validation and business rules
- **Repository Interfaces**: Contracts for data access operations

### 5. **Infrastructure Layer**
- **Repository Implementations**: Concrete implementations of data access
- **ConfigRepository**: File-based configuration management
- **TemplateRepository**: Template discovery and management
- **ExecutorRepository**: External command execution

### 6. **Utility Layer**
- **ErrorHandler**: Comprehensive error management
- **Logger**: High-performance logging
- **Config**: Environment-based configuration
- **DIContainer**: Dependency injection management

### 7. **External Dependencies**
- **cookiecutter**: External tool for template processing
- **File System**: Configuration files, templates, and generated projects

## Design Principles

- **Clean Architecture**: Clear separation of concerns
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each class has one clear purpose
- **Interface Segregation**: Clients depend only on interfaces they use
- **Performance Optimization**: Caching, parallel operations, and O(1) lookups
