export type RgbTuple = [number, number, number];
export type FolderTabPosition = 'left' | 'center' | 'right';
export type FolderPhase = 'rest' | 'peek' | 'receive' | 'open';

export interface FolderGeometry {
  scale: number;
  w: number;
  h: number;
  tabH: number;
  r: number;
  shoulder: number;
  tabW: number;
  tabX: number;
  frontTop: number;
  frontH: number;
  docW: number;
  docH: number;
}

export interface CardPlacement {
  x: number;
  y: number;
  r: number;
  s: number;
}

export interface RectBox {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface FlipDelta {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  rotation: number;
}

export interface ProjectedSlot {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
  unitScale: number;
}

const FLAP_REST = [
  { x: 0.16, rise: 0, r: 3 },
  { x: -0.17, rise: 0.05, r: -3.5 },
  { x: 0, rise: 0.1, r: 0.5 },
  { x: 0.25, rise: 0.08, r: 5 },
  { x: -0.25, rise: 0.09, r: -5.5 },
  { x: 0.08, rise: 0.12, r: 1.5 },
] as const;

const SPREAD_TURN = [4, -5, 3, -6, 5, -3] as const;
const SPREAD_DROP = [0.03, -0.04, 0.05, -0.02, 0.04, -0.05] as const;

export const DROP_TURN = [-6, 4, -3, 7, -5, 3] as const;

export const FLAP_ANGLES: Readonly<Record<FolderPhase, number>> = {
  open: -64,
  receive: -30,
  peek: -15,
  rest: 0,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseHexColor(value: string, fallback: RgbTuple = [61, 139, 255]): RgbTuple {
  const cleaned = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(cleaned)) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16),
      parseInt(cleaned[1] + cleaned[1], 16),
      parseInt(cleaned[2] + cleaned[2], 16),
    ];
  }
  if (/^[\da-f]{6}$/i.test(cleaned)) {
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }
  return fallback;
}

export function mixRgb(rgb: RgbTuple, target: RgbTuple, amount: number): RgbTuple {
  return [
    Math.round(rgb[0] + (target[0] - rgb[0]) * amount),
    Math.round(rgb[1] + (target[1] - rgb[1]) * amount),
    Math.round(rgb[2] + (target[2] - rgb[2]) * amount),
  ];
}

export function rgbString(rgb: RgbTuple): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function luma(rgb: RgbTuple): number {
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
}

export function multiplyMatrices(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] +
        a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

export function chainMatrices(...list: readonly (readonly number[])[]): number[] {
  let acc = Array.from(list[0]);
  for (let i = 1; i < list.length; i++) {
    acc = multiplyMatrices(acc, list[i]);
  }
  return acc;
}

export function translateMatrix(x: number, y: number, z = 0): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
}

