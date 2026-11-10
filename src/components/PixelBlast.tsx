import { useEffect, useRef } from 'react';
import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  ShaderMaterial,
  PlaneGeometry,
  Mesh,
  Vector2,
  Color,
  Clock,
  Texture,
  LinearFilter,
  GLSL3,
  type IUniform
} from 'three';
import './PixelBlast.css';

interface TouchPoint {
  x: number;
  y: number;
  age: number;
  force: number;
  vx: number;
  vy: number;
}

interface TouchTexture {
  canvas: HTMLCanvasElement;
  texture: Texture;
  addTouch: (norm: { x: number; y: number }) => void;
  update: () => void;
  radiusScale: number;
  size: number;
}

const createTouchTexture = (): TouchTexture => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new Texture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  const trail: TouchPoint[] = [];
  let last: { x: number; y: number } | null = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;

  let isDirty = false;

  const clear = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawPoint = (p: TouchPoint) => {
    const pos = { x: p.x * size, y: (1 - p.y) * size };
    let intensity: number;
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
    const easeOutQuad = (t: number) => -t * (t - 2);
    if (p.age < maxAge * 0.3) intensity = easeOutSine(p.age / (maxAge * 0.3));
    else intensity = easeOutQuad(1 - (p.age - maxAge * 0.3) / (maxAge * 0.7)) || 0;
    intensity *= p.force;
    const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;
    ctx.shadowOffsetX = offset;
    ctx.shadowOffsetY = offset;
    ctx.shadowBlur = radius;
    ctx.shadowColor = `rgba(${color},${0.22 * intensity})`;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,0,0,1)';
    ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const addTouch = (norm: { x: number; y: number }) => {
    let force = 0;
    let vx = 0;
    let vy = 0;
    if (last) {
      const dx = norm.x - last.x;
      const dy = norm.y - last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / (d || 1);
      vy = dy / (d || 1);
      force = Math.min(dd * 10000, 1);
    }
    last = { x: norm.x, y: norm.y };
    trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
    isDirty = true;
  };

  const update = () => {
    if (trail.length === 0) {
      if (isDirty) {
        clear();
        texture.needsUpdate = true;
        isDirty = false;
      }
      return;
    }
    isDirty = true;
    clear();
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const f = point.force * speed * (1 - point.age / maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > maxAge) trail.splice(i, 1);
    }
    for (let i = 0; i < trail.length; i++) drawPoint(trail[i]);
    texture.needsUpdate = true;
  };

  return {
    canvas,
    texture,
    addTouch,
    update,
    set radiusScale(v: number) {
      radius = 0.1 * size * v;
    },
    get radiusScale() {
      return radius / (0.1 * size);
    },
    size
  };
};

const createDummyTexture = (): Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1, 1);
  }
  const texture = new Texture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

