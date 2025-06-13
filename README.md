# @kalatori/frontend-lib

TypeScript library for integrating Kalatori payment gateway into websites. Kalatori is a non-custodial Polkadot payments gateway that derives unique payment addresses for each order and monitors blockchain transactions.

## Features

- 🔒 **Non-custodial**: Payments go directly to your wallet, no intermediaries
- 🌐 **Polkadot ecosystem**: Support for DOT, USDC, USDt, and other Substrate assets
- ⚛️ **React hooks**: Ready-to-use hooks for seamless React integration
- 🔄 **Real-time monitoring**: Event-driven payment status updates
- 📱 **Dual integration modes**: Embedded (via backend) and offsite (direct) support
- 🛡️ **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🔧 **Framework agnostic**: Core client works with any JavaScript framework

## Installation

```bash
npm install @kalatori/frontend-lib
# or
yarn add @kalatori/frontend-lib
```

For React usage, ensure you have React 16.8+ installed:

```bash
npm install react@^16.8.0
```

## Quick Start

### React Hook Usage (Recommended)

```tsx
import React from 'react';
import { useKalatoriPayment } from '@kalatori/frontend-lib';

function PaymentComponent() {
  const {
    order,
    isCompleted,
    error,
    createOrder,
    startMonitoring
  } = useKalatoriPayment({
    clientConfig: {
      baseUrl: 'https://api.your-daemon.com',
      mode: 'embedded'
    },
    autoStartMonitoring: true,
    onPaymentComplete: (update) => {
      console.log('Payment completed!', update);
    }
  });

  const handleCreateOrder = async () => {
    await createOrder('order-123', {
      amount: 10,
      currency: 'DOT'
    });
  };

  return (
    <div>
      {!order ? (
        <button onClick={handleCreateOrder}>
          Create Payment
        </button>
      ) : (
        <div>
          <p>Payment Account: {order.payment_account}</p>
          <p>Status: {order.payment_status}</p>
          {isCompleted && <p>✅ Payment Completed!</p>}
        </div>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Core Client Usage

```typescript
import { KalatoriClient } from '@kalatori/frontend-lib';

const client = new KalatoriClient({
  baseUrl: 'https://api.your-daemon.com',
  mode: 'embedded'
});

// Create an order
const order = await client.createOrder('order-123', {
  amount: 10,
  currency: 'DOT'
});

// Monitor payment status
client.startPaymentMonitoring(order.payment_account, {
  onUpdate: (update) => console.log('Payment update:', update),
  onComplete: (update) => console.log('Payment completed:', update)
});
```

## Integration Modes

### Embedded Mode

In embedded mode, your frontend communicates with your backend, which proxies requests to the Kalatori daemon. This is suitable for server-side rendered applications and provides additional security.

```typescript
const config = {
  baseUrl: 'https://your-backend.com/api/kalatori',
  mode: 'embedded' as const
};
```

### Offsite Mode

In offsite mode, your frontend communicates directly with the Kalatori daemon via public endpoints. This requires CORS configuration on the daemon and is suitable for static frontends and SPAs.

```typescript
const config = {
  baseUrl: 'https://kalatori-daemon.com',
  mode: 'offsite' as const
};
```

## React Hooks API

### useKalatoriPayment

Comprehensive hook for end-to-end payment flow management.

```tsx
const {
  order,           // Created order data
  paymentStatus,   // Current payment status
  isCompleted,     // Payment completion state
  isMonitoring,    // Monitoring state
  error,           // Error state
  createOrder,     // Create order function
  startMonitoring, // Start monitoring function
  stopMonitoring,  // Stop monitoring function
  reset            // Reset all states
} = useKalatoriPayment({
  clientConfig: {
    baseUrl: 'https://api.example.com',
    mode: 'embedded'
  },
  autoStartMonitoring: true,
  onPaymentUpdate: (update) => console.log(update),
  onPaymentComplete: (update) => console.log(update)
});
```

### useOrderStatus

Hook for tracking order status with automatic refresh.

```tsx
const {
  data,        // Order status data
  loading,     // Loading state
  error,       // Error state
  refresh,     // Manual refresh function
  clearError   // Clear error function
} = useOrderStatus(client, orderId, {
  refreshInterval: 5000,  // Auto-refresh interval
  enabled: true           // Enable/disable hook
});
```

### usePaymentMonitoring

Hook for real-time payment monitoring.

```tsx
const {
  status,          // Current payment status
  isMonitoring,    // Monitoring state
  isCompleted,     // Completion state
  attempts,        // Number of polling attempts
  startMonitoring, // Start monitoring function
  stopMonitoring   // Stop monitoring function
} = usePaymentMonitoring(client, paymentAccount, {
  interval: 5000,
  maxAttempts: 120,
  autoStart: true
});
```

### useCreateOrder

Hook for creating and updating orders.

```tsx
const {
  data,        // Created order data
  loading,     // Creation loading state
  error,       // Error state
  createOrder, // Create order function
  updateOrder, // Update order function
  reset        // Reset state function
} = useCreateOrder(client);
```

### useDaemonStatus

Hook for monitoring daemon health and configuration.

```tsx
const {
  status,      // Server status
  health,      // Server health
  loading,     // Loading state
  error,       // Error state
  isHealthy,   // Health check result
  refresh      // Manual refresh function
} = useDaemonStatus(client, {
  refreshInterval: 30000,
  includeHealth: true
});
```

## Core Client API

### Order Management

```typescript
// Create order
const response = await client.createOrder('order-123', {
  amount: 10,
  currency: 'DOT',
  callback: 'https://yoursite.com/webhook'
});