export function scaleMatrix(x: number, y: number): number[] {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function rotateXMatrix(degrees: number): number[] {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

export function rotateYMatrix(degrees: number): number[] {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function rotateZMatrix(degrees: number): number[] {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

export function matrixToCss(m: readonly number[]): string {
  return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-7 ? 0 : Number(v.toFixed(6)))).join(', ')})`;
}

export function measureFolder(
  scale: number,
  labelWidth: number,
  hasLabel: boolean,
  tabPosition: FolderTabPosition
): FolderGeometry {
  const w = 224 * scale;
  const h = 176 * scale;
  const tabH = 20 * scale;
  const r = 12 * scale;
  const shoulder = tabH * 0.75;
  const frontTop = tabH + h * 0.3;
  const maxTab = w - r * 2 - shoulder * 2 - 10 * scale;
  const tabW = clamp(
    hasLabel ? labelWidth + 14 * scale + shoulder : w * 0.34,
    Math.min(w * 0.3, maxTab),
    maxTab
  );
  const tabX =
    tabPosition === 'left'
      ? r + 5 * scale + shoulder
      : tabPosition === 'center'
        ? (w - tabW) / 2
        : w - r - 5 * scale - shoulder - tabW;
  const docW = w * 0.54;

  return {
    scale,
    w,
    h,
    tabH,
    r,
    shoulder,
    tabW,
    tabX,
    frontTop,
    frontH: tabH + h - frontTop,
    docW,
    docH: docW * 1.22,
  };
}

export function buildFolderBackPath(g: FolderGeometry): string {
  const { w, h, tabX, tabW, tabH, shoulder, r } = g;
  const top = tabH;
  const bottom = tabH + h;
  return [
    `M 0 ${top + r}`,
    `Q 0 ${top} ${r} ${top}`,
    `L ${tabX - shoulder} ${top}`,
    `C ${tabX} ${top} ${tabX} 0 ${tabX + shoulder} 0`,
    `L ${tabX + tabW - shoulder} 0`,
    `C ${tabX + tabW} 0 ${tabX + tabW} ${top} ${tabX + tabW + shoulder} ${top}`,
    `L ${w - r} ${top}`,
    `Q ${w} ${top} ${w} ${top + r}`,
    `L ${w} ${bottom - r}`,
    `Q ${w} ${bottom} ${w - r} ${bottom}`,
    `L ${r} ${bottom}`,
    `Q 0 ${bottom} 0 ${bottom - r}`,
    'Z',
  ].join(' ');
}

export function placeFlapCard(
  rank: number,
  count: number,
  phase: FolderPhase,
  g: FolderGeometry,
  pointer: number | null
): CardPlacement {
  const rest = FLAP_REST[rank] ?? FLAP_REST[FLAP_REST.length - 1];
  const floor = g.tabH + g.h - 6.5 * g.scale - g.docH / 2;

  if (phase === 'open') {
    const mid = Math.max(0, (count - 1) / 2);
    const safeCount = Math.max(1, count);
    const lift = g.tabH - g.h * 0.02;
    const gap = 12 * g.scale;
    const fit = Math.min(0.94, (g.w * 2.3 - gap * (safeCount - 1)) / (safeCount * g.docW));
    const step = g.docW * fit + gap;
    const dropOffset = SPREAD_DROP[rank % SPREAD_DROP.length] * g.h * 0.7;
    const turnOffset = SPREAD_TURN[rank % SPREAD_TURN.length] * 0.55;
    return {
      x: g.w / 2 + (rank - mid) * step,
      y: lift + dropOffset,
      r: turnOffset,
      s: fit,
    };
  }

  const part = phase === 'receive' ? 1.7 : phase === 'peek' ? 1.3 : 1;
  const cardR = phase === 'rest' ? rest.r : rest.r * 1.6;
  const rad = Math.abs((cardR * Math.PI) / 180);
  const halfSpanX = (g.docW * Math.cos(rad) + g.docH * Math.sin(rad)) / 2;
  const wallPad = 4 * g.scale;
  const minX = halfSpanX + wallPad;
  const maxX = Math.max(minX, g.w - halfSpanX - wallPad);
  const x = clamp(g.w / 2 + rest.x * g.w * part, minX, maxX);

  if (phase === 'rest') {
    return { x, y: floor - rest.rise * g.h, r: cardR, s: 1 };
  }

  const near =
    phase === 'peek' && pointer != null
      ? Math.max(0, 1 - Math.abs(pointer - x) / (g.w * 0.32))
      : 0;
  const rise = rest.rise + (phase === 'receive' ? 0.03 : 0.1);
  return {
    x,
    y: floor - rise * g.h - near * near * g.h * 0.09,
    r: cardR,
    s: 1,
  };
}

export function rectToBox(rect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>): RectBox {
  return {
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
    rotation: 0,
  };
}

export function toLocalBox(
  box: RectBox,
  containerRect: Pick<DOMRectReadOnly, 'left' | 'top'>
): RectBox {
  return {
    centerX: box.centerX - containerRect.left,
    centerY: box.centerY - containerRect.top,
    width: box.width,
    height: box.height,
    rotation: box.rotation ?? 0,
  };
}

export function projectFolderSlot(
  slot: CardPlacement,
  lift: number,
  g: FolderGeometry,
  folderDepth: number,
  rootRect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>
): ProjectedSlot {
  const totalH = g.tabH + g.h;
  const pivotX = g.w / 2;
  const pivotY = g.tabH + g.h / 2;
  const z = (3 + lift * 26) * g.scale;
  const persp = folderDepth > z ? folderDepth / (folderDepth - z) : 1;

  const localX = pivotX + (slot.x - pivotX) * persp;
  const localY = pivotY + (slot.y - pivotY) * persp;
  const scaleX = g.w > 0 && rootRect.width > 0 ? rootRect.width / g.w : 1;
  const scaleY = totalH > 0 && rootRect.height > 0 ? rootRect.height / totalH : 1;

  const width = g.docW * slot.s * persp * scaleX;
  const height = g.docH * slot.s * persp * scaleY;

  return {
    centerX: rootRect.left + localX * scaleX,
    centerY: rootRect.top + localY * scaleY,
    width,
    height,
    rotation: slot.r,
    unitScale: g.scale * slot.s * persp * ((scaleX + scaleY) / 2),
  };
}

export function computeFlipDelta(from: RectBox, to: RectBox): FlipDelta {
  const safeToW = Number.isFinite(to.width) && to.width > 0 ? to.width : 1;
  const safeToH = Number.isFinite(to.height) && to.height > 0 ? to.height : 1;
  const safeFromW = Number.isFinite(from.width) && from.width > 0 ? from.width : safeToW;
  const safeFromH = Number.isFinite(from.height) && from.height > 0 ? from.height : safeToH;
  const dx = Number.isFinite(from.centerX - to.centerX) ? from.centerX - to.centerX : 0;
  const dy = Number.isFinite(from.centerY - to.centerY) ? from.centerY - to.centerY : 0;
  const rotation = Number.isFinite((from.rotation ?? 0) - (to.rotation ?? 0))
    ? (from.rotation ?? 0) - (to.rotation ?? 0)
    : 0;

  return {
    dx,
    dy,
    sx: clamp(safeFromW / safeToW, 0.05, 12),
    sy: clamp(safeFromH / safeToH, 0.05, 12),
    rotation,
  };
}

export function buildFlipTransform(delta: FlipDelta): string {
  return `translate3d(${delta.dx.toFixed(2)}px, ${delta.dy.toFixed(2)}px, 0) rotate(${delta.rotation.toFixed(2)}deg) scale(${delta.sx.toFixed(4)}, ${delta.sy.toFixed(4)})`;
}
