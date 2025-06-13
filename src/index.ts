// Main exports
export { KalatoriClient } from './client/KalatoriClient';

// Export all types
export * from './types';

// Export React hooks (optional import for non-React users)
export * from './hooks';

// Convenience factory function
import { KalatoriClient } from './client/KalatoriClient';
import { KalatoriClientConfig } from './types';

export function createKalatoriClient(config: KalatoriClientConfig): KalatoriClient {
  return new KalatoriClient(config);
}