// Get order status
const status = await client.getOrderStatus('order-123');

// Update order
const updated = await client.updateOrder('order-123', {
  amount: 15
});

// Force withdrawal
const forced = await client.forceWithdrawal('order-123');
```

### Payment Monitoring

```typescript
// Start monitoring (returns a promise that resolves when payment completes)
await client.startPaymentMonitoring(paymentAccount, {
  interval: 5000,
  maxAttempts: 120,
  onUpdate: (update) => console.log('Payment update:', update),
  onComplete: (update) => console.log('Payment completed:', update)
});

// Get payment status via public endpoint
const paymentStatus = await client.getPaymentStatus(paymentAccount);
```

### Daemon Status

```typescript
// Get daemon configuration
const status = await client.getStatus();
console.log('Supported currencies:', status.supported_currencies);

// Check daemon health
const health = await client.getHealth();
console.log('RPC endpoints:', health.connected_rpcs);
```

## Event System

The KalatoriClient extends EventEmitter and emits the following events:

```typescript
client.on('payment:update', (update) => {
  console.log('Payment updated:', update);
});

client.on('payment:final', (update) => {
  console.log('Payment finalized:', update);
});

client.on('payment:error', ({ paymentAccount, error }) => {
  console.log('Payment error:', error);
});

client.on('monitoring:started', ({ paymentAccount }) => {
  console.log('Started monitoring:', paymentAccount);
});

client.on('monitoring:stopped', ({ paymentAccount, reason }) => {
  console.log('Stopped monitoring:', paymentAccount, reason);
});
```

## Error Handling

All methods throw `KalatoriError` with additional context:

```typescript
try {
  await client.createOrder('order-123', { amount: 10, currency: 'DOT' });
} catch (error) {
  if (error instanceof KalatoriError) {
    console.log('Status:', error.status);
    console.log('Errors:', error.errors); // API validation errors
    console.log('Response:', error.response); // Original response
  }
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import {
  KalatoriClient,
  OrderStatus,
  CreateOrderRequest,
  PaymentStatusUpdate,
  KalatoriClientConfig
} from '@kalatori/frontend-lib';
```

## Supported Currencies

The library supports all currencies configured in your Kalatori daemon:

- **DOT** - Polkadot native token
- **USDC** - USD Coin on Statemint
- **USDt** - Tether USD on Statemint
- **Custom assets** - Any asset configured in your daemon

## Configuration

### Client Configuration

```typescript
interface KalatoriClientConfig {
  baseUrl: string;           // Daemon or backend URL
  mode: 'embedded' | 'offsite'; // Integration mode
  timeout?: number;          // Request timeout (default: 30000ms)
  headers?: Record<string, string>; // Additional headers
}
```

### Payment Monitoring Options

```typescript
interface PaymentMonitoringOptions {
  interval?: number;         // Polling interval (default: 5000ms)
  maxAttempts?: number;      // Max polling attempts (default: 120)
  autoStart?: boolean;       // Auto-start monitoring (default: false)
  onUpdate?: (update: PaymentStatusUpdate) => void;
  onComplete?: (update: PaymentStatusUpdate) => void;
  onTimeout?: () => void;
}
```

## Examples

Check the `/examples` directory for complete implementation examples:

- `examples/react-payment.tsx` - Complete React payment component
- `examples/opencart-style-payment.tsx` - OpenCart-style payment flow
- `examples/admin-configuration.tsx` - Admin configuration panel
- `examples/quick-start-demo/` - Complete runnable demo app

### 🚀 Try the Live Demo

```bash
# Build the library
yarn build

# Run the demo
cd examples/quick-start-demo
yarn install
cp ../opencart-style-payment.tsx src/opencart-style-payment.tsx
cp ../admin-configuration.tsx src/admin-configuration.tsx
yarn start
```

Visit `http://localhost:3000` to try:
- 🔧 Admin configuration with daemon testing
- 💳 Complete payment flow with real API integration
- 🐛 Error handling and recovery scenarios

See `examples/run-demo.md` for detailed setup instructions.

## Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Build library
yarn build

# Type checking
yarn typecheck

# Linting
yarn lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/kalatori/kalatori-frontend-lib/issues)
- [Documentation](https://docs.kalatori.com)
- [Discord Community](https://discord.gg/kalatori)

---

Made with ❤️ by the Kalatori team