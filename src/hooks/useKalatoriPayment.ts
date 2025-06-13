import { useState, useCallback, useEffect } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { CreateOrderRequest, OrderStatus, PaymentStatusUpdate, KalatoriError, KalatoriClientConfig } from '../types';
import { useKalatoriClient } from './useKalatoriClient';
import { useCreateOrder } from './useCreateOrder';
import { usePaymentMonitoring } from './usePaymentMonitoring';

export interface UseKalatoriPaymentOptions {
  /** Client configuration */
  clientConfig: KalatoriClientConfig;
  /** Payment monitoring options */
  monitoringInterval?: number;
  /** Maximum monitoring attempts */
  maxAttempts?: number;
  /** Auto-start monitoring after order creation */
  autoStartMonitoring?: boolean;
  /** Callbacks */
  onPaymentUpdate?: (update: PaymentStatusUpdate) => void;
  onPaymentComplete?: (update: PaymentStatusUpdate) => void;
  onPaymentTimeout?: () => void;
}

export interface UseKalatoriPaymentResult {
  /** Kalatori client instance */
  client: KalatoriClient;
  /** Current order data */
  order: OrderStatus | null;
  /** Payment monitoring status */
  paymentStatus: OrderStatus | null;
  /** Order creation loading state */
  creatingOrder: boolean;
  /** Payment monitoring state */
  isMonitoring: boolean;
  /** Payment completion state */
  isCompleted: boolean;
  /** Payment timeout state */
  isTimedOut: boolean;
  /** Any errors */
  error: KalatoriError | null;
  /** Monitoring attempts count */
  attempts: number;
  /** Create a new order */
  createOrder: (orderId: string, request: CreateOrderRequest) => Promise<OrderStatus | null>;
  /** Start payment monitoring manually */
  startMonitoring: () => void;
  /** Stop payment monitoring */
  stopMonitoring: () => void;
  /** Reset all states */
  reset: () => void;
  /** Clear errors */
  clearError: () => void;
}

/**
 * Comprehensive hook for end-to-end Kalatori payment flow
 * @param options - Configuration options
 * @returns Complete payment management state and functions
 */
export function useKalatoriPayment(options: UseKalatoriPaymentOptions): UseKalatoriPaymentResult {
  const {
    clientConfig,
    monitoringInterval = 5000,
    maxAttempts = 120,
    autoStartMonitoring = true,
    onPaymentUpdate,
    onPaymentComplete,
    onPaymentTimeout
  } = options;

  const client = useKalatoriClient(clientConfig);
  const [paymentAccount, setPaymentAccount] = useState<string>('');

  const {
    data: order,
    loading: creatingOrder,
    error: createError,
    createOrder: createOrderFn,
    reset: resetOrder,
    clearError: clearCreateError
  } = useCreateOrder(client);

  const {
    status: paymentStatus,
    isMonitoring,
    error: monitoringError,
    isCompleted,
    isTimedOut,
    startMonitoring: startMonitoringFn,
    stopMonitoring,
    clearError: clearMonitoringError,
    attempts
  } = usePaymentMonitoring(client, paymentAccount, {
    interval: monitoringInterval,
    maxAttempts,
    autoStart: false, // We'll control this manually
    onUpdate: onPaymentUpdate,
    onComplete: onPaymentComplete,
    onTimeout: onPaymentTimeout
  });

  const createOrder = useCallback(async (
    orderId: string, 
    request: CreateOrderRequest
  ): Promise<OrderStatus | null> => {
    const result = await createOrderFn(orderId, request);
    
    if (result && autoStartMonitoring) {
      setPaymentAccount(result.payment_account);
    }
    
    return result;
  }, [createOrderFn, autoStartMonitoring]);

  const startMonitoring = useCallback(() => {
    if (paymentAccount) {
      startMonitoringFn();
    }
  }, [paymentAccount, startMonitoringFn]);

  // Auto-start monitoring when payment account is available
  useEffect(() => {
    if (paymentAccount && autoStartMonitoring && !isMonitoring) {
      startMonitoringFn();
    }
  }, [paymentAccount, autoStartMonitoring, isMonitoring, startMonitoringFn]);

  const reset = useCallback(() => {
    resetOrder();
    stopMonitoring();
    setPaymentAccount('');
  }, [resetOrder, stopMonitoring]);

  const clearError = useCallback(() => {
    clearCreateError();
    clearMonitoringError();
  }, [clearCreateError, clearMonitoringError]);

  // Combined error state
  const error = createError || monitoringError;

  return {
    client,
    order,
    paymentStatus,
    creatingOrder,
    isMonitoring,
    isCompleted,
    isTimedOut,
    error,
    attempts,
    createOrder,
    startMonitoring,
    stopMonitoring,
    reset,
    clearError
  };
}