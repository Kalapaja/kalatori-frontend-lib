# 🚨 Quick Fix for Demo Issues

If you're getting import errors, here's the quick fix:

## Step 1: Copy Files to Correct Location

```bash
# From the examples/quick-start-demo directory:
cp ../opencart-style-payment.tsx src/opencart-style-payment.tsx
cp ../admin-configuration.tsx src/admin-configuration.tsx
```

## Step 2: Verify the Files Are There

```bash
ls src/
# Should show:
# - App.tsx
# - opencart-style-payment.tsx  ← This file
# - admin-configuration.tsx     ← This file
# - index.tsx
# - etc...
```

## Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C) and restart:
yarn start
```

## Alternative: Clean Setup

If you're still having issues, try a clean setup:

```bash
# Go back to the library root
cd /Users/vovke/Projects/Kalatori/kalatori-frontend-lib

# Run the setup script
./examples/setup-demo.sh

# Start the demo
cd examples/quick-start-demo
yarn start
```

## Manual Component Installation

If the automated script doesn't work, you can manually set up:

```bash
# 1. Build library
yarn build

# 2. Set up demo
cd examples/quick-start-demo
yarn install

# 3. Copy components manually
cp ../opencart-style-payment.tsx src/
cp ../admin-configuration.tsx src/

# 4. Fix imports in src/App.tsx to use relative paths:
# Change: import OpenCartStylePayment from '../opencart-style-payment';
# To:     import OpenCartStylePayment from './opencart-style-payment';

# 5. Start demo
yarn start
```

The key issue was that Create React App doesn't allow imports from outside the `src/` directory, so we need to copy the example files into the `src/` folder.