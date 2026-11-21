import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { STADIUM_TIERS, type TierSpec } from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
  halfCutaway: boolean;
  occupancyPercent: number;
}

/**
 * Creates a hollow elliptical bowl-tier geometry with stepped seating profile.
 */
function createTierGeometry(
  tier: TierSpec,
  arcSpan: number,
  segments = 96
): THREE.BufferGeometry {
  const steps = Math.min(12, Math.max(6, Math.floor(tier.rows / 3)));
  const positions: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, t);
    const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, t);
    const y = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t);

    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * arcSpan;
      positions.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
    }
  }

  const ringStride = segments + 1;
  for (let s = 0; s < steps; s += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = s * ringStride + i;
      const b = a + 1;
      const c = (s + 1) * ringStride + i;
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

/**
 * Creates a thin elliptical ring for LED ribbon boards and VIP skybox glazing.
 */
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

function CrowdInstances({
  arcSpan,
  occupancyPercent,
}: {
  arcSpan: number;
  occupancyPercent: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const transforms = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; rotY: number; color: string }> = [];
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
          // Deterministic pseudo-random occupancy filter
          const hash = Math.abs(Math.sin((tIdx + 1) * 12.9898 + r * 78.233 + c * 37.719));
          if (hash > threshold) {
            continue;
          }
          const color = hash < threshold * 0.18 ? '#fbbf24' : hash < threshold * 0.72 ? '#ef4444' : '#f8fafc';
          list.push({
            pos: [Math.cos(angle) * rx, y, Math.sin(angle) * rz],
            rotY: -angle,
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
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    transforms.forEach((item, i) => {
      dummy.position.set(...item.pos);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    mesh.count = transforms.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [transforms]);

  const maxInstances = STADIUM_TIERS.length * 72 * 6;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxInstances]}>
      <boxGeometry args={[1.1, 0.85, 1.8]} />
      <meshStandardMaterial roughness={0.6} metalness={0.05} />
    </instancedMesh>
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
        1.3,
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
      <mesh geometry={ribbonGeo} position={[0, tier.baseElevation - 1.35, 0]}>
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
}: BowlStandsProps) {
  const arcSpan = halfCutaway ? Math.PI * 1.15 : Math.PI * 2;
  const skyboxGeo = useMemo(
    () => createEllipticalRibbonGeometry(118, 96, 3.2, arcSpan, 96),
    [arcSpan]
  );
  const jumbotronTex = useMemo(() => createJumbotronTexture(), []);

  return (
    <group name="stadium-bowl-200k">
      {STADIUM_TIERS.map((tier) => (
        <TierMesh
          key={tier.id}
          tier={tier}
          arcSpan={arcSpan}
          ledGlowIntensity={ledGlowIntensity}
        />
      ))}

      {/* Instanced 200K Crowd / Seat Clusters */}
      <CrowdInstances arcSpan={arcSpan} occupancyPercent={occupancyPercent} />

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

      {/* Twin Giant Jumbotron Scoreboards (East & West ends) */}
      <mesh position={[92, 56, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[36, 11]} />
        <meshStandardMaterial
          map={jumbotronTex}
          emissive="#ffffff"
          emissiveMap={jumbotronTex}
          emissiveIntensity={0.9 + ledGlowIntensity * 0.3}
        />
      </mesh>
      {!halfCutaway && (
        <mesh position={[-92, 56, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[36, 11]} />
          <meshStandardMaterial
            map={jumbotronTex}
            emissive="#ffffff"
            emissiveMap={jumbotronTex}
            emissiveIntensity={0.9 + ledGlowIntensity * 0.3}
          />
        </mesh>
      )}
    </group>
  );
}
