import { useMemo } from 'react';
import { KalatoriClient } from '../client/KalatoriClient';
import { KalatoriClientConfig } from '../types';

/**
 * Hook to create and manage a Kalatori client instance
 * @param config - Client configuration
 * @returns Memoized KalatoriClient instance
 */
export function useKalatoriClient(config: KalatoriClientConfig): KalatoriClient {
  return useMemo(() => {
    return new KalatoriClient(config);
  }, [config.baseUrl, config.mode, config.timeout]);
}