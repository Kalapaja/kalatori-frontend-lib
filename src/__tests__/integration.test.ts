import { KalatoriClient } from '../client/KalatoriClient';
import { KalatoriClientConfig } from '../types';

describe('Kalatori Integration Tests', () => {
  let client: KalatoriClient;
  
  beforeAll(() => {
    const config: KalatoriClientConfig = {
      baseUrl: 'https://api.staging.reloket.com',
      mode: 'embedded',
      timeout: 10000
    };
    client = new KalatoriClient(config);
  });

  describe('Daemon Status', () => {
    test('should get daemon status', async () => {
      const response = await client.getStatus();
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('server_info');
      expect(response.data).toHaveProperty('supported_currencies');
      expect(response.data.server_info).toHaveProperty('version');
      expect(response.data.server_info).toHaveProperty('instance_id');
      
      // Check for expected currencies from our earlier API test
      expect(response.data.supported_currencies).toHaveProperty('DOT');
      expect(response.data.supported_currencies).toHaveProperty('USDC');
      expect(response.data.supported_currencies).toHaveProperty('USDt');
    }, 10000);

    test('should get daemon health', async () => {
      const response = await client.getHealth();
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('server_info');
      expect(response.data).toHaveProperty('connected_rpcs');
      expect(response.data).toHaveProperty('status');
      expect(Array.isArray(response.data.connected_rpcs)).toBe(true);
      expect(response.data.connected_rpcs.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Order Management', () => {
    const testOrderId = `test-order-${Date.now()}`;

    test('should create a new order', async () => {
      const orderRequest = {
        amount: 1.0,
        currency: 'DOT'
      };

      const response = await client.createOrder(testOrderId, orderRequest);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('order', testOrderId);
      expect(response.data).toHaveProperty('payment_account');
      expect(response.data).toHaveProperty('amount', 1.0);
      expect(response.data).toHaveProperty('currency');
      expect(response.data.currency.currency).toBe('DOT');
      expect(response.data.payment_status).toBe('pending');
      expect(response.data.withdrawal_status).toBe('waiting');
    }, 10000);

    test('should get order status', async () => {
      const response = await client.getOrderStatus(testOrderId);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('order', testOrderId);
      expect(response.data).toHaveProperty('payment_account');
      expect(response.data.payment_status).toBe('pending');
    }, 10000);

    test('should get payment status via public endpoint', async () => {
      // First get the order to extract payment account
      const orderResponse = await client.getOrderStatus(testOrderId);
      const paymentAccount = orderResponse.data.payment_account;

      // Retry logic for potentially flaky API
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          response = await client.getPaymentStatus(paymentAccount);
          break;
        } catch (error: any) {
          attempts++;
          if (attempts === maxAttempts || (error.status && error.status !== 502)) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      expect(response!.status).toBe(200);
      expect(response!.data).toHaveProperty('order', testOrderId);
      expect(response!.data).toHaveProperty('payment_account', paymentAccount);
      // Public endpoint should not include callback URL
      expect(response!.data).not.toHaveProperty('callback');
    }, 15000);
  });

  describe('Error Handling', () => {
    test('should handle invalid currency', async () => {
      const invalidOrderRequest = {
        amount: 1.0,
        currency: 'INVALID_CURRENCY'
      };

      await expect(
        client.createOrder(`invalid-${Date.now()}`, invalidOrderRequest)
      ).rejects.toThrow();
    }, 10000);

    test('should handle missing order', async () => {
      await expect(
        client.getOrderStatus('non-existent-order')
      ).rejects.toThrow();
    }, 10000);

    test('should handle invalid payment account', async () => {
      await expect(
        client.getPaymentStatus('invalid-payment-account')
      ).rejects.toThrow();
    }, 10000);
  });
});