import { useMemo } from 'react';
import * as THREE from 'three';

interface SurroundingsProps {
  halfCutaway: boolean;
}

interface SkybridgeConfig {
  id: string;
  axis: 'x' | 'z';
  dir: 1 | -1;
  innerStart: number;
  deckEnd: number;
  rampEnd: number;
}

function GroundedSkybridge({ config }: { config: SkybridgeConfig }) {
  const deckHeight = 18.0;
  const deckLength = config.deckEnd - config.innerStart;
  const deckMid = (config.innerStart + config.deckEnd) / 2;

  const rampHoriz = config.rampEnd - config.deckEnd;
  const rampDrop = deckHeight - 0.4;
  const rampLength = Math.hypot(rampHoriz, rampDrop);
  const rampAngle = Math.atan2(rampDrop, rampHoriz);
  const rampMidDist = (config.deckEnd + config.rampEnd) / 2;
  const rampMidY = (deckHeight + 0.4) / 2;

  // Concrete bridge pier positions under the horizontal deck
  const deckPiers = [
    config.innerStart + deckLength * 0.25,
    config.innerStart + deckLength * 0.6,
    config.deckEnd - 2,
  ];
  // Intermediate pier supporting the sloped ramp
  const rampPierDist = config.deckEnd + rampHoriz * 0.45;
  const rampPierHeight = deckHeight - (rampDrop * 0.45);

  const isX = config.axis === 'x';
  const rotY = isX ? (config.dir === 1 ? Math.PI / 2 : -Math.PI / 2) : config.dir === 1 ? 0 : Math.PI;

  const toWorld = (dist: number, y: number): [number, number, number] =>
    isX ? [dist * config.dir, y, 0] : [0, y, dist * config.dir];

  return (
    <group name={`skybridge-${config.id}`}>
      {/* Horizontal Elevated Deck connecting directly into Tier 2 Concourse */}
      <group position={toWorld(deckMid, deckHeight)} rotation={[0, rotY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[15, 1.4, deckLength]} />
          <meshStandardMaterial color="#475569" metalness={0.45} roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[14.4, 2.4, deckLength - 1]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.32}
            metalness={0.5}
            roughness={0.18}
          />
        </mesh>
      </group>

      {/* Twin Concrete Piers supporting the horizontal deck down to y=0 */}
      {deckPiers.map((dist, idx) => (
        <group key={`dp-${idx}`} position={toWorld(dist, deckHeight / 2)} rotation={[0, rotY, 0]}>
          {[-5.2, 5.2].map((offset) => (
            <mesh key={offset} position={[offset, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 1.15, deckHeight, 10]} />
              <meshStandardMaterial color="#334155" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Sloped Pedestrian Access Ramp descending to Plaza Ground (y=0.4m) */}
      <group
        position={toWorld(rampMidDist, rampMidY)}
        rotation={[0, rotY, 0]}
      >
        <mesh rotation={[rampAngle, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[15, 1.2, rampLength]} />
          <meshStandardMaterial color="#475569" roughness={0.65} />
        </mesh>
      </group>

      {/* Ramp Intermediate Support Pier down to y=0 */}
      <group
        position={toWorld(rampPierDist, rampPierHeight / 2)}
        rotation={[0, rotY, 0]}
      >
        {[-5.2, 5.2].map((offset) => (
          <mesh key={offset} position={[offset, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 1.05, rampPierHeight, 10]} />
            <meshStandardMaterial color="#334155" roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Renders the grand podium plaza, 4 grounded pedestrian skybridges with access ramps,
 * plaza reflecting pools, and perimeter trees.
 */
export function Surroundings({ halfCutaway }: SurroundingsProps) {
  const treePositions = useMemo(() => {
    const coords: Array<[number, number, number]> = [];
    const count = 48;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const rx = 235 + (i % 2) * 14;
      const rz = 212 + (i % 2) * 14;
      coords.push([Math.cos(angle) * rx, 0, Math.sin(angle) * rz]);
    }
    return coords;
  }, []);

  const skybridges: SkybridgeConfig[] = useMemo(() => {
    const list: SkybridgeConfig[] = [
      { id: 'south', axis: 'z', dir: 1, innerStart: 96, deckEnd: 174, rampEnd: 226 },
      { id: 'east', axis: 'x', dir: 1, innerStart: 118, deckEnd: 198, rampEnd: 248 },
      { id: 'west', axis: 'x', dir: -1, innerStart: 118, deckEnd: 198, rampEnd: 248 },
    ];
    if (!halfCutaway) {
      list.push({ id: 'north', axis: 'z', dir: -1, innerStart: 96, deckEnd: 174, rampEnd: 226 });
    }
    return list;
  }, [halfCutaway]);

  return (
    <group name="stadium-surroundings">
      {/* Ground terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <circleGeometry args={[640, 64]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Grand Concourse Podium (top surface sits cleanly at y = 0.0 beneath the FIFA pitch at y = 0.08) */}
      <mesh position={[0, -0.6, 0]} scale={[1.18, 1, 1.0]} receiveShadow>
        <cylinderGeometry args={[178, 188, 1.2, 72]} />
        <meshStandardMaterial color="#334155" roughness={0.82} />
      </mesh>

      {/* Outer Ceremonial Plaza Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} scale={[1.16, 1.0, 1]} receiveShadow>
        <ringGeometry args={[186, 245, 72]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Grounded Pedestrian Skybridges + Concrete Piers + Access Ramps */}
      {skybridges.map((cfg) => (
        <GroundedSkybridge key={cfg.id} config={cfg} />
      ))}

      {/* Reflecting Pools flanked symmetrically along the outer plaza */}
      {[
        [-85, 178],
        [85, 178],
        [-85, -178],
        [85, -178],
      ].map(([px, pz], idx) => (
        <group key={idx} position={[px, 0.14, pz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[64, 22]} />
            <meshStandardMaterial color="#0284c7" metalness={0.82} roughness={0.15} />
          </mesh>
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
