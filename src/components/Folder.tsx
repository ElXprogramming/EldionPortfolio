import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from 'react';
import {
  DROP_TURN,
  FLAP_ANGLES,
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
  projectFolderSlot,
  rgbString,
  rotateXMatrix,
  rotateYMatrix,
  rotateZMatrix,
  scaleMatrix,
  translateMatrix,
  type CardPlacement,
  type FolderGeometry,
  type FolderPhase,
  type FolderTabPosition,
} from '../lib/folderUtils';
import './Folder.css';

export interface FolderItem {
  title?: string;
  image: string;
  alt?: string;
}

export interface FolderItemSnapshot {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
}

export interface FolderItemTarget extends FolderItemSnapshot {
  unitScale: number;
  intoPocket: boolean;
}

export interface FolderHandle {
  getItemSnapshot: (index: number) => FolderItemSnapshot | null;
  prepareItemReturn: (index: number) => FolderItemTarget | null;
  completeItemReturn: (index: number, intoPocket?: boolean) => void;
}

export interface FolderProps {
  ref?: Ref<FolderHandle>;
  items: readonly FolderItem[];
  label?: string;
  color?: string;
  paperColor?: string;
  tabPosition?: FolderTabPosition;
  size?: number;
  defaultOpen?: boolean;
  selectedIndex?: number | null;
  extractSelected?: boolean;
  inFlightIndices?: readonly number[];
  onItemClick?: (
    item: FolderItem,
    index: number,
    snapshot: FolderItemSnapshot | null
  ) => void;
  draggable?: boolean;
  zoomOnClick?: boolean;
  className?: string;
}

const TAU = Math.PI * 2;
const STEP = 1 / 240;
const MAX_ITEMS = 6;
const DEFAULT_TILT = 0.5;
const DEFAULT_BOUNCE = 0.4;
const DEFAULT_SPEED = 1;
const LAYERS = { out: 50, drag: 80, focus: 90 } as const;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface SpringValue {
  value: number;
  velocity: number;
}

interface SimItem {
  x: SpringValue;
  y: SpringValue;
  r: SpringValue;
  s: SpringValue;
  hover: SpringValue;
  mx: SpringValue;
  my: SpringValue;
  alpha: SpringValue;
  place: 'inside' | 'out';
  rank: number;
  layer: 'inside' | 'out' | 'drag' | 'focus';
  elevated: boolean;
  entering: boolean;
  enterDeadline: number;
  outX: number;
  outY: number;
  outR: number;
  outS: number;
  outOrder: number;
  localX: number;
  localY: number;
  fresh: boolean;
}

interface DragState {
  index: number;
  id: number;
  clientX: number;
  clientY: number;
  downX: number;
  downY: number;
  grabX: number;
  grabY: number;
  scale: number;
  clip: { left: number; top: number; right: number; bottom: number } | null;
  active: boolean;
  samples: [number, number, number][];
}

interface FolderEngineHandle {
  wake: () => void;
  consumeClick: () => boolean;
  interactive: (index: number) => boolean;
  select: (index: number) => void;
  setFocus: (index: number) => void;
  blur: () => boolean;
  getItemSnapshot: (index: number) => FolderItemSnapshot | null;
  prepareItemReturn: (index: number) => FolderItemTarget | null;
  completeItemReturn: (index: number, intoPocket?: boolean) => void;
}

interface FolderRuntimeSettings {
  open: boolean;
  draggable: boolean;
  zoomOnClick: boolean;
  selectedIndex: number | null | undefined;
  extractSelected: boolean;
  inFlightIndices: readonly number[];
  onItemClick: FolderProps['onItemClick'];
  count: number;
  entries: readonly FolderItem[];
  g: FolderGeometry;
}

const createSpring = (value: number): SpringValue => ({ value, velocity: 0 });

const snapSpring = (spring: SpringValue, value: number) => {
  spring.value = value;
  spring.velocity = 0;
};

const integrateSpring = (
  spring: SpringValue,
  target: number,
  omega: number,
  zeta: number,
  dt: number
): boolean => {
  const k = omega * omega;
  const d = 2 * zeta * omega;
  const steps = Math.max(1, Math.ceil(dt / STEP));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    spring.velocity += (k * (target - spring.value) - d * spring.velocity) * step;
    spring.value += spring.velocity * step;
  }
  return Math.abs(target - spring.value) > 0.01 || Math.abs(spring.velocity) > 0.01;
};

const velocityOf = (samples: readonly [number, number, number][]): [number, number] => {
  if (samples.length < 2) return [0, 0];
  const first = samples[0];
  const last = samples[samples.length - 1];
  const span = Math.max(0.016, (last[0] - first[0]) / 1000);
  return [(last[1] - first[1]) / span, (last[2] - first[2]) / span];
};

const EMPTY_IN_FLIGHT: readonly number[] = [];

