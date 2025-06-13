// Core API types based on OpenAPI specification

export interface ServerInfo {
  version: string;
  instance_id: string;
  debug?: boolean;
  kalatori_remark?: string;
}

export interface CurrencyProperties {
  chain_name: string;
  kind: 'native' | 'asset';
  decimals: number;
  rpc_url: string;
  asset_id?: number;
}

export interface CurrencyInfo extends CurrencyProperties {
  currency: string;
}

export interface TransactionInfo {
  block_number?: number;
  position_in_block?: number;
  timestamp?: string;
  transaction_bytes: string;
  sender: string;
  recipient: string;
  amount: number | 'all';
  currency: CurrencyInfo;
  status: 'pending' | 'finalized' | 'failed';
}

export interface OrderStatus {
  order: string;
  payment_status: 'pending' | 'paid' | 'timed_out';
  withdrawal_status: 'waiting' | 'failed' | 'completed' | 'none';
  message?: string;
  payment_account: string;
  amount: number;
  currency: CurrencyInfo;
  callback?: string;
  payment_page?: string;
  redirect_url?: string;
  recipient: string;
  transactions: TransactionInfo[];
  server_info: ServerInfo;
}

export interface ServerStatus {
  server_info: ServerInfo;
  supported_currencies: Record<string, CurrencyProperties>;
}

export interface RpcEndpointStatus {
  rpc_url: string;
  chain_name: string;
  status: 'ok' | 'degraded' | 'critical';
}

export interface ServerHealth {
  server_info: ServerInfo;
  connected_rpcs: RpcEndpointStatus[];
  status: 'ok' | 'degraded' | 'critical';
}

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  callback?: string;
}

export interface ApiError {
  parameter: 'orderId' | 'amount' | 'currency' | 'callback';
  message: string;
}

// Client configuration types
export interface KalatoriClientConfig {
  baseUrl: string;
  mode: 'embedded' | 'offsite';
  timeout?: number;
  headers?: Record<string, string>;
}

// Event types for payment monitoring
export interface PaymentStatusUpdate {
  orderId: string;
  paymentAccount: string;
  status: OrderStatus;
  timestamp: Date;
}

// Client response types
export interface KalatoriResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface KalatoriError extends Error {
  status?: number;
  errors?: ApiError[];
  response?: Response;
}