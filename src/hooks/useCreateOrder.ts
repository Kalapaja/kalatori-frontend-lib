import { useState, useCallback } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { CreateOrderRequest, OrderStatus, KalatoriError } from '../types';

export interface UseCreateOrderResult {
  /** Order creation data */
  data: OrderStatus | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: KalatoriError | null;
  /** Create order function */
  createOrder: (orderId: string, request: CreateOrderRequest) => Promise<OrderStatus | null>;
  /** Update existing order */
  updateOrder: (orderId: string, request: Partial<CreateOrderRequest>) => Promise<OrderStatus | null>;
  /** Reset state */
  reset: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for creating and updating orders
 * @param client - Kalatori client instance
 * @returns Order creation state and functions
 */
export function useCreateOrder(client: KalatoriClient): UseCreateOrderResult {
  const [data, setData] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<KalatoriError | null>(null);

  const createOrder = useCallback(async (
    orderId: string, 
    request: CreateOrderRequest
  ): Promise<OrderStatus | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.createOrder(orderId, request);
      setData(response.data);
      return response.data;
    } catch (err) {
      const error = err as KalatoriError;
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const updateOrder = useCallback(async (
    orderId: string, 
    request: Partial<CreateOrderRequest>
  ): Promise<OrderStatus | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await client.updateOrder(orderId, request);
      setData(response.data);
      return response.data;
    } catch (err) {
      const error = err as KalatoriError;
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    createOrder,
    updateOrder,
    reset,
    clearError
  };
}