import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { STADIUM_TIERS, type TierSpec } from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
  halfCutaway: boolean;
  occupancyPercent: number;
  crowdWave: boolean;
  showEvacPaths: boolean;
}

/**
 * Creates a solid, closed cross-section elliptical bowl-tier geometry including
 * the stepped seating deck, vertical outer back wall, and horizontal underslab.
 */
function createTierGeometry(
  tier: TierSpec,
  arcSpan: number,
  segments = 96
): THREE.BufferGeometry {
  const steps = Math.min(10, Math.max(6, Math.floor(tier.rows / 3)));
  const slabDrop = 1.6;
  const profile: Array<[number, number]> = [];

  // 1. Sloped seating deck (inner bottom -> outer top)
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    profile.push([t, THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t)]);
  }
  // 2. Outer back structural wall down to concourse soffit
  profile.push([1.0, tier.baseElevation - slabDrop]);
  // 3. Horizontal concourse underslab back to inner edge
  profile.push([0.0, tier.baseElevation - slabDrop]);
  // 4. Close front fascia back to inner start
  profile.push([0.0, tier.baseElevation]);

  const positions: number[] = [];
  const indices: number[] = [];

  for (const [t, y] of profile) {
    const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, t);
    const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, t);
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * arcSpan;
      positions.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
    }
  }

  const ringStride = segments + 1;
  for (let p = 0; p < profile.length - 1; p += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = p * ringStride + i;
      const b = a + 1;
      const c = (p + 1) * ringStride + i;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createEllipticalRibbonGeometry(
  radiusX: number,
  radiusZ: number,
  height: number,
  arcSpan: number,
  segments = 96
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * arcSpan;
    const x = Math.cos(angle) * radiusX;
    const z = Math.sin(angle) * radiusZ;
    positions.push(x, 0, z, x, height, z);
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
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createJumbotronTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIETNAM NATIONAL STADIUM • 200,000', canvas.width / 2, 86);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 92px monospace';
    ctx.fillText('VIE  3  :  0  ALL', canvas.width / 2, 205);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('LIVE MATCH • 88:42', canvas.width / 2, 275);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Renders 36 radial reinforced-concrete structural bents (vertical piers from ground y=0
 * and sloped raker beams) physically supporting Tiers 2, 3, and 4 down to the podium foundation.
 */
function StructuralSupportBents({ arcSpan }: { arcSpan: number }) {
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
      if (angle > arcSpan + 0.02) {
        continue;
      }
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Ring 1 pier supporting Tier 2 base (y = 0 -> 18.0)
      colList.push({ pos: [cos * 102, 9.0, sin * 82], height: 18.0, radius: 1.1 });
      // Ring 2 pier supporting Tier 3 base (y = 0 -> 32.5)
      colList.push({ pos: [cos * 124, 16.25, sin * 102], height: 32.5, radius: 1.25 });
      // Ring 3 pier supporting Tier 4 & roof perimeter (y = 0 -> 56.0)
      colList.push({ pos: [cos * 150, 28.0, sin * 126], height: 56.0, radius: 1.4 });

      // Sloped raker beam connecting inner podium (y=1.2) up to Tier 4 soffit (y=56.0)
      const start = new THREE.Vector3(cos * 78, 1.2, sin * 60);
      const end = new THREE.Vector3(cos * 156, 58.0, sin * 132);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const dir = end.clone().sub(start);
      const length = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      rakerList.push({ pos: [mid.x, mid.y, mid.z], quat, length });
    }

    return { columns: colList, rakers: rakerList };
  }, [arcSpan]);

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
        <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={rakersRef} args={[undefined, undefined, bentCount]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1, 1.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.2} />
      </instancedMesh>
    </group>
  );
}

/**
 * Suspended Jumbotron scoreboard anchored by twin steel hanger trusses to the overhead roof ring.
 */
