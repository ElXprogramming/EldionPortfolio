import { describe, expect, it } from 'vitest';
import {
  buildFlipTransform,
  buildFolderBackPath,
  chainMatrices,
  clamp,
  computeFlipDelta,
  luma,
  matrixToCss,
  measureFolder,
  mixRgb,
  multiplyMatrices,
  parseHexColor,
  placeFlapCard,
  projectFolderSlot,
  rectToBox,
  rgbString,
  rotateXMatrix,
  rotateYMatrix,
  rotateZMatrix,
  scaleMatrix,
  toLocalBox,
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

    it('computes FLIP transform deltas safely between folder file and project card rects', () => {
      const cardBox = rectToBox({ left: 600, top: 200, width: 400, height: 350 });
      expect(cardBox).toEqual({
        centerX: 800,
        centerY: 375,
        width: 400,
        height: 350,
        rotation: 0,
      });

      const fileSnapshot = {
        centerX: 300,
        centerY: 325,
        width: 120,
        height: 140,
        rotation: -4.5,
      };
      const delta = computeFlipDelta(fileSnapshot, cardBox);
      expect(delta.dx).toBe(-500);
      expect(delta.dy).toBe(-50);
      expect(delta.sx).toBeCloseTo(0.3, 4);
      expect(delta.sy).toBeCloseTo(0.4, 4);
      expect(delta.rotation).toBeCloseTo(-4.5, 4);

      const css = buildFlipTransform(delta);
      expect(css).toBe('translate3d(-500.00px, -50.00px, 0) rotate(-4.50deg) scale(0.3000, 0.4000)');

      const degenerate = computeFlipDelta(
        { centerX: 0, centerY: 0, width: 0, height: 0 },
        { centerX: 0, centerY: 0, width: 0, height: 0 }
      );
      expect(degenerate.sx).toBe(1);
      expect(degenerate.sy).toBe(1);

      // Reverse card-to-file scale (> 4x when compact) must not be clamped prematurely
      const reverseDelta = computeFlipDelta(
        { centerX: 800, centerY: 375, width: 420, height: 350, rotation: 0 },
        { centerX: 300, centerY: 325, width: 96, height: 117, rotation: -3 }
      );
      expect(reverseDelta.sx).toBeCloseTo(420 / 96, 4);
      expect(reverseDelta.sy).toBeCloseTo(350 / 117, 4);
    });

    it('keeps rotated cards inside pocket side seams and above pocket floor in non-open phases', () => {
      const geom = measureFolder(1.05, 95, true, 'left');
      const phases = ['rest', 'peek', 'receive'] as const;

      for (const phase of phases) {
        for (let rank = 0; rank < 6; rank++) {
          const slot = placeFlapCard(rank, 6, phase, geom, geom.w * 0.5);
          const rad = Math.abs((slot.r * Math.PI) / 180);
          const halfSpanX = ((geom.docW * Math.cos(rad) + geom.docH * Math.sin(rad)) * slot.s) / 2;
          const reachY = ((geom.docW * Math.sin(rad) + geom.docH * Math.cos(rad)) * slot.s) / 2;
          const pocketFloor = geom.tabH + geom.h - 1.5 * geom.scale - reachY;

          expect(slot.x - halfSpanX).toBeGreaterThanOrEqual(4 * geom.scale - 1e-6);
          expect(slot.x + halfSpanX).toBeLessThanOrEqual(geom.w - 4 * geom.scale + 1e-6);
          expect(slot.y).toBeLessThan(pocketFloor);
        }
      }
    });

    it('projects canonical folder slots with 3D perspective and converts to section-local coordinates', () => {
      const geom = measureFolder(1.05, 90, true, 'left');
      const totalH = geom.tabH + geom.h;
      const depth = Math.round(Math.max(geom.w, geom.h) * 5);
      const slot = placeFlapCard(0, 4, 'open', geom, null);
      const rootRect = { left: 220, top: 480, width: geom.w, height: totalH };

      const projected = projectFolderSlot(slot, 0.2, geom, depth, rootRect);
      const expectedZ = (3 + 0.2 * 26) * geom.scale;
      const expectedPersp = depth / (depth - expectedZ);

      expect(projected.width).toBeCloseTo(geom.docW * slot.s * expectedPersp, 4);
      expect(projected.height).toBeCloseTo(geom.docH * slot.s * expectedPersp, 4);
      expect(projected.rotation).toBe(slot.r);
      expect(projected.unitScale).toBeCloseTo(geom.scale * slot.s * expectedPersp, 4);

      const sectionRect = { left: 100, top: 360 };
      const local = toLocalBox(projected, sectionRect);
      expect(local.centerX).toBeCloseTo(projected.centerX - 100, 4);
      expect(local.centerY).toBeCloseTo(projected.centerY - 360, 4);
      expect(local.width).toBeCloseTo(projected.width, 4);
      expect(local.height).toBeCloseTo(projected.height, 4);
      expect(local.rotation).toBe(slot.r);
    });
  });
});
