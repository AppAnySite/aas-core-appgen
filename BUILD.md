# Build Process for AAS Core AppGen

## Overview

This document explains the build process for AAS Core AppGen, which uses a template-cloning approach to avoid TypeScript compilation issues.

## Build Steps

### 1. Clean Build Environment
```bash
# Remove existing template directory
rm -rf .template
```

### 2. Build with ncc
```bash
# Build the application without template files
ncc build index.js -o build/lib
```

### 3. Clone Template from GitHub
```bash
# Clone the template from the official repository
git clone https://github.com/AppAnySite/aas-app-template.git .template
```

### 4. Test the Build
```bash
# Test the built application
node build/lib/index.js create --config-file /path/to/app-config.json
```

## Build Scripts

### Manual Build Process
```bash
# Complete build process
rm -rf .template
ncc build index.js -o build/lib
git clone https://github.com/AppAnySite/aas-app-template.git .template
```

### Manual Build Process (Recommended)
```bash
# Complete build process - run these commands manually
rm -rf .template
ncc build index.js -o build/lib
git clone https://github.com/AppAnySite/aas-app-template.git .template

# Test the build
node build/lib/index.js create --config-file /path/to/app-config.json
```

### Using npm scripts
```bash
# Shows the manual commands to run
npm run build
```

## Why This Approach?

1. **Avoids TypeScript Issues**: By removing the template during build, we avoid ncc trying to compile TypeScript files
2. **Clean Separation**: Template is managed separately from the application code
3. **Version Control**: Template can be updated independently via git
4. **Flexibility**: Different template versions can be used for different builds

## Template Management

The template is cloned from the official GitHub repository:
- **Repository**: https://github.com/AppAnySite/aas-app-template.git
- **Local Path**: `.template/`
- **Update Command**: `git pull` in the `.template/` directory

## Notes

- The pkg build has ES module compatibility issues and is not used
- The ncc build works perfectly for deployment
- Template cloning ensures the latest version is always used
- For deployment, use the ncc build output directly
