import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs and finds expect/jest-dom matchers', () => {
    expect(1 + 1).toBe(2);
  });

  it('has indexedDB available (fake-indexeddb)', () => {
    expect(typeof indexedDB).toBe('object');
    expect(indexedDB).not.toBeNull();
  });
});
