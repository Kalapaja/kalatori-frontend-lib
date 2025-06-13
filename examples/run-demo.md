# 🚀 Running the Kalatori Examples

Here are several ways to run and test the examples:

## Quick Start (Recommended)

### 1. Build the Library First
```bash
# In the main project directory
cd /Users/vovke/Projects/Kalatori/kalatori-frontend-lib
yarn build
```

### 2. Set Up Demo Project
```bash
# Navigate to the demo directory
cd examples/quick-start-demo

# Install dependencies
yarn install

# Copy the example components to src directory
cp ../opencart-style-payment.tsx src/opencart-style-payment.tsx
cp ../admin-configuration.tsx src/admin-configuration.tsx

# Start the development server
yarn start
```

The demo will open at `http://localhost:3000` with:
- 🔧 **Admin Configuration**: Test daemon connection and currency setup
- 💳 **Payment Flow Demo**: Complete payment process with staging API

## Alternative: Next.js Setup

### 1. Create Next.js Project
```bash
npx create-next-app@latest kalatori-demo --typescript --tailwind --eslint
cd kalatori-demo
```

### 2. Install Kalatori Library
```bash
# Install from local build
yarn add file:../kalatori-frontend-lib

# Or install from npm (when published)
# yarn add @kalatori/frontend-lib
```

### 3. Create Demo Pages
```bash
# Create pages
mkdir pages/examples
cp ../examples/opencart-style-payment.tsx pages/examples/payment.tsx
cp ../examples/admin-configuration.tsx pages/examples/admin.tsx
```

### 4. Run Development Server
```bash
yarn dev
# Visit http://localhost:3000/examples/payment
```

## Testing Features

### 🔧 Admin Configuration Test
1. Click "Admin Configuration" 
2. Enter daemon URL: `https://api.staging.reloket.com`
3. Click "Test Connection"
4. See supported currencies and toggle them
5. Save configuration

### 💳 Payment Flow Test
1. Click "Payment Flow Demo"
2. Select currency (DOT, USDC, or USDt) 
3. Click "Confirm Payment"
4. Watch real-time monitoring
5. See payment status updates

### 🐛 Error Testing
- Try invalid daemon URL to see error handling
- Test with no currency selected
- Watch timeout behavior (shortened for demo)

## Integration in Your App

### React Component Usage
```tsx
import { OpenCartStylePayment } from '@kalatori/frontend-lib';

function CheckoutPage() {
  return (
    <OpenCartStylePayment
      shopName="MyStore"
      daemonUrl="https://api.staging.reloket.com"
      allowedCurrencies={['DOT', 'USDC']}
      orderId="order-123"
      orderTotal={29.99}
      orderCurrency="USD"
      onSuccess={(orderStatus) => {
        // Handle success - redirect to confirmation
        window.location.href = '/order-confirmation';
      }}
      onCancel={() => {
        // Handle cancellation
        window.location.href = '/checkout';
      }}
    />
  );
}
```

### Hook Usage
```tsx
import { useKalatoriPayment } from '@kalatori/frontend-lib';

function CustomPayment() {
  const {
    order,
    isCompleted,
    error,
    createOrder
  } = useKalatoriPayment({
    clientConfig: {
      baseUrl: 'https://api.staging.reloket.com',
      mode: 'embedded'
    }
  });

  // Your custom implementation
}
```

## Environment Configuration

### Development (Staging)
```typescript
const config = {
  daemonUrl: 'https://api.staging.reloket.com',
  allowedCurrencies: ['DOT', 'USDC', 'USDt'],
  shopName: 'DemoStore'
};
```

### Production
```typescript
const config = {
  daemonUrl: 'https://api.yourdomain.com',
  allowedCurrencies: ['DOT', 'USDC'], // Configure as needed
  shopName: 'YourStore'
};
```

## Troubleshooting

### Common Issues

**1. Library not found**
```bash
# Make sure you built the library first
cd /Users/vovke/Projects/Kalatori/kalatori-frontend-lib
yarn build
```

**2. Import errors**
```bash
# Check that files are copied correctly
ls examples/quick-start-demo/src/
# Should show opencart-style-payment.tsx and admin-configuration.tsx
```

**3. API connection issues**
- Check daemon URL is correct
- Verify CORS settings if using direct mode
- Use browser dev tools to inspect network requests

**4. TypeScript errors**
```bash
# Ensure React types are installed
yarn add @types/react @types/react-dom
```

### Development Tips

1. **Use browser dev tools** to inspect API calls
2. **Check console logs** for payment status updates  
3. **Test error scenarios** by using invalid URLs
4. **Monitor network tab** to see real API requests

## Next Steps

1. **Customize styling** to match your brand
2. **Add your own error handling** logic
3. **Integrate with your backend** API
4. **Configure production daemon** URL
5. **Test with real Polkadot accounts** (testnet first!)

The examples provide a complete foundation for integrating Kalatori payments into any React application with the same proven patterns used in the OpenCart 3 extension.