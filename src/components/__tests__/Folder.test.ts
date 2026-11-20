import { describe, expect, it } from 'vitest';
import {
  buildFolderBackPath,
  chainMatrices,
  clamp,
  luma,
  matrixToCss,
  measureFolder,
  mixRgb,
  multiplyMatrices,
  parseHexColor,
  placeFlapCard,
  rgbString,
  rotateXMatrix,
  rotateYMatrix,
  rotateZMatrix,
  scaleMatrix,
  translateMatrix,
} from '../../lib/folderUtils';

describe('Folder utilities', () => {
  describe('color helpers', () => {
    it('parses 3-digit and 6-digit hex colors and falls back safely', () => {
      expect(parseHexColor('#fff')).toEqual([255, 255, 255]);
      expect(parseHexColor('#3b1d60')).toEqual([59, 29, 96]);
      expect(parseHexColor('invalid', [10, 20, 30])).toEqual([10, 20, 30]);
    });

    it('mixes RGB colors, formats rgb strings, and computes luminance', () => {
      expect(mixRgb([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25]);
      expect(rgbString([59, 29, 96])).toBe('rgb(59, 29, 96)');
      expect(luma([255, 255, 255])).toBeCloseTo(1, 5);
      expect(luma([0, 0, 0])).toBe(0);
    });
  });

  describe('clamp and 3D matrix helpers', () => {
    it('clamps numeric values within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-3, 0, 10)).toBe(0);
      expect(clamp(20, 0, 10)).toBe(10);
    });

    it('composes translation, scale, and rotation matrices accurately', () => {
      const id = translateMatrix(0, 0, 0);
      const t = translateMatrix(10, 20, 5);
      expect(multiplyMatrices(id, t)).toEqual(t);

      const composed = chainMatrices(
        translateMatrix(10, 0, 0),
        scaleMatrix(2, 3),
        rotateXMatrix(0),
        rotateYMatrix(0),
        rotateZMatrix(90)
      );
      expect(composed[12]).toBeCloseTo(10, 5);
      expect(matrixToCss(translateMatrix(1e-9, -1e-9, 0))).toBe(
        'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
      );
    });
  });

  describe('geometry and placement', () => {
    it('measures folder geometry across left, center, and right tab positions', () => {
      const left = measureFolder(1, 90, true, 'left');
      const center = measureFolder(1, 90, true, 'center');
      const right = measureFolder(1, 90, true, 'right');

      expect(left.w).toBe(224);
      expect(left.h).toBe(176);
      expect(left.tabX).toBeLessThan(center.tabX);
      expect(center.tabX).toBeLessThan(right.tabX);

      const path = buildFolderBackPath(left);
      expect(path.startsWith('M 0 ')).toBe(true);
      expect(path.endsWith('Z')).toBe(true);
    });

    it('computes card placements for rest, peek, receive, and open phases', () => {
      const geom = measureFolder(1, 80, true, 'left');
      const rest = placeFlapCard(0, 5, 'rest', geom, null);
      const peekNoPointer = placeFlapCard(0, 5, 'peek', geom, null);
      const peekNearPointer = placeFlapCard(0, 5, 'peek', geom, peekNoPointer.x);
      const receive = placeFlapCard(0, 5, 'receive', geom, null);
      const openLeft = placeFlapCard(0, 5, 'open', geom, null);
      const openRight = placeFlapCard(4, 5, 'open', geom, null);

      expect(peekNoPointer.y).toBeLessThan(rest.y);
      expect(peekNearPointer.y).toBeLessThan(peekNoPointer.y);
      expect(receive.x).not.toBe(rest.x);
      expect(openLeft.x).toBeLessThan(openRight.x);
      expect(openLeft.s).toBeGreaterThan(0);
    });
  });
});
