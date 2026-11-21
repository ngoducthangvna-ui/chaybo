import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS, superEllipsePoint } from '../config/stadiumSpecs';

interface SurroundingsProps {
  halfCutaway: boolean;
  isNight: boolean;
}

/**
 * Creates a hollow super-ellipse stepped granite plinth ring outside the Grid E columns,
 * leaving the interior pitch floor unobstructed at y=0.
 */
function createPlinthTerraceGeometry(
  innerRx: number,
  innerRz: number,
  outerRx: number,
  outerRz: number,
  topY: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const profile: Array<[number, number]> = [
    [0, 0],
    [0, topY],
    [1, topY],
    [1, 0],
  ];

  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (const [t, y] of profile) {
    const rx = THREE.MathUtils.lerp(innerRx, outerRx, t);
    const rz = THREE.MathUtils.lerp(innerRz, outerRz, t);
    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, y, z);
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
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates a realistic architectural site masterplan texture (840m x 840m):
 * neutral granite stone plazas, concrete expansion joints, pedestrian avenues,
 * manicured park turf, and asphalt ring roads with parking stalls.
 */
function createMasterplanGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const pxPerMeter = size / 840;

  // Urban park turf
  ctx.fillStyle = '#1e3a2a';
  ctx.fillRect(0, 0, size, size);

  // Outer 6-lane asphalt Ring Road (r=330m, width=30m)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 30 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 330 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  // Ring road double yellow center line & dashed lane lines
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 330 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.setLineDash([16, 16]);
  for (const laneOffset of [-7.5, 7.5]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (330 + laneOffset) * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Granite Podium Plaza Disc (neutral architectural stone grey)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 265 * pxPerMeter, 240 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // Concentric stone paving joints
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.14)';
  ctx.lineWidth = 2;
  for (const r of [212, 232, 252]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * pxPerMeter, (r - 24) * pxPerMeter, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial concrete expansion joints aligned with the 48 structural bays
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 170 * pxPerMeter, cy + Math.sin(a) * 145 * pxPerMeter);
    ctx.lineTo(cx + Math.cos(a) * 265 * pxPerMeter, cy + Math.sin(a) * 240 * pxPerMeter);
    ctx.stroke();
  }

  // 4 Clean Granite Pedestrian Access Boulevards (light architectural concrete)
  ctx.fillStyle = '#64748b';
  const blvdW = 40 * pxPerMeter;
  ctx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  ctx.fillRect(0, cy - blvdW / 2, size, blvdW);

  // Subtle dark granite median pavers
  ctx.fillStyle = '#334155';
  const medianW = 8 * pxPerMeter;
  ctx.fillRect(cx - medianW / 2, 0, medianW, size);
  ctx.fillRect(0, cy - medianW / 2, size, medianW);

  // Inner Stadium Concrete Sub-Base beneath the Bowl & Pitch
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 168 * pxPerMeter, 142 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function LushBoulevardLandscaping({ isNight }: { isNight: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh | null>(null);
  const lowerCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const upperCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const poleRef = useRef<THREE.InstancedMesh | null>(null);
  const lampRef = useRef<THREE.InstancedMesh | null>(null);

  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number }> = [];
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      if (Math.abs(Math.sin(a * 2)) < 0.18) {
        continue;
      }
      const rx = 276 + (i % 2) * 14;
      const rz = 252 + (i % 2) * 14;
      list.push({
        x: Math.cos(a) * rx,
        z: Math.sin(a) * rz,
        scale: 0.9 + (i % 3) * 0.16,
      });
    }
    for (const d of [232, 258, 286]) {
      for (const side of [-28, 28]) {
        list.push({ x: side, z: d, scale: 1.0 });
        list.push({ x: side, z: -d, scale: 1.0 });
        list.push({ x: d + 16, z: side, scale: 1.0 });
        list.push({ x: -(d + 16), z: side, scale: 1.0 });
      }
    }
    return list;
  }, []);

  const lightPoles = useMemo(() => {
    const list: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      const [x, z] = superEllipsePoint(a, 218, 192);
      list.push({ x, z });
    }
    return list;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    trees.forEach((t, i) => {
      if (trunkRef.current) {
        dummy.position.set(t.x, 2.2 * t.scale, t.z);
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      if (lowerCanopyRef.current) {
        dummy.position.set(t.x, 5.4 * t.scale, t.z);
        dummy.scale.set(1.25 * t.scale, 0.95 * t.scale, 1.25 * t.scale);
        dummy.updateMatrix();
        lowerCanopyRef.current.setMatrixAt(i, dummy.matrix);
      }
      if (upperCanopyRef.current) {
        dummy.position.set(t.x, 7.3 * t.scale, t.z);
        dummy.scale.set(0.95 * t.scale, 0.85 * t.scale, 0.95 * t.scale);
        dummy.updateMatrix();
        upperCanopyRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    if (trunkRef.current) {
      trunkRef.current.count = trees.length;
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (lowerCanopyRef.current) {
      lowerCanopyRef.current.count = trees.length;
      lowerCanopyRef.current.instanceMatrix.needsUpdate = true;
    }
    if (upperCanopyRef.current) {
      upperCanopyRef.current.count = trees.length;
      upperCanopyRef.current.instanceMatrix.needsUpdate = true;
    }

    lightPoles.forEach((p, i) => {
      if (poleRef.current) {
        dummy.position.set(p.x, 4.5, p.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleRef.current.setMatrixAt(i, dummy.matrix);
      }
      if (lampRef.current) {
        dummy.position.set(p.x, 9.2, p.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        lampRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    if (poleRef.current) {
      poleRef.current.count = lightPoles.length;
      poleRef.current.instanceMatrix.needsUpdate = true;
    }
    if (lampRef.current) {
      lampRef.current.count = lightPoles.length;
      lampRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [trees, lightPoles]);

  return (
    <group name="boulevard-landscaping">
      <instancedMesh ref={trunkRef} args={[undefined, undefined, 96]} castShadow>
        <cylinderGeometry args={[0.32, 0.5, 4.4, 8]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lowerCanopyRef} args={[undefined, undefined, 96]} castShadow>
        <sphereGeometry args={[3.1, 12, 10]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={upperCanopyRef} args={[undefined, undefined, 96]} castShadow>
        <sphereGeometry args={[2.5, 12, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.82} />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, 48]}>
        <cylinderGeometry args={[0.18, 0.25, 9.0, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, 48]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 2.0 : 0.15}
        />
      </instancedMesh>
    </group>
  );
}

export function Surroundings({ halfCutaway, isNight }: SurroundingsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const groundTexture = useMemo(() => createMasterplanGroundTexture(), []);

  // 3 stepped concrete/granite terraces wrapping cleanly around Grid E (166x140)
  const plinthTerraces = useMemo(
    () => [
      createPlinthTerraceGeometry(
        ROOF_SPECS.supportRadiusX,
        ROOF_SPECS.supportRadiusZ,
        204,
        178,
        1.0,
        startAngle,
        endAngle
      ),
      createPlinthTerraceGeometry(
        ROOF_SPECS.supportRadiusX,
        ROOF_SPECS.supportRadiusZ,
        192,
        166,
        2.0,
        startAngle,
        endAngle
      ),
      createPlinthTerraceGeometry(
        ROOF_SPECS.supportRadiusX,
        ROOF_SPECS.supportRadiusZ,
        180,
        154,
        2.8,
        startAngle,
        endAngle
      ),
    ],
    [startAngle, endAngle]
  );

  return (
    <group name="stadium-masterplan">
      {/* Site Masterplan Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[840, 840]} />
        <meshStandardMaterial map={groundTexture} roughness={0.88} metalness={0.05} />
      </mesh>

      {/* Stepped Granite Podium Plinth */}
      {plinthTerraces.map((geo, idx) => (
        <mesh key={`plinth-${idx}`} geometry={geo} receiveShadow castShadow>
          <meshStandardMaterial
            color={idx === 2 ? '#94a3b8' : idx === 1 ? '#64748b' : '#475569'}
            roughness={0.82}
          />
        </mesh>
      ))}

      {/* Reflecting Pools */}
      {[
        [-84, 198],
        [84, 198],
        [-84, -198],
        [84, -198],
      ].map(([px, pz], idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.04, pz]}>
          <planeGeometry args={[68, 22]} />
          <meshStandardMaterial color="#0369a1" metalness={0.85} roughness={0.12} />
        </mesh>
      ))}

      <LushBoulevardLandscaping isNight={isNight} />
    </group>
  );
}
