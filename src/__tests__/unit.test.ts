import { KalatoriClient, createKalatoriClient } from '../index';
import { KalatoriClientConfig } from '../types';

describe('Kalatori Unit Tests', () => {
  describe('KalatoriClient', () => {
    test('should create client instance with config', () => {
      const config: KalatoriClientConfig = {
        baseUrl: 'https://example.com',
        mode: 'embedded'
      };

      const client = new KalatoriClient(config);
      expect(client).toBeInstanceOf(KalatoriClient);
    });

    test('should create client using factory function', () => {
      const config: KalatoriClientConfig = {
        baseUrl: 'https://example.com',
        mode: 'offsite',
        timeout: 5000
      };

      const client = createKalatoriClient(config);
      expect(client).toBeInstanceOf(KalatoriClient);
    });

    test('should extend EventEmitter', () => {
      const config: KalatoriClientConfig = {
        baseUrl: 'https://example.com',
        mode: 'embedded'
      };

      const client = new KalatoriClient(config);
      
      // Should have EventEmitter methods
      expect(typeof client.on).toBe('function');
      expect(typeof client.emit).toBe('function');
      expect(typeof client.off).toBe('function');
    });
  });

  describe('Type exports', () => {
    test('should export all required types', () => {
      // This test ensures TypeScript compilation is working correctly
      // If types are not properly exported, this would fail at compile time
      
      const config: KalatoriClientConfig = {
        baseUrl: 'https://example.com',
        mode: 'embedded'
      };
      
      expect(config.baseUrl).toBe('https://example.com');
      expect(config.mode).toBe('embedded');
    });
  });
});