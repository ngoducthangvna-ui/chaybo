import { describe, expect, it } from 'vitest';
import {
  CAMERA_PRESETS,
  LIGHTING_CONFIGS,
  LOOPFORGE_SOP_NODES,
  PITCH_SPECS,
  ROOF_SPECS,
  STADIUM_TIERS,
  calculateEvacuationMetrics,
  calculateStructuralMetrics,
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

  it('calculates structural acoustics and power consumption accurately', () => {
    const quietDay = calculateStructuralMetrics(0, 100, false, 'day');
    expect(quietDay.steelTonnage).toBe(28_500);
    expect(quietDay.crowdDecibels).toBe(45);
    expect(quietDay.roofOpenPercent).toBe(100);

    const fullNightCeremony = calculateStructuralMetrics(100, 0, true, 'night');
    expect(fullNightCeremony.crowdDecibels).toBe(121);
    expect(fullNightCeremony.powerConsumptionMw).toBeGreaterThan(10);
    expect(fullNightCeremony.roofOpenPercent).toBe(0);
  });

  it('contains all 7 LoopForge SOP pipeline nodes', () => {
    expect(LOOPFORGE_SOP_NODES).toHaveLength(7);
    expect(LOOPFORGE_SOP_NODES[0].id).toBe('requirement');
    expect(LOOPFORGE_SOP_NODES[6].id).toBe('deliver');
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
