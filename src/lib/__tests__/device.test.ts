import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { detectDeviceCapabilities, shouldEnableHeavyVisuals } from '../device';

describe('device capabilities detector', () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      (globalThis as unknown as { window?: unknown }).window = originalWindow;
    } else {
      delete (globalThis as unknown as { window?: unknown }).window;
    }
  });

  it('handles SSR / non-browser environment safely', () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    const caps = detectDeviceCapabilities();
    expect(caps.isLowEnd).toBe(true);
    expect(caps.hasWebGL).toBe(false);
    expect(shouldEnableHeavyVisuals()).toBe(false);
  });

  describe('browser environment simulation', () => {
    beforeEach(() => {
      (globalThis as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      };
      (globalThis as unknown as { document: unknown }).document = {
        createElement: vi.fn().mockReturnValue({
          getContext: vi.fn().mockReturnValue({}),
        }),
      };
    });

    it('detects capable modern desktop', () => {
      const caps = detectDeviceCapabilities();
      expect(caps.isLowEnd).toBe(false);
      expect(caps.hasWebGL).toBe(true);
      expect(caps.reducedMotion).toBe(false);
      expect(caps.saveData).toBe(false);
      expect(shouldEnableHeavyVisuals()).toBe(true);
    });

    it('identifies prefers-reduced-motion as low-end', () => {
      (globalThis as unknown as { window: unknown }).window = {
        matchMedia: vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
        })),
      };

      const caps = detectDeviceCapabilities();
      expect(caps.reducedMotion).toBe(true);
      expect(caps.isLowEnd).toBe(true);
      expect(shouldEnableHeavyVisuals()).toBe(false);
    });

    it('identifies missing WebGL support as low-end', () => {
      (globalThis as unknown as { document: unknown }).document = {
        createElement: vi.fn().mockReturnValue({
          getContext: vi.fn().mockReturnValue(null),
        }),
      };

      const caps = detectDeviceCapabilities();
      expect(caps.hasWebGL).toBe(false);
      expect(caps.isLowEnd).toBe(true);
      expect(shouldEnableHeavyVisuals()).toBe(false);
    });
  });
});
