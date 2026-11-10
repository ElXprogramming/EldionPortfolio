export interface DeviceCapabilities {
  isLowEnd: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  hasWebGL: boolean;
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      isLowEnd: true,
      reducedMotion: false,
      saveData: false,
      hasWebGL: false,
    };
  }

  const reducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  );

  const nav = navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  const saveData = Boolean(nav.connection?.saveData);
  const slowNetwork = Boolean(
    nav.connection?.effectiveType && ['slow-2g', '2g'].includes(nav.connection.effectiveType)
  );

  // Low memory devices (<= 2GB)
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;

  // Low CPU concurrency (<= 2 cores)
  const lowConcurrency =
    typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2;

  // Safe WebGL context probe
  const hasWebGL = checkWebGLSupport();

  const isLowEnd =
    reducedMotion || saveData || slowNetwork || lowMemory || lowConcurrency || !hasWebGL;

  return {
    isLowEnd,
    reducedMotion,
    saveData,
    hasWebGL,
  };
}

export function shouldEnableHeavyVisuals(): boolean {
  return !detectDeviceCapabilities().isLowEnd;
}
