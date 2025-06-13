# 🚀 Kalatori Payment Demo

A clean, working demo showing how to integrate with the Kalatori payment system.

## Quick Setup

```bash
# From the examples/quick-start-demo directory:
yarn install
yarn start
```

## Features

- ✅ **Daemon Connection** - Tests connectivity to Kalatori daemon
- 💳 **Order Creation** - Creates payment orders with USDC
- 📊 **Payment Monitoring** - Real-time status polling
- 🔄 **Complete Flow** - Full payment process from start to finish

## What the Demo Shows

### 1. Connection Test
- Connects to `https://api.staging.reloket.com`
- Shows daemon version and supported currencies
- Tests the `/v2/status` endpoint

### 2. Payment Flow
- Create orders with custom amount in USDC
- Real order creation using `/v2/order/{orderId}` endpoint
- Payment monitoring via `/public/v2/payment/{paymentAccount}`
- Real-time status updates every 3 seconds

### 3. Real API Integration
- Uses the actual Kalatori staging environment
- Direct API calls with native `fetch()`
- No mocked responses - everything is real

## How It Works

The demo creates a simple client that:
1. Tests daemon connectivity
2. Creates payment orders
3. Monitors payment status
4. Shows real-time updates

This demonstrates the core patterns you'll use in your own integration.