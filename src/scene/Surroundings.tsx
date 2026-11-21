import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { superEllipsePoint } from '../config/stadiumSpecs';

interface SurroundingsProps {
  halfCutaway: boolean;
  isNight: boolean;
}

/**
 * Creates a hollow super-ellipse stepped granite plinth ring outside the stadium wall,
 * leaving the interior pitch floor completely open at y=0.
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
 * Generates a 2048x2048 urban sports-complex masterplan texture with granite plaza paving,
 * inlaid Dong Son pavement motif, 4 ceremonial boulevards, manicured park lawns, and
 * a 6-lane outer ring road with lane markings & crosswalks.
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
  // Ground plane is 840m x 840m -> 1m ≈ 2.438 px
  const pxPerMeter = size / 840;

  // Base urban park turf outside the complex
  ctx.fillStyle = '#183428';
  ctx.fillRect(0, 0, size, size);

  // Subtle park mowing grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 2;
  for (let g = 0; g < size; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(size, g);
    ctx.stroke();
  }

  // Outer 6-lane Ring Road (asphalt circle r=325m, width=32m)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 32 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 325 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  // Ring road golden double center median
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 325 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  // Ring road dashed white lane lines
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.setLineDash([16, 16]);
  ctx.lineWidth = 2;
  for (const laneOffset of [-8, 8]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (325 + laneOffset) * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Central Ceremonial Granite Plaza Disc (r=262m)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 265 * pxPerMeter, 240 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // Concentric Granite Paving Rings & Inlaid Dong Son Rays
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.16)';
  ctx.lineWidth = 3;
  for (const r of [215, 235, 255]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * pxPerMeter, (r - 24) * pxPerMeter, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 24 subtle bronze-gold inlaid plaza sun rays
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 185 * pxPerMeter, cy + Math.sin(a) * 160 * pxPerMeter);
    ctx.lineTo(cx + Math.cos(a) * 260 * pxPerMeter, cy + Math.sin(a) * 235 * pxPerMeter);
    ctx.stroke();
  }

  // 4 Ceremonial Approach Boulevards (N, S, E, W)
  ctx.fillStyle = '#475569';
  const blvdW = 46 * pxPerMeter;
  ctx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  ctx.fillRect(0, cy - blvdW / 2, size, blvdW);

  // Boulevard central red-granite carpet strips
  ctx.fillStyle = '#7f1d1d';
  const carpetW = 12 * pxPerMeter;
  ctx.fillRect(cx - carpetW / 2, 0, carpetW, size);
  ctx.fillRect(0, cy - carpetW / 2, size, carpetW);

  // Inner Stadium Floor Apron Base (dark slate concrete beneath pitch)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 168 * pxPerMeter, 142 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Multi-tier lush rounded boulevard trees & plaza light columns using InstancedMesh.
 */
function LushBoulevardLandscaping({ isNight }: { isNight: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh | null>(null);
  const lowerCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const upperCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const poleRef = useRef<THREE.InstancedMesh | null>(null);
  const lampRef = useRef<THREE.InstancedMesh | null>(null);

  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number }> = [];
    // 48 perimeter park trees
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      // Keep clear of the 4 main boulevards
      if (Math.abs(Math.sin(a * 2)) < 0.18) {
        continue;
      }
      const rx = 272 + (i % 2) * 14;
      const rz = 248 + (i % 2) * 14;
      list.push({
        x: Math.cos(a) * rx,
        z: Math.sin(a) * rz,
        scale: 0.9 + (i % 3) * 0.18,
      });
    }
    // 24 avenue trees lining the 4 ceremonial boulevards
    for (const d of [228, 254, 282]) {
      for (const side of [-32, 32]) {
        list.push({ x: side, z: d, scale: 1.05 });
        list.push({ x: side, z: -d, scale: 1.05 });
        list.push({ x: d + 16, z: side, scale: 1.05 });
        list.push({ x: -(d + 16), z: side, scale: 1.05 });
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
        <sphereGeometry args={[0.65, 8, 8]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 2.2 : 0.2}
        />
      </instancedMesh>
    </group>
  );
}

/**
 * Renders the Masterplan urban complex: stepped granite stadium plinth, granite plaza,
 * 4 ceremonial boulevards, reflecting water basins, ring road, and lush landscaping.
 */
export function Surroundings({ halfCutaway, isNight }: SurroundingsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const groundTexture = useMemo(() => createMasterplanGroundTexture(), []);

  // 3 stepped monumental granite terraces wrapping cleanly around the outer curtain wall
  const plinthTerraces = useMemo(
    () => [
      createPlinthTerraceGeometry(165, 139, 204, 178, 1.1, startAngle, endAngle),
      createPlinthTerraceGeometry(165, 139, 192, 166, 2.2, startAngle, endAngle),
      createPlinthTerraceGeometry(165, 139, 180, 154, 3.2, startAngle, endAngle),
    ],
    [startAngle, endAngle]
  );

  return (
    <group name="stadium-masterplan">
      {/* Masterplan Urban Complex Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[840, 840]} />
        <meshStandardMaterial map={groundTexture} roughness={0.88} metalness={0.05} />
      </mesh>

      {/* Stepped Monumental Granite Stadium Plinth */}
      {plinthTerraces.map((geo, idx) => (
        <mesh key={`plinth-${idx}`} geometry={geo} receiveShadow castShadow>
          <meshStandardMaterial
            color={idx === 2 ? '#64748b' : idx === 1 ? '#475569' : '#334155'}
            roughness={0.8}
          />
        </mesh>
      ))}

      {/* Symmetrical Reflecting Pools along the Ceremonial Plaza */}
      {[
        [-84, 198],
        [84, 198],
        [-84, -198],
        [84, -198],
      ].map(([px, pz], idx) => (
        <group key={idx} position={[px, 0.04, pz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[68, 22]} />
            <meshStandardMaterial color="#0284c7" metalness={0.88} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[70, 0.25, 24]} />
            <meshStandardMaterial color="#475569" roughness={0.7} wireframe={false} visible={false} />
          </mesh>
        </group>
      ))}

      <LushBoulevardLandscaping isNight={isNight} />
    </group>
  );
}
