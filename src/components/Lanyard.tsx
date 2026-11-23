import { useEffect, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { clamp, parseHexColor } from '../lib/folderUtils';
import './Lanyard.css';

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  cardColor?: string;
  size?: number;
  anchor?: 'left' | 'center' | 'right';
  strapLength?: number;
  strapColor?: string;
  breeze?: number;
  interactive?: boolean;
  className?: string;
}

const CARD_WIDTH = 1.6;
const CARD_HEIGHT = 2.25;
const CORNER_RADIUS = 0.3;
const STRAP_WIDTH_RATIO = 0.65;
const GRAVITY_SCALE = 1;
const DAMPING = 0.5;
const ELASTICITY = 0.5;

const ANCHORS: Readonly<Record<'left' | 'center' | 'right', number>> = {
  left: 0.27,
  center: 0.5,
  right: 0.73,
};

const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 360;
const ITERATIONS = 2;
const SAMPLES = 40;
const FOV = 24;
const STRAP_WIDTH = 0.36 * STRAP_WIDTH_RATIO;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_WIDTH = 512;
const PROCEDURAL_TEX_SIZE = 64;
const BAND_COLUMNS = [0, 0.07, 0.93, 1] as const;
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95] as const;
const FLIP_SPIN = 9;
const SILVER_COLOR = '#d9dce2';
const SILVER_ROUGHNESS = 0.16;

type NormalizedRgb = [number, number, number];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const parseNormalizedRgb = (hex: string, fallback: NormalizedRgb): NormalizedRgb => {
  const [r, g, b] = parseHexColor(hex, [
    Math.round(fallback[0] * 255),
    Math.round(fallback[1] * 255),
    Math.round(fallback[2] * 255),
  ]);
  return [r / 255, g / 255, b / 255];
};

const luminance = (rgb: NormalizedRgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

const toRgba = (rgb: NormalizedRgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = (start: number) => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (
  path: Shape | Path,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (
  cache: Map<string, Promise<HTMLImageElement | null>>,
  url?: string
): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cache.set(url, promise);
  return promise;
};

const CARD_LAYOUT = (() => {
  const radius = mix(0.03, Math.min(CARD_WIDTH, CARD_HEIGHT) * 0.2, CORNER_RADIUS);
  const slot = { width: 0.34, height: 0.07, y: CARD_HEIGHT / 2 - 0.13 };
  const ringY = CARD_HEIGHT / 2 - 0.055;
  return {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    radius,
    slot,
    ringY,
    hangY: ringY + RING_RADIUS,
  };
})();

const buildCardGeometry = () => {
  const { width, height, radius, slot } = CARD_LAYOUT;
  const outline = new Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005)
  );
  const hole = new Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL
  );
  outline.holes.push(hole);

  const body = new ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 12,
  });
  body.translate(0, 0, -THICKNESS / 2);

  const face = new ShapeGeometry(outline, 12);
  const position = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