export default function Folder({
  ref,
  items,
  label,
  color = '#3b1d60',
  paperColor = '#ffffff',
  tabPosition = 'left',
  size = 1,
  defaultOpen = false,
  selectedIndex,
  extractSelected = false,
  inFlightIndices = EMPTY_IN_FLIGHT,
  onItemClick,
  draggable = true,
  zoomOnClick = true,
  className = '',
}: FolderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const measureRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<FolderEngineHandle | null>(null);

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [labelWidth, setLabelWidth] = useState(0);
  const [outside, setOutside] = useState<number[]>([]);

  const entries = useMemo(() => items.slice(0, MAX_ITEMS), [items]);
  const count = entries.length;
  const scale = Math.max(0.3, Number(size) || 1);

  const g = useMemo(
    () => measureFolder(scale, labelWidth, Boolean(label), tabPosition),
    [scale, labelWidth, label, tabPosition]
  );
  const totalHeight = g.tabH + g.h;
  const folderDepth = Math.round(Math.max(g.w, g.h) * 5);

  useIsomorphicLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return undefined;
    let active = true;
    const measure = () => {
      if (active) setLabelWidth(node.offsetWidth);
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => {
      active = false;
    };
  }, [label, scale]);

  const setOpenRef = useRef(setIsOpen);
  const settingsRef = useRef<FolderRuntimeSettings>({
    open: isOpen,
    draggable,
    zoomOnClick,
    selectedIndex,
    extractSelected,
    inFlightIndices,
    onItemClick,
    count,
    entries,
    g,
  });

  useImperativeHandle(
    ref,
    () => ({
      getItemSnapshot: (index: number) => engineRef.current?.getItemSnapshot(index) ?? null,
      prepareItemReturn: (index: number) => engineRef.current?.prepareItemReturn(index) ?? null,
      completeItemReturn: (index: number, intoPocket?: boolean) => {
        engineRef.current?.completeItemReturn(index, intoPocket);
      },
    }),
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const state = {
      raf: 0,
      last: 0,
      ready: false,
      hovered: false,
      pressed: false,
      pointerX: 0,
      pointerY: 0,
      deskX: 0,
      deskY: 0,
      hoveredItem: -1,
      phase: 'rest' as FolderPhase,
      previous: 'rest' as FolderPhase,
      changedAt: 0,
      closedAt: 0,
      front: createSpring(0),
      rx: createSpring(0),
      ry: createSpring(0),
      lift: createSpring(0),
      squash: createSpring(1),
      items: [] as SimItem[],
      focus: -1,
      drag: null as DragState | null,
      receiving: false,
      receiveUntil: 0,
      suppressClick: false,
      dropCount: 0,
      intro: { phase: 'done' as 'wait' | 'run' | 'done', start: 0, opening: false },
      appear: 1,
    };

    const syncOutside = () => {
      const list: number[] = [];
      state.items.forEach((item, index) => {
        if (item.place === 'out') list.push(index);
      });
      setOutside((prev) =>
        prev.length === list.length && prev.every((value, i) => value === list[i]) ? prev : list
      );
    };

    const ensureItems = (n: number) => {
      while (state.items.length < n) {
        state.items.push({
          x: createSpring(0),
          y: createSpring(0),
          r: createSpring(0),
          s: createSpring(1),
          hover: createSpring(0),
          mx: createSpring(0),
          my: createSpring(0),
          alpha: createSpring(1),
          place: 'inside',
          rank: 0,
          layer: 'inside',
          elevated: false,
          entering: false,
          enterDeadline: 0,
          outX: 0,
          outY: 0,
          outR: 0,
          outS: 1,
          outOrder: 0,
          localX: 0,
          localY: 0,
          fresh: true,
        });
      }
      if (state.items.length > n) {
        state.items.length = n;
        if (state.focus >= n) state.focus = -1;
        syncOutside();
      }
    };

    const toDesk = (clientX: number, clientY: number): [number, number] => {
      const box = root.getBoundingClientRect();
      const kx = root.offsetWidth / (box.width || 1);
      const ky = root.offsetHeight / (box.height || 1);
      return [(clientX - box.left) * kx, (clientY - box.top) * ky];
    };

    const clipBounds = () => {
      const box = root.getBoundingClientRect();
      let left = 0;
      let top = 0;
      let right = window.innerWidth;
      let bottom = window.innerHeight;
      const mainNode = root.closest('main');
      if (mainNode) {
        const mainRect = mainNode.getBoundingClientRect();
        const padLeft = parseFloat(getComputedStyle(mainNode).paddingLeft) || 0;
        left = Math.max(left, mainRect.left + padLeft);
      }
      for (let node = root.parentElement; node && node !== document.body; node = node.parentElement) {
        const computed = getComputedStyle(node);
        if (/(hidden|clip|auto|scroll)/.test(`${computed.overflowX} ${computed.overflowY}`)) {
          const rect = node.getBoundingClientRect();
          left = Math.max(left, rect.left);
          top = Math.max(top, rect.top);
          right = Math.min(right, rect.right);
          bottom = Math.min(bottom, rect.bottom);
          break;
        }
      }
      const kx = root.offsetWidth / (box.width || 1);
      const ky = root.offsetHeight / (box.height || 1);
      return {
        left: (left - box.left) * kx,
        top: (top - box.top) * ky,
        right: (right - box.left) * kx,
        bottom: (bottom - box.top) * ky,
      };
    };

    const overFolder = (x: number, y: number, draggedItem?: SimItem | null): boolean => {
      const s = settingsRef.current;
      const { g: geom } = s;
      const pad = 14 * geom.scale;
      const topLimit = s.open ? -geom.docH * 0.45 : -pad;
      if (x >= -pad && x <= geom.w + pad && y >= topLimit && y <= geom.tabH + geom.h + pad) {
        return true;
      }
      // If an inside item in an open folder was only nudged near its own slot, keep it inside
      if (s.open && draggedItem && draggedItem.place === 'inside') {
        const insideCount = state.items.reduce(
          (acc, it) => acc + (it.place === 'inside' ? 1 : 0),
          0
        );
        const slot = placeFlapCard(draggedItem.rank, insideCount, 'open', geom, null);
        const itemX = x + (state.drag?.grabX ?? 0);
        const itemY = y + (state.drag?.grabY ?? 0);
        if (Math.hypot(itemX - slot.x, itemY - slot.y) <= 36 * geom.scale) {
          return true;
        }
      }
      return false;
    };

    const inPocket = (item: SimItem): boolean => {
      const { g: geom } = settingsRef.current;
      if (state.front.value < -45) return false;
      const halfW = (geom.docW * item.s.value) / 2;
      const halfH = (geom.docH * item.s.value) / 2;
      return (
        item.y.value + halfH > geom.frontTop + 4 * geom.scale &&
        item.x.value + halfW > 0 &&
        item.x.value - halfW < geom.w
      );
    };

    const phaseOf = (s: FolderRuntimeSettings, time: number): FolderPhase => {
      if (s.open) return 'open';
      if (state.receiving || time < state.receiveUntil) return 'receive';
      if (state.hovered && !state.drag?.active) return 'peek';
      return 'rest';
    };

    const place = (rank: number, inside: number, phase: FolderPhase, s: FolderRuntimeSettings): CardPlacement => {
      const pointer = state.hovered ? ((state.pointerX + 1) / 2) * s.g.w : null;
      return placeFlapCard(rank, inside, phase, s.g, pointer);
    };

    const write = () => {
      const s = settingsRef.current;
      const { w, h, tabH, frontH, docW, docH, scale: sc } = s.g;
      const pivotX = w / 2;
      const pivotY = tabH + h / 2;
      const theta = state.front.value;
      const angle = (theta * Math.PI) / 180;
      const zoom =
        (1 + state.lift.value * 0.012) * state.squash.value * (0.94 + 0.06 * state.appear);
      root.style.opacity = state.appear < 0.999 ? state.appear.toFixed(3) : '';

      const desk = chainMatrices(
        translateMatrix(pivotX, pivotY),
        rotateXMatrix(state.rx.value),
        rotateYMatrix(state.ry.value),
        scaleMatrix(zoom, zoom),
        translateMatrix(-pivotX, -pivotY)
      );

      if (backRef.current) {
        backRef.current.style.transform = matrixToCss(desk);
        backRef.current.style.setProperty(
          '--folder-label',
          (1 - clamp((-theta - 18) / 26, 0, 1)).toFixed(3)
        );
      }

      const frontMatrix = chainMatrices(
        desk,
        translateMatrix(0, tabH + h, 2 * sc),
        rotateXMatrix(theta),
        translateMatrix(0, -frontH)
      );
      const light = (Math.sin(angle) * 0.5 + Math.cos(angle) * 0.86) / 0.86;
      const glint = clamp((light - 1) * 0.9, 0, 0.18);
      const dim = clamp((1 - light) * 0.22, 0, 0.5);

      if (frontRef.current) {
        frontRef.current.style.transform = matrixToCss(frontMatrix);
        frontRef.current.style.setProperty('--folder-glint', glint.toFixed(3));
        frontRef.current.style.setProperty('--folder-dim', dim.toFixed(3));
      }

      if (groundRef.current) {
        groundRef.current.style.transform = matrixToCss(
          multiplyMatrices(desk, translateMatrix(0, tabH + h))
        );
        groundRef.current.style.opacity = (0.75 + state.lift.value * 0.25).toFixed(3);
      }

      const outs = state.items
        .map((item, index) => [item, index] as const)
        .filter(([item]) => item.layer === 'out')
        .sort((a, b) => a[0].outOrder - b[0].outOrder)
        .map(([, index]) => index);

      state.items.forEach((item, index) => {
        const node = itemRefs.current[index];
        if (!node) return;
        const z = 3 * sc + item.hover.value * 26 * sc;
        const matrix = chainMatrices(
          desk,
          translateMatrix(item.x.value + item.mx.value, item.y.value + item.my.value, z),
          rotateZMatrix(item.r.value),
          scaleMatrix(item.s.value, item.s.value),
          translateMatrix(-docW / 2, -docH / 2)
        );
        let layer = 10 + s.count - item.rank;
        if (item.layer === 'inside' && state.phase === 'open' && state.hoveredItem === index) {
          layer = 30;
        }
        if (item.layer === 'out') layer = LAYERS.out + outs.indexOf(index);
        if (item.layer === 'drag') layer = LAYERS.drag;
        if (item.layer === 'focus') layer = LAYERS.focus;

        node.style.transform = matrixToCss(matrix);
        node.style.zIndex = String(layer);
        node.style.setProperty('--folder-lift', clamp(item.hover.value, 0, 2.4).toFixed(3));
        node.style.opacity = item.alpha.value < 0.995 ? Math.max(0, item.alpha.value).toFixed(3) : '';
      });
    };

    const frame = (now: number) => {
      state.raf = 0;
      const s = settingsRef.current;
      const { g: geom } = s;
      ensureItems(s.count);

      const time = now / 1000;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;

      const zeta = reduce ? 1 : 1 - 0.72 * DEFAULT_BOUNCE;
      const frontOmega = TAU * 2 * DEFAULT_SPEED;
      const itemOmega = TAU * 2.1 * DEFAULT_SPEED;
      const soft = TAU * 1.6 * DEFAULT_SPEED;

      const phase = phaseOf(s, time);
      if (phase !== state.phase) {
        if (state.phase === 'open' && phase !== 'open') {
          state.closedAt = now;
        }
        state.previous = state.phase;
        state.phase = phase;
        state.changedAt = now;
      }
      const elapsed = (now - state.changedAt) / 1000;
      const sinceClose = state.closedAt > 0 ? (now - state.closedAt) / 1000 : Infinity;
      let busy = time < state.receiveUntil;

      const ranks: number[] = [];
      state.items.forEach((item, index) => {
        if (item.place === 'inside') ranks.push(index);
      });
      const inside = ranks.length;
      ranks.forEach((index, rank) => {
        state.items[index].rank = rank;
      });
      if (state.focus >= 0 && phase !== 'open' && state.items[state.focus]?.place === 'inside') {
        state.focus = -1;
      }

      const intro = state.intro;
      if (!state.ready) intro.opening = s.open;
      if (intro.phase === 'run' && !intro.opening && (s.open || state.drag?.active)) {
        intro.phase = 'done';
      }
      const introTime = intro.phase === 'run' ? time - intro.start : 0;
      const staged = intro.phase !== 'done' && !intro.opening;
      const closeAt = (0.16 + inside * 0.085 + 0.3) / DEFAULT_SPEED;
      const holding = staged && introTime < closeAt;
      const dropAt = (rank: number) => (0.16 + (inside - 1 - rank) * 0.085) / DEFAULT_SPEED;
      const introPose = (item: SimItem, slot: CardPlacement): CardPlacement => ({
        ...slot,
        y: slot.y - (geom.h * 0.8 + geom.docH * 0.5),
        r: slot.r + (item.rank % 2 ? 9 : -7),
      });

      if (intro.phase === 'run') {
        busy = true;
        if (introTime > (intro.opening ? 1.4 : closeAt + 1) / DEFAULT_SPEED) {
          intro.phase = 'done';
        }
      }
      const appear =
        intro.phase === 'wait'
          ? 0
          : intro.phase === 'run'
            ? clamp(introTime / (0.34 / DEFAULT_SPEED), 0, 1)
            : 1;
      state.appear = 1 - (1 - appear) ** 3;

      const closingDelay = !s.open && !reduce ? (0.08 + 0.035 * inside) / DEFAULT_SPEED : 0;
      const holdingOpenForClose = sinceClose < closingDelay;
      const frontPhase: FolderPhase = holdingOpenForClose ? 'open' : phase;
      const frontTarget = holding ? -42 : FLAP_ANGLES[frontPhase];

      if (!state.ready) {
        state.ready = true;
        const openingIntro = intro.phase !== 'done' && intro.opening;
        if (openingIntro) {
          state.phase = 'rest';
          state.previous = 'rest';
        }
        snapSpring(state.front, openingIntro ? 0 : frontTarget);
        state.items.forEach((item) => {
          const slot = place(item.rank, inside, openingIntro ? 'rest' : phase, s);
          const target = staged ? introPose(item, slot) : slot;
          snapSpring(item.x, target.x);
          snapSpring(item.y, target.y);
          snapSpring(item.r, target.r);
          snapSpring(item.s, target.s);
          snapSpring(item.alpha, staged ? 0 : 1);
          snapSpring(item.hover, 0);
          item.fresh = false;
        });
      }

      if (intro.phase === 'wait') {
        write();
        state.last = 0;
        return;
      }

      busy = integrateSpring(state.front, frontTarget, frontOmega, zeta, dt) || busy;
      if (state.front.value > 0) {
        const restitution = 0.2 + 0.35 * DEFAULT_BOUNCE;
        state.front.value = -state.front.value;
        state.front.velocity = -state.front.velocity * restitution;
      }
      if (holdingOpenForClose) busy = true;

      const engaged = state.hovered && !reduce;
      busy = integrateSpring(state.rx, engaged ? -state.pointerY * 8 * DEFAULT_TILT : 0, soft, 1, dt) || busy;
      busy = integrateSpring(state.ry, engaged ? state.pointerX * 10 * DEFAULT_TILT : 0, soft, 1, dt) || busy;
      busy = integrateSpring(state.lift, state.hovered && phase !== 'open' ? 1 : 0, soft, 1, dt) || busy;
      busy = integrateSpring(state.squash, state.pressed ? 0.975 : 1, TAU * 3.2, 0.6, dt) || busy;

      const opening = phase === 'open' && state.previous !== 'open';
      const drag = state.drag?.active ? state.drag : null;
      const hover = state.hoveredItem;
      const hovering = !drag && hover >= 0 && state.items[hover] ? state.items[hover] : null;
      const lead =
        hovering && hovering.place === 'inside' && phase === 'open'
          ? place(hovering.rank, inside, 'open', s)
          : null;
      const focusScale = clamp(((geom.tabH + geom.h) * 1.18) / geom.docH, 1.2, 2.2);
      const focusY = geom.tabH + geom.h * 0.36;
      const frontAngleRad = (state.front.value * Math.PI) / 180;
      const frontLipY = geom.tabH + geom.h - geom.frontH * Math.cos(frontAngleRad);

      state.items.forEach((item, index) => {
        if (item.fresh) {
          const start = place(item.rank, inside, 'rest', s);
          snapSpring(item.x, start.x);
          snapSpring(item.y, start.y);
          snapSpring(item.r, start.r);
          item.fresh = false;
        }

        let target: CardPlacement;
        let omega = itemOmega;
        let omegaX = itemOmega;
        let damping = zeta;
        let lift = 0;
        let fade = 1;
        let magnet = false;

        if (state.focus === index) {
          target = { x: geom.w / 2, y: focusY, r: 0, s: focusScale };
          lift = 2.4;
          item.layer = 'focus';
        } else if (drag && drag.index === index) {
          const [vx] = velocityOf(drag.samples);
          target = {
            x: state.deskX + drag.grabX,
            y: state.deskY + drag.grabY,
            r: clamp(vx * 0.012, -14, 14),
            s: drag.scale * 1.05,
          };
          omega = TAU * 5;
          omegaX = omega;
          damping = 0.78;
          lift = 1.4;
          if (!item.elevated && !inPocket(item)) item.elevated = true;
          item.layer = item.elevated ? 'drag' : 'inside';
        } else if (item.place === 'out') {
          target = { x: item.outX, y: item.outY, r: item.outR, s: item.outS };
          lift = hover === index ? 1 : 0.15;
          magnet = hover === index;
          item.layer = 'out';
        } else {
          const delay = reduce
            ? 0
            : opening
              ? (0.05 + item.rank * 0.045) / DEFAULT_SPEED
              : (item.rank * 0.03) / DEFAULT_SPEED;
          const itemElapsed = !s.open && sinceClose < 0.5 ? sinceClose : elapsed;
          const prevForStagger: FolderPhase = !s.open && sinceClose < 0.5 ? 'open' : state.previous;
          const activePhase = itemElapsed >= delay ? phase : prevForStagger;
          const isItemInFlight = s.inFlightIndices.includes(index);
          target = isItemInFlight
            ? placeFlapCard(item.rank, inside, activePhase, geom, null)
            : place(item.rank, inside, activePhase, s);
          if (itemElapsed < delay) busy = true;

          const rad = Math.abs((item.r.value * Math.PI) / 180);
          const halfSpanX =
            ((geom.docW * Math.cos(rad) + geom.docH * Math.sin(rad)) * item.s.value) / 2;
          const halfSpanY =
            ((geom.docW * Math.sin(rad) + geom.docH * Math.cos(rad)) * item.s.value) / 2;
          const wallPad = 4 * geom.scale;
          const minPocketX = halfSpanX + wallPad;
          const maxPocketX = Math.max(minPocketX, geom.w - halfSpanX - wallPad);

          if (staged && introTime < dropAt(item.rank)) {
            target = introPose(item, target);
            fade = 0;
            item.layer = 'inside';
          } else if (item.entering) {
            if (phase === 'open') {
              const overlapsFlap = item.y.value + halfSpanY > frontLipY - 2 * geom.scale;
              const stillTraveling =
                Math.hypot(item.x.value - target.x, item.y.value - target.y) > 14 * geom.scale &&
                time < item.enterDeadline;
              if (overlapsFlap || stillTraveling) {
                busy = true;
                item.layer = 'drag';
                lift = 0.5;
              } else {
                item.entering = false;
                item.elevated = false;
                item.layer = 'inside';
                lift = 0.2;
              }
            } else {
              const clearedLip = item.y.value + halfSpanY <= frontLipY + 2 * geom.scale;
              const withinWalls =
                item.x.value >= minPocketX - 8 * geom.scale &&
                item.x.value <= maxPocketX + 8 * geom.scale;
              if ((clearedLip && withinWalls) || time >= item.enterDeadline) {
                item.entering = false;
                item.elevated = false;
                item.layer = 'inside';
                state.receiveUntil = Math.max(state.receiveUntil, time + 0.22 / DEFAULT_SPEED);
              } else {
                busy = true;
                target = {
                  ...target,
                  y: Math.min(target.y, frontLipY - halfSpanY - 6 * geom.scale),
                };
                omega = itemOmega * 1.35;
                omegaX = omega;
                item.layer = 'drag';
                lift = 0.6;
              }
            }
          } else {
            item.elevated = false;
            item.layer = 'inside';
            if (activePhase !== 'open') {
              // Gather fanned-out outer cards over the folder mouth before dropping behind front flap
              const outsideWalls =
                item.x.value < minPocketX - 4 * geom.scale ||
                item.x.value > maxPocketX + 4 * geom.scale;
              if (outsideWalls) {
                busy = true;
                omegaX = itemOmega * 1.4;
                target = {
                  ...target,
                  y: Math.min(target.y, frontLipY - halfSpanY - 4 * geom.scale),
                };
              }
            } else if (lead && !isItemInFlight) {
              if (hover === index) {
                target = {
                  ...target,
                  y: target.y - 6 * geom.scale,
                  r: target.r * 0.2,
                  s: target.s * 1.05,
                };
                lift = 1;
                magnet = true;
              } else {
                const distance = target.x - lead.x;
                target = {
                  ...target,
                  x:
                    target.x +
                    Math.sign(distance) *
                      12 *
                      geom.scale *
                      Math.max(0, 1 - Math.abs(distance) / (geom.w * 1.1)),
                };
                lift = 0.2;
              }
            } else if (activePhase === 'open') {
              lift = 0.2;
            }
          }
        }

        busy = integrateSpring(item.x, target.x, omegaX, damping, dt) || busy;
        busy = integrateSpring(item.y, target.y, omega, damping, dt) || busy;
        if (item.layer === 'inside') {
          const tiltVal = (item.r.value * Math.PI) / 180;
          const reach =
            ((geom.docW * Math.abs(Math.sin(tiltVal)) + geom.docH * Math.abs(Math.cos(tiltVal))) *
              item.s.value) /
            2;
          const floor = geom.tabH + geom.h - 1.5 * geom.scale - reach;
          if (item.y.value > floor) {
            item.y.value = floor;
            if (item.y.velocity > 0) item.y.velocity *= -0.25;
          }
        }
        busy = integrateSpring(item.r, target.r, omega, damping, dt) || busy;
        busy = integrateSpring(item.s, target.s, itemOmega, zeta, dt) || busy;
        busy = integrateSpring(item.hover, lift, itemOmega, zeta, dt) || busy;
        busy = integrateSpring(item.alpha, fade, TAU * 3 * DEFAULT_SPEED, 1, dt) || busy;
        busy =
          integrateSpring(item.mx, magnet ? item.localX * 7 * geom.scale : 0, soft, 0.85, dt) || busy;
        busy =
          integrateSpring(item.my, magnet ? item.localY * 7 * geom.scale : 0, soft, 0.85, dt) || busy;
      });

      write();
      if (busy || drag) state.raf = requestAnimationFrame(frame);
      else state.last = 0;
    };

    const wake = () => {
      if (!state.raf) state.raf = requestAnimationFrame(frame);
    };

    const beginIntro = () => {
      if (state.intro.phase !== 'wait') return;
      state.intro.phase = 'run';
      state.intro.start = performance.now() / 1000;
      wake();
    };

    const updateReceiving = () => {
      const drag = state.drag;
      const item = drag ? state.items[drag.index] : null;
      state.receiving = Boolean(
        drag?.active &&
          item &&
          (item.place === 'out' || item.elevated) &&
          overFolder(state.deskX, state.deskY, item)
      );
    };

    const startDrag = (drag: DragState) => {
      const item = state.items[drag.index];
      if (!item) return;
      drag.active = true;
      drag.grabX = item.x.value - drag.downX;
      drag.grabY = item.y.value - drag.downY;
      drag.scale = item.place === 'out' ? item.outS : item.s.value;
      drag.clip = clipBounds();
      state.suppressClick = true;
      if (state.focus === drag.index) state.focus = -1;
      item.elevated = item.place === 'out' || !inPocket(item);
      root.dataset.dragging = '';
    };

    const drop = (drag: DragState, cancelled: boolean) => {
      const s = settingsRef.current;
      const item = state.items[drag.index];
      state.receiving = false;
      delete root.dataset.dragging;
      if (!item) return;

      const time = performance.now() / 1000;
      const [vx, vy] = cancelled ? [0, 0] : velocityOf(drag.samples);

      if (overFolder(state.deskX, state.deskY, item)) {
        const wasOutsideOrElevated = item.place === 'out' || item.elevated;
        item.place = 'inside';
        state.hoveredItem = -1;
        item.x.velocity = clamp(vx, -1400, 1400) * 0.35;
        item.y.velocity = clamp(vy, -1400, 1400) * 0.35;
        if (wasOutsideOrElevated && !reduce) {
          item.entering = true;
          item.enterDeadline = time + 0.55 / DEFAULT_SPEED;
          if (!s.open) {
            state.receiveUntil = Math.max(state.receiveUntil, time + 0.52 / DEFAULT_SPEED);
          }
        } else {
          item.entering = false;
          item.elevated = false;
        }
        syncOutside();
        return;
      }

      const clip = drag.clip ?? clipBounds();
      const halfW = (s.g.docW * drag.scale) / 2;
      const halfH = (s.g.docH * drag.scale) / 2;
      const x = state.deskX + drag.grabX + clamp(vx, -2400, 2400) * 0.09;
      const y = state.deskY + drag.grabY + clamp(vy, -2400, 2400) * 0.09;
      item.place = 'out';
      item.entering = false;
      item.elevated = true;
      const margin = 8 * s.g.scale;
      const reachX = halfW * 1.08 + margin;
      const reachY = halfH * 1.08 + margin;
      item.outX = clamp(x, clip.left + reachX, Math.max(clip.left + reachX, clip.right - reachX));
      item.outY = clamp(y, clip.top + reachY, Math.max(clip.top + reachY, clip.bottom - reachY));
      item.outR = clamp(
        item.r.value * 0.5 +
          clamp(vx, -2400, 2400) * 0.003 +
          DROP_TURN[drag.index % DROP_TURN.length] * 0.6,
        -12,
        12
      );
      item.outS = drag.scale;
      state.dropCount += 1;
      item.outOrder = state.dropCount;
      syncOutside();
    };

    const onMove = (event: PointerEvent) => {
      const drag = state.drag;
      if (drag && event.pointerId === drag.id) {
        const [x, y] = toDesk(event.clientX, event.clientY);
        state.deskX = x;
        state.deskY = y;
        const now = performance.now();
        drag.samples.push([now, x, y]);
        while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
        if (!drag.active) {
          const threshold = event.pointerType === 'touch' ? 8 : 4;
          if (Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > threshold) {
            startDrag(drag);
          }
        }
        if (drag.active) updateReceiving();
        wake();
      }
      if (event.pointerType === 'touch') return;

      const box = root.getBoundingClientRect();
      if (box.width > 0 && box.height > 0) {
        state.pointerX = clamp(((event.clientX - box.left) / box.width) * 2 - 1, -1.5, 1.5);
        state.pointerY = clamp(((event.clientY - box.top) / box.height) * 2 - 1, -1.5, 1.5);
      }

      const target = (event.target as HTMLElement).closest?.('[data-folder-item]');
      const rawIndex =
        target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
      const s = settingsRef.current;
      const isGhost =
        rawIndex >= 0 &&
        ((s.extractSelected && s.selectedIndex === rawIndex) ||
          s.inFlightIndices.includes(rawIndex));
      const index = isGhost ? -1 : rawIndex;
      state.hoveredItem = index;
      if (target && index >= 0 && !state.drag?.active) {
        const rect = target.getBoundingClientRect();
        const item = state.items[index];
        if (item && rect.width > 0 && rect.height > 0) {
          item.localX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          item.localY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }
      }
      if (!state.hovered) {
        state.hovered = true;
      }
      wake();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || state.drag?.active) return;
      state.hovered = false;
      state.pressed = false;
      state.hoveredItem = -1;
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      state.suppressClick = false;
      const target = (event.target as HTMLElement).closest?.('[data-folder-item]');
      const targetIndex =
        target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
      const s = settingsRef.current;
      const canDragTarget =
        targetIndex >= 0 &&
        s.draggable &&
        !(s.extractSelected && s.selectedIndex === targetIndex) &&
        !s.inFlightIndices.includes(targetIndex);
      if (target && canDragTarget) {
        const [x, y] = toDesk(event.clientX, event.clientY);
        state.deskX = x;
        state.deskY = y;
        state.drag = {
          index: targetIndex,
          id: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          downX: x,
          downY: y,
          grabX: 0,
          grabY: 0,
          scale: 1,
          clip: null,
          active: false,
          samples: [[performance.now(), x, y]],
        };
        try {
          (target as HTMLElement).setPointerCapture(event.pointerId);
        } catch {
          // Ignore pointer capture failures on synthetic/unsupported events
        }
      } else if (!target || !root.contains(target)) {
        state.pressed = true;
      }
      wake();
    };

    const onUp = (event: PointerEvent) => {
      state.pressed = false;
      const drag = state.drag;
      if (drag && event.pointerId === drag.id) {
        state.drag = null;
        if (drag.active) drop(drag, event.type === 'pointercancel');
      }
      wake();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (state.focus >= 0) {
        state.focus = -1;
        wake();
        return;
      }
      if (settingsRef.current.extractSelected && settingsRef.current.selectedIndex != null) {
        return;
      }
      if (settingsRef.current.open) setOpenRef.current(false);
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('keydown', onKey);

    let observer: IntersectionObserver | null = null;
    if (!reduce) {
      state.intro.phase = 'wait';
      root.style.opacity = '0';
      if (typeof IntersectionObserver === 'undefined') {
        beginIntro();
      } else {
        observer = new IntersectionObserver(
          (ioEntries) => {
            if (!ioEntries.some((entry) => entry.isIntersecting)) return;
            observer?.disconnect();
            beginIntro();
          },
          { threshold: 0.2 }
        );
        observer.observe(root);
      }
    }

    if (settingsRef.current.selectedIndex != null && !settingsRef.current.extractSelected) {
      state.focus = settingsRef.current.selectedIndex;
    }

    const computeMouthSlot = (
      rank: number,
      insideCount: number,
      geom: FolderGeometry
    ): CardPlacement => {
      const receiveSlot = placeFlapCard(rank, insideCount, 'receive', geom, null);
      const receiveLipY =
        geom.tabH + geom.h - geom.frontH * Math.cos((FLAP_ANGLES.receive * Math.PI) / 180);
      const mouthScale = 0.92;
      const mouthRot = receiveSlot.r * 0.5;
      const rad = Math.abs((mouthRot * Math.PI) / 180);
      const halfSpanY =
        ((geom.docW * Math.sin(rad) + geom.docH * Math.cos(rad)) * mouthScale) / 2;
      return {
        x: receiveSlot.x,
        y: Math.min(receiveSlot.y, receiveLipY - halfSpanY - 6 * geom.scale),
        r: mouthRot,
        s: mouthScale,
      };
    };

    const syncInsideRanks = (): number => {
      const insideIndices: number[] = [];
      state.items.forEach((it, idx) => {
        if (it.place === 'inside') insideIndices.push(idx);
      });
      insideIndices.forEach((idx, rnk) => {
        state.items[idx].rank = rnk;
      });
      return insideIndices.length;
    };

    const getItemSnapshot = (index: number): FolderItemSnapshot | null => {
      const node = itemRefs.current[index];
      const sim = state.items[index];
      const s = settingsRef.current;
      if (!node || !sim) return null;
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const rootBox = root.getBoundingClientRect();
      const scaleRatioX = root.offsetWidth > 0 ? rootBox.width / root.offsetWidth : 1;
      const scaleRatioY = root.offsetHeight > 0 ? rootBox.height / root.offsetHeight : 1;
      const zoom =
        (1 + state.lift.value * 0.012) * state.squash.value * (0.94 + 0.06 * state.appear);
      const depth = Math.round(Math.max(s.g.w, s.g.h) * 5);
      const z = (3 + sim.hover.value * 26) * s.g.scale;
      const persp = depth > z ? depth / (depth - z) : 1;
      return {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        width: s.g.docW * sim.s.value * zoom * persp * scaleRatioX,
        height: s.g.docH * sim.s.value * zoom * persp * scaleRatioY,
        rotation: sim.r.value,
      };
    };

    const prepareItemReturn = (index: number): FolderItemTarget | null => {
      const s = settingsRef.current;
      ensureItems(s.count);
      const sim = state.items[index];
      if (!sim || index < 0 || index >= s.count) return null;

      if (state.intro.phase !== 'done') {
        observer?.disconnect();
        state.intro.phase = 'done';
        state.appear = 1;
        root.style.opacity = '';
        if (!state.ready) {
          state.ready = true;
          state.phase = s.open ? 'open' : 'rest';
          state.previous = state.phase;
          snapSpring(state.front, FLAP_ANGLES[state.phase]);
        }
      }

      if (sim.place !== 'inside') {
        sim.place = 'inside';
        sim.elevated = false;
        syncOutside();
      }
      sim.entering = false;
      sim.enterDeadline = 0;

      const insideCount = syncInsideRanks();
      const rootBox = root.getBoundingClientRect();
      if (rootBox.width === 0 || rootBox.height === 0) return null;
      const depth = Math.round(Math.max(s.g.w, s.g.h) * 5);

      if (s.open) {
        const slot = placeFlapCard(sim.rank, insideCount, 'open', s.g, null);
        snapSpring(sim.x, slot.x);
        snapSpring(sim.y, slot.y);
        snapSpring(sim.r, slot.r);
        snapSpring(sim.s, slot.s);
        snapSpring(sim.hover, 0.2);
        snapSpring(sim.mx, 0);
        snapSpring(sim.my, 0);
        snapSpring(sim.alpha, 1);
        sim.fresh = false;
        sim.layer = 'inside';
        write();
        wake();

        return {
          ...projectFolderSlot(slot, 0.2, s.g, depth, rootBox),
          intoPocket: false,
        };
      }

      const nowSec = performance.now() / 1000;
      state.receiveUntil = Math.max(state.receiveUntil, nowSec + 0.65 / DEFAULT_SPEED);
      const mouthSlot = computeMouthSlot(sim.rank, insideCount, s.g);
      snapSpring(sim.x, mouthSlot.x);
      snapSpring(sim.y, mouthSlot.y);
      snapSpring(sim.r, mouthSlot.r);
      snapSpring(sim.s, mouthSlot.s);
      snapSpring(sim.hover, 0.5);
      snapSpring(sim.mx, 0);
      snapSpring(sim.my, 0);
      snapSpring(sim.alpha, 1);
      sim.fresh = false;
      sim.layer = 'inside';
      write();
      wake();

      return {
        ...projectFolderSlot(mouthSlot, 0.5, s.g, depth, rootBox),
        intoPocket: true,
      };
    };

    const completeItemReturn = (index: number, intoPocket = false) => {
      const s = settingsRef.current;
      const sim = state.items[index];
      if (!sim) return;

      if (intoPocket && !s.open) {
        const insideCount = syncInsideRanks();
        const mouthSlot = computeMouthSlot(sim.rank, insideCount, s.g);
        snapSpring(sim.x, mouthSlot.x);
        snapSpring(sim.y, mouthSlot.y);
        snapSpring(sim.r, mouthSlot.r);
        snapSpring(sim.s, mouthSlot.s);
        snapSpring(sim.hover, 0.5);
        snapSpring(sim.mx, 0);
        snapSpring(sim.my, 0);
        snapSpring(sim.alpha, 1);
        sim.y.velocity = reduce ? 0 : 130 * s.g.scale;
        sim.entering = false;
        sim.elevated = false;
        sim.layer = 'inside';
        const nowSec = performance.now() / 1000;
        state.receiveUntil = Math.max(state.receiveUntil, nowSec + 0.26 / DEFAULT_SPEED);
      } else if (s.open) {
        const insideCount = syncInsideRanks();
        const slot = placeFlapCard(sim.rank, insideCount, 'open', s.g, null);
        snapSpring(sim.x, slot.x);
        snapSpring(sim.y, slot.y);
        snapSpring(sim.r, slot.r);
        snapSpring(sim.s, slot.s);
        snapSpring(sim.hover, 0.2);
        snapSpring(sim.mx, 0);
        snapSpring(sim.my, 0);
        snapSpring(sim.alpha, 1);
        sim.entering = false;
        sim.elevated = false;
        sim.layer = 'inside';
      }

      write();
      wake();
    };

    engineRef.current = {
      wake,
      consumeClick: () => {
        if (!state.suppressClick) return false;
        state.suppressClick = false;
        return true;
      },
      interactive: (index) =>
        settingsRef.current.open || state.items[index]?.place === 'out' || state.focus === index,
      select: (index) => {
        const s = settingsRef.current;
        const snapshot = getItemSnapshot(index);
        if (s.extractSelected && s.selectedIndex !== index && state.items[index]?.place === 'out') {
          state.items[index].place = 'inside';
          state.items[index].entering = false;
          state.items[index].elevated = false;
          syncOutside();
        }
        if (s.selectedIndex === undefined && !s.extractSelected && s.zoomOnClick) {
          state.focus = state.focus === index ? -1 : index;
        }
        s.onItemClick?.(s.entries[index], index, snapshot);
        wake();
      },
      setFocus: (idx: number) => {
        if (state.focus !== idx) {
          state.focus = idx;
          wake();
        }
      },
      blur: () => {
        if (state.focus < 0) return false;
        state.focus = -1;
        wake();
        return true;
      },
      getItemSnapshot,
      prepareItemReturn,
      completeItemReturn,
    };
    wake();

    return () => {
      cancelAnimationFrame(state.raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('keydown', onKey);
      observer?.disconnect();
      engineRef.current = null;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    setOpenRef.current = setIsOpen;
    settingsRef.current = {
      open: isOpen,
      draggable,
      zoomOnClick,
      selectedIndex,
      extractSelected,
      inFlightIndices,
      onItemClick,
      count,
      entries,
      g,
    };
    engineRef.current?.wake();
  }, [
    isOpen,
    draggable,
    zoomOnClick,
    selectedIndex,
    extractSelected,
    inFlightIndices,
    onItemClick,
    count,
    entries,
    g,
  ]);

  useEffect(() => {
    if (extractSelected) {
      engineRef.current?.setFocus(-1);
    } else if (selectedIndex !== undefined) {
      engineRef.current?.setFocus(selectedIndex === null ? -1 : selectedIndex);
    }
  }, [selectedIndex, extractSelected]);

  const toggle = useCallback(() => {
    if (engineRef.current?.blur()) return;
    setIsOpen((prev) => !prev);
  }, []);

  const onItemActivate = (
    event: ReactMouseEvent | ReactKeyboardEvent,
    index: number
  ) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.consumeClick()) {
      event.stopPropagation();
      return;
    }
    if (!engine.interactive(index)) return;
    event.stopPropagation();
    engine.select(index);
  };

  const vars = useMemo(() => {
    const rgb = parseHexColor(color, [59, 29, 96]);
    const paper = parseHexColor(paperColor, [255, 255, 255]);
    const backTone = mixRgb(rgb, [0, 0, 0], 0.16);
    const insideTop = rgbString(mixRgb(rgb, [0, 0, 0], 0.08));
    const insideBottom = rgbString(backTone);

    return {
      '--folder-base': rgbString(rgb),
      '--folder-front-top': rgbString(mixRgb(rgb, [255, 255, 255], 0.12)),
      '--folder-front-bottom': rgbString(mixRgb(rgb, [0, 0, 0], 0.06)),
      '--folder-inside-top': insideTop,
      '--folder-inside-bottom': insideBottom,
      '--folder-tab-ink':
        luma(backTone) > 0.6 ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.92)',
      '--folder-paper': rgbString(paper),
      '--folder-w': `${g.w}px`,
      '--folder-h': `${g.h}px`,
      '--folder-tab-h': `${g.tabH}px`,
      '--folder-front-h': `${g.frontH}px`,
      '--folder-front-radius': `${g.r}px`,
      '--folder-doc-w': `${g.docW}px`,
      '--folder-doc-h': `${g.docH}px`,
      '--folder-depth': `${folderDepth}px`,
      '--folder-scale': scale,
    } as CSSProperties;
  }, [color, paperColor, g, folderDepth, scale]);

  const shape = useMemo(() => buildFolderBackPath(g), [g]);

  return (
    <div
      ref={rootRef}
      className={`folder-root${className ? ` ${className}` : ''}`}
      data-open={isOpen ? '' : undefined}
      data-draggable={draggable ? '' : undefined}
      style={vars}
    >
      <div
        className="folder-stage"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={label ? `${label} folder` : 'Folder'}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        }}
      >
        <span ref={groundRef} className="folder-layer folder-ground" aria-hidden="true" />

        <div ref={backRef} className="folder-layer folder-back" aria-hidden="true">
          <div className="folder-back-fill" style={{ clipPath: `path('${shape}')` }} />
          <svg
            className="folder-back-rim"
            width={g.w}
            height={totalHeight}
            viewBox={`0 0 ${g.w} ${totalHeight}`}
          >
            <path className="folder-focus" d={shape} />
          </svg>
          {label && (
            <span className="folder-tab-text" style={{ left: g.tabX, width: g.tabW }}>
              {label}
            </span>
          )}
        </div>

        {entries.map((item, index) => {
          const interactive = isOpen || outside.includes(index);
          const isExtracted = extractSelected && selectedIndex === index;
          const isInFlight = inFlightIndices.includes(index);
          return (
            <div
              key={item.title ?? index}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className="folder-layer folder-item"
              data-folder-item={index}
              data-selected={!extractSelected && selectedIndex === index ? '' : undefined}
              data-extracted={isExtracted ? '' : undefined}
              data-in-flight={isInFlight ? '' : undefined}
              role={interactive ? 'button' : undefined}
              aria-label={
                item.title
                  ? isExtracted
                    ? `Return ${item.title} to folder`
                    : `Open ${item.title}`
                  : undefined
              }
              tabIndex={interactive ? 0 : -1}
              onClick={(event) => onItemActivate(event, index)}
              onKeyDown={(event) => {
                if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();
                event.stopPropagation();
                engineRef.current?.select(index);
              }}
            >
              <div className="folder-photo">
                <img src={item.image} alt={item.alt ?? item.title ?? ''} draggable={false} />
                {item.title && (
                  <div className="folder-photo-caption">
                    <span>{item.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={frontRef} className="folder-layer folder-front" aria-hidden="true">
          <div className="folder-face folder-face-outer" />
        </div>
      </div>

      {label && (
        <span ref={measureRef} className="folder-tab-text folder-measure" aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}
