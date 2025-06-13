import { useState, useEffect, useCallback } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { ServerStatus, ServerHealth, KalatoriError } from '../types';

export interface UseDaemonStatusOptions {
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Enable automatic refresh */
  enabled?: boolean;
  /** Include health check data */
  includeHealth?: boolean;
}

export interface UseDaemonStatusResult {
  /** Server status data */
  status: ServerStatus | null;
  /** Server health data */
  health: ServerHealth | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: KalatoriError | null;
  /** Manually refresh status */
  refresh: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Check if daemon is healthy */
  isHealthy: boolean;
}

/**
 * Hook to monitor daemon status and health
 * @param client - Kalatori client instance
 * @param options - Configuration options
 * @returns Daemon status state and controls
 */
export function useDaemonStatus(
  client: KalatoriClient,
  options: UseDaemonStatusOptions = {}
): UseDaemonStatusResult {
  const { refreshInterval = 30000, enabled = true, includeHealth = true } = options;
  
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<KalatoriError | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch status
      const statusResponse = await client.getStatus();
      setStatus(statusResponse.data);
      
      // Fetch health if requested
      if (includeHealth) {
        const healthResponse = await client.getHealth();
        setHealth(healthResponse.data);
      }
    } catch (err) {
      setError(err as KalatoriError);
    } finally {
      setLoading(false);
    }
  }, [client, enabled, includeHealth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  // Compute health status
  const isHealthy = health?.status === 'ok' || (!includeHealth && status !== null);

  return {
    status,
    health,
    loading,
    error,
    refresh: fetchData,
    clearError,
    isHealthy
  };
}