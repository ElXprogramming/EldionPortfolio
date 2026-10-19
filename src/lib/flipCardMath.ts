export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const snap = (deg: number): number => {
  const snapped = Math.round(deg / 180) * 180;
  return Object.is(snapped, -0) ? 0 : snapped;
};

export const isBack = (deg: number): boolean =>
  Math.abs(Math.round(deg / 180)) % 2 === 1;

/**
 * Determines whether the front face of a 3D flip card is oriented toward the viewer
 * for a given rotation angle in degrees.
 *
 * Returns true when cos(deg) >= 0 (i.e. within [-90°, +90°] modulo 360°),
 * and false when the back face is oriented toward the viewer.
 */
export const isFrontFacing = (deg: number): boolean => {
  if (!Number.isFinite(deg)) return true;
  return Math.cos((deg * Math.PI) / 180) >= 0;
};