const buildClampGeometry = (width: number) => {
  const shape = new Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = (count: number) => {
  const columns = BAND_COLUMNS.length;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

const buildEnvironment = (renderer: WebGLRenderer) => {
  const scene = new Scene();
  scene.background = new Color(0.035, 0.035, 0.04);
  const geometry = new PlaneGeometry(1, 1);
  const materials: MeshBasicMaterial[] = [];

  const addPanel = (
    intensity: number,
    position: [number, number, number],
    scale: [number, number],
    rotation = 0
  ) => {
    const material = new MeshBasicMaterial({
      color: new Color(intensity, intensity, intensity),
      side: DoubleSide,
    });
    materials.push(material);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };

  addPanel(2.6, [0, 4.5, 8], [9, 4]);
  addPanel(6, [-5.5, 0.5, 7], [0.9, 14]);
  addPanel(4, [5, -0.5, 8], [0.6, 14]);
  addPanel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  addPanel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  addPanel(1.4, [0, 6, -6], [12, 4]);
  addPanel(0.5, [0, -7, 1], [16, 6]);
  addPanel(0.9, [8, 0, -2], [4, 10]);

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas: HTMLCanvasElement, anisotropy: number) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const buildGrainTexture = () => {
  const size = PROCEDURAL_TEX_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x: number, y: number) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
      }
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

const buildWeaveTexture = () => {
  const size = PROCEDURAL_TEX_SIZE;
  const threads = 6;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = (f: number) => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

const paintFace = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  color: NormalizedRgb
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = toRgba(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image) {
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
};

const paintStrap = (canvas: HTMLCanvasElement, color: NormalizedRgb) => {
  const across = 192;
  const along = across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 2;
  ctx.fillStyle = toRgba(color);
  ctx.fillRect(0, 0, across, along);
  const ink: NormalizedRgb = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  ctx.fillStyle = toRgba(ink, 0.05);
  for (let y = 0; y < along; y += 4) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toRgba(ink, 0.2);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }
  return 2;
};

interface SimBody {
  position: Vector3;
  previous: Vector3;
  velocity: Vector3;
  quaternion: Quaternion;
  previousQuaternion: Quaternion;
  angular: Vector3;
  mass: number;
  inverseInertia: Vector3;
  hang: Vector3;
}

interface GrabInfo {
  local: Vector3;
  rotation: Quaternion;
  reach: number;
  from: Vector3;
  target: Vector3;
}

interface SimState {
  nodes: Vector3[];
  previous: Vector3[];
  velocities: Vector3[];
  lengths: Float64Array;
  impulses: Float64Array;
  rest: number;
  anchor: Vector3;
  body: SimBody;
  grab: GrabInfo | null;
  turn: number;
  twist: number;
  twistRaw: number;
  calm: number;
}

interface PhysicsConfig {
  gravity: number;
  hold: number;
  stiffness: number;
  spring: number;
  bandDamping: number;
  linearDrag: number;
  angularDrag: number;
  air: number;
  broadside: number;
  spinAir: number;
  nodeDrag: number;
  nodeAir: number;
  twist: number;
  twistDamping: number;
  grip: number;
  gripDamping: number;
  breeze: number;
}

const createSimulation = (): SimState => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new Vector3());
  const t = THICKNESS + BEVEL * 2;
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new Vector3(),
    body: {
      position: new Vector3(),
      previous: new Vector3(),
      velocity: new Vector3(),
      quaternion: new Quaternion(),
      previousQuaternion: new Quaternion(),
      angular: new Vector3(),
      mass: 1,
      inverseInertia: new Vector3(
        12 / (CARD_HEIGHT * CARD_HEIGHT + t * t),
        12 / (CARD_WIDTH * CARD_WIDTH + t * t),
        12 / (CARD_WIDTH * CARD_WIDTH + CARD_HEIGHT * CARD_HEIGHT)
      ),
      hang: new Vector3(0, CARD_LAYOUT.hangY, 0),
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0,
  };
};

const scratch = {
  a: new Vector3(),
  b: new Vector3(),
  c: new Vector3(),
  d: new Vector3(),
  e: new Vector3(),
  f: new Vector3(),
  g: new Vector3(),
  pin: new Vector3(),
  q: new Quaternion(),
  r: new Quaternion(),
};

const applyInverseInertia = (body: SimBody, vector: Vector3, out: Vector3) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q: Quaternion, w: Vector3) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body: SimBody, r: Vector3, normal: Vector3) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body: SimBody, r: Vector3, impulse: Vector3) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim: SimState, i: number, h: number, physics: PhysicsConfig) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body: SimBody, grab: GrabInfo, target: Vector3) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

const placeHanging = (sim: SimState, intro: boolean) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const stepSimulation = (sim: SimState, dt: number, physics: PhysicsConfig, time: number) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }

    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }

    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(
        up,
        (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h
      );
    }

    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

