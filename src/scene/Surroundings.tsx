import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders the grand podium plaza, reflecting pools, perimeter trees, and ground plane.
 */
export function Surroundings() {
  const treePositions = useMemo(() => {
    const coords: Array<[number, number, number]> = [];
    const count = 48;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const rx = 212 + (i % 2) * 14;
      const rz = 186 + (i % 2) * 14;
      coords.push([Math.cos(angle) * rx, 0, Math.sin(angle) * rz]);
    }
    return coords;
  }, []);

  return (
    <group name="stadium-surroundings">
      {/* Ground terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <circleGeometry args={[600, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Grand Concourse Podium */}
      <mesh position={[0, 0.4, 0]} scale={[1.18, 1, 1.0]} receiveShadow>
        <cylinderGeometry args={[178, 188, 1.2, 72]} />
        <meshStandardMaterial color="#334155" roughness={0.82} />
      </mesh>

      {/* Outer Ceremonial Plaza Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[1.16, 1.0, 1]} receiveShadow>
        <ringGeometry args={[186, 228, 72]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Reflecting Pools (North & South Plaza) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 168]}>
        <planeGeometry args={[130, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, -168]}>
        <planeGeometry args={[130, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.12} />
      </mesh>

      {/* Stylized Perimeter Trees */}
      {treePositions.map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.5, 4.4, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 6.2, 0]} castShadow>
            <dodecahedronGeometry args={[3.2, 0]} />
            <meshStandardMaterial color="#15803d" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
