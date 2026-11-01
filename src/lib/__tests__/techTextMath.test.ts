import { describe, expect, it } from 'vitest';
import { approach, clamp01, noise, signed, smoothstep } from '../techTextMath';

describe('techTextMath', () => {
  describe('clamp01', () => {
    it('clamps values between 0 and 1', () => {
      expect(clamp01(-0.5)).toBe(0);
      expect(clamp01(0)).toBe(0);
      expect(clamp01(0.5)).toBe(0.5);
      expect(clamp01(1)).toBe(1);
      expect(clamp01(1.5)).toBe(1);
    });

    it('handles non-numeric or NaN values safely', () => {
      expect(clamp01(Number.NaN)).toBe(0);
      expect(clamp01(null)).toBe(0);
      expect(clamp01(undefined)).toBe(0);
      expect(clamp01('0.75')).toBe(0.75);
    });
  });

  describe('smoothstep', () => {
    it('returns 0 when value <= edge0 and 1 when value >= edge1', () => {
      expect(smoothstep(0, 10, 0)).toBe(0);
      expect(smoothstep(0, 10, -5)).toBe(0);
      expect(smoothstep(0, 10, 10)).toBe(1);
      expect(smoothstep(0, 10, 15)).toBe(1);
    });

    it('smoothly interpolates at midpoint', () => {
      expect(smoothstep(0, 10, 5)).toBe(0.5);
    });
  });

  describe('approach', () => {
    it('approaches target value smoothly over time', () => {
      const current = 0;
      const target = 100;
      const next = approach(current, target, 0.1, 0.2);
      expect(next).toBeGreaterThan(current);
      expect(next).toBeLessThan(target);
    });

    it('stays at target if already reached', () => {
      expect(approach(50, 50, 0.1, 0.2)).toBe(50);
    });
  });

  describe('noise', () => {
    it('generates deterministic pseudo-random float between 0 and 1', () => {
      const val1 = noise(1, 2, 3);
      const val2 = noise(1, 2, 3);
      expect(val1).toBe(val2);
      expect(val1).toBeGreaterThanOrEqual(0);
      expect(val1).toBeLessThanOrEqual(1);

      const val3 = noise(2, 3, 4);
      expect(val3).not.toBe(val1);
    });
  });

  describe('signed', () => {
    it('formats positive, negative and zero numbers with proper prefixes', () => {
      expect(signed(5)).toBe('+5');
      expect(signed(-8)).toBe('−8');
      expect(signed(0)).toBe('0');
      expect(signed(-0)).toBe('0');
    });
  });
});
