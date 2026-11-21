export type LightingMode = 'day' | 'sunset' | 'night';

export type CameraPresetId = 'overview' | 'pitch' | 'vip' | 'roof';

export interface TierSpec {
  readonly id: string;
  readonly name: string;
  readonly seats: number;
  readonly rows: number;
  readonly innerRadiusX: number;
  readonly innerRadiusZ: number;
  readonly outerRadiusX: number;
  readonly outerRadiusZ: number;
  readonly baseElevation: number;
  readonly topElevation: number;
  readonly seatColor: string;
  readonly accentColor: string;
  readonly slopeDeg: number;
}

export interface CameraPreset {
  readonly id: CameraPresetId;
  readonly label: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export interface LightingConfig {
  readonly mode: LightingMode;
  readonly label: string;
  readonly skyColor: string;
  readonly fogColor: string;
  readonly ambientIntensity: number;
  readonly sunPosition: readonly [number, number, number];
  readonly sunColor: string;
  readonly sunIntensity: number;
  readonly floodlightIntensity: number;
  readonly ledGlowIntensity: number;
}

export const PITCH_SPECS = {
  length: 105,
  width: 68,
  apronLength: 132,
  apronWidth: 92,
  goalWidth: 7.32,
  goalHeight: 2.44,
  goalDepth: 2.2,
  penaltyAreaLength: 16.5,
  penaltyAreaWidth: 40.32,
  goalAreaLength: 5.5,
  goalAreaWidth: 18.32,
  centerCircleRadius: 9.15,
} as const;

export const ROOF_SPECS = {
  outerRadiusX: 172,
  outerRadiusZ: 146,
  oculusRadiusX: 62,
  oculusRadiusZ: 44,
  eaveHeight: 68,
  peakHeight: 88,
  ribCount: 24,
} as const;

export const STADIUM_TIERS: readonly TierSpec[] = [
  {
    id: 'tier-1',
    name: 'Tầng 1 — Lower Bowl',
    seats: 65_000,
    rows: 34,
    innerRadiusX: 74,
    innerRadiusZ: 56,
    outerRadiusX: 100,
    outerRadiusZ: 80,
    baseElevation: 1.8,
    topElevation: 16.5,
    seatColor: '#b91c1c',
    accentColor: '#f59e0b',
    slopeDeg: 24,
  },
  {
    id: 'tier-2',
    name: 'Tầng 2 — VIP & Club',
    seats: 45_000,
    rows: 24,
    innerRadiusX: 98,
    innerRadiusZ: 78,
    outerRadiusX: 120,
    outerRadiusZ: 98,
    baseElevation: 18.5,
    topElevation: 31.0,
    seatColor: '#991b1b',
    accentColor: '#fbbf24',
    slopeDeg: 28,
  },
  {
    id: 'tier-3',
    name: 'Tầng 3 — Upper Bowl',
    seats: 55_000,
    rows: 32,
    innerRadiusX: 117,
    innerRadiusZ: 95,
    outerRadiusX: 144,
    outerRadiusZ: 120,
    baseElevation: 33.0,
    topElevation: 51.5,
    seatColor: '#dc2626',
    accentColor: '#f8fafc',
    slopeDeg: 33,
  },
  {
    id: 'tier-4',
    name: 'Tầng 4 — Sky Tier',
    seats: 35_000,
    rows: 22,
    innerRadiusX: 140,
    innerRadiusZ: 116,
    outerRadiusX: 164,
    outerRadiusZ: 138,
    baseElevation: 53.5,
    topElevation: 69.0,
    seatColor: '#7f1d1d',
    accentColor: '#fbbf24',
    slopeDeg: 35,
  },
] as const;

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: 'overview',
    label: 'Toàn cảnh',
    position: [235, 145, 225],
    target: [0, 20, 0],
  },
  {
    id: 'pitch',
    label: 'Mặt sân',
    position: [0, 8, 52],
    target: [0, 12, -20],
  },
  {
    id: 'vip',
    label: 'Khán đài VIP',
    position: [0, 26, 98],
    target: [0, 4, 0],
  },
  {
    id: 'roof',
    label: 'Mái vòm',
    position: [155, 110, -145],
    target: [0, 58, 0],
  },
] as const;

export const LIGHTING_CONFIGS: Record<LightingMode, LightingConfig> = {
  day: {
    mode: 'day',
    label: 'Ban ngày',
    skyColor: '#bae6fd',
    fogColor: '#cbd5e1',
    ambientIntensity: 0.75,
    sunPosition: [180, 220, 140],
    sunColor: '#fffbeb',
    sunIntensity: 2.1,
    floodlightIntensity: 0,
    ledGlowIntensity: 0.5,
  },
  sunset: {
    mode: 'sunset',
    label: 'Hoàng hôn',
    skyColor: '#7c2d12',
    fogColor: '#431407',
    ambientIntensity: 0.5,
    sunPosition: [-220, 55, 110],
    sunColor: '#fb923c',
    sunIntensity: 1.75,
    floodlightIntensity: 1.2,
    ledGlowIntensity: 1.6,
  },
  night: {
    mode: 'night',
    label: 'Đêm thi đấu',
    skyColor: '#020617',
    fogColor: '#0f172a',
    ambientIntensity: 0.3,
    sunPosition: [100, 180, -120],
    sunColor: '#64748b',
    sunIntensity: 0.45,
    floodlightIntensity: 3.4,
    ledGlowIntensity: 2.6,
  },
};

/**
 * Computes total seated capacity across all stadium tiers.
 */
export function calculateTotalCapacity(tiers: readonly TierSpec[] = STADIUM_TIERS): number {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return 0;
  }
  return tiers.reduce((sum, tier) => sum + Math.max(0, tier.seats), 0);
}

/**
 * Returns the camera preset matching the given ID, falling back to 'overview'.
 */
export function getCameraPreset(id: CameraPresetId): CameraPreset {
  return CAMERA_PRESETS.find((preset) => preset.id === id) ?? CAMERA_PRESETS[0];
}

/**
 * Returns the lighting configuration for the selected mode.
 */
export function getLightingConfig(mode: LightingMode): LightingConfig {
  return LIGHTING_CONFIGS[mode] ?? LIGHTING_CONFIGS.night;
}
