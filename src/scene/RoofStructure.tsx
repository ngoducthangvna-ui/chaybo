import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOF_SPECS } from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  halfCutaway: boolean;
  floodlightIntensity: number;
  facadeGlowColor: string;
  roofOpenPercent: number;
  ceremonyMode: boolean;
}

/**
 * Generates the translucent PTFE roof canopy mesh from outer eave to central oculus.
 */
function createRoofCanopyGeometry(arcSpan: number, segments = 96): THREE.BufferGeometry {
  const rings = 10;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r += 1) {
    const t = r / rings;
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, t);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, t);

    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * arcSpan;
      const wave = Math.sin(angle * 12) * 1.8 * (1 - t);
      const arch = Math.sin(t * Math.PI * 0.78) * (ROOF_SPECS.peakHeight - ROOF_SPECS.eaveHeight);
      const y = ROOF_SPECS.eaveHeight + arch + wave;
      positions.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
    }
  }

  const stride = segments + 1;
  for (let r = 0; r < rings; r += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = r * stride + i;
      const b = a + 1;
      const c = (r + 1) * stride + i;
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
 * Generates one curved elliptical half-dome shell matching the oculus opening,
 * staying completely tucked beneath the main roof canopy when retracted.
 */
function createOculusDomeHalfGeometry(side: -1 | 1): THREE.BufferGeometry {
  const rings = 8;
  const segs = 28;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r += 1) {
    const rt = r / rings;
    for (let i = 0; i <= segs; i += 1) {
      const it = i / segs;
      const angle = -Math.PI / 2 + it * Math.PI;
      const x = Math.cos(angle) * ROOF_SPECS.oculusRadiusX * rt * side;
      const z = Math.sin(angle) * ROOF_SPECS.oculusRadiusZ * rt;
      const domeArch = Math.cos((rt * Math.PI) / 2) * 6.5;
      const y = 74.2 + domeArch;
      positions.push(x, y, z);
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < rings; r += 1) {
    for (let i = 0; i < segs; i += 1) {
      const a = r * stride + i;
      const b = a + 1;
      const c = (r + 1) * stride + i;
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

function createRoofRibGeometries(arcSpan: number): THREE.TubeGeometry[] {
  const ribs: THREE.TubeGeometry[] = [];
  for (let i = 0; i < ROOF_SPECS.ribCount; i += 1) {
    const angle = (i / ROOF_SPECS.ribCount) * Math.PI * 2;
    if (angle > arcSpan + 0.05) {
      continue;
    }
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const points = [
      new THREE.Vector3(cos * (ROOF_SPECS.outerRadiusX + 4), 0, sin * (ROOF_SPECS.outerRadiusZ + 4)),
      new THREE.Vector3(cos * (ROOF_SPECS.outerRadiusX + 8), 38, sin * (ROOF_SPECS.outerRadiusZ + 8)),
      new THREE.Vector3(cos * ROOF_SPECS.outerRadiusX, ROOF_SPECS.eaveHeight, sin * ROOF_SPECS.outerRadiusZ),
      new THREE.Vector3(
        cos * ((ROOF_SPECS.outerRadiusX + ROOF_SPECS.oculusRadiusX) * 0.52),
        ROOF_SPECS.peakHeight + 1.2,
        sin * ((ROOF_SPECS.outerRadiusZ + ROOF_SPECS.oculusRadiusZ) * 0.52)
      ),
      new THREE.Vector3(cos * ROOF_SPECS.oculusRadiusX, 75, sin * ROOF_SPECS.oculusRadiusZ),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    ribs.push(new THREE.TubeGeometry(curve, 28, 0.95, 8, false));
  }
  return ribs;
}

function createDiagridGeometries(arcSpan: number): THREE.TubeGeometry[] {
  const struts: THREE.TubeGeometry[] = [];
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const a1 = (i / count) * Math.PI * 2;
    const a2 = ((i + 1) / count) * Math.PI * 2;
    if (a1 > arcSpan || a2 > arcSpan + 0.1) {
      continue;
    }
    const p1 = new THREE.Vector3(
      Math.cos(a1) * (ROOF_SPECS.outerRadiusX + 4),
      0,
      Math.sin(a1) * (ROOF_SPECS.outerRadiusZ + 4)
    );
    const p2 = new THREE.Vector3(
      Math.cos(a2) * ROOF_SPECS.outerRadiusX,
      ROOF_SPECS.eaveHeight,
      Math.sin(a2) * ROOF_SPECS.outerRadiusZ
    );
    struts.push(new THREE.TubeGeometry(new THREE.LineCurve3(p1, p2), 4, 0.55, 6, false));
  }
  return struts;
}

function createOculusRingGeometry(arcSpan: number, segments = 96): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = [];
  const isClosed = arcSpan >= Math.PI * 1.99;
  const steps = isClosed ? segments : Math.max(12, Math.round((arcSpan / (Math.PI * 2)) * segments));

  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * arcSpan;
    pts.push(
      new THREE.Vector3(
        Math.cos(angle) * ROOF_SPECS.oculusRadiusX,
        75,
        Math.sin(angle) * ROOF_SPECS.oculusRadiusZ
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts, isClosed);
  return new THREE.TubeGeometry(curve, steps, 1.15, 8, isClosed);
}

/**
 * Concrete pier footings anchoring every steel rib & diagrid strut firmly to the ground.
 */
function ButtressFoundations({ arcSpan }: { arcSpan: number }) {
  const footings = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; rotY: number }> = [];
    for (let i = 0; i < ROOF_SPECS.ribCount; i += 1) {
      const angle = (i / ROOF_SPECS.ribCount) * Math.PI * 2;
      if (angle > arcSpan + 0.05) {
        continue;
      }
      items.push({
        pos: [
          Math.cos(angle) * (ROOF_SPECS.outerRadiusX + 4),
          1.8,
          Math.sin(angle) * (ROOF_SPECS.outerRadiusZ + 4),
        ],
        rotY: -angle,
      });
    }
    return items;
  }, [arcSpan]);

  return (
    <group name="roof-buttress-foundations">
      {footings.map((f, idx) => (
        <mesh key={idx} position={f.pos} rotation={[0, f.rotY, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.5, 4.2, 4.5]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function RetractableOculusPanels({
  roofOpenPercent,
  xrayRoof,
}: {
  roofOpenPercent: number;
  xrayRoof: boolean;
}) {
  const leftDomeGeo = useMemo(() => createOculusDomeHalfGeometry(-1), []);
  const rightDomeGeo = useMemo(() => createOculusDomeHalfGeometry(1), []);
  // Max 44m retract keeps both curved dome halves tucked strictly underneath the main roof canopy
  const slideOffset = (roofOpenPercent / 100) * 44;

  return (
    <group name="retractable-oculus-dome">
      {/* Guide Track Beams supporting the retractable halves beneath the canopy */}
      {[-44, 44].map((zTrack) => (
        <mesh key={zTrack} position={[0, 74.2, zTrack]}>
          <boxGeometry args={[216, 0.9, 1.1]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      <mesh
        geometry={leftDomeGeo}
        position={[-slideOffset, -0.4 * (roofOpenPercent / 100), 0]}
        castShadow={!xrayRoof}
      >
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={xrayRoof ? 0.14 : 0.58}
          wireframe={xrayRoof}
          roughness={0.2}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        geometry={rightDomeGeo}
        position={[slideOffset, -0.4 * (roofOpenPercent / 100), 0]}
        castShadow={!xrayRoof}
      >
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={xrayRoof ? 0.14 : 0.58}
          wireframe={xrayRoof}
          roughness={0.2}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function CeremonyFireworks() {
  const pointsRef = useRef<THREE.Points | null>(null);
  const count = 360;

  const { positions, colors, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seedArr = new Float32Array(count * 4);
    const palette = [
      new THREE.Color('#ef4444'),
      new THREE.Color('#fbbf24'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#f472b6'),
    ];

    for (let i = 0; i < count; i += 1) {
      const burstIdx = i % 12;
      const baseAngle = (burstIdx / 12) * Math.PI * 2;
      const spreadA = ((i * 73) % 360) * (Math.PI / 180);
      const spreadPhi = (((i * 37) % 180) - 90) * (Math.PI / 180);
      seedArr[i * 4] = baseAngle;
      seedArr[i * 4 + 1] = spreadA;
      seedArr[i * 4 + 2] = spreadPhi;
      seedArr[i * 4 + 3] = (burstIdx * 0.45) % 2.4;

      const c = palette[burstIdx % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col, seeds: seedArr };
  }, []);

  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) {
      return;
    }
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i += 1) {
      const baseAngle = seeds[i * 4];
      const spreadA = seeds[i * 4 + 1];
      const spreadPhi = seeds[i * 4 + 2];
      const delay = seeds[i * 4 + 3];

      const cycle = (t + delay) % 2.8;
      const originX = Math.cos(baseAngle) * (ROOF_SPECS.oculusRadiusX + 12);
      const originZ = Math.sin(baseAngle) * (ROOF_SPECS.oculusRadiusZ + 12);
      const originY = 82;

      if (cycle < 0.9) {
        const rise = cycle / 0.9;
        attr.setXYZ(i, originX, originY + rise * 48, originZ);
      } else {
        const burstT = (cycle - 0.9) / 1.9;
        const radius = burstT * 26;
        const gravity = burstT * burstT * 18;
        const x = originX + Math.cos(spreadA) * Math.cos(spreadPhi) * radius;
        const y = originY + 48 + Math.sin(spreadPhi) * radius - gravity;
        const z = originZ + Math.sin(spreadA) * Math.cos(spreadPhi) * radius;
        attr.setXYZ(i, x, y, z);
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} name="ceremony-fireworks">
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={2.6} vertexColors transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}

export function RoofStructure({
  xrayRoof,
  halfCutaway,
  floodlightIntensity,
  facadeGlowColor,
  roofOpenPercent,
  ceremonyMode,
}: RoofStructureProps) {
  const arcSpan = halfCutaway ? Math.PI * 1.15 : Math.PI * 2;
  const canopyGeo = useMemo(() => createRoofCanopyGeometry(arcSpan), [arcSpan]);
  const ribGeos = useMemo(() => createRoofRibGeometries(arcSpan), [arcSpan]);
  const diagridGeos = useMemo(() => createDiagridGeometries(arcSpan), [arcSpan]);
  const oculusGeo = useMemo(() => createOculusRingGeometry(arcSpan), [arcSpan]);

  const floodlightPositions = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; angle: number }> = [];
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      if (angle > arcSpan) {
        continue;
      }
      items.push({
        pos: [
          Math.cos(angle) * (ROOF_SPECS.oculusRadiusX + 3),
          73.5,
          Math.sin(angle) * (ROOF_SPECS.oculusRadiusZ + 3),
        ],
        angle,
      });
    }
    return items;
  }, [arcSpan]);

  return (
    <group name="dong-son-roof">
      <ButtressFoundations arcSpan={arcSpan} />

      {/* Translucent PTFE roof canopy */}
      <mesh geometry={canopyGeo} castShadow={!xrayRoof} receiveShadow>
        <meshPhysicalMaterial
          color={xrayRoof ? '#38bdf8' : '#f1f5f9'}
          transparent
          opacity={xrayRoof ? 0.16 : 0.84}
          wireframe={xrayRoof}
          roughness={0.35}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Curved Retractable Inner Oculus Dome tucked beneath canopy */}
      {!halfCutaway && (
        <RetractableOculusPanels roofOpenPercent={roofOpenPercent} xrayRoof={xrayRoof} />
      )}

      {/* 24 Sweeping Dong Son Structural Ribs anchored to foundations */}
      {ribGeos.map((geo, idx) => (
        <mesh key={idx} geometry={geo} castShadow>
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#e2e8f0' : '#f59e0b'}
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      ))}

      {/* Outer Diagrid Exoskeleton Facade anchored at y=0 */}
      {diagridGeos.map((geo, idx) => (
        <mesh key={`diag-${idx}`} geometry={geo}>
          <meshStandardMaterial
            color="#cbd5e1"
            emissive={facadeGlowColor}
            emissiveIntensity={floodlightIntensity > 0 ? 0.35 : 0.05}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* Central Oculus Tension Ring */}
      <mesh geometry={oculusGeo} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.22} />
      </mesh>

      {/* Stadium Floodlights & Night Volumetric Beams */}
      {floodlightPositions.map(({ pos, angle }, idx) => (
        <group key={idx} position={pos} rotation={[0, -angle, 0]}>
          <mesh>
            <boxGeometry args={[3.8, 1.4, 2.0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fef08a"
              emissiveIntensity={floodlightIntensity > 0 ? floodlightIntensity * 1.4 : 0.15}
            />
          </mesh>
          {floodlightIntensity > 1 && (
            <mesh position={[-22, -34, 0]} rotation={[0, 0, -0.55]}>
              <coneGeometry args={[18, 76, 12, 1, true]} />
              <meshBasicMaterial
                color="#fef9c3"
                transparent
                opacity={0.045}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Opening Ceremony Fireworks */}
      {ceremonyMode && <CeremonyFireworks />}
    </group>
  );
}
