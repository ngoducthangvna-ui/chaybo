import {
  FLOOR_CORRIDORS,
  FLOOR_ELEVATION_Y,
  FLOOR_LEVEL_SPECS,
  ROOM_CLEAR_AISLE_ANCHORS,
  STADIUM_INTERIOR_ROOMS,
  TARGET_ENGINE_FPS,
  VERTICAL_CORES,
  evaluateFramePerformance,
  findNearestVerticalCore,
  findRoomAtPoint,
  getCorridorsByFloor,
  getRoom3dWalkthroughPose,
  getRoomNpcPoses,
  getRoomSafeSpawnPoint,
  getRoomsByFloor,
  isDoorwayOpen,
  isFurnitureSolidForWalk,
  isPointInInteriorClearZone,
  stepExplorerAvatar,
} from './interiorRooms';
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
  calculateCrowdPhysicsMetrics,
  calculateEvacuationMetrics,
  calculateStructuralMetrics,
  calculateTotalCapacity,
  evaluateBallProjectile,
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

  it('calculates Weidmann pedestrian velocity, Fruin LOS, and ISO 10137 dynamic crowd loads at 100% capacity', () => {
    const idle = calculateCrowdPhysicsMetrics(100, false);
    expect(idle.seatedSpectators).toBe(200_000);
    expect(idle.activePedestrians).toBe(0);
    expect(idle.dynamicLoadFactor).toBe(1.0);

    const liveFull = calculateCrowdPhysicsMetrics(100, true);
    expect(liveFull.seatedSpectators).toBe(200_000);
    expect(liveFull.activePedestrians).toBe(18_500);
    expect(liveFull.dynamicLoadFactor).toBe(1.34);
    expect(liveFull.naturalFreqHz).toBeGreaterThan(5.0);
    expect(liveFull.staticLiveLoadKn).toBeGreaterThan(150_000);
    expect(liveFull.stairSpeedMps).toBeCloseTo(liveFull.walkingSpeedMps * 0.62, 1);
  });

  it('enforces physical monotonic decrease of walking speed as crowd density increases', () => {
    const low = calculateCrowdPhysicsMetrics(10, true);
    const mid = calculateCrowdPhysicsMetrics(55, true);
    const full = calculateCrowdPhysicsMetrics(100, true);
    expect(low.walkingSpeedMps).toBeGreaterThan(mid.walkingSpeedMps);
    expect(mid.walkingSpeedMps).toBeGreaterThan(full.walkingSpeedMps);
  });

  it('evaluates 3D ball projectile trajectory with positive apex height and realistic km/h velocity', () => {
    const start: [number, number, number] = [-20, 0.38, 12];
    const target: [number, number, number] = [32, 0.38, -8];
    const apex = evaluateBallProjectile(0.85, start, target, 2.0, 5.2);
    expect(apex.position[1]).toBeGreaterThan(5.0);
    expect(apex.speedKmh).toBeGreaterThan(40);
    expect(apex.speedKmh).toBeLessThan(150);

    const end = evaluateBallProjectile(2.0, start, target, 2.0, 5.2);
    expect(end.position[0]).toBeCloseTo(32, 3);
    expect(end.position[2]).toBeCloseTo(-8, 3);
  });

  it('defines all 4 floor levels (B0, L1, L2, L3) and 16 furnished architectural stadium rooms', () => {
    expect(FLOOR_LEVEL_SPECS).toHaveLength(4);
    expect(STADIUM_INTERIOR_ROOMS).toHaveLength(16);
    for (const floor of ['B0', 'L1', 'L2', 'L3'] as const) {
      expect(getRoomsByFloor(floor).length).toBeGreaterThanOrEqual(3);
    }
    for (const room of STADIUM_INTERIOR_ROOMS) {
      expect(room.areaM2).toBeGreaterThan(100);
      expect(room.furniture.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('detects room entry and automatic proximity sliding door opening accurately', () => {
    const locker = STADIUM_INTERIOR_ROOMS.find((r) => r.id === 'home-locker')!;
    expect(findRoomAtPoint('B0', -112, -34)?.id).toBe('home-locker');
    expect(findRoomAtPoint('L1', -112, -34)).toBeNull();
    expect(isDoorwayOpen(locker, locker.door.x, locker.door.y + 3)).toBe(true);
    expect(isDoorwayOpen(locker, 0, 0)).toBe(false);
  });

  it('advances 2D free-roam avatar kinematics toward WASD and click-to-walk targets within stadium bounds', () => {
    const wasdStep = stepExplorerAvatar({ x: 0, y: 0 }, { dx: 1, dy: 0 }, 0.05);
    expect(wasdStep.x).toBeCloseTo(0.24, 2);
    expect(wasdStep.speedMps).toBeCloseTo(4.8, 2);

    const clickStep = stepExplorerAvatar({ x: 10, y: 10 }, { dx: 0, dy: 0, targetX: 20, targetY: 10 }, 0.05);
    expect(clickStep.x).toBeCloseTo(10.24, 2);

    const clamped = stepExplorerAvatar({ x: 194.8, y: 171.8 }, { dx: 1, dy: 1 }, 0.1);
    expect(clamped.x).toBe(195);
    expect(clamped.y).toBe(172);
  });

  it('computes accurate 3D floor elevations and 3D walkthrough camera poses for all 16 rooms', () => {
    expect(FLOOR_ELEVATION_Y.B0).toBeLessThan(FLOOR_ELEVATION_Y.L1);
    expect(FLOOR_ELEVATION_Y.L1).toBeLessThan(FLOOR_ELEVATION_Y.L2);
    expect(FLOOR_ELEVATION_Y.L2).toBeLessThan(FLOOR_ELEVATION_Y.L3);

    for (const room of STADIUM_INTERIOR_ROOMS) {
      const cx = room.bounds.x + room.bounds.w * 0.5;
      const cz = room.bounds.y + room.bounds.h * 0.5;
      const follow = getRoom3dWalkthroughPose(room, cx, cz, 0, 'follow3d');
      const fps = getRoom3dWalkthroughPose(room, cx, cz, 0, 'fps3d');
      const cutaway = getRoom3dWalkthroughPose(room, cx, cz, 0, 'cutaway3d');

      expect(follow.avatarPos[1]).toBe(FLOOR_ELEVATION_Y[room.floor]);
      expect(fps.cameraPos[1]).toBeCloseTo(FLOOR_ELEVATION_Y[room.floor] + 1.72, 2);
      expect(cutaway.cameraPos[1]).toBeCloseTo(FLOOR_ELEVATION_Y[room.floor] + 14, 2);
    }
  });

  it('defines connected floor corridors, 4 vertical elevator cores, and column-free interior clear zones', () => {
    expect(VERTICAL_CORES).toHaveLength(4);
    expect(FLOOR_CORRIDORS.length).toBeGreaterThanOrEqual(16);
    for (const floor of ['B0', 'L1', 'L2', 'L3'] as const) {
      expect(getCorridorsByFloor(floor).length).toBeGreaterThanOrEqual(3);
    }
    expect(findNearestVerticalCore(-134, 36)?.code).toBe('CORE-W');
    expect(findNearestVerticalCore(0, 0)).toBeNull();

    // Verify L2-01, B0-01, and B0-03 interiors report active clear-zone envelopes above table/tunnel height
    const vvipZone = isPointInInteriorClearZone(-12, 97, 1.4);
    expect(vvipZone.inRoom).toBe(true);
    expect(vvipZone.maxCeilingY).toBeGreaterThanOrEqual(FLOOR_ELEVATION_Y.L2 + 5.5);

    const tunnelZone = isPointInInteriorClearZone(-72, 0, 1.4);
    expect(tunnelZone.inRoom).toBe(true);
    expect(tunnelZone.maxCeilingY).toBeGreaterThanOrEqual(FLOOR_ELEVATION_Y.B0 + 4.5);
  });

  it('enforces real-world wall, doorway, open east portal, and furniture collision sliding', () => {
    // Solid north wall of B0-01 (y = -42) blocks walking north from inside room
    const blockedWall = stepExplorerAvatar(
      { x: -115, y: -41.2 },
      { dx: 0, dy: -1 },
      0.1,
      'B0'
    );
    expect(blockedWall.y).toBe(-41.2);

    // Doorway of B0-01 at (-110, -24) allows walking straight out south into corridor
    const throughDoor = stepExplorerAvatar(
      { x: -110, y: -24.4 },
      { dx: 0, dy: 1 },
      0.1,
      'B0'
    );
    expect(throughDoor.y).toBeGreaterThan(-24.4);

    // East mouth of B0-03 Players' Tunnel at x = -58 opens freely onto pitch apron
    const outTunnel = stepExplorerAvatar(
      { x: -58.3, y: 0 },
      { dx: 1, dy: 0 },
      0.1,
      'B0'
    );
    expect(outTunnel.x).toBeGreaterThan(-58);

    // Banquet table inside L2-01 (-22..0, 92..99.5, radius 0.42 => stop boundary y=99.92) blocks piercing tabletop
    const hitTable = stepExplorerAvatar(
      { x: -12, y: 100.3 },
      { dx: 0, dy: -1 },
      0.1,
      'L2'
    );
    expect(hitTable.y).toBeGreaterThanOrEqual(99.92);
    expect(hitTable.y).toBeLessThan(100.3);
  });

  it('places NPCs and safe spawns strictly on unobstructed aisles across all 16 rooms', () => {
    for (const room of STADIUM_INTERIOR_ROOMS) {
      const spawn = getRoomSafeSpawnPoint(room);
      expect(spawn.x).toBeGreaterThan(room.bounds.x);
      expect(spawn.x).toBeLessThan(room.bounds.x + room.bounds.w);

      for (const sec of [0, 3.2, 7.5]) {
        const npcs = getRoomNpcPoses(room, sec);
        expect(npcs.length).toBeGreaterThanOrEqual(2);
        for (const npc of npcs) {
          for (const item of room.furniture) {
            if (!isFurnitureSolidForWalk(item)) continue;
            const insideSolid =
              npc.x > item.x - 0.3 &&
              npc.x < item.x + item.w + 0.3 &&
              npc.z > item.y - 0.3 &&
              npc.z < item.y + item.h + 0.3;
            expect(insideSolid).toBe(false);
          }
        }
      }
    }
  });

  it('targets 120 FPS engine telemetry budgets and caches O(1) aisle anchors for all 16 rooms', () => {
    expect(TARGET_ENGINE_FPS).toBe(120);
    const ultra = evaluateFramePerformance(2.4);
    expect(ultra.fps).toBe(120);
    expect(ultra.modeLabel).toBe('120 FPS ULTRA');
    expect(ultra.budgetPercent).toBeLessThanOrEqual(35);

    const heavier = evaluateFramePerformance(12.5);
    expect(heavier.fps).toBeLessThan(120);
    expect(heavier.modeLabel).toBe('60 FPS HIGH');

    expect(ROOM_CLEAR_AISLE_ANCHORS.size).toBe(STADIUM_INTERIOR_ROOMS.length);
  });
});
