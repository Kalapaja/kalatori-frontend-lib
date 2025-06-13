# 🧪 Testing Kalatori Integration

## How to Verify It Really Works

### 1. **Test with Working Daemon**

The most reliable way is to test against a working Kalatori daemon:

```bash
# Option A: Run your own local daemon
docker run -p 8080:8080 kalatori/daemon:latest

# Option B: Use a different staging environment
# Update the API URL in PaymentDemo.tsx to point to your daemon
```

### 2. **Check Real API Responses**

Monitor browser DevTools Network tab to see actual API calls:

```javascript
// Look for these endpoints in Network tab:
GET /v2/status           // Daemon info & currencies
POST /v2/order/{id}      // Order creation  
POST /public/v2/payment/{account}  // Payment status
```

### 3. **Test with Real Polkadot Testnet**

For full end-to-end testing:

1. **Get testnet tokens** from Polkadot/Kusama faucets
2. **Configure daemon** to use testnet endpoints
3. **Send actual test payments** to the generated payment accounts
4. **Verify blockchain transactions** on block explorers

### 4. **Integration Tests**

Run the existing integration tests:

```bash
# From project root
npm test src/client/KalatoriClient.test.ts
```

### 5. **Manual API Testing**

Test the staging API directly when it's available:

```bash
# Check daemon status
curl https://api.staging.reloket.com/v2/status

# Create test order
curl -X POST https://api.staging.reloket.com/v2/order/test123 \
  -H "Content-Type: application/json" \
  -d '{"amount": 1.0, "currency": "USDC"}'

# Check payment status
curl -X POST https://api.staging.reloket.com/public/v2/payment/{payment_account}
```

### 6. **Verify Mock Data Accuracy**

The mock data in the demo uses real response formats from the OpenAPI spec:

- Check `src/types/index.ts` for TypeScript interfaces
- Compare mock responses with actual API documentation
- Verify field names, types, and structure match exactly

### 7. **Test Error Handling**

Intentionally break things to test error handling:

```javascript
// In PaymentDemo.tsx, test with:
- Invalid currency codes
- Malformed order IDs  
- Network timeouts
- Invalid amounts
```

### 8. **Production Readiness Checklist**

- [ ] Environment variables for daemon URLs
- [ ] Proper error handling and user feedback
- [ ] Payment timeout handling
- [ ] Transaction confirmation requirements
- [ ] Security: no secrets in frontend code
- [ ] Rate limiting for API calls
- [ ] Proper loading states and UX

## Current Demo Status

🟡 **Mock Mode**: Staging API is down, using realistic mock data
🟢 **Ready for Real Testing**: Will automatically use real API when available
✅ **Integration Patterns**: Shows correct API usage and data flow

## Next Steps

1. **Wait for staging API** to come back online
2. **Test with local daemon** for immediate verification  
3. **Run integration tests** against working endpoint
4. **Deploy to testnet** for full blockchain testing