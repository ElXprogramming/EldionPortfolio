import { describe, expect, it } from 'vitest';
import { clamp, isBack, isFrontFacing, snap } from '../../lib/flipCardMath';

describe('FlipCard geometry helpers', () => {
  describe('clamp', () => {
    it('clamps values within [min, max]', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-3, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('snap', () => {
    it('snaps angles to the nearest multiple of 180 degrees', () => {
      expect(snap(0)).toBe(0);
      expect(snap(89)).toBe(0);
      expect(snap(91)).toBe(180);
      expect(snap(180)).toBe(180);
      expect(snap(-89)).toBe(0);
      expect(snap(-91)).toBe(-180);
    });
  });

  describe('isBack', () => {
    it('identifies odd multiples of 180 degrees as back face', () => {
      expect(isBack(0)).toBe(false);
      expect(isBack(180)).toBe(true);
      expect(isBack(-180)).toBe(true);
      expect(isBack(360)).toBe(false);
      expect(isBack(540)).toBe(true);
    });
  });

  describe('isFrontFacing', () => {
    it('returns true when angle is 0 degrees (unflipped front face)', () => {
      expect(isFrontFacing(0)).toBe(true);
    });

    it('returns true while card rotation is within (-90, 90) degrees', () => {
      expect(isFrontFacing(45)).toBe(true);
      expect(isFrontFacing(-45)).toBe(true);
      expect(isFrontFacing(89.9)).toBe(true);
      expect(isFrontFacing(-89.9)).toBe(true);
    });

    it('returns false once card rotates past 90 degrees toward the back face', () => {
      expect(isFrontFacing(90.1)).toBe(false);
      expect(isFrontFacing(135)).toBe(false);
      expect(isFrontFacing(180)).toBe(false);
      expect(isFrontFacing(225)).toBe(false);
      expect(isFrontFacing(269.9)).toBe(false);
    });

    it('returns false when rotated negatively to the back face (-90.1 to -269.9 degrees)', () => {
      expect(isFrontFacing(-90.1)).toBe(false);
      expect(isFrontFacing(-180)).toBe(false);
      expect(isFrontFacing(-269.9)).toBe(false);
    });

    it('handles multiple full 360-degree spins and non-finite inputs safely', () => {
      expect(isFrontFacing(360)).toBe(true);
      expect(isFrontFacing(540)).toBe(false);
      expect(isFrontFacing(-360)).toBe(true);
      expect(isFrontFacing(-540)).toBe(false);
      expect(isFrontFacing(Number.NaN)).toBe(true);
    });
  });
});
