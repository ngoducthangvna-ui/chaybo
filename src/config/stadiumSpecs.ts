export type LightingMode = 'day' | 'sunset' | 'night';

export type CameraPresetId = 'overview' | 'pitch' | 'vip' | 'sky' | 'roof';

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
  readonly horizonColor: string;
  readonly fogColor: string;
  readonly ambientIntensity: number;
  readonly sunPosition: readonly [number, number, number];
  readonly sunColor: string;
  readonly sunIntensity: number;
  readonly floodlightIntensity: number;
  readonly ledGlowIntensity: number;
  readonly facadeGlowColor: string;
}

export interface EvacuationMetrics {
  readonly occupancyPercent: number;
  readonly seatedCount: number;
  readonly exitGates: number;
  readonly estimatedEvacMinutes: number;
  readonly cValueMm: number;
}

export interface StructuralMetrics {
  readonly roofOpenPercent: number;
  readonly steelTonnage: number;
  readonly crowdDecibels: number;
  readonly powerConsumptionMw: number;
}

export interface LoopForgeSopNode {
  readonly id: string;
  readonly title: string;
  readonly role: string;
  readonly status: 'passed' | 'active';
  readonly artifact: string;
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
  outerRadiusX: 174,
  outerRadiusZ: 148,
  oculusRadiusX: 64,
  oculusRadiusZ: 45,
  eaveHeight: 68,
  peakHeight: 87,
  ribCount: 48,
  exitGates: 48,
  steelTonnage: 28_500,
  superEllipsePower: 2.4,
} as const;

export const STADIUM_TIERS: readonly TierSpec[] = [
  {
    id: 'tier-1',
    name: 'Tầng 1 — Lower Bowl',
    seats: 65_000,
    rows: 34,
    innerRadiusX: 72,
    innerRadiusZ: 52,
    outerRadiusX: 98,
    outerRadiusZ: 76,
    baseElevation: 2.2,
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
    innerRadiusX: 96,
    innerRadiusZ: 74,
    outerRadiusX: 118,
    outerRadiusZ: 95,
    baseElevation: 19.0,
    topElevation: 31.5,
    seatColor: '#991b1b',
    accentColor: '#fbbf24',
    slopeDeg: 28,
  },
  {
    id: 'tier-3',
    name: 'Tầng 3 — Upper Bowl',
    seats: 55_000,
    rows: 32,
    innerRadiusX: 115,
    innerRadiusZ: 92,
    outerRadiusX: 142,
    outerRadiusZ: 118,
    baseElevation: 34.0,
    topElevation: 52.0,
    seatColor: '#dc2626',
    accentColor: '#f8fafc',
    slopeDeg: 33,
  },
  {
    id: 'tier-4',
    name: 'Tầng 4 — Sky Tier',
    seats: 35_000,
    rows: 22,
    innerRadiusX: 138,
    innerRadiusZ: 114,
    outerRadiusX: 162,
    outerRadiusZ: 136,
    baseElevation: 54.5,
    topElevation: 69.5,
    seatColor: '#7f1d1d',
    accentColor: '#fbbf24',
    slopeDeg: 35,
  },
] as const;

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: 'overview',
    label: 'Toàn cảnh',
    position: [248, 138, 238],
    target: [0, 22, 0],
  },
  {
    id: 'pitch',
    label: 'Mặt sân',
    position: [0, 8, 50],
    target: [0, 15, -26],
  },
  {
    id: 'vip',
    label: 'Khán đài VIP',
    position: [0, 26, 94],
    target: [0, 4, 0],
  },
  {
    id: 'sky',
    label: 'Tầng 4 Sky',
    position: [-140, 66, 0],
    target: [0, 2, 0],
  },
  {
    id: 'roof',
    label: 'Mái vòm',
    position: [168, 118, -158],
    target: [0, 56, 0],
  },
] as const;

export const LIGHTING_CONFIGS: Record<LightingMode, LightingConfig> = {
  day: {
    mode: 'day',
    label: 'Ban ngày',
    skyColor: '#60a5fa',
    horizonColor: '#dbeafe',
    fogColor: '#cbd5e1',
    ambientIntensity: 0.72,
    sunPosition: [210, 240, 160],
    sunColor: '#fffbeb',
    sunIntensity: 2.35,
    floodlightIntensity: 0,
    ledGlowIntensity: 0.65,
    facadeGlowColor: '#f59e0b',
  },
  sunset: {
    mode: 'sunset',
    label: 'Hoàng hôn',
    skyColor: '#1e1b4b',
    horizonColor: '#fb923c',
    fogColor: '#7c2d12',
    ambientIntensity: 0.48,
    sunPosition: [-240, 48, 120],
    sunColor: '#fb923c',
    sunIntensity: 1.9,
    floodlightIntensity: 1.4,
    ledGlowIntensity: 1.8,
    facadeGlowColor: '#f59e0b',
  },
  night: {
    mode: 'night',
    label: 'Đêm thi đấu',
    skyColor: '#020617',
    horizonColor: '#0f172a',
    fogColor: '#0f172a',
    ambientIntensity: 0.34,
    sunPosition: [100, 180, -120],
    sunColor: '#64748b',
    sunIntensity: 0.45,
    floodlightIntensity: 3.6,
    ledGlowIntensity: 2.6,
    facadeGlowColor: '#f59e0b',
  },
};