const SHAPE_MAP = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3
} as const;

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform sampler2D uTouchTexture;
uniform int       uUseLiquid;
uniform float     uLiquidStrength;
uniform float     uLiquidFreq;
uniform float     uNoiseAmount;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     3
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  if (uUseLiquid == 1) {
    vec2 normUv = gl_FragCoord.xy / uResolution;
    vec4 touchTex = texture(uTouchTexture, normUv);
    float vx = touchTex.r * 2.0 - 1.0;
    float vy = touchTex.g * 2.0 - 1.0;
    float intensity = touchTex.b;
    float wave = 0.5 + 0.5 * sin(uTime * uLiquidFreq + intensity * 6.2831853);
    float amt = uLiquidStrength * intensity * wave;
    uv += vec2(vx, vy) * amt;
  }

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;

  // sRGB gamma correction - convert linear to sRGB for accurate color output
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  if (uNoiseAmount > 0.0) {
    float n = hash11(dot(floor(gl_FragCoord.xy) + floor(uTime * 60.0), vec2(127.1, 311.7)));
    srgbColor += (n - 0.5) * uNoiseAmount;
  }

  fragColor = vec4(srgbColor, M);
}
`;

const MAX_CLICKS = 10;

export interface PixelBlastProps {
  variant?: 'square' | 'circle' | 'triangle' | 'diamond';
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  liquidWobbleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
  noiseAmount?: number;
}

interface ThreeState {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  material: ShaderMaterial;
  clock: Clock;
  clickIx: number;
  uniforms: Record<string, IUniform>;
  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;
  raf: number;
  quad: Mesh;
  timeOffset: number;
  touch?: TouchTexture;
  dummyTexture?: Texture;
}

const PixelBlast = ({
  variant = 'square',
  pixelSize = 3,
  color = '#B497CF',
  className,
  style,
  antialias = true,
  patternScale = 2,
  patternDensity = 1,
  liquid = false,
  liquidStrength = 0.1,
  liquidRadius = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  liquidWobbleSpeed = 4.5,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
  noiseAmount = 0
}: PixelBlastProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const threeRef = useRef<ThreeState | null>(null);

  // 1. Core WebGL Lifecycle Effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    const renderer = new WebGLRenderer({
      canvas,
      antialias,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.setPixelRatio(1.0);
    container.appendChild(renderer.domElement);
    if (transparent) renderer.setClearAlpha(0);
    else renderer.setClearColor(0x000000, 1);

    let touch: TouchTexture | undefined;
    let dummyTexture: Texture | undefined;

    if (liquid) {
      touch = createTouchTexture();
      touch.radiusScale = liquidRadius;
    } else {
      dummyTexture = createDummyTexture();
    }

    const uniforms: Record<string, IUniform> = {
      uResolution: { value: new Vector2(0, 0) },
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uClickPos: {
        value: Array.from({ length: MAX_CLICKS }, () => new Vector2(-1, -1))
      },
      uClickTimes: { value: new Float32Array(MAX_CLICKS) },
      uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
      uPixelSize: { value: pixelSize },
      uScale: { value: patternScale },
      uDensity: { value: patternDensity },
      uPixelJitter: { value: pixelSizeJitter },
      uEnableRipples: { value: enableRipples ? 1 : 0 },
      uRippleSpeed: { value: rippleSpeed },
      uRippleThickness: { value: rippleThickness },
      uRippleIntensity: { value: rippleIntensityScale },
      uEdgeFade: { value: edgeFade },
      uTouchTexture: { value: touch ? touch.texture : dummyTexture },
      uUseLiquid: { value: liquid ? 1 : 0 },
      uLiquidStrength: { value: liquidStrength },
      uLiquidFreq: { value: liquidWobbleSpeed },
      uNoiseAmount: { value: noiseAmount }
    };

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new ShaderMaterial({
      vertexShader: VERTEX_SRC,
      fragmentShader: FRAGMENT_SRC,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      glslVersion: GLSL3
    });
    const quadGeom = new PlaneGeometry(2, 2);
    const quad = new Mesh(quadGeom, material);
    scene.add(quad);
    const clock = new Clock();

    let cachedWidth = 1;
    let cachedHeight = 1;
    let cachedLeft = 0;
    let cachedTop = 0;

    const setSize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      (uniforms.uResolution.value as Vector2).set(renderer.domElement.width, renderer.domElement.height);
      uniforms.uPixelSize.value = pixelSize;

      const r = container.getBoundingClientRect();
      cachedLeft = r.left;
      cachedTop = r.top;
      cachedWidth = r.width || 1;
      cachedHeight = r.height || 1;
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    let io: IntersectionObserver | undefined;
    if (autoPauseOffscreen && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        visibilityRef.current.visible = entry.isIntersecting;
      }, { threshold: 0.05 });
      io.observe(container);
    }

    const randomFloat = () => {
      if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const u32 = new Uint32Array(1);
        window.crypto.getRandomValues(u32);
        return u32[0] / 0xffffffff;
      }
      return Math.random();
    };
    const timeOffset = randomFloat() * 1000;

    const mapToPixels = (e: { clientX: number; clientY: number }) => {
      const scaleX = renderer.domElement.width / cachedWidth;
      const scaleY = renderer.domElement.height / cachedHeight;
      const fx = (e.clientX - cachedLeft) * scaleX;
      const fy = (cachedHeight - (e.clientY - cachedTop)) * scaleY;
      return {
        fx,
        fy,
        w: renderer.domElement.width,
        h: renderer.domElement.height
      };
    };

    const onPointerDown = (e: { clientX: number; clientY: number }) => {
      const { fx, fy } = mapToPixels(e);
      const ix = threeRef.current?.clickIx ?? 0;
      (uniforms.uClickPos.value as Vector2[])[ix].set(fx, fy);
      (uniforms.uClickTimes.value as Float32Array)[ix] = uniforms.uTime.value as number;
      if (threeRef.current) threeRef.current.clickIx = (ix + 1) % MAX_CLICKS;
    };

    let pendingPointer: { clientX: number; clientY: number } | null = null;
    const onWindowPointerDown = (e: PointerEvent) => {
      onPointerDown(e);
      if (touch) {
        const { fx, fy, w, h } = mapToPixels(e);
        touch.addTouch({ x: fx / w, y: fy / h });
      }
    };

    const onWindowPointerMove = (e: PointerEvent) => {
      // Ignore touchmove while scrolling to prevent GPU/thread thrashing on iPads & mobile
      if (e.pointerType === 'touch') return;
      pendingPointer = { clientX: e.clientX, clientY: e.clientY };
    };

    window.addEventListener('pointerdown', onWindowPointerDown, { passive: true });
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });

    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    let raf: number;
    let lastFrameTime = performance.now();
    const minFrameDelta = 1000 / 60; // Smooth 60 FPS cap

    const animate = () => {
      if (reducedMotion) {
        renderer.render(scene, camera);
        return;
      }

      if (autoPauseOffscreen && !visibilityRef.current.visible) {
        raf = requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      const elapsed = now - lastFrameTime;

      if (elapsed < minFrameDelta) {
        raf = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = now - (elapsed % minFrameDelta);

      if (pendingPointer && touch) {
        const { fx, fy, w, h } = mapToPixels(pendingPointer);
        touch.addTouch({ x: fx / w, y: fy / h });
        pendingPointer = null;
      }

      uniforms.uTime.value = timeOffset + clock.getElapsedTime() * speedRef.current;

      if (touch) touch.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        lastFrameTime = performance.now();
        raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    threeRef.current = {
      renderer,
      scene,
      camera,
      material,
      clock,
      clickIx: 0,
      uniforms,
      resizeObserver: ro,
      intersectionObserver: io,
      raf,
      quad,
      timeOffset,
      touch,
      dummyTexture
    };

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pointerdown', onWindowPointerDown);
      window.removeEventListener('pointermove', onWindowPointerMove);
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
      quadGeom.dispose();
      material.dispose();
      touch?.texture.dispose();
      dummyTexture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      threeRef.current = null;
    };
    // Uniforms and shaders are updated via the subsequent effect without tearing down the WebGL context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [antialias, liquid, noiseAmount, transparent, autoPauseOffscreen]);

  // 2. Uniform & Dynamic Parameters Update Effect
  useEffect(() => {
    const t = threeRef.current;
    if (!t) return;

    t.uniforms.uShapeType.value = SHAPE_MAP[variant] ?? 0;
    t.uniforms.uPixelSize.value = pixelSize;
    (t.uniforms.uColor.value as Color).set(color);
    t.uniforms.uScale.value = patternScale;
    t.uniforms.uDensity.value = patternDensity;
    t.uniforms.uPixelJitter.value = pixelSizeJitter;
    t.uniforms.uEnableRipples.value = enableRipples ? 1 : 0;
    t.uniforms.uRippleIntensity.value = rippleIntensityScale;
    t.uniforms.uRippleThickness.value = rippleThickness;
    t.uniforms.uRippleSpeed.value = rippleSpeed;
    t.uniforms.uEdgeFade.value = edgeFade;
    t.uniforms.uUseLiquid.value = liquid ? 1 : 0;
    t.uniforms.uLiquidStrength.value = liquidStrength;
    t.uniforms.uLiquidFreq.value = liquidWobbleSpeed;
    t.uniforms.uNoiseAmount.value = noiseAmount;

    if (t.touch) {
      t.touch.radiusScale = liquidRadius;
    }
  }, [
    variant,
    pixelSize,
    color,
    patternScale,
    patternDensity,
    pixelSizeJitter,
    enableRipples,
    rippleIntensityScale,
    rippleThickness,
    rippleSpeed,
    edgeFade,
    liquid,
    liquidStrength,
    liquidRadius,
    liquidWobbleSpeed,
    noiseAmount
  ]);

  return (
    <div
      ref={containerRef}
      className={`pixel-blast-container ${className ?? ''}`}
      style={style}
      aria-label="PixelBlast interactive background"
    />
  );
};

export default PixelBlast;
