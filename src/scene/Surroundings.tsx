import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Renders the grand podium plaza, 4 pedestrian skybridges, reflecting pools with
 * fountain jets, perimeter trees, and plaza lighting.
 */
export function Surroundings() {
  const treePositions = useMemo(() => {
    const coords: Array<[number, number, number]> = [];
    const count = 48;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const rx = 216 + (i % 2) * 14;
      const rz = 190 + (i % 2) * 14;
      coords.push([Math.cos(angle) * rx, 0, Math.sin(angle) * rz]);
    }
    return coords;
  }, []);

  const skybridges = useMemo(
    () => [
      { pos: [0, 14, 154] as [number, number, number], rotY: 0 },
      { pos: [0, 14, -154] as [number, number, number], rotY: 0 },
      { pos: [182, 14, 0] as [number, number, number], rotY: Math.PI / 2 },
      { pos: [-182, 14, 0] as [number, number, number], rotY: Math.PI / 2 },
    ],
    []
  );

  return (
    <group name="stadium-surroundings">
      {/* Ground terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <circleGeometry args={[620, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Grand Concourse Podium */}
      <mesh position={[0, 0.4, 0]} scale={[1.18, 1, 1.0]} receiveShadow>
        <cylinderGeometry args={[178, 188, 1.2, 72]} />
        <meshStandardMaterial color="#334155" roughness={0.82} />
      </mesh>

      {/* Outer Ceremonial Plaza Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} scale={[1.16, 1.0, 1]} receiveShadow>
        <ringGeometry args={[186, 232, 72]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* 4 Pedestrian Skybridges connecting Plaza to Tier 2 VIP Concourse */}
      {skybridges.map((bridge, idx) => (
        <group key={idx} position={bridge.pos} rotation={[0, bridge.rotY, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[16, 1.6, 56]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[15.4, 2.8, 55]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              transparent
              opacity={0.32}
              metalness={0.6}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Reflecting Pools & Fountain Jets (North & South Plaza) */}
      {[172, -172].map((zPos) => (
        <group key={zPos} position={[0, 0.12, zPos]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[130, 24]} />
            <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.12} />
          </mesh>
          {[-35, 0, 35].map((xJet) => (
            <mesh key={xJet} position={[xJet, 4.5, 0]}>
              <cylinderGeometry args={[0.35, 1.4, 9, 8]} />
              <meshStandardMaterial
                color="#bae6fd"
                emissive="#38bdf8"
                emissiveIntensity={0.6}
                transparent
                opacity={0.68}
              />
            </mesh>
          ))}
        </group>
      ))}

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
