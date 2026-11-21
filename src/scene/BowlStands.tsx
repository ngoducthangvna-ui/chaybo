import { useMemo } from 'react';
import * as THREE from 'three';
import { STADIUM_TIERS, type TierSpec } from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
}

/**
 * Creates a hollow elliptical bowl-tier geometry with stepped seating profile.
 */
function createTierGeometry(tier: TierSpec, segments = 96): THREE.BufferGeometry {
  const steps = Math.min(12, Math.max(6, Math.floor(tier.rows / 3)));
  const positions: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, t);
    const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, t);
    const y = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t);

    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
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
 * Creates a thin elliptical ring for LED ribbon boards and concourse walkways.
 */
function createEllipticalRibbonGeometry(
  radiusX: number,
  radiusZ: number,
  height: number,
  segments = 96
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
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

function TierMesh({ tier, ledGlowIntensity }: { tier: TierSpec; ledGlowIntensity: number }) {
  const bowlGeo = useMemo(() => createTierGeometry(tier), [tier]);
  const ribbonGeo = useMemo(
    () => createEllipticalRibbonGeometry(tier.innerRadiusX - 0.3, tier.innerRadiusZ - 0.3, 1.3),
    [tier.innerRadiusX, tier.innerRadiusZ]
  );

  return (
    <group name={tier.id}>
      {/* Main stepped seating bowl */}
      <mesh geometry={bowlGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={tier.seatColor}
          roughness={0.72}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glowing LED fascia / ribbon board along inner tier edge */}
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

export function BowlStands({ ledGlowIntensity }: BowlStandsProps) {
  // VIP Skybox glass ring between Tier 2 and Tier 3
  const skyboxGeo = useMemo(
    () => createEllipticalRibbonGeometry(118, 96, 3.2, 96),
    []
  );

  return (
    <group name="stadium-bowl-200k">
      {STADIUM_TIERS.map((tier) => (
        <TierMesh key={tier.id} tier={tier} ledGlowIntensity={ledGlowIntensity} />
      ))}

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
    </group>
  );
}
