# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a TypeScript library for integrating Kalatori daemon into websites. Kalatori is a non-custodial Polkadot payments gateway that derives unique payment addresses for each order and monitors blockchain transactions.

## Library Architecture

The library should provide TypeScript interfaces and client implementations for both integration modes:

### Embedded Mode Integration
- Client communicates with shop backend
- Shop backend proxies requests to Kalatori daemon
- Suitable for server-side rendered applications

### Offsite Mode Integration  
- Client communicates directly with daemon via `/public/v2` endpoints
- Requires CORS configuration on daemon
- Suitable for static frontends and SPAs

## Key API Endpoints (from kalatori.yaml)

### Private Endpoints (via shop backend)
- `POST /v2/order/{orderId}` - Create/update orders with amount, currency, callback
- `POST /v2/order/{orderId}/forceWithdrawal` - Force withdrawal for complex payments
- `GET /v2/status` - Get daemon configuration and supported currencies
- `GET /v2/health` - Check RPC endpoint connectivity

### Public Endpoints (direct from frontend)
- `POST /public/v2/payment/{paymentAccount}` - Get order status by payment address
- Excludes sensitive callback URLs for security

## TypeScript Types to Generate

Based on the OpenAPI spec, the library should include:

- `OrderStatus` - Complete order state with payment/withdrawal status
- `CurrencyInfo` - Currency details (chain, decimals, RPC URL, asset ID)
- `TransactionInfo` - On-chain transaction details
- `ServerInfo` - Daemon version and instance information
- `ServerStatus` & `ServerHealth` - Configuration and connectivity status

## Payment Flow Implementation

1. **Order Creation**: Call `/v2/order/{orderId}` with amount/currency to get `payment_account`
2. **Status Monitoring**: Poll `/public/v2/payment/{paymentAccount}` for transaction updates
3. **Completion Handling**: Watch for `payment_status: "paid"` and `redirect_url` for user flow

## Integration Patterns

- **React Hooks**: For payment status polling and state management
- **Event Emitters**: For real-time payment status updates
- **Promise-based API**: For order creation and status queries
- **Error Handling**: For network issues and payment failures

## Development Commands

- `yarn build` - Build the library
- `yarn test` - Run tests  
- `yarn lint` - Check code style
- `yarn typecheck` - Verify TypeScript types