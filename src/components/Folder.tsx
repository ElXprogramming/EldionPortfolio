import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
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

export interface FolderProps {
  items: readonly FolderItem[];
  label?: string;
  color?: string;
  paperColor?: string;
  tabPosition?: FolderTabPosition;
  size?: number;
  defaultOpen?: boolean;
  selectedIndex?: number | null;
  onItemClick?: (item: FolderItem, index: number) => void;
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
  insertUntil: number;
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
}

interface FolderRuntimeSettings {
  open: boolean;
  draggable: boolean;
  zoomOnClick: boolean;
  selectedIndex: number | null | undefined;
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

export default function Folder({
  items,
  label,
  color = '#3b1d60',
  paperColor = '#ffffff',
  tabPosition = 'left',
  size = 1,
  defaultOpen = false,
  selectedIndex,
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
    onItemClick,
    count,
    entries,
    g,
  });

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
          insertUntil: 0,
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

    const overFolder = (x: number, y: number): boolean => {
      const { g: geom } = settingsRef.current;
      return x >= 0 && x <= geom.w && y >= 0 && y <= geom.tabH + geom.h;
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

    const approach = (slot: CardPlacement, geom: FolderGeometry): CardPlacement => ({
      ...slot,
      y: Math.min(slot.y, geom.frontTop - geom.docH * 0.5 * slot.s - 8 * geom.scale),
    });

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
        state.previous = state.phase;
        state.phase = phase;
        state.changedAt = now;
      }
      const elapsed = (now - state.changedAt) / 1000;
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

      const closing = state.previous === 'open' && phase !== 'open';
      const frontDelay = closing && !reduce ? (0.06 + 0.035 * inside) / DEFAULT_SPEED : 0;
      const frontPhase = elapsed < frontDelay ? state.previous : phase;
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
      if (elapsed < frontDelay) busy = true;

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
          const activePhase = elapsed >= delay ? phase : state.previous;
          target = place(item.rank, inside, activePhase, s);
          if (elapsed < delay) busy = true;

          if (staged && introTime < dropAt(item.rank)) {
            target = introPose(item, target);
            fade = 0;
            item.layer = 'inside';
          } else if (item.insertUntil > time) {
            busy = true;
            target = approach(target, geom);
            item.layer = 'drag';
            lift = 0.6;
          } else {
            item.insertUntil = 0;
            item.elevated = false;
            item.layer = 'inside';
            if (lead && activePhase === 'open') {
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

        busy = integrateSpring(item.x, target.x, omega, damping, dt) || busy;
        busy = integrateSpring(item.y, target.y, omega, damping, dt) || busy;
        if (item.layer === 'inside') {
          const tiltVal = (item.r.value * Math.PI) / 180;
          const reach =
            ((geom.docW * Math.abs(Math.sin(tiltVal)) + geom.docH * Math.abs(Math.cos(tiltVal))) *
              item.s.value) /
            2;
          const floor = geom.tabH + geom.h - 2 * geom.scale - reach;
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
          overFolder(state.deskX, state.deskY)
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

      if (overFolder(state.deskX, state.deskY)) {
        const entering = item.place === 'out' || item.elevated;
        item.place = 'inside';
        if (entering && !reduce) {
          item.insertUntil = time + 0.24 / DEFAULT_SPEED;
          state.receiveUntil = item.insertUntil + 0.14 / DEFAULT_SPEED;
        }
        item.elevated = false;
        syncOutside();
        return;
      }

      const clip = drag.clip ?? clipBounds();
      const halfW = (s.g.docW * drag.scale) / 2;
      const halfH = (s.g.docH * drag.scale) / 2;
      const x = state.deskX + drag.grabX + clamp(vx, -2400, 2400) * 0.09;
      const y = state.deskY + drag.grabY + clamp(vy, -2400, 2400) * 0.09;
      item.place = 'out';
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
      const index = target && root.contains(target) ? Number(target.getAttribute('data-folder-item')) : -1;
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
      if (target && root.contains(target) && settingsRef.current.draggable) {
        const [x, y] = toDesk(event.clientX, event.clientY);
        state.deskX = x;
        state.deskY = y;
        state.drag = {
          index: Number(target.getAttribute('data-folder-item')),
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
      } else {
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

    if (settingsRef.current.selectedIndex != null) {
      state.focus = settingsRef.current.selectedIndex;
    }

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
        if (s.selectedIndex === undefined && s.zoomOnClick) {
          state.focus = state.focus === index ? -1 : index;
        }
        s.onItemClick?.(s.entries[index], index);
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

  useEffect(() => {
    setOpenRef.current = setIsOpen;
    settingsRef.current = {
      open: isOpen,
      draggable,
      zoomOnClick,
      selectedIndex,
      onItemClick,
      count,
      entries,
      g,
    };
    engineRef.current?.wake();
  }, [isOpen, draggable, zoomOnClick, selectedIndex, onItemClick, count, entries, g]);

  useEffect(() => {
    if (selectedIndex !== undefined) {
      engineRef.current?.setFocus(selectedIndex === null ? -1 : selectedIndex);
    }
  }, [selectedIndex]);

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
          return (
            <div
              key={item.title ?? index}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className="folder-layer folder-item"
              data-folder-item={index}
              data-selected={selectedIndex === index ? '' : undefined}
              role={interactive ? 'button' : undefined}
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
