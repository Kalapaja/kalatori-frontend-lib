import { useState, useEffect, useCallback } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { OrderStatus, KalatoriError } from '../types';

export interface UseOrderStatusOptions {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Enable automatic refresh */
  enabled?: boolean;
}

export interface UseOrderStatusResult {
  /** Current order status */
  data: OrderStatus | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: KalatoriError | null;
  /** Manually refresh order status */
  refresh: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook to manage order status with automatic refresh
 * @param client - Kalatori client instance
 * @param orderId - Order ID to track
 * @param options - Configuration options
 * @returns Order status state and controls
 */
export function useOrderStatus(
  client: KalatoriClient,
  orderId: string,
  options: UseOrderStatusOptions = {}
): UseOrderStatusResult {
  const { refreshInterval = 5000, enabled = true } = options;
  
  const [data, setData] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<KalatoriError | null>(null);

  const fetchOrderStatus = useCallback(async () => {
    if (!orderId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.getOrderStatus(orderId);
      setData(response.data);
    } catch (err) {
      setError(err as KalatoriError);
    } finally {
      setLoading(false);
    }
  }, [client, orderId, enabled]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchOrderStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOrderStatus, refreshInterval, enabled]);

  return {
    data,
    loading,
    error,
    refresh: fetchOrderStatus,
    clearError
  };
}