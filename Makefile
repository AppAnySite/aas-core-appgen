# AAS Core AppGen Makefile
# High-performance CLI tool for generating React Native apps

.PHONY: help build clean test install-deps

# Default target
help:
	@echo "AAS Core AppGen - Available targets:"
	@echo "  build     - Build the application (remove template, ncc build, clone template)"
	@echo "  clean     - Clean build artifacts and template"
	@echo "  test      - Test the built application"
	@echo "  install   - Install dependencies"
	@echo "  help      - Show this help message"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

# Clean build artifacts and template
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf build/
	rm -rf .template/
	@echo "✅ Clean completed"

# Build the application
build: clean
	@echo "🔨 Building application..."
	@echo "📦 Running ncc build..."
	ncc build index.js -o build/lib
	@echo "📁 Cloning template..."
	git clone https://github.com/AppAnySite/aas-app-template.git .template
	@echo "✅ Build completed successfully!"

# Test the built application
test: build
	@echo "🧪 Testing application..."
	@echo "Testing with sample config..."
	node build/lib/index.js create --config-file /Users/hvetagir/Documents/aas-app-template/hooks/source/app-config.json
	@echo "✅ Test completed successfully!"

# Quick build (without cleaning)
quick-build:
	@echo "⚡ Quick build (without cleaning)..."
	@echo "📦 Running ncc build..."
	ncc build index.js -o build/lib
	@echo "✅ Quick build completed!"

# Update template only
update-template:
	@echo "🔄 Updating template..."
	rm -rf .template/
	git clone https://github.com/AppAnySite/aas-app-template.git .template
	@echo "✅ Template updated successfully!"

# Development build with verbose output
dev-build: clean
	@echo "🔨 Development build with verbose output..."
	@echo "📦 Running ncc build..."
	NODE_OPTIONS="--openssl-legacy-provider" ncc build index.js -o build/lib
	@echo "📁 Cloning template..."
	git clone https://github.com/AppAnySite/aas-app-template.git .template
	@echo "✅ Development build completed successfully!"

# Show build info
info:
	@echo "📋 Build Information:"
	@echo "  Node.js version: $(shell node --version)"
	@echo "  npm version: $(shell npm --version)"
	@echo "  ncc version: $(shell npx ncc --version 2>/dev/null || echo 'Not installed')"
	@echo "  Template exists: $(shell test -d .template && echo 'Yes' || echo 'No')"
	@echo "  Build exists: $(shell test -d build/lib && echo 'Yes' || echo 'No')"

# Full development setup
setup: install build test
	@echo "🎉 Full development setup completed!"
	@echo "You can now use: node build/lib/index.js create --config-file app-config.json"
