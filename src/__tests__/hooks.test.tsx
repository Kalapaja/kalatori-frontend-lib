import { renderHook, act, waitFor } from '@testing-library/react';
import { useKalatoriClient, useCreateOrder, useOrderStatus } from '../hooks';
import { KalatoriClientConfig, OrderStatus } from '../types';
import { KalatoriClient } from '../client/KalatoriClient';

// Mock the KalatoriClient
jest.mock('../client/KalatoriClient');

const MockedKalatoriClient = KalatoriClient as jest.MockedClass<typeof KalatoriClient>;

describe('React Hooks', () => {
  const mockConfig: KalatoriClientConfig = {
    baseUrl: 'https://test.example.com',
    mode: 'embedded'
  };

  const mockOrderStatus: OrderStatus = {
    order: 'test-order',
    payment_status: 'pending',
    withdrawal_status: 'waiting',
    payment_account: 'mock-account',
    amount: 10,
    currency: {
      currency: 'DOT',
      chain_name: 'polkadot',
      kind: 'native',
      decimals: 10,
      rpc_url: 'wss://mock.example.com'
    },
    recipient: 'mock-recipient',
    transactions: [],
    server_info: {
      version: '1.0.0',
      instance_id: 'test'
    }
  };

  beforeEach(() => {
    MockedKalatoriClient.mockClear();
  });

  describe('useKalatoriClient', () => {
    test('should create and memoize client instance', () => {
      const { result, rerender } = renderHook(
        ({ config }) => useKalatoriClient(config),
        { initialProps: { config: mockConfig } }
      );

      const firstClient = result.current;
      expect(firstClient).toBeDefined();

      // Re-render with same config should return same instance
      rerender({ config: mockConfig });
      expect(result.current).toBe(firstClient);

      // Re-render with different config should return new instance
      const newConfig = { ...mockConfig, baseUrl: 'https://different.example.com' };
      rerender({ config: newConfig });
      expect(result.current).not.toBe(firstClient);
    });
  });

  describe('useCreateOrder', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => {
        const client = useKalatoriClient(mockConfig);
        return useCreateOrder(client);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.createOrder).toBe('function');
      expect(typeof result.current.updateOrder).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    test('should reset state correctly', () => {
      const { result } = renderHook(() => {
        const client = useKalatoriClient(mockConfig);
        return useCreateOrder(client);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('useOrderStatus', () => {
    test('should initialize with correct default state when disabled', () => {
      const { result } = renderHook(() => {
        const client = useKalatoriClient(mockConfig);
        return useOrderStatus(client, 'test-order', { enabled: false });
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    test('should handle enabled state with mock client', async () => {
      const mockGetOrderStatus = jest.fn().mockResolvedValue({
        data: mockOrderStatus,
        status: 200,
        headers: {}
      });

      MockedKalatoriClient.mockImplementation(() => ({
        getOrderStatus: mockGetOrderStatus
      } as any));

      const { result } = renderHook(() => {
        const client = useKalatoriClient(mockConfig);
        return useOrderStatus(client, 'test-order', { enabled: true });
      });

      // Initially should be loading
      expect(result.current.loading).toBe(true);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockOrderStatus);
      expect(result.current.error).toBeNull();
    });
  });
});