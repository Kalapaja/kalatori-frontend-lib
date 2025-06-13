# OpenCart-Style Integration Guide

This guide shows how to integrate Kalatori payments using the same patterns and design as the OpenCart 3 extension.

## Architecture Overview

The integration follows the OpenCart 3 extension patterns:

1. **Configuration Phase**: Admin sets up daemon URL and currencies
2. **Payment Flow**: Multi-step process with real-time monitoring  
3. **Order Management**: Structured order ID format and status tracking
4. **Error Handling**: Clear error states and recovery options

## Components

### 1. Admin Configuration Component

```tsx
import AdminConfiguration from './admin-configuration';

function AdminPanel() {
  return <AdminConfiguration />;
}
```

**Features:**
- Daemon connection testing (like `kalatori_test()`)
- Currency selection with toggle buttons
- Real-time validation and feedback
- Configuration summary display

### 2. Payment Flow Component

```tsx
import OpenCartStylePayment from './opencart-style-payment';

function CheckoutPage() {
  return (
    <OpenCartStylePayment
      shopName="MyStore"
      daemonUrl="https://api.staging.reloket.com"
      allowedCurrencies={['DOT', 'USDC', 'USDt']}
      orderId="12345"
      orderTotal={29.99}
      orderCurrency="USD"
      onSuccess={(orderStatus) => {
        console.log('Payment completed:', orderStatus);
        // Redirect to success page
      }}
      onCancel={() => {
        // Handle cancellation
        window.location.href = '/checkout';
      }}
    />
  );
}
```

## Payment Flow Breakdown

### Step 1: Initialization
```typescript
// Check daemon status (like OpenCart's kalatori_test)
const { status, isHealthy } = useDaemonStatus(client, {
  refreshInterval: 0, // One-time check
  enabled: true
});
```

### Step 2: Currency Selection
```typescript
// Validate allowed currencies against daemon capabilities
const supportedCurrencies = Object.keys(daemonStatus.supported_currencies);
const validCurrencies = allowedCurrencies.filter(cur => 
  supportedCurrencies.includes(cur)
);
```

### Step 3: Order Creation
```typescript
// Create order with OpenCart-style format
const orderApiId = `oc3_${shopName ? shopName + '_' : ''}${orderId}`;

const result = await createOrder(orderApiId, {
  amount: orderTotal,
  currency: selectedCurrency
});
```

### Step 4: Payment Monitoring
```typescript
// Real-time monitoring like DOT.js
const { isMonitoring, attempts, isCompleted } = usePaymentMonitoring(
  client, 
  paymentAccount, 
  {
    interval: 5000,     // 5 second polling
    maxAttempts: 120,   // 10 minute timeout
    autoStart: true
  }
);
```

## Configuration Patterns

### Backend Configuration (matching OpenCart PHP)

```typescript
interface KalatoriConfig {
  // Required settings
  shopName: string;           // payment_polkadot_shopname
  daemonUrl: string;          // payment_polkadot_engineurl  
  allowedCurrencies: string[]; // payment_polkadot_currences
  orderStatusId: string;      // payment_polkadot_order_status_id
  enabled: boolean;           // payment_polkadot_status
}
```

### Order ID Format
Following OpenCart convention:
```typescript
const orderApiId = `oc3_${shopName}_${orderId}`;
// Example: "oc3_MyStore_12345"
```

### Status Polling
Matching the OpenCart polling pattern:
```typescript
const pollOrderStatus = async () => {
  try {
    const response = await client.getOrderStatus(orderApiId);
    
    if (response.data.payment_status === 'paid') {
      // Payment confirmed - redirect to success
      window.location.href = '/checkout/success';
    } else if (response.data.payment_status === 'pending') {
      // Continue monitoring
      setTimeout(pollOrderStatus, 5000);
    }
  } catch (error) {
    // Handle error
    console.error('Polling error:', error);
  }
};
```

## Error Handling

### Connection Errors
```typescript
if (daemonError || !isHealthy) {
  return (
    <div className="alert alert-danger">
      Payment gateway is not available. Please try again later.
    </div>
  );
}
```

### Payment Errors
```typescript
if (paymentError) {
  return (
    <div className="alert alert-danger">
      <strong>Error:</strong> {paymentError.message}
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```

### Timeout Handling
```typescript
if (isTimedOut) {
  return (
    <div className="alert alert-warning">
      Payment timeout. Please check your transaction or try again.
    </div>
  );
}
```

## Styling

The components use inline styles matching OpenCart's Bootstrap-like classes:

```typescript
const styles = {
  alertSuccess: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724',
    // ... matches Bootstrap .alert-success
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb', 
    color: '#721c24',
    // ... matches Bootstrap .alert-danger
  }
};
```

## Integration with Backend

### API Endpoint Structure
Following OpenCart's controller pattern:

```typescript
// Status check endpoint
GET /api/kalatori/status
// Response: ServerStatus

// Order management endpoint  
POST /api/kalatori/order/:orderId
// Body: { amount: number, currency: string }
// Response: OrderStatus

// Payment monitoring endpoint
GET /api/kalatori/payment/:paymentAccount
// Response: OrderStatus (without callback)
```

### Callback Handling
For server-side order updates:

```typescript
// Webhook endpoint (like OpenCart's callback())
POST /api/kalatori/callback
// Body: { order: string, payment_status: string, ... }
// Updates order status in database
```

## Testing

### Local Development
```bash
# Use staging daemon
const config = {
  daemonUrl: 'https://api.staging.reloket.com',
  allowedCurrencies: ['DOT', 'USDC', 'USDt']
};
```

### Production Setup
```bash
# Use your production daemon
const config = {
  daemonUrl: 'https://api.yourdomain.com',
  allowedCurrencies: ['DOT', 'USDC'] // Configure as needed
};
```

## Security Considerations

1. **Never expose daemon URL directly** - Use backend proxy like OpenCart
2. **Validate currencies** - Check against daemon's supported currencies
3. **Order ID format** - Use consistent prefixing to avoid conflicts
4. **Timeout handling** - Implement reasonable timeouts (10 minutes)
5. **Error logging** - Log errors for debugging but don't expose internals

## Migration from OpenCart

If migrating from the OpenCart 3 extension:

1. **Keep the same order ID format** (`oc3_shopname_orderid`)
2. **Use the same polling intervals** (5 seconds)
3. **Maintain the same timeout logic** (120 attempts = 10 minutes)
4. **Preserve the same currency validation**
5. **Keep the same success/error flow**

This ensures a smooth transition while gaining TypeScript safety and React integration.