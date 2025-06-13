import { EventEmitter } from 'eventemitter3';
import {
  KalatoriClientConfig,
  OrderStatus,
  CreateOrderRequest,
  ServerStatus,
  ServerHealth,
  KalatoriResponse,
  KalatoriError,
  PaymentStatusUpdate,
  ApiError
} from '../types';

export class KalatoriClient extends EventEmitter {
  private config: Required<KalatoriClientConfig>;

  constructor(config: KalatoriClientConfig) {
    super();
    this.config = {
      timeout: 30000,
      headers: {},
      ...config
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<KalatoriResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errors: ApiError[] = [];
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData)) {
            errors = errorData;
          }
        } catch {
          // Ignore JSON parse errors for non-JSON error responses
        }

        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as KalatoriError;
        error.status = response.status;
        error.errors = errors;
        error.response = response;
        throw error;
      }

      const data = await response.json();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        data,
        status: response.status,
        headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as KalatoriError;
        timeoutError.status = 408;
        throw timeoutError;
      }
      throw error;
    }
  }

  // Order management methods
  async createOrder(orderId: string, request: CreateOrderRequest): Promise<KalatoriResponse<OrderStatus>> {
    return this.makeRequest<OrderStatus>(`/v2/order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrderStatus(orderId: string): Promise<KalatoriResponse<OrderStatus>> {
    return this.makeRequest<OrderStatus>(`/v2/order/${orderId}`, {
      method: 'POST',
    });
  }

  async updateOrder(orderId: string, request: Partial<CreateOrderRequest>): Promise<KalatoriResponse<OrderStatus>> {
    return this.makeRequest<OrderStatus>(`/v2/order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async forceWithdrawal(orderId: string): Promise<KalatoriResponse<OrderStatus>> {
    return this.makeRequest<OrderStatus>(`/v2/order/${orderId}/forceWithdrawal`, {
      method: 'POST',
    });
  }

  // Public endpoints (for offsite mode)
  async getPaymentStatus(paymentAccount: string): Promise<KalatoriResponse<OrderStatus>> {
    return this.makeRequest<OrderStatus>(`/public/v2/payment/${paymentAccount}`, {
      method: 'POST',
    });
  }

  // Daemon status methods
  async getStatus(): Promise<KalatoriResponse<ServerStatus>> {
    return this.makeRequest<ServerStatus>('/v2/status');
  }

  async getHealth(): Promise<KalatoriResponse<ServerHealth>> {
    return this.makeRequest<ServerHealth>('/v2/health');
  }

  // Payment monitoring utilities
  async startPaymentMonitoring(
    paymentAccount: string,
    options: {
      interval?: number;
      maxAttempts?: number;
      onUpdate?: (update: PaymentStatusUpdate) => void;
    } = {}
  ): Promise<void> {
    const {
      interval = 5000,
      maxAttempts = 120, // 10 minutes with 5s intervals
      onUpdate
    } = options;

    let attempts = 0;
    let isMonitoring = true;

    const poll = async (): Promise<void> => {
      if (!isMonitoring || attempts >= maxAttempts) {
        this.emit('monitoring:stopped', { paymentAccount, reason: attempts >= maxAttempts ? 'maxAttempts' : 'manual' });
        return;
      }

      try {
        const response = await this.getPaymentStatus(paymentAccount);
        const update: PaymentStatusUpdate = {
          orderId: response.data.order,
          paymentAccount,
          status: response.data,
          timestamp: new Date()
        };

        this.emit('payment:update', update);
        onUpdate?.(update);

        // Stop monitoring if payment is completed or failed
        if (response.data.payment_status === 'paid' || response.data.payment_status === 'timed_out') {
          this.emit('payment:final', update);
          isMonitoring = false;
          return;
        }

        attempts++;
        setTimeout(poll, interval);
      } catch (error) {
        this.emit('payment:error', { paymentAccount, error, attempts });
        attempts++;
        setTimeout(poll, interval);
      }
    };

    // Start monitoring
    this.emit('monitoring:started', { paymentAccount });
    poll();

    // Return a way to stop monitoring
    return new Promise((resolve) => {
      this.once('monitoring:stopped', resolve);
      this.once('payment:final', () => {
        isMonitoring = false;
        resolve();
      });
    });
  }

  stopPaymentMonitoring(): void {
    this.emit('monitoring:stop');
  }
}