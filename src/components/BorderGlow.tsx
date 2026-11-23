import { useRef, useCallback, useEffect, useMemo, type ReactNode, type CSSProperties, type PointerEvent } from 'react';
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
  sanitizeCssColor,
} from '../lib/borderGlowUtils';
import './BorderGlow.css';

export interface BorderGlowProps {
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: readonly string[];
  fillOpacity?: number;
}

type CSSCustomProperties = CSSProperties & Record<`--${string}`, string | number>;

interface AnimateValueOptions {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateValueOptions): () => void {
  const safeDuration = Math.max(1, duration);
  const t0 = performance.now() + delay;
  let frame = 0;
  let cancelled = false;

  function tick() {
    if (cancelled) return;
    const elapsed = performance.now() - t0;
    const t = Math.min(Math.max(elapsed / safeDuration, 0), 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else if (onEnd) {
      onEnd();
    }
  }

  const timer = setTimeout(() => {
    if (!cancelled) {
      frame = requestAnimationFrame(tick);
    }
  }, delay);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  };
}

const BorderGlow = ({
  children,
  className = '',
  innerClassName = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  colors = DEFAULT_GLOW_COLORS,
  fillOpacity = 0.5,
}: BorderGlowProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const moveRafRef = useRef(0);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerEnter = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      rectRef.current = card.getBoundingClientRect();
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    rectRef.current = null;
    if (moveRafRef.current) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = 0;
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    pointerPosRef.current.x = e.clientX;
    pointerPosRef.current.y = e.clientY;
    if (moveRafRef.current) return;

    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = 0;
      const card = cardRef.current;
      if (!card) return;

      const rect = rectRef.current ?? card.getBoundingClientRect();
      rectRef.current = rect;
      if (rect.width === 0 || rect.height === 0) return;

      const x = pointerPosRef.current.x - rect.left;
      const y = pointerPosRef.current.y - rect.top;

      const edge = calculateEdgeProximity(rect.width, rect.height, x, y);
      const angle = calculateCursorAngle(rect.width, rect.height, x, y);

      card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(2)}`);
      card.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!animated || !cardRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    const animations = [
      animateValue({
        duration: 500,
        onUpdate: (v) => card.style.setProperty('--edge-proximity', v.toFixed(3)),
      }),
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: (v) => {
          card.style.setProperty(
            '--cursor-angle',
            `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(3)}deg`
          );
        },
      }),
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: (v) => {
          card.style.setProperty(
            '--cursor-angle',
            `${((angleEnd - angleStart) * (v / 100) + angleStart).toFixed(3)}deg`
          );
        },
      }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: (v) => card.style.setProperty('--edge-proximity', v.toFixed(3)),
        onEnd: () => card.classList.remove('sweep-active'),
      }),
    ];

    return () => {
      animations.forEach((cancel) => cancel());
      card.classList.remove('sweep-active');
      card.style.setProperty('--edge-proximity', '0');
    };
  }, [animated]);

  const safeBackgroundColor = useMemo(
    () => sanitizeCssColor(backgroundColor, '#120F17'),
    [backgroundColor]
  );
  const safeEdgeSensitivity = clampNumber(edgeSensitivity, 0, 79, 30);
  const safeBorderRadius = clampNumber(borderRadius, 0, 100, 28);
  const safeGlowRadius = clampNumber(glowRadius, 0, 120, 40);
  const safeConeSpread = clampNumber(coneSpread, 5, 45, 25);
  const safeFillOpacity = clampNumber(fillOpacity, 0, 1, 0.5);

  const glowVars = useMemo(
    () => buildGlowVars(glowColor, glowIntensity),
    [glowColor, glowIntensity]
  );
  const gradientVars = useMemo(() => buildGradientVars(colors), [colors]);
  const lightSurface = useMemo(() => isLightColor(safeBackgroundColor), [safeBackgroundColor]);

  const cardStyle: CSSCustomProperties = {
    '--card-bg': safeBackgroundColor,
    '--edge-sensitivity': safeEdgeSensitivity,
    '--border-radius': `${safeBorderRadius}px`,
    '--glow-padding': `${safeGlowRadius}px`,
    '--cone-spread': safeConeSpread,
    '--fill-opacity': safeFillOpacity,
    ...glowVars,
    ...gradientVars,
  };

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      className={`border-glow-card${lightSurface ? ' border-glow-card--light' : ''}${className ? ` ${className}` : ''}`}
      style={cardStyle}
    >
      <span className="edge-light" aria-hidden="true" />
      <div className={`border-glow-inner${innerClassName ? ` ${innerClassName}` : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
