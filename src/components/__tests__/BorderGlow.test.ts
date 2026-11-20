import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GLOW_COLORS,
  buildGlowVars,
  buildGradientVars,
  calculateCursorAngle,
  calculateEdgeProximity,
  clampNumber,
  easeInCubic,
  easeOutCubic,
  isLightColor,
  parseHSL,
  sanitizeCssColor,
} from '../../lib/borderGlowUtils';

describe('BorderGlow utilities', () => {
  describe('parseHSL', () => {
    it('parses standard space-separated HSL values', () => {
      expect(parseHSL('275 85 75')).toEqual({ h: 275, s: 85, l: 75 });
      expect(parseHSL('40 80% 80%')).toEqual({ h: 40, s: 80, l: 80 });
    });

    it('clamps out-of-range numeric HSL values', () => {
      expect(parseHSL('999 200 150')).toEqual({ h: 360, s: 100, l: 100 });
    });

    it('falls back safely on invalid input', () => {
      expect(parseHSL('not-a-color')).toEqual({ h: 40, s: 80, l: 80 });
      expect(parseHSL('')).toEqual({ h: 40, s: 80, l: 80 });
    });
  });

  describe('sanitizeCssColor', () => {
    it('allows valid hex, rgb/rgba, hsl/hsla, and transparent colors', () => {
      expect(sanitizeCssColor('#111116', '#000')).toBe('#111116');
      expect(sanitizeCssColor('#fff', '#000')).toBe('#fff');
      expect(sanitizeCssColor('#c084fc80', '#000')).toBe('#c084fc80');
      expect(sanitizeCssColor('rgb(17, 17, 22)', '#000')).toBe('rgb(17, 17, 22)');
      expect(sanitizeCssColor('hsl(275deg 85% 75% / 50%)', '#000')).toBe(
        'hsl(275deg 85% 75% / 50%)'
      );
      expect(sanitizeCssColor('transparent', '#000')).toBe('transparent');
    });

    it('blocks CSS injection attempts and returns fallback', () => {
      expect(sanitizeCssColor('red; background-image: url(https://evil.example/x)', '#120F17')).toBe(
        '#120F17'
      );
      expect(sanitizeCssColor('url(javascript:alert(1))', '#120F17')).toBe('#120F17');
      expect(sanitizeCssColor('expression(alert(1))', '#120F17')).toBe('#120F17');
      expect(sanitizeCssColor('"#111116"', '#120F17')).toBe('#120F17');
    });
  });

  describe('buildGlowVars', () => {
    it('generates all seven opacity tier CSS variables', () => {
      const vars = buildGlowVars('40 80 80', 1.0);
      expect(vars['--glow-color']).toBe('hsl(40deg 80% 80% / 100%)');
      expect(vars['--glow-color-60']).toBe('hsl(40deg 80% 80% / 60%)');
      expect(vars['--glow-color-50']).toBe('hsl(40deg 80% 80% / 50%)');
      expect(vars['--glow-color-40']).toBe('hsl(40deg 80% 80% / 40%)');
      expect(vars['--glow-color-30']).toBe('hsl(40deg 80% 80% / 30%)');
      expect(vars['--glow-color-20']).toBe('hsl(40deg 80% 80% / 20%)');
      expect(vars['--glow-color-10']).toBe('hsl(40deg 80% 80% / 10%)');
    });

    it('caps scaled opacity at 100% when intensity > 1', () => {
      const vars = buildGlowVars('275 85 75', 2.0);
      expect(vars['--glow-color']).toBe('hsl(275deg 85% 75% / 100%)');
      expect(vars['--glow-color-60']).toBe('hsl(275deg 85% 75% / 100%)');
      expect(vars['--glow-color-30']).toBe('hsl(275deg 85% 75% / 60%)');
    });
  });

  describe('buildGradientVars', () => {
    it('maps 3 colors across all seven radial gradients and base gradient', () => {
      const vars = buildGradientVars(['#c084fc', '#f472b6', '#38bdf8']);
      expect(vars['--gradient-one']).toContain('#c084fc');
      expect(vars['--gradient-two']).toContain('#f472b6');
      expect(vars['--gradient-three']).toContain('#38bdf8');
      expect(vars['--gradient-base']).toBe('linear-gradient(#c084fc 0 100%)');
    });

    it('falls back to default palette when colors array is empty', () => {
      const vars = buildGradientVars([]);
      expect(vars['--gradient-one']).toContain(DEFAULT_GLOW_COLORS[0]);
      expect(vars['--gradient-base']).toBe(`linear-gradient(${DEFAULT_GLOW_COLORS[0]} 0 100%)`);
    });

    it('sanitizes unsafe color entries before building gradient declarations', () => {
      const vars = buildGradientVars(['url(https://evil.test/a)', '#f472b6', '#38bdf8']);
      expect(vars['--gradient-one']).not.toContain('url(');
      expect(vars['--gradient-one']).toContain(DEFAULT_GLOW_COLORS[0]);
    });
  });

  describe('isLightColor', () => {
    it('identifies light and dark hex surfaces accurately', () => {
      expect(isLightColor('#ffffff')).toBe(true);
      expect(isLightColor('#fff')).toBe(true);
      expect(isLightColor('#f4f4f5')).toBe(true);
      expect(isLightColor('#111116')).toBe(false);
      expect(isLightColor('#120F17')).toBe(false);
      expect(isLightColor('#08080a')).toBe(false);
      expect(isLightColor('invalid')).toBe(false);
    });
  });

  describe('geometry helpers', () => {
    it('calculates edge proximity from 0 at center to 1 at edges', () => {
      expect(calculateEdgeProximity(200, 100, 100, 50)).toBe(0);
      expect(calculateEdgeProximity(200, 100, 200, 50)).toBe(1);
      expect(calculateEdgeProximity(200, 100, 100, 0)).toBe(1);
      expect(calculateEdgeProximity(200, 100, 150, 50)).toBeCloseTo(0.5, 5);
      expect(calculateEdgeProximity(0, 100, 50, 50)).toBe(0);
    });

    it('calculates clockwise cursor angle from top (0 deg)', () => {
      expect(calculateCursorAngle(200, 200, 100, 0)).toBeCloseTo(0, 5);
      expect(calculateCursorAngle(200, 200, 200, 100)).toBeCloseTo(90, 5);
      expect(calculateCursorAngle(200, 200, 100, 200)).toBeCloseTo(180, 5);
      expect(calculateCursorAngle(200, 200, 0, 100)).toBeCloseTo(270, 5);
      expect(calculateCursorAngle(200, 200, 100, 100)).toBe(0);
      expect(calculateCursorAngle(0, 0, 10, 10)).toBe(0);
    });
  });

  describe('numeric and easing helpers', () => {
    it('clamps finite numbers and guards non-finite inputs', () => {
      expect(clampNumber(50, 0, 100, 30)).toBe(50);
      expect(clampNumber(-5, 0, 100, 30)).toBe(0);
      expect(clampNumber(150, 0, 100, 30)).toBe(100);
      expect(clampNumber(Number.NaN, 0, 100, 30)).toBe(30);
    });

    it('evaluates cubic easing curves at endpoints and midpoint', () => {
      expect(easeInCubic(0)).toBe(0);
      expect(easeInCubic(0.5)).toBeCloseTo(0.125, 5);
      expect(easeInCubic(1)).toBe(1);
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
      expect(easeOutCubic(1)).toBe(1);
    });
  });
});
