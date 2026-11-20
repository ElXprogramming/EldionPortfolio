export const DEFAULT_GLOW_COLORS: readonly string[] = ['#c084fc', '#f472b6', '#38bdf8'];

const HEX_COLOR_REGEX = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const FUNCTIONAL_COLOR_REGEX =
  /^(?:rgba?\(\s*[\d.\s,/%+-]+\)|hsla?\(\s*(?:[\d.+-]+(?:deg|rad|grad|turn)?|[\s,/%])+\))$/i;
const HSL_TRIPLET_REGEX = /([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/;

const GRADIENT_POSITIONS = [
  '80% 55%',
  '69% 34%',
  '8% 6%',
  '41% 38%',
  '86% 85%',
  '82% 18%',
  '51% 4%',
] as const;

const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
] as const;

const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1] as const;

export interface ParsedHSL {
  h: number;
  s: number;
  l: number;
}

export function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

export function sanitizeCssColor(color: string, fallback: string): string {
  if (typeof color !== 'string') {
    return fallback;
  }
  const trimmed = color.trim();
  if (
    trimmed.toLowerCase() === 'transparent' ||
    HEX_COLOR_REGEX.test(trimmed) ||
    FUNCTIONAL_COLOR_REGEX.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}

export function parseHSL(hslStr: string): ParsedHSL {
  if (typeof hslStr !== 'string') {
    return { h: 40, s: 80, l: 80 };
  }
  const match = hslStr.match(HSL_TRIPLET_REGEX);
  if (!match) {
    return { h: 40, s: 80, l: 80 };
  }
  const h = clampNumber(parseFloat(match[1]), 0, 360, 40);
  const s = clampNumber(parseFloat(match[2]), 0, 100, 80);
  const l = clampNumber(parseFloat(match[3]), 0, 100, 80);
  return { h, s, l };
}

export function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const safeIntensity = clampNumber(intensity, 0, 3, 1.0);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10] as const;
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'] as const;
  const vars: Record<string, string> = {};

  for (let i = 0; i < opacities.length; i++) {
    const pct = Math.min(opacities[i] * safeIntensity, 100);
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${pct}%)`;
  }
  return vars;
}

export function buildGradientVars(colors: readonly string[]): Record<string, string> {
  const sourceColors = Array.isArray(colors) && colors.length > 0 ? colors : DEFAULT_GLOW_COLORS;
  const sanitizedColors = sourceColors.map((color, idx) =>
    sanitizeCssColor(color, DEFAULT_GLOW_COLORS[idx % DEFAULT_GLOW_COLORS.length])
  );

  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const color = sanitizedColors[Math.min(COLOR_MAP[i], sanitizedColors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${color} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${sanitizedColors[0]} 0 100%)`;
  return vars;
}

export function isLightColor(color: string): boolean {
  if (typeof color !== 'string') {
    return false;
  }
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) {
    return false;
  }
  const hex =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

export function calculateEdgeProximity(
  width: number,
  height: number,
  x: number,
  y: number
): number {
  if (width <= 0 || height <= 0) {
    return 0;
  }
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

export function calculateCursorAngle(
  width: number,
  height: number,
  x: number,
  y: number
): number {
  if (width <= 0 || height <= 0) {
    return 0;
  }
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 && dy === 0) {
    return 0;
  }
  const radians = Math.atan2(dy, dx);
  let degrees = radians * (180 / Math.PI) + 90;
  if (degrees < 0) {
    degrees += 360;
  }
  return degrees;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(x: number): number {
  return x * x * x;
}
