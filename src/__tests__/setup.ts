// Test setup configuration
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch for Node.js environment
const fetch = require('node-fetch');
(global as any).fetch = fetch;

// Simple placeholder test to satisfy Jest
test('setup works', () => {
  expect(true).toBe(true);
});