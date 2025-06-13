import { useState, useEffect, useCallback, useRef } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { OrderStatus, PaymentStatusUpdate, KalatoriError } from '../types';

export interface UsePaymentMonitoringOptions {
  /** Polling interval in milliseconds */
  interval?: number;
  /** Maximum number of polling attempts */
  maxAttempts?: number;
  /** Auto-start monitoring */
  autoStart?: boolean;
  /** Callback for payment updates */
  onUpdate?: (update: PaymentStatusUpdate) => void;
  /** Callback for payment completion */
  onComplete?: (update: PaymentStatusUpdate) => void;
  /** Callback for payment timeout */
  onTimeout?: () => void;
}

export interface UsePaymentMonitoringResult {
  /** Current payment status */
  status: OrderStatus | null;
  /** Monitoring state */
  isMonitoring: boolean;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: KalatoriError | null;
  /** Payment completion state */
  isCompleted: boolean;
  /** Payment timeout state */
  isTimedOut: boolean;
  /** Start monitoring */
  startMonitoring: () => void;
  /** Stop monitoring */
  stopMonitoring: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Number of polling attempts made */
  attempts: number;
}

/**
 * Hook for monitoring payment status with real-time updates
 * @param client - Kalatori client instance
 * @param paymentAccount - Payment account address to monitor
 * @param options - Configuration options
 * @returns Payment monitoring state and controls
 */
export function usePaymentMonitoring(
  client: KalatoriClient,
  paymentAccount: string,
  options: UsePaymentMonitoringOptions = {}
): UsePaymentMonitoringResult {
  const {
    interval = 5000,
    maxAttempts = 120,
    autoStart = false,
    onUpdate,
    onComplete,
    onTimeout
  } = options;

  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<KalatoriError | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    setLoading(false);
  }, []);

  const startMonitoring = useCallback(() => {
    if (!paymentAccount || isMonitoring) return;

    setIsMonitoring(true);
    setError(null);
    setIsCompleted(false);
    setIsTimedOut(false);
    attemptCountRef.current = 0;
    setAttempts(0);

    const poll = async (): Promise<void> => {
      if (attemptCountRef.current >= maxAttempts) {
        setIsTimedOut(true);
        stopMonitoring();
        onTimeout?.();
        return;
      }

      setLoading(true);
      attemptCountRef.current++;
      setAttempts(attemptCountRef.current);

      try {
        const response = await client.getPaymentStatus(paymentAccount);
        const orderStatus = response.data;
        
        setStatus(orderStatus);
        setError(null);

        const update: PaymentStatusUpdate = {
          orderId: orderStatus.order,
          paymentAccount,
          status: orderStatus,
          timestamp: new Date()
        };

        onUpdate?.(update);

        // Check for completion
        if (orderStatus.payment_status === 'paid' || orderStatus.payment_status === 'timed_out') {
          setIsCompleted(orderStatus.payment_status === 'paid');
          setIsTimedOut(orderStatus.payment_status === 'timed_out');
          stopMonitoring();
          onComplete?.(update);
          return;
        }

      } catch (err) {
        const error = err as KalatoriError;
        setError(error);
        
        // Stop monitoring on non-recoverable errors
        if (error.status === 404 || error.status === 400) {
          stopMonitoring();
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    // Start polling
    poll(); // Initial poll
    intervalRef.current = setInterval(poll, interval);
  }, [client, paymentAccount, interval, maxAttempts, isMonitoring, onUpdate, onComplete, onTimeout, stopMonitoring]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart && paymentAccount && !isMonitoring) {
      startMonitoring();
    }
  }, [autoStart, paymentAccount, isMonitoring, startMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    status,
    isMonitoring,
    loading,
    error,
    isCompleted,
    isTimedOut,
    startMonitoring,
    stopMonitoring,
    clearError,
    attempts
  };
}