function JumbotronRig({
  positionX,
  rotationY,
  texture,
  ledGlowIntensity,
}: {
  positionX: number;
  rotationY: number;
  texture: THREE.CanvasTexture;
  ledGlowIntensity: number;
}) {
  return (
    <group position={[positionX, 58, 0]} rotation={[0, rotationY, 0]}>
      {/* Main Display Face */}
      <mesh>
        <planeGeometry args={[34, 10.5]} />
        <meshStandardMaterial
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.85 + ledGlowIntensity * 0.25}
        />
      </mesh>
      {/* Structural Steel Backing Housing */}
      <mesh position={[0, 0, -0.7]}>
        <boxGeometry args={[34.8, 11.2, 1.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Twin Vertical Steel Hangers anchored straight into the roof truss at y=75..78 */}
      {[-11, 11].map((hx) => (
        <mesh key={hx} position={[hx, 11.5, -0.5]}>
          <cylinderGeometry args={[0.35, 0.35, 15, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function CrowdInstances({
  arcSpan,
  occupancyPercent,
  crowdWave,
}: {
  arcSpan: number;
  occupancyPercent: number;
  crowdWave: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const transforms = useMemo(() => {
    const list: Array<{
      pos: [number, number, number];
      rotY: number;
      angle: number;
      color: string;
    }> = [];
    const perTierCols = 72;
    const rowsPerTier = 6;
    const threshold = occupancyPercent / 100;

    STADIUM_TIERS.forEach((tier, tIdx) => {
      for (let r = 0; r < rowsPerTier; r += 1) {
        const rt = (r + 0.5) / rowsPerTier;
        const rx = THREE.MathUtils.lerp(tier.innerRadiusX + 1.5, tier.outerRadiusX - 1.5, rt);
        const rz = THREE.MathUtils.lerp(tier.innerRadiusZ + 1.5, tier.outerRadiusZ - 1.5, rt);
        const y = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, rt) + 0.55;

        for (let c = 0; c < perTierCols; c += 1) {
          const angle = (c / perTierCols) * arcSpan;
          const hash = Math.abs(Math.sin((tIdx + 1) * 12.9898 + r * 78.233 + c * 37.719));
          if (hash > threshold) {
            continue;
          }
          const color =
            hash < threshold * 0.18 ? '#fbbf24' : hash < threshold * 0.72 ? '#ef4444' : '#f8fafc';
          list.push({
            pos: [Math.cos(angle) * rx, y, Math.sin(angle) * rz],
            rotY: -angle,
            angle,
            color,
          });
        }
      }
    });
    return list;
  }, [arcSpan, occupancyPercent]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const color = new THREE.Color();
    transforms.forEach((item, i) => {
      dummy.position.set(...item.pos);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    mesh.count = transforms.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [transforms, dummy]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !crowdWave || transforms.length === 0) {
      return;
    }
    const t = clock.getElapsedTime();
    for (let i = 0; i < transforms.length; i += 1) {
      const item = transforms[i];
      const wave = Math.max(0, Math.sin(item.angle * 2 - t * 3.4));
      const lift = wave * 0.75;
      dummy.position.set(item.pos[0], item.pos[1] + lift, item.pos[2]);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(1, 1 + wave * 0.45, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const maxInstances = STADIUM_TIERS.length * 72 * 6;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]}>
      <boxGeometry args={[1.1, 0.85, 1.8]} />
      <meshStandardMaterial roughness={0.6} metalness={0.05} />
    </instancedMesh>
  );
}

/**
 * Renders physically grounded evacuation paths descending along Tier 2 concourse decks,
 * crossing the Skybridges, and following the pedestrian ramps down to the plaza ground.
 */
function EvacuationFlowPaths({ halfCutaway }: { halfCutaway: boolean }) {
  const routes: Array<Array<[number, number, number]>> = useMemo(() => {
    const list: Array<Array<[number, number, number]>> = [
      // South (+Z) Skybridge & Ramp
      [
        [0, 19.2, 82],
        [0, 19.0, 98],
        [0, 19.0, 174],
        [0, 1.2, 226],
      ],
      // East (+X) Skybridge & Ramp
      [
        [102, 19.2, 0],
        [120, 19.0, 0],
        [198, 19.0, 0],
        [248, 1.2, 0],
      ],
      // West (-X) Skybridge & Ramp
      [
        [-102, 19.2, 0],
        [-120, 19.0, 0],
        [-198, 19.0, 0],
        [-248, 1.2, 0],
      ],
    ];

    if (!halfCutaway) {
      // North (-Z) Skybridge & Ramp
      list.push([
        [0, 19.2, -82],
        [0, 19.0, -98],
        [0, 19.0, -174],
        [0, 1.2, -226],
      ]);
    }
    return list;
  }, [halfCutaway]);

  return (
    <group name="evacuation-flow-paths">
      {routes.map((pts, idx) => (
        <Line key={idx} points={pts} color="#10b981" lineWidth={3.5} dashed dashSize={4} gapSize={2} />
      ))}
    </group>
  );
}

function TierMesh({
  tier,
  arcSpan,
  ledGlowIntensity,
}: {
  tier: TierSpec;
  arcSpan: number;
  ledGlowIntensity: number;
}) {
  const bowlGeo = useMemo(() => createTierGeometry(tier, arcSpan), [tier, arcSpan]);
  const ribbonGeo = useMemo(
    () =>
      createEllipticalRibbonGeometry(
        tier.innerRadiusX - 0.3,
        tier.innerRadiusZ - 0.3,
        1.4,
        arcSpan
      ),
    [tier.innerRadiusX, tier.innerRadiusZ, arcSpan]
  );

  return (
    <group name={tier.id}>
      <mesh geometry={bowlGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={tier.seatColor}
          roughness={0.72}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={ribbonGeo} position={[0, tier.baseElevation - 1.5, 0]}>
        <meshStandardMaterial
          color={tier.accentColor}
          emissive={tier.accentColor}
          emissiveIntensity={ledGlowIntensity}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
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
  const arcSpan = halfCutaway ? Math.PI * 1.15 : Math.PI * 2;
  const skyboxGeo = useMemo(
    () => createEllipticalRibbonGeometry(118, 96, 3.2, arcSpan, 96),
    [arcSpan]
  );
  const jumbotronTex = useMemo(() => createJumbotronTexture(), []);

  return (
    <group name="stadium-bowl-200k">
      <StructuralSupportBents arcSpan={arcSpan} />

      {STADIUM_TIERS.map((tier) => (
        <TierMesh
          key={tier.id}
          tier={tier}
          arcSpan={arcSpan}
          ledGlowIntensity={ledGlowIntensity}
        />
      ))}

      <CrowdInstances
        arcSpan={arcSpan}
        occupancyPercent={occupancyPercent}
        crowdWave={crowdWave}
      />

      {showEvacPaths && <EvacuationFlowPaths halfCutaway={halfCutaway} />}

      {/* Glazed VIP / VVIP Skybox Concourse */}
      <mesh geometry={skyboxGeo} position={[0, 30.2, 0]}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={ledGlowIntensity * 0.35}
          transparent
          opacity={0.55}
          metalness={0.8}
          roughness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Physically Anchored Twin Jumbotrons hung from roof ring */}
      <JumbotronRig
        positionX={72}
        rotationY={-Math.PI / 2}
        texture={jumbotronTex}
        ledGlowIntensity={ledGlowIntensity}
      />
      {!halfCutaway && (
        <JumbotronRig
          positionX={-72}
          rotationY={Math.PI / 2}
          texture={jumbotronTex}
          ledGlowIntensity={ledGlowIntensity}
        />
      )}
    </group>
  );
}