export default function Lanyard({
  frontImage,
  backImage,
  cardColor = '#141419',
  size = 0.28,
  anchor = 'right',
  strapLength = 0.45,
  strapColor = '#27272a',
  breeze = 0.25,
  interactive = true,
  className = '',
}: LanyardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({
    frontImage,
    backImage,
    cardColor,
    size,
    anchor,
    strapLength,
    strapColor,
    breeze,
    interactive,
  });
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    settingsRef.current = {
      frontImage,
      backImage,
      cardColor,
      size,
      anchor,
      strapLength,
      strapColor,
      breeze,
      interactive,
    };
    applyRef.current?.();
  }, [frontImage, backImage, cardColor, size, anchor, strapLength, strapColor, breeze, interactive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
      });
    } catch {
      return undefined;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 1;

    const canvas = renderer.domElement;
    canvas.className = 'lanyard-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const scene = new Scene();
    const environment = buildEnvironment(renderer);
    scene.environment = environment.texture;

    const camera = new PerspectiveCamera(FOV, 1, 0.1, 200);
    const keyLight = new DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-2.5, 4, 6);
    const fillLight = new DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(3, -1, 4);
    scene.add(keyLight, fillLight);

    const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
    const images: { front: HTMLImageElement | null; back: HTMLImageElement | null } = {
      front: null,
      back: null,
    };
    const frontCanvas = document.createElement('canvas');
    const strapCanvas = document.createElement('canvas');
    const faceHeight = Math.round((FACE_WIDTH * CARD_HEIGHT) / CARD_WIDTH);
    frontCanvas.width = FACE_WIDTH;
    frontCanvas.height = faceHeight;

    let backCanvas: HTMLCanvasElement | null = null;
    let backTexture: CanvasTexture | null = null;

    const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = ClampToEdgeWrapping;
    strapTexture.wrapT = RepeatWrapping;

    const grain = buildGrainTexture();
    const weave = buildWeaveTexture();

    const createFaceMaterial = (map: CanvasTexture) =>
      new MeshStandardMaterial({
        map,
        normalMap: grain,
        normalScale: new Vector2(0.05, 0.05),
        roughness: 0.28,
        metalness: 0.06,
        envMapIntensity: 1.2,
      });

    const frontMaterial = createFaceMaterial(frontTexture);
    const backMaterial = createFaceMaterial(frontTexture);
    const edgeMaterial = new MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.08,
      envMapIntensity: 1.15,
    });
    const metalMaterial = new MeshStandardMaterial({
      color: SILVER_COLOR,
      metalness: 1,
      roughness: SILVER_ROUGHNESS,
    });
    const bandMaterial = new MeshStandardMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new Vector2(0.65, 0.65),
      roughness: 0.72,
      metalness: 0.02,
      side: DoubleSide,
    });

    const cardGeom = buildCardGeometry();
    const cardGroup = new Group();
    const bodyMesh = new Mesh(cardGeom.body, edgeMaterial);
    const frontMesh = new Mesh(cardGeom.face, frontMaterial);
    const backMesh = new Mesh(cardGeom.face, backMaterial);
    frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
    backMesh.rotation.y = Math.PI;
    backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);

    const ring = new Mesh(new TorusGeometry(RING_RADIUS, RING_TUBE, 10, 32), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    ring.position.set(0, CARD_LAYOUT.ringY, 0);
    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    const bandGeometry = buildBandGeometry(SAMPLES);
    const band = new Mesh(bandGeometry, bandMaterial);
    band.frustumCulled = false;
    scene.add(band);

    const clampGroup = new Group();
    const clampMesh = new Mesh(buildClampGeometry(STRAP_WIDTH), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new Mesh(new TorusGeometry(EYELET_RADIUS, 0.0105, 10, 24), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    const sim = createSimulation();
    const controls: Vector3[] = [];
    const mouth = new Vector3();
    const tuck = new Vector3();
    const curve = new CatmullRomCurve3(controls, false, 'centripetal');
    const view = { width: 1, height: 1 };
    let applied = { framingKey: '', imageKey: '', cardColor: '', strapColor: '' };
    let tileRatio = 2;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = true;
    let alive = true;
    let placed = false;
    let hovering = false;
    let press: { x: number; y: number; time: number; point: Vector3 } | null = null;
    let imageToken = 0;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const paintFaces = () => {
      const color = parseNormalizedRgb(settingsRef.current.cardColor, [0.08, 0.08, 0.1]);
      paintFace(frontCanvas, images.front, color);
      frontTexture.needsUpdate = true;

      const hasDistinctBack = Boolean(images.back && images.back !== images.front);
      if (hasDistinctBack) {
        if (!backCanvas) {
          backCanvas = document.createElement('canvas');
          backCanvas.width = FACE_WIDTH;
          backCanvas.height = faceHeight;
          backTexture = makeCanvasTexture(backCanvas, anisotropy);
        }
        paintFace(backCanvas, images.back, color);
        if (backTexture) {
          backTexture.needsUpdate = true;
          backMaterial.map = backTexture;
        }
      } else {
        backMaterial.map = frontTexture;
      }
      backMaterial.needsUpdate = true;
      start();
    };

    const repaintStrap = () => {
      tileRatio = paintStrap(
        strapCanvas,
        parseNormalizedRgb(settingsRef.current.strapColor, [0.15, 0.15, 0.16])
      );
      weave.repeat.set(2, 2 * tileRatio);
      strapTexture.dispose();
      strapTexture.needsUpdate = true;
      start();
    };

    const frameView = () => {
      const s = settingsRef.current;
      const aspect = view.width / view.height;
      let viewHeight = CARD_HEIGHT / clamp(s.size, 0.15, 0.9);
      const minimumWidth = CARD_WIDTH / 0.72;
      if (viewHeight * aspect < minimumWidth) viewHeight = minimumWidth / aspect;
      const viewWidth = viewHeight * aspect;

      camera.aspect = aspect;
      camera.position.set(0, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      const effectiveAnchor = view.width < 640 ? 0.5 : ANCHORS[s.anchor];
      const anchorX = (effectiveAnchor - 0.5) * viewWidth;
      const anchorY = viewHeight / 2 + 0.2;
      const cardTop = viewHeight / 2 - viewHeight * mix(0.12, 0.42, clamp(s.strapLength, 0, 1));
      const hangTop = cardTop + (CARD_LAYOUT.hangY - CARD_HEIGHT / 2);
      sim.anchor.set(anchorX, anchorY, 0);
      sim.rest = (anchorY - hangTop) / JOINTS;
      sim.nodes[0].copy(sim.anchor);
      sim.previous[0].copy(sim.anchor);
    };

    const apply = () => {
      const s = settingsRef.current;
      const framingKey = `${s.size}|${s.anchor}|${s.strapLength}|${view.width}|${view.height}`;
      if (framingKey !== applied.framingKey) {
        frameView();
        if (!placed) {
          placeHanging(sim, !reducedMotion);
          placed = true;
        }
      }

      const imageKey = `${s.frontImage}|${s.backImage}`;
      if (imageKey !== applied.imageKey) {
        const token = ++imageToken;
        Promise.all([
          loadImage(imageCache, s.frontImage),
          loadImage(imageCache, s.backImage),
        ]).then(([front, back]) => {
          if (!alive || token !== imageToken) return;
          images.front = front;
          images.back = back;
          paintFaces();
        });
      }

      if (s.cardColor !== applied.cardColor) {
        paintFaces();
        const card = parseNormalizedRgb(s.cardColor, [0.08, 0.08, 0.1]);
        edgeMaterial.color.setRGB(card[0] * 0.92, card[1] * 0.92, card[2] * 0.92, SRGBColorSpace);
      }

      if (s.strapColor !== applied.strapColor) {
        repaintStrap();
      }

      canvas.style.touchAction = s.interactive ? 'pan-y' : 'auto';
      applied = { framingKey, imageKey, cardColor: s.cardColor, strapColor: s.strapColor };
      start();
    };

    const points = Array.from({ length: SAMPLES }, () => new Vector3());
    const sides = Array.from({ length: SAMPLES }, () => new Vector3());
    const bends = BAND_BEND.map((angle) => [Math.cos(angle), Math.sin(angle)] as const);
    const work = {
      tangent: new Vector3(),
      toCamera: new Vector3(),
      basis: new Matrix4(),
      up: new Vector3(),
      across: new Vector3(),
      facing: new Vector3(),
      end: new Vector3(),
    };

    const updateBand = () => {
      const hang = sim.nodes[JOINTS];
      const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
      let guide = JOINTS - 1;
      while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
      const axis = work.up.subVectors(sim.nodes[guide], hang);
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
      axis.normalize();

      mouth.copy(hang).addScaledVector(axis, reach);
      tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
      controls.length = 0;
      for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
      controls.push(mouth, tuck);

      curve.updateArcLengths();
      for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
      const length = curve.getLength();
      const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
      const position = bandGeometry.getAttribute('position');
      const normal = bandGeometry.getAttribute('normal');
      const uv = bandGeometry.getAttribute('uv');
      const columns = BAND_COLUMNS.length;
      const restLength = sim.rest * JOINTS;
      const repeats = restLength / (STRAP_WIDTH * tileRatio);
      const width = STRAP_WIDTH / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
      const { tangent, toCamera, across, facing } = work;

      for (let i = 0; i < SAMPLES; i++) {
        tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
        if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
        tangent.normalize();
        toCamera.subVectors(camera.position, points[i]).normalize();
        const side = sides[i].crossVectors(toCamera, tangent);
        if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
        side.normalize();
        if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();

        const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
        facing.crossVectors(tangent, side);
        across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
        facing.crossVectors(tangent, across);

        const p = points[i];
        const v = (1 - i / (SAMPLES - 1)) * repeats;
        for (let c = 0; c < columns; c++) {
          const k = i * columns + c;
          const offset = (BAND_COLUMNS[c] - 0.5) * width;
          const [bendCos, bendSin] = bends[c];
          position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
          normal.setXYZ(
            k,
            facing.x * bendCos + across.x * bendSin,
            facing.y * bendCos + across.y * bendSin,
            facing.z * bendCos + across.z * bendSin
          );
          uv.setXY(k, BAND_COLUMNS[c], v);
        }
      }

      work.end.copy(across);
      position.needsUpdate = true;
      normal.needsUpdate = true;
      uv.needsUpdate = true;

      across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
      facing.crossVectors(across, axis).normalize();
      work.basis.makeBasis(across, axis, facing);
      clampGroup.quaternion.setFromRotationMatrix(work.basis);
      clampGroup.position.copy(hang);
    };

    const render = () => {
      cardGroup.position.copy(sim.body.position);
      cardGroup.quaternion.copy(sim.body.quaternion);
      updateBand();
      renderer.render(scene, camera);
    };

    const gravity = 40 * GRAVITY_SCALE;
    const basePhysics = {
      gravity,
      hold: gravity * mix(2.2, 5.5, ELASTICITY),
      stiffness: gravity * 10 * JOINTS,
      spring: gravity * mix(0.1, 0.4, ELASTICITY) * JOINTS,
      bandDamping: gravity * mix(0.3, 0.08, ELASTICITY) * JOINTS,
      linearDrag: 0.25 * Math.pow(16, DAMPING),
      angularDrag: 0.5 * Math.pow(12, DAMPING),
      air: 0.15,
      broadside: 0.5,
      spinAir: 0.03,
      nodeDrag: 2,
      nodeAir: 0.2,
      twist: 30,
      twistDamping: 3,
      grip: 40,
      gripDamping: 6,
    };

    const getPhysics = (): PhysicsConfig => ({
      ...basePhysics,
      breeze: reducedMotion ? 0 : clamp(settingsRef.current.breeze, 0, 1),
    });

    const tick = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      time += dt;
      const current = getPhysics();
      stepSimulation(sim, dt, current, time);
      const body = sim.body;
      if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
        sim.grab = null;
        placeHanging(sim, false);
      }
      render();
      const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0;
      if (visible && !document.hidden && !resting) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible || !alive || document.hidden) return;
      sim.calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const raycaster = new Raycaster();
    const pointer = new Vector2();

    const toPointer = (event: MouseEvent | Touch | PointerEvent): boolean => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      return true;
    };

    const pickCard = () => {
      cardGroup.updateMatrixWorld();
      return raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false)[0] ?? null;
    };

    const setCursor = (value: string) => {
      if (canvas.style.cursor !== value) canvas.style.cursor = value;
    };

    const flip = (point: Vector3) => {
      const body = sim.body;
      const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
      let direction = sim.turn > 0 ? -1 : 1;
      if (sim.turn === 0) {
        const away = scratch.c.subVectors(point, camera.position).normalize();
        direction = scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
      }
      sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
      body.angular.addScaledVector(up, FLIP_SPIN * direction);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!settingsRef.current.interactive || event.button > 0 || !toPointer(event)) return;
      const hit = pickCard();
      if (!hit) return;
      sim.grab = {
        local: hit.point
          .clone()
          .sub(sim.body.position)
          .applyQuaternion(sim.body.quaternion.clone().invert()),
        rotation: sim.body.quaternion.clone(),
        reach: hit.distance,
        from: hit.point.clone(),
        target: hit.point.clone(),
      };
      press = { x: event.clientX, y: event.clientY, time: performance.now(), point: hit.point.clone() };
      canvas.setPointerCapture?.(event.pointerId);
      setCursor('grabbing');
      event.preventDefault();
      start();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!settingsRef.current.interactive || !toPointer(event)) return;
      if (sim.grab) {
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null;
        raycaster.ray.at(sim.grab.reach, sim.grab.target);
        start();
        return;
      }
      if (event.pointerType === 'touch') return;
      hovering = Boolean(pickCard());
      setCursor(hovering ? 'grab' : '');
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!sim.grab) return;
      sim.grab = null;
      if (press && event.type === 'pointerup' && performance.now() - press.time < 450) {
        flip(press.point);
      }
      press = null;
      canvas.releasePointerCapture?.(event.pointerId);
      setCursor(hovering && event.pointerType !== 'touch' ? 'grab' : '');
      start();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!settingsRef.current.interactive || event.touches.length !== 1) return;
      if (toPointer(event.touches[0]) && pickCard()) event.preventDefault();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    const resize = () => {
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(view.width, view.height, false);
      apply();
      render();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        start();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    applyRef.current = apply;
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      applyRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      [cardGeom.body, cardGeom.face, ring.geometry, clampMesh.geometry, eyelet.geometry, bandGeometry].forEach(
        (geometry) => geometry?.dispose()
      );
      [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial].forEach((material) =>
        material.dispose()
      );
      [frontTexture, backTexture, strapTexture, grain, weave].forEach((texture) => texture?.dispose());
      environment.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className={`lanyard ${className}`.trim()} />;
}
