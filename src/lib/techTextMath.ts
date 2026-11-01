/**
 * Mathematical utilities for the TechText canvas component.
 */

export const approach = (current: number, target: number, dt: number, seconds: number): number =>
  current + (target - current) * (1 - Math.exp(-dt / seconds));

export const clamp01 = (value: unknown): number =>
  Math.min(1, Math.max(0, Number(value) || 0));

export const smoothstep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export const noise = (...values: number[]): number => {
  let h = 2166136261;
  for (const value of values) {
    h = Math.imul(h ^ (value | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

export const signed = (value: number): string =>
  value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0';
