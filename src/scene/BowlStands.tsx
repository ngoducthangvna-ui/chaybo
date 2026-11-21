import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  ROOF_SPECS,
  STADIUM_TIERS,
  type TierSpec,
  superEllipsePoint,
} from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
  halfCutaway: boolean;
  occupancyPercent: number;
  crowdWave: boolean;
  showEvacPaths: boolean;
}

/**
 * Generates a high-resolution procedural seating & vomitory texture for 1 sector
 * (tiled 36 times around the stadium bowl), showing individual seat rows, concrete
 * radial staircases with yellow safety nosing, and shadowed vomitory tunnel portals.
 */
function createSeatingBowlTexture(occupancyPercent: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Concrete riser/tread base
  ctx.fillStyle = '#27272a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rowCount = 32;
  const seatCols = 24;
  const rowH = canvas.height / rowCount;
  const colW = canvas.width / seatCols;
  const fillThreshold = occupancyPercent / 100;

  for (let r = 0; r < rowCount; r += 1) {
    const y = r * rowH;
    // Concrete step shadow line
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, y, canvas.width, 4);

    for (let c = 0; c < seatCols; c += 1) {
      const x = c * colW;
      // Left & right edges form the concrete radial vomitory staircase
      if (c === 0 || c === seatCols - 1) {
        ctx.fillStyle = '#52525b';
        ctx.fillRect(x, y + 4, colW, rowH - 4);
        // Yellow safety step edge
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x + 2, y + 4, colW - 4, 3);
        continue;
      }

      // Mid-tier vomitory portal opening (rows 13-17, center 4 cols)
      if (r >= 13 && r <= 17 && c >= 10 && c <= 13) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(x, y, colW, rowH);
        if (r === 13) {
          ctx.fillStyle = '#71717a';
          ctx.fillRect(x, y, colW, 5);
        }
        continue;
      }

      // Empty seat base (crimson / gold accent bands)
      const isGoldBand = r === 0 || r === rowCount - 1 || (r >= 19 && r <= 20);
      ctx.fillStyle = isGoldBand ? '#b45309' : r % 2 === 0 ? '#991b1b' : '#b91c1c';
      ctx.fillRect(x + 2, y + 6, colW - 4, rowH - 8);

      // Deterministic seated spectator dot based on occupancyPercent
      const hash = Math.abs(Math.sin(r * 78.233 + c * 37.719));
      if (hash < fillThreshold) {
        ctx.fillStyle =
          hash < fillThreshold * 0.22
            ? '#fbbf24'
            : hash < fillThreshold * 0.68
              ? '#ef4444'
              : '#f8fafc';
        ctx.fillRect(x + 4, y + 8, colW - 8, rowH - 12);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(36, 1);
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

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, canvas.width, 14);
    ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

    // Repeat graphic 4 times around the 360° halo board
    for (let k = 0; k < 4; k += 1) {
      const cx = k * 512 + 256;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIETNAM NATIONAL STADIUM • 200,000 SEATS', cx, 66);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px monospace';
      ctx.fillText('VIE  3 : 0  ALL', cx, 152);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('★ DONG SON ARENA • LIVE MATCH 88:42 ★', cx, 206);
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
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'VIETNAM 200K STADIUM  ★  FIFA WORLD STANDARD  ★  C-VALUE 95MM  ★',
      canvas.width / 2,
      43
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(12, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an extruded, stepped stadium seating tier using super-ellipse contours.
 * Includes physical stair treads & risers, mapped with clean UVs for seating texture.
 */
function createSteppedTierGeometry(
  tier: TierSpec,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const stepCount = 12;
  const profile: Array<[number, number, number]> = []; // [t, y, v]

  for (let s = 0; s < stepCount; s += 1) {
    const t0 = s / stepCount;
    const t1 = (s + 1) / stepCount;
    const y0 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t0);
    const y1 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t1);
    // Horizontal tread
    profile.push([t0, y0, t0]);
    profile.push([t1, y0, t1]);
    // Vertical riser
    profile.push([t1, y1, t1]);
  }
  // Outer structural back wall & horizontal concourse underslab
  const slabDrop = 1.6;
  profile.push([1.0, tier.baseElevation - slabDrop, 1.0]);
  profile.push([0.0, tier.baseElevation - slabDrop, 0.0]);
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

/**
 * Creates a continuous super-ellipse horizontal concourse floor deck slab.
 */
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

/**
 * Creates a vertical super-ellipse band (LED ribbon board, VIP skybox glass, or Halo video board).
 */
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
 * Renders 36 radial reinforced-concrete structural bents (vertical columns & raker beams)
 * physically supporting the 4 tiers down to ground y=0.
 */
function StructuralSupportBents({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const columnsRef = useRef<THREE.InstancedMesh | null>(null);
  const rakersRef = useRef<THREE.InstancedMesh | null>(null);
  const bentCount = 36;

  const { columns, rakers } = useMemo(() => {
    const colList: Array<{ pos: [number, number, number]; height: number; radius: number }> = [];
    const rakerList: Array<{
      pos: [number, number, number];
      quat: THREE.Quaternion;
      length: number;
    }> = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < bentCount; i += 1) {
      const angle = (i / bentCount) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }

      const [x1, z1] = superEllipsePoint(angle, 98, 76);
      const [x2, z2] = superEllipsePoint(angle, 124, 102);
      const [x3, z3] = superEllipsePoint(angle, 152, 128);
      const [x0, z0] = superEllipsePoint(angle, 75, 55);
      const [x4, z4] = superEllipsePoint(angle, 160, 134);

      colList.push({ pos: [x1, 9.0, z1], height: 18.0, radius: 1.05 });
      colList.push({ pos: [x2, 16.5, z2], height: 33.0, radius: 1.2 });
      colList.push({ pos: [x3, 28.5, z3], height: 57.0, radius: 1.35 });

      const start = new THREE.Vector3(x0, 1.5, z0);
      const end = new THREE.Vector3(x4, 59.0, z4);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dir = end.clone().sub(start);
      const length = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      rakerList.push({ pos: [mid.x, mid.y, mid.z], quat, length });
    }

    return { columns: colList, rakers: rakerList };
  }, [startAngle, endAngle]);

  useEffect(() => {
    const colMesh = columnsRef.current;
    const rakerMesh = rakersRef.current;
    const dummy = new THREE.Object3D();

    if (colMesh) {
      columns.forEach((c, idx) => {
        dummy.position.set(...c.pos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(c.radius, c.height, c.radius);
        dummy.updateMatrix();
        colMesh.setMatrixAt(idx, dummy.matrix);
      });
      colMesh.count = columns.length;
      colMesh.instanceMatrix.needsUpdate = true;
    }

    if (rakerMesh) {
      rakers.forEach((r, idx) => {
        dummy.position.set(...r.pos);
        dummy.quaternion.copy(r.quat);
        dummy.scale.set(1, r.length, 1);
        dummy.updateMatrix();
        rakerMesh.setMatrixAt(idx, dummy.matrix);
      });
      rakerMesh.count = rakers.length;
      rakerMesh.instanceMatrix.needsUpdate = true;
    }
  }, [columns, rakers]);

  return (
    <group name="structural-support-bents">
      <instancedMesh ref={columnsRef} args={[undefined, undefined, bentCount * 3]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.15, 1, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={rakersRef} args={[undefined, undefined, bentCount]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1, 1.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.78} metalness={0.22} />
      </instancedMesh>
    </group>
  );
}

/**
 * 360° Halo LED Video Board hung cleanly via 24 steel suspension struts from the Inner Tension Ring.
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
        ROOF_SPECS.oculusRadiusX + 2,
        ROOF_SPECS.oculusRadiusZ + 2,
        5.5,
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
        ROOF_SPECS.oculusRadiusX + 2,
        ROOF_SPECS.oculusRadiusZ + 2
      );
      list.push([x, 71.5, z]);
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="halo-360-video-board">
      <mesh geometry={boardGeo} position={[0, 64.5, 0]}>
        <meshStandardMaterial
          map={haloTex}
          emissive="#ffffff"
          emissiveMap={haloTex}
          emissiveIntensity={0.8 + ledGlowIntensity * 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hangers.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <cylinderGeometry args={[0.25, 0.25, 5.5, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Evacuation flow paths descending along the 4 Grand Arch Concourse Portals & Plinth stairs.
 */
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
      const [x1, z1] = superEllipsePoint(a, 96, 74);
      const [x2, z2] = superEllipsePoint(a, 168, 142);
      const [x3, z3] = superEllipsePoint(a, 206, 180);
      const [x4, z4] = superEllipsePoint(a, 275, 250);
      list.push([
        [x1, 19.2, z1],
        [x2, 4.2, z2],
        [x3, 1.2, z3],
        [x4, 0.8, z4],
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
  occupancyPercent,
  crowdWave,
  showEvacPaths,
}: BowlStandsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;

  const seatingTexture = useMemo(() => createSeatingBowlTexture(occupancyPercent), [occupancyPercent]);
  const ribbonTexture = useMemo(() => createRibbonTexture(), []);

  useFrame((_, delta) => {
    if (crowdWave) {
      ribbonTexture.offset.x = (ribbonTexture.offset.x + delta * 0.14) % 1;
    }
  });

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
          1.45,
          startAngle,
          endAngle
        )
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
      createConcourseSlabGeometry(96, 74, 165, 139, 17.5, startAngle, endAngle),
      createConcourseSlabGeometry(115, 92, 165, 139, 32.5, startAngle, endAngle),
      createConcourseSlabGeometry(138, 114, 165, 139, 53.0, startAngle, endAngle),
    ],
    [startAngle, endAngle]
  );

  const skyboxGeo = useMemo(
    () => createSuperEllipseBandGeometry(117, 94, 3.2, startAngle, endAngle),
    [startAngle, endAngle]
  );

  return (
    <group name="stadium-bowl-200k">
      <StructuralSupportBents startAngle={startAngle} endAngle={endAngle} />

      {/* Horizontal Concourse Floor Decks connecting all tiers to the exterior curtain wall */}
      {concourseSlabs.map((slabGeo, idx) => (
        <mesh key={`slab-${idx}`} geometry={slabGeo} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* 4 Stepped Super-Ellipse Seating Tiers with High-Res Seating & Vomitory Texture */}
      {STADIUM_TIERS.map((tier, idx) => (
        <group key={tier.id} name={tier.id}>
          <mesh geometry={tierGeos[idx]} castShadow receiveShadow>
            <meshStandardMaterial
              map={seatingTexture}
              roughness={0.68}
              metalness={0.05}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={ribbonGeos[idx]} position={[0, tier.baseElevation - 1.55, 0]}>
            <meshStandardMaterial
              map={ribbonTexture}
              emissive="#ffffff"
              emissiveMap={ribbonTexture}
              emissiveIntensity={0.45 + ledGlowIntensity * 0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Glass Safety Balustrades along Tier 2, 3, 4 edges */}
      {STADIUM_TIERS.slice(1).map((tier, idx) => (
        <mesh key={`rail-${tier.id}`} geometry={glassRails[idx]} position={[0, tier.baseElevation, 0]}>
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.35}
            metalness={0.5}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Glazed VIP / VVIP Skybox Suites */}
      <mesh geometry={skyboxGeo} position={[0, 31.2, 0]}>
        <meshPhysicalMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={ledGlowIntensity * 0.35}
          transparent
          opacity={0.52}
          metalness={0.82}
          roughness={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>

      <HaloLedRing
        startAngle={startAngle}
        endAngle={endAngle}
        ledGlowIntensity={ledGlowIntensity}
      />

      {showEvacPaths && <EvacuationFlowPaths startAngle={startAngle} endAngle={endAngle} />}
    </group>
  );
}
