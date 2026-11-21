import { describe, expect, it } from 'vitest';
import {
  CAMERA_PRESETS,
  LIGHTING_CONFIGS,
  LOOPFORGE_SOP_NODES,
  MASTERPLAN_ZONES,
  PITCH_SPECS,
  ROOF_SPECS,
  STADIUM_TIERS,
  STRUCTURAL_GRID_LINES,
  calculateEvacuationMetrics,
  calculateStructuralMetrics,
  calculateTotalCapacity,
  getCameraPreset,
  getLightingConfig,
  getUndulatingRimHeight,
  superEllipsePoint,
} from './stadiumSpecs';

describe('stadiumSpecs', () => {
  it('sums all 4 tiers to exactly 200,000 seats', () => {
    expect(STADIUM_TIERS).toHaveLength(4);
    expect(calculateTotalCapacity()).toBe(200_000);
  });

  it('orders tiers monotonically in elevation and aligns outer radii with Grid B..E', () => {
    for (let i = 1; i < STADIUM_TIERS.length; i += 1) {
      const prev = STADIUM_TIERS[i - 1];
      const curr = STADIUM_TIERS[i];
      expect(curr.baseElevation).toBeGreaterThan(prev.topElevation);
      expect(curr.innerRadiusX).toBeGreaterThan(prev.innerRadiusX);
      expect(curr.outerRadiusX).toBeGreaterThan(prev.outerRadiusX);
    }

    expect(STRUCTURAL_GRID_LINES).toHaveLength(5);
    expect(STADIUM_TIERS[0].outerRadiusX).toBe(STRUCTURAL_GRID_LINES[1].rx);
    expect(STADIUM_TIERS[1].outerRadiusX).toBe(STRUCTURAL_GRID_LINES[2].rx);
    expect(STADIUM_TIERS[2].outerRadiusX).toBe(STRUCTURAL_GRID_LINES[3].rx);
    expect(STADIUM_TIERS[3].outerRadiusX).toBe(STRUCTURAL_GRID_LINES[4].rx);
    expect(ROOF_SPECS.supportRadiusX).toBe(STRUCTURAL_GRID_LINES[4].rx);
    expect(ROOF_SPECS.supportHeight).toBe(STADIUM_TIERS[3].topElevation);
  });

  it('includes 5 masterplan service complex zones and saddle roof geometry', () => {
    expect(MASTERPLAN_ZONES).toHaveLength(5);
    expect(getUndulatingRimHeight(0)).toBeGreaterThan(getUndulatingRimHeight(Math.PI / 2));
  });

  it('computes accurate super-ellipse boundary points at cardinal angles', () => {
    const [x0, z0] = superEllipsePoint(0, 100, 80);
    expect(x0).toBeCloseTo(100, 4);
    expect(Math.abs(z0)).toBeLessThan(1e-6);

    const [x90, z90] = superEllipsePoint(Math.PI / 2, 100, 80);
    expect(Math.abs(x90)).toBeLessThan(1e-6);
    expect(z90).toBeCloseTo(80, 4);
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
    expect(quietDay.steelTonnage).toBe(34_600);
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