export const LOOPFORGE_SOP_NODES: readonly LoopForgeSopNode[] = [
  {
    id: 'requirement',
    title: '1. Requirement',
    role: 'Requirement Owner',
    status: 'passed',
    artifact: 'docs/REQUIREMENTS.md',
  },
  {
    id: 'clarify',
    title: '2. Clarify',
    role: 'Clarify Agent',
    status: 'passed',
    artifact: 'artifacts/vietnam-200k-masterpiece/01-solo/solo-report.md',
  },
  {
    id: 'design',
    title: '3. Design',
    role: 'Architect (Grasp + Harness UI)',
    status: 'passed',
    artifact: 'design.md',
  },
  {
    id: 'implement',
    title: '4. Implement',
    role: '3D WebGL Developer',
    status: 'passed',
    artifact: 'src/scene/*.tsx',
  },
  {
    id: 'review',
    title: '5. Review',
    role: 'Code Reviewer',
    status: 'passed',
    artifact: 'src/components/ControlPanel.tsx',
  },
  {
    id: 'test',
    title: '6. Test (Vitest)',
    role: 'Test Engineer',
    status: 'passed',
    artifact: 'src/config/stadiumSpecs.test.ts',
  },
  {
    id: 'deliver',
    title: '7. Accept & Delivery',
    role: 'Human Gate / Summary',
    status: 'active',
    artifact: 'artifacts/vietnam-200k-masterpiece/workflow-summary.md',
  },
] as const;

/**
 * Computes a point along a rounded-rectangle super-ellipse (squircle) hugging the FIFA pitch.
 */
export function superEllipsePoint(
  angle: number,
  radiusX: number,
  radiusZ: number,
  power: number = ROOF_SPECS.superEllipsePower
): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const exp = 2 / power;
  const x = Math.sign(cos) * Math.pow(Math.abs(cos), exp) * radiusX;
  const z = Math.sign(sin) * Math.pow(Math.abs(sin), exp) * radiusZ;
  return [x, z];
}

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
 * Computes crowd occupancy, exit gate throughput, and minimum sightline C-value.
 */
export function calculateEvacuationMetrics(occupancyPercent: number): EvacuationMetrics {
  const clamped = Math.min(100, Math.max(0, occupancyPercent));
  const total = calculateTotalCapacity();
  const seatedCount = Math.round((total * clamped) / 100);
  const throughputPerMin = ROOF_SPECS.exitGates * 420;
  const estimatedEvacMinutes =
    seatedCount === 0 ? 0 : Number((seatedCount / throughputPerMin + 1.5).toFixed(1));

  return {
    occupancyPercent: clamped,
    seatedCount,
    exitGates: ROOF_SPECS.exitGates,
    estimatedEvacMinutes,
    cValueMm: 95,
  };
}

/**
 * Computes real-time acoustic (dB) and power (MW) engineering telemetry.
 */
export function calculateStructuralMetrics(
  occupancyPercent: number,
  roofOpenPercent: number,
  ceremonyMode: boolean,
  lightingMode: LightingMode = 'night'
): StructuralMetrics {
  const occ = Math.min(100, Math.max(0, occupancyPercent));
  const open = Math.min(100, Math.max(0, roofOpenPercent));

  const crowdDecibels = Number((45 + (occ / 100) * 73.5 + (ceremonyMode ? 2.5 : 0)).toFixed(1));
  const baseLightingMw = lightingMode === 'day' ? 1.8 : lightingMode === 'sunset' ? 4.6 : 7.4;
  const occupancyHvacMw = (occ / 100) * 3.2;
  const ceremonyMw = ceremonyMode ? 1.4 : 0;
  const powerConsumptionMw = Number((baseLightingMw + occupancyHvacMw + ceremonyMw).toFixed(2));

  return {
    roofOpenPercent: open,
    steelTonnage: ROOF_SPECS.steelTonnage,
    crowdDecibels: Math.min(122, crowdDecibels),
    powerConsumptionMw,
  };
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
