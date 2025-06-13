#!/bin/bash

# Kalatori Frontend Library Demo Setup Script
echo "🚀 Setting up Kalatori Frontend Library Demo..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the kalatori-frontend-lib root directory"
    exit 1
fi

# Step 1: Build the library
echo "📦 Building the library..."
yarn build

if [[ $? -ne 0 ]]; then
    echo "❌ Error: Failed to build the library"
    exit 1
fi

echo "✅ Library built successfully"

# Step 2: Set up demo project
echo "🏗️ Setting up demo project..."
cd examples/quick-start-demo

# Install dependencies
echo "📥 Installing demo dependencies..."
yarn install

if [[ $? -ne 0 ]]; then
    echo "❌ Error: Failed to install demo dependencies"
    exit 1
fi

# Copy example components
echo "📋 Copying example components..."
cp ../opencart-style-payment.tsx src/opencart-style-payment.tsx
cp ../admin-configuration.tsx src/admin-configuration.tsx

echo "✅ Demo setup complete!"
echo ""
echo "🎉 To start the demo:"
echo "   cd examples/quick-start-demo"
echo "   yarn start"
echo ""
echo "📖 Or follow the full guide in examples/run-demo.md"