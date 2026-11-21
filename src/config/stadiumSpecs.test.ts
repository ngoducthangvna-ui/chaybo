import { describe, expect, it } from 'vitest';
import {
  CAMERA_PRESETS,
  LIGHTING_CONFIGS,
  PITCH_SPECS,
  ROOF_SPECS,
  STADIUM_TIERS,
  calculateEvacuationMetrics,
  calculateTotalCapacity,
  getCameraPreset,
  getLightingConfig,
} from './stadiumSpecs';

describe('stadiumSpecs', () => {
  it('sums all 4 tiers to exactly 200,000 seats', () => {
    expect(STADIUM_TIERS).toHaveLength(4);
    expect(calculateTotalCapacity()).toBe(200_000);
  });

  it('orders tiers monotonically in elevation and radius', () => {
    for (let i = 1; i < STADIUM_TIERS.length; i += 1) {
      const prev = STADIUM_TIERS[i - 1];
      const curr = STADIUM_TIERS[i];
      expect(curr.baseElevation).toBeGreaterThan(prev.topElevation);
      expect(curr.innerRadiusX).toBeGreaterThan(prev.innerRadiusX);
      expect(curr.outerRadiusX).toBeGreaterThan(prev.outerRadiusX);
    }
  });

  it('uses FIFA regulation pitch dimensions (105m x 68m)', () => {
    expect(PITCH_SPECS.length).toBe(105);
    expect(PITCH_SPECS.width).toBe(68);
    expect(ROOF_SPECS.outerRadiusX).toBeGreaterThan(STADIUM_TIERS[3].outerRadiusX);
  });

  it('calculates evacuation metrics and clamps occupancy between 0 and 100', () => {
    const empty = calculateEvacuationMetrics(-10);
    expect(empty.occupancyPercent).toBe(0);
    expect(empty.seatedCount).toBe(0);
    expect(empty.estimatedEvacMinutes).toBe(0);

    const full = calculateEvacuationMetrics(120);
    expect(full.occupancyPercent).toBe(100);
    expect(full.seatedCount).toBe(200_000);
    expect(full.cValueMm).toBeGreaterThanOrEqual(90);
    expect(full.estimatedEvacMinutes).toBeGreaterThan(8);
    expect(full.estimatedEvacMinutes).toBeLessThan(15);
  });

  it('resolves camera presets and lighting configs', () => {
    for (const preset of CAMERA_PRESETS) {
      expect(getCameraPreset(preset.id).id).toBe(preset.id);
    }
    expect(getLightingConfig('day').floodlightIntensity).toBe(0);
    expect(getLightingConfig('night').floodlightIntensity).toBeGreaterThan(0);
    expect(Object.keys(LIGHTING_CONFIGS)).toEqual(['day', 'sunset', 'night']);
  });
});
