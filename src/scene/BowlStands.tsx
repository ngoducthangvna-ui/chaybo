import { useEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  ROOF_SPECS,
  STADIUM_TIERS,
  STRUCTURAL_GRID_LINES,
  type TierSpec,
  superEllipsePoint,
} from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
  halfCutaway: boolean;
  bimFrameMode: boolean;
  occupancyPercent: number;
  showEvacPaths: boolean;
}

/**
 * Generates a realistic architectural precast-concrete & stadium seating texture:
 * individual seat rows, grey concrete vomitory stairs with yellow nosing, and dark portal tunnels.
 */
function createSeatingBowlTexture(occupancyPercent: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Precast concrete riser/tread base
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rowCount = 32;
  const seatCols = 24;
  const rowH = canvas.height / rowCount;
  const colW = canvas.width / seatCols;
  const fillThreshold = occupancyPercent / 100;

  for (let r = 0; r < rowCount; r += 1) {
    const y = r * rowH;
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, y, canvas.width, 4);

    for (let c = 0; c < seatCols; c += 1) {
      const x = c * colW;
      // Radial concrete vomitory staircase aisle
      if (c === 0 || c === seatCols - 1) {
        ctx.fillStyle = '#71717a';
        ctx.fillRect(x, y + 4, colW, rowH - 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x + 2, y + 4, colW - 4, 3);
        continue;
      }

      // Mid-tier concrete vomitory entrance portal
      if (r >= 13 && r <= 17 && c >= 10 && c <= 13) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(x, y, colW, rowH);
        if (r === 13) {
          ctx.fillStyle = '#a1a1aa';
          ctx.fillRect(x, y, colW, 5);
        }
        continue;
      }

      // Realistic seat color layout (crimson tiers with subtle gold fascia row)
      const isGoldRow = r === 0 || r === rowCount - 1;
      ctx.fillStyle = isGoldRow ? '#b45309' : r % 2 === 0 ? '#991b1b' : '#b91c1c';
      ctx.fillRect(x + 2, y + 6, colW - 4, rowH - 8);

      // Seated spectators scaled deterministically by occupancyPercent
      const hash = Math.abs(Math.sin(r * 78.233 + c * 37.719));
      if (hash < fillThreshold) {
        ctx.fillStyle =
          hash < fillThreshold * 0.2 ? '#fbbf24' : hash < fillThreshold * 0.65 ? '#dc2626' : '#f1f5f9';
        ctx.fillRect(x + 4, y + 8, colW - 8, rowH - 12);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(48, 1);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHaloLedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, 10);
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    for (let k = 0; k < 4; k += 1) {
      const cx = k * 512 + 256;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIETNAM NATIONAL STADIUM • 200,000 SEATS', cx, 66);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px monospace';
      ctx.fillText('VIE  0 : 0  ALL', cx, 152);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('FIFA REGULATION 105×68M • C-VALUE 95MM', cx, 206);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRibbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIETNAM NATIONAL STADIUM  •  200,000 CAPACITY  •  C-VALUE 95MM', canvas.width / 2, 42);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(12, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an extruded precast stepped concrete seating tier using super-ellipse contours.
 */
function createSteppedTierGeometry(
  tier: TierSpec,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const stepCount = 12;
  const profile: Array<[number, number, number]> = [];

  for (let s = 0; s < stepCount; s += 1) {
    const t0 = s / stepCount;
    const t1 = (s + 1) / stepCount;
    const y0 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t0);
    const y1 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t1);
    profile.push([t0, y0, t0]);
    profile.push([t1, y0, t1]);
    profile.push([t1, y1, t1]);
  }
  // Underside precast concrete slab thickness (0.9m) sloping down cleanly to front fascia
  const slabThickness = 0.9;
  profile.push([1.0, tier.topElevation - slabThickness, 1.0]);
  profile.push([0.0, tier.baseElevation - slabThickness, 0.0]);
  profile.push([0.0, tier.baseElevation, 0.0]);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const arcSpan = endAngle - startAngle;
  for (const [t, y, v] of profile) {
    const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, t);
    const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, t);
    for (let i = 0; i <= segments; i += 1) {
      const uFrac = i / segments;
      const angle = startAngle + uFrac * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, y, z);
      uvs.push(uFrac * (arcSpan / (Math.PI * 2)), v);
    }
  }

  const stride = segments + 1;
  for (let p = 0; p < profile.length - 1; p += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = p * stride + i;
      const b = a + 1;
      const c = (p + 1) * stride + i;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createConcourseSlabGeometry(
  innerRx: number,
  innerRz: number,
  outerRx: number,
  outerRz: number,
  elevation: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let ring = 0; ring <= 1; ring += 1) {
    const rx = ring === 0 ? innerRx : outerRx;
    const rz = ring === 0 ? innerRz : outerRz;
    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, elevation, z);
    }
  }

  const stride = segments + 1;
  for (let i = 0; i < segments; i += 1) {
    const a = i;
    const b = i + 1;
    const c = stride + i;
    const d = c + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSuperEllipseBandGeometry(
  radiusX: number,
  radiusZ: number,
  height: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let i = 0; i <= segments; i += 1) {
    const uFrac = i / segments;
    const angle = startAngle + uFrac * arcSpan;
    const [x, z] = superEllipsePoint(angle, radiusX, radiusZ);
    positions.push(x, 0, z, x, height, z);
    const u = uFrac * (arcSpan / (Math.PI * 2));
    uvs.push(u, 0, u, 1);
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Renders 48 Radial Reinforced-Concrete Portal Frames (Grid A-E):
 * - 5 concentric rings of rectangular RC columns rising from ground y=0 to exact tier/roof bearings
 * - 4 individual sloped Tier Raker Beams seated flush directly beneath each precast tier slab
 * - Horizontal radial floor beams & circumferential tie beams at concourse elevations
 * - 8 RC elevator/stair shear-wall cores between Grid D and Grid E
 */
function RCFrameBents({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const columnsRef = useRef<THREE.InstancedMesh | null>(null);
  const beamsRef = useRef<THREE.InstancedMesh | null>(null);
  const coresRef = useRef<THREE.InstancedMesh | null>(null);
  const bentCount = ROOF_SPECS.ribCount;

  const { columns, beams, cores } = useMemo(() => {
    const colList: Array<{ pos: [number, number, number]; rotY: number; scale: [number, number, number] }> = [];
    const beamList: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; scale: [number, number, number] }> = [];
    const coreList: Array<{ pos: [number, number, number]; rotY: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);

    const addBeam = (p1: THREE.Vector3, p2: THREE.Vector3, width: number, depth: number) => {
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      if (len < 0.1) {
        return;
      }
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      beamList.push({ pos: [mid.x, mid.y, mid.z], quat, scale: [width, len, depth] });
    };

    for (let i = 0; i < bentCount; i += 1) {
      const angle = (i / bentCount) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }

      // 1. 5 RC Columns per radial frame (Grid A, B, C, D, E)
      for (const grid of STRUCTURAL_GRID_LINES) {
        const [gx, gz] = superEllipsePoint(angle, grid.rx, grid.rz);
        const colW = grid.id === 'E' ? 1.8 : 1.3;
        const colD = grid.id === 'E' ? 2.2 : 1.5;
        colList.push({
          pos: [gx, grid.topElevation / 2, gz],
          rotY: -angle,
          scale: [colW, grid.topElevation, colD],
        });
      }

      // 2. 4 Sloped Tier Raker Beams seated flush beneath each tier's precast slab (soffit - 0.85m)
      for (const tier of STADIUM_TIERS) {
        const [xIn, zIn] = superEllipsePoint(angle, tier.innerRadiusX, tier.innerRadiusZ);
        const [xOut, zOut] = superEllipsePoint(angle, tier.outerRadiusX, tier.outerRadiusZ);
        addBeam(
          new THREE.Vector3(xIn, tier.baseElevation - 1.3, zIn),
          new THREE.Vector3(xOut, tier.topElevation - 1.3, zOut),
          0.95,
          1.2
        );
      }

      // 3. Horizontal Radial Floor Transfer Beams connecting Grid A-B-C-D-E at concourse levels
      const [ax, az] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[0].rx, STRUCTURAL_GRID_LINES[0].rz);
      const [bx, bz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[1].rx, STRUCTURAL_GRID_LINES[1].rz);
      const [cx, cz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[2].rx, STRUCTURAL_GRID_LINES[2].rz);
      const [dx, dz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[3].rx, STRUCTURAL_GRID_LINES[3].rz);
      const [ex, ez] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[4].rx, STRUCTURAL_GRID_LINES[4].rz);

      // Concourse +18m (Grid B -> E), +33m (Grid C -> E), +53m (Grid D -> E)
      addBeam(new THREE.Vector3(bx, 17.5, bz), new THREE.Vector3(ex, 17.5, ez), 0.9, 1.0);
      addBeam(new THREE.Vector3(cx, 32.5, cz), new THREE.Vector3(ex, 32.5, ez), 0.9, 1.0);
      addBeam(new THREE.Vector3(dx, 52.5, dz), new THREE.Vector3(ex, 52.5, ez), 0.9, 1.0);
      // Lower tie beam +6m (Grid A -> B)
      addBeam(new THREE.Vector3(ax, 5.8, az), new THREE.Vector3(bx, 5.8, bz), 0.85, 0.9);

      // 4. Circumferential Ring Tie Beams linking adjacent bents at Grid E (every level)
      const nextAngle = ((i + 1) / bentCount) * Math.PI * 2;
      if (nextAngle <= endAngle + 0.03) {
        const [ex2, ez2] = superEllipsePoint(nextAngle, STRUCTURAL_GRID_LINES[4].rx, STRUCTURAL_GRID_LINES[4].rz);
        for (const elev of [17.5, 32.5, 52.5, 68.0]) {
          addBeam(new THREE.Vector3(ex, elev, ez), new THREE.Vector3(ex2, elev, ez2), 0.85, 1.1);
        }
      }

      // 5. 8 RC Shear-Wall Cores (every 6th radial bay) for lateral seismic & wind stability
      if (i % 6 === 3) {
        const [coreX, coreZ] = superEllipsePoint(angle, 155, 129);
        coreList.push({ pos: [coreX, 34.0, coreZ], rotY: -angle });
      }
    }

    return { columns: colList, beams: beamList, cores: coreList };
  }, [startAngle, endAngle, bentCount]);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (columnsRef.current) {
      columns.forEach((c, idx) => {
        dummy.position.set(...c.pos);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(...c.scale);
        dummy.updateMatrix();
        columnsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      columnsRef.current.count = columns.length;
      columnsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (beamsRef.current) {
      beams.forEach((b, idx) => {
        dummy.position.set(...b.pos);
        dummy.quaternion.copy(b.quat);
        dummy.scale.set(...b.scale);
        dummy.updateMatrix();
        beamsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      beamsRef.current.count = beams.length;
      beamsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (coresRef.current) {
      cores.forEach((core, idx) => {
        dummy.position.set(...core.pos);
        dummy.rotation.set(0, core.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        coresRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      coresRef.current.count = cores.length;
      coresRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [columns, beams, cores]);

  return (
    <group name="rc-frame-bents">
      <instancedMesh ref={columnsRef} args={[undefined, undefined, bentCount * 5]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={beamsRef} args={[undefined, undefined, bentCount * 14]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.82} metalness={0.08} />
      </instancedMesh>
      <instancedMesh ref={coresRef} args={[undefined, undefined, 12]} castShadow receiveShadow>
        <boxGeometry args={[9.5, 68.0, 5.5]} />
        <meshStandardMaterial color="#64748b" roughness={0.88} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

/**
 * 360° Halo LED Video Board hung cleanly via 24 vertical steel suspension struts from the Inner Tension Ring.
 */
function HaloLedRing({
  startAngle,
  endAngle,
  ledGlowIntensity,
}: {
  startAngle: number;
  endAngle: number;
  ledGlowIntensity: number;
}) {
  const haloTex = useMemo(() => createHaloLedTexture(), []);
  const boardGeo = useMemo(
    () =>
      createSuperEllipseBandGeometry(
        ROOF_SPECS.oculusRadiusX + 1.5,
        ROOF_SPECS.oculusRadiusZ + 1.5,
        5.2,
        startAngle,
        endAngle,
        96
      ),
    [startAngle, endAngle]
  );

  const hangers = useMemo(() => {
    const list: Array<[number, number, number]> = [];
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }
      const [x, z] = superEllipsePoint(
        angle,
        ROOF_SPECS.oculusRadiusX + 1.5,
        ROOF_SPECS.oculusRadiusZ + 1.5
      );
      list.push([x, 70.0, z]);
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="halo-360-video-board">
      <mesh geometry={boardGeo} position={[0, 62.8, 0]}>
        <meshStandardMaterial
          map={haloTex}
          emissive="#ffffff"
          emissiveMap={haloTex}
          emissiveIntensity={0.6 + ledGlowIntensity * 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hangers.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <cylinderGeometry args={[0.22, 0.22, 4.8, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function EvacuationFlowPaths({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const routes = useMemo(() => {
    const list: Array<Array<[number, number, number]>> = [];
    const portalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const a of portalAngles) {
      if (a < startAngle - 0.05 || a > endAngle + 0.05) {
        continue;
      }
      const [x1, z1] = superEllipsePoint(a, 98, 76);
      const [x2, z2] = superEllipsePoint(a, 168, 142);
      const [x3, z3] = superEllipsePoint(a, 206, 180);
      const [x4, z4] = superEllipsePoint(a, 275, 250);
      list.push([
        [x1, 18.6, z1],
        [x2, 3.8, z2],
        [x3, 1.0, z3],
        [x4, 0.6, z4],
      ]);
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="evacuation-flow-paths">
      {routes.map((pts, idx) => (
        <Line key={idx} points={pts} color="#10b981" lineWidth={3.5} dashed dashSize={4} gapSize={2} />
      ))}
    </group>
  );
}

export function BowlStands({
  ledGlowIntensity,
  halfCutaway,
  bimFrameMode,
  occupancyPercent,
  showEvacPaths,
}: BowlStandsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;

  const seatingTexture = useMemo(() => createSeatingBowlTexture(occupancyPercent), [occupancyPercent]);
  const ribbonTexture = useMemo(() => createRibbonTexture(), []);

  const tierGeos = useMemo(
    () => STADIUM_TIERS.map((tier) => createSteppedTierGeometry(tier, startAngle, endAngle)),
    [startAngle, endAngle]
  );

  const ribbonGeos = useMemo(
    () =>
      STADIUM_TIERS.map((tier) =>
        createSuperEllipseBandGeometry(
          tier.innerRadiusX - 0.25,
          tier.innerRadiusZ - 0.25,
          1.3,
          startAngle,
          endAngle
        )
      ),
    [startAngle, endAngle]
  );

  // Lower pitch-side concrete podium retaining wall sealing Tier 1 base down to ground y=0
  const pitchRetainingWallGeo = useMemo(
    () =>
      createSuperEllipseBandGeometry(
        STADIUM_TIERS[0].innerRadiusX,
        STADIUM_TIERS[0].innerRadiusZ,
        STADIUM_TIERS[0].baseElevation,
        startAngle,
        endAngle
      ),
    [startAngle, endAngle]
  );

  const glassRails = useMemo(
    () =>
      STADIUM_TIERS.slice(1).map((tier) =>
        createSuperEllipseBandGeometry(
          tier.innerRadiusX - 0.15,
          tier.innerRadiusZ - 0.15,
          1.1,
          startAngle,
          endAngle
        )
      ),
    [startAngle, endAngle]
  );

  const concourseSlabs = useMemo(
    () => [
      createConcourseSlabGeometry(100, 78, 166, 140, 17.8, startAngle, endAngle),
      createConcourseSlabGeometry(122, 98, 166, 140, 32.8, startAngle, endAngle),
      createConcourseSlabGeometry(146, 120, 166, 140, 52.8, startAngle, endAngle),
    ],
    [startAngle, endAngle]
  );

  const skyboxGeo = useMemo(
    () => createSuperEllipseBandGeometry(120, 96, 3.0, startAngle, endAngle),
    [startAngle, endAngle]
  );

  return (
    <group name="stadium-bowl-200k">
      <RCFrameBents startAngle={startAngle} endAngle={endAngle} />

      {/* Solid RC Pitch Perimeter Retaining Wall (seals Tier 1 down to y=0) */}
      <mesh geometry={pitchRetainingWallGeo} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#475569" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Reinforced Concrete Concourse Floor Slabs */}
      {concourseSlabs.map((slabGeo, idx) => (
        <mesh key={`slab-${idx}`} geometry={slabGeo} receiveShadow>
          <meshStandardMaterial
            color="#64748b"
            roughness={0.85}
            transparent={bimFrameMode}
            opacity={bimFrameMode ? 0.35 : 1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 4 Precast Stepped Super-Ellipse Seating Tiers */}
      {STADIUM_TIERS.map((tier, idx) => (
        <group key={tier.id} name={tier.id}>
          <mesh geometry={tierGeos[idx]} castShadow={!bimFrameMode} receiveShadow>
            <meshStandardMaterial
              map={seatingTexture}
              roughness={0.7}
              metalness={0.05}
              transparent={bimFrameMode}
              opacity={bimFrameMode ? 0.22 : 1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {!bimFrameMode && (
            <mesh geometry={ribbonGeos[idx]} position={[0, tier.baseElevation - 1.4, 0]}>
              <meshStandardMaterial
                map={ribbonTexture}
                emissive="#ffffff"
                emissiveMap={ribbonTexture}
                emissiveIntensity={0.4 + ledGlowIntensity * 0.28}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Safety Glass Balustrades */}
      {!bimFrameMode &&
        STADIUM_TIERS.slice(1).map((tier, idx) => (
          <mesh key={`rail-${tier.id}`} geometry={glassRails[idx]} position={[0, tier.baseElevation, 0]}>
            <meshPhysicalMaterial
              color="#bae6fd"
              transparent
              opacity={0.32}
              metalness={0.5}
              roughness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {/* Glazed VIP / VVIP Skybox Suites */}
      {!bimFrameMode && (
        <mesh geometry={skyboxGeo} position={[0, 31.6, 0]}>
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={ledGlowIntensity * 0.25}
            transparent
            opacity={0.45}
            metalness={0.78}
            roughness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {!bimFrameMode && (
        <HaloLedRing
          startAngle={startAngle}
          endAngle={endAngle}
          ledGlowIntensity={ledGlowIntensity}
        />
      )}

      {showEvacPaths && <EvacuationFlowPaths startAngle={startAngle} endAngle={endAngle} />}
    </group>
  );
}
