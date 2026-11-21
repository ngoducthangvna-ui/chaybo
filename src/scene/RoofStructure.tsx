import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS } from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  halfCutaway: boolean;
  floodlightIntensity: number;
  facadeGlowColor: string;
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
 * Generates sweeping steel arch ribs inspired by Dong Son sun-rays & Lac bird wings.
 */
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
      new THREE.Vector3(cos * (ROOF_SPECS.outerRadiusX + 4), 2, sin * (ROOF_SPECS.outerRadiusZ + 4)),
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

/**
 * Generates diagrid exoskeleton struts wrapping the outer stadium facade.
 */
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
      2,
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

export function RoofStructure({
  xrayRoof,
  halfCutaway,
  floodlightIntensity,
  facadeGlowColor,
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

      {/* 24 Sweeping Dong Son Structural Ribs */}
      {ribGeos.map((geo, idx) => (
        <mesh key={idx} geometry={geo} castShadow>
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#e2e8f0' : '#f59e0b'}
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      ))}

      {/* Outer Diagrid Exoskeleton Facade */}
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
    </group>
  );
}
