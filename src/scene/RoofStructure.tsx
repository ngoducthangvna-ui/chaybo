import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS } from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  floodlightIntensity: number;
}

/**
 * Generates the translucent PTFE roof canopy mesh from outer eave to central oculus.
 */
function createRoofCanopyGeometry(segments = 96): THREE.BufferGeometry {
  const rings = 10;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r += 1) {
    const t = r / rings;
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, t);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, t);

    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      // Subtle Dong Son wave undulation along the perimeter
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
 * Generates 24 sweeping steel arch ribs inspired by Dong Son sun-rays & Lac bird wings.
 */
function createRoofRibGeometries(): THREE.TubeGeometry[] {
  const ribs: THREE.TubeGeometry[] = [];
  for (let i = 0; i < ROOF_SPECS.ribCount; i += 1) {
    const angle = (i / ROOF_SPECS.ribCount) * Math.PI * 2;
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
 * Generates the elliptical oculus tension ring geometry.
 */
function createOculusRingGeometry(segments = 96): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    pts.push(
      new THREE.Vector3(
        Math.cos(angle) * ROOF_SPECS.oculusRadiusX,
        75,
        Math.sin(angle) * ROOF_SPECS.oculusRadiusZ
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, 96, 1.15, 8, true);
}

export function RoofStructure({ xrayRoof, floodlightIntensity }: RoofStructureProps) {
  const canopyGeo = useMemo(() => createRoofCanopyGeometry(), []);
  const ribGeos = useMemo(() => createRoofRibGeometries(), []);
  const oculusGeo = useMemo(() => createOculusRingGeometry(), []);

  const floodlightPositions = useMemo(() => {
    const items: Array<[number, number, number]> = [];
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      items.push([
        Math.cos(angle) * (ROOF_SPECS.oculusRadiusX + 3),
        73.5,
        Math.sin(angle) * (ROOF_SPECS.oculusRadiusZ + 3),
      ]);
    }
    return items;
  }, []);

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

      {/* 24 Sweeping Structural Ribs */}
      {ribGeos.map((geo, idx) => (
        <mesh key={idx} geometry={geo} castShadow>
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#e2e8f0' : '#f59e0b'}
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      ))}

      {/* Central Oculus Compression/Tension Ring */}
      <mesh geometry={oculusGeo} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.22} />
      </mesh>

      {/* Stadium Floodlights along the Oculus */}
      {floodlightPositions.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <boxGeometry args={[3.8, 1.4, 2.0]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fef08a"
            emissiveIntensity={floodlightIntensity > 0 ? floodlightIntensity * 1.4 : 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}
