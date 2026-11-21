import { useEffect, useMemo, useRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOF_SPECS, calculateCrowdPhysicsMetrics, superEllipsePoint } from '../config/stadiumSpecs';

interface SurroundingsProps {
  halfCutaway: boolean;
  isNight: boolean;
  bimFrameMode: boolean;
  occupancyPercent: number;
  liveSimActive?: boolean;
}

function createTravertineArcadeTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Warm travertine stone podium facade
  ctx.fillStyle = '#c8c2b8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Obsidian curtain glass mezzanine band
  ctx.fillStyle = isNight ? 'rgba(251, 191, 36, 0.52)' : '#0b1324';
  ctx.fillRect(0, 24, canvas.width, 84);

  // Champagne-bronze horizontal architectural cornice
  ctx.fillStyle = '#c5a059';
  ctx.fillRect(0, 108, canvas.width, 8);
  ctx.fillStyle = '#dad4c8';
  ctx.fillRect(0, 116, canvas.width, 16);

  ctx.fillStyle = '#b4ada2';
  ctx.fillRect(0, 132, canvas.width, 124);

  const portalCount = 36;
  const step = canvas.width / portalCount;
  for (let i = 0; i < portalCount; i += 1) {
    const px = i * step + step * 0.5;
    ctx.fillStyle = '#a8874a';
    ctx.beginPath();
    ctx.arc(px, 178, 16, Math.PI, 0);
    ctx.lineTo(px + 16, 256);
    ctx.lineTo(px - 16, 256);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isNight ? '#fde68a' : '#090e1a';
    ctx.beginPath();
    ctx.arc(px, 180, 12, Math.PI, 0);
    ctx.lineTo(px + 12, 256);
    ctx.lineTo(px - 12, 256);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTrainingPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 660;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#1c4f2a' : '#245e34';
      ctx.fillRect((i * canvas.width) / 14, 0, canvas.width / 14 + 1, canvas.height);
    }
    ctx.strokeStyle = 'rgba(245, 245, 244, 0.88)';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 28, canvas.width - 72, canvas.height - 56);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 28);
    ctx.lineTo(canvas.width / 2, canvas.height - 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 65, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates high-resolution 1000m x 1000m masterplan albedo and matching micro-grain bump maps
 * with muted botanical turf, warm travertine stone plazas, and honed basalt ring roads.
 */
function createMasterplanGroundPbrTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (!ctx || !bCtx) {
    return {
      map: new THREE.CanvasTexture(canvas),
      bumpMap: new THREE.CanvasTexture(bumpCanvas),
    };
  }

  const cx = size / 2;
  const cy = size / 2;
  const pxPerMeter = size / 1000;

  // Muted botanical forest turf with fine pixel-grain texture (zero cartoon polka dots)
  ctx.fillStyle = '#1c2e21';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#707070';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 95000; i += 1) {
    const h = ((i * 2654435761) >>> 0) % (size * size);
    const x = h % size;
    const y = Math.floor(h / size);
    const light = (i & 1) === 0;
    ctx.fillStyle = light ? 'rgba(42, 68, 46, 0.24)' : 'rgba(16, 28, 19, 0.28)';
    ctx.fillRect(x, y, 3, 3);
    bCtx.fillStyle = light ? 'rgba(215, 215, 215, 0.25)' : 'rgba(45, 45, 45, 0.25)';
    bCtx.fillRect(x, y, 2, 2);
  }

  // Subtle manicured park mowing contours
  ctx.strokeStyle = 'rgba(28, 48, 33, 0.35)';
  ctx.lineWidth = 14 * pxPerMeter;
  for (let r = 270; r <= 360; r += 30) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * pxPerMeter, (r - 18) * pxPerMeter, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer 6-lane Honed Asphalt Arterial Ring Road (r=385m) with basalt curbs
  ctx.strokeStyle = '#57534e';
  ctx.lineWidth = 30 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#1f2329';
  ctx.lineWidth = 26 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  bCtx.strokeStyle = '#606060';
  bCtx.lineWidth = 26 * pxPerMeter;
  bCtx.beginPath();
  bCtx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  bCtx.stroke();

  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(229, 231, 235, 0.5)';
  ctx.setLineDash([14, 14]);
  for (const off of [-6.5, 6.5]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (385 + off) * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Warm Travertine & Honed Stone Ceremonial Plaza around Stadium
  ctx.fillStyle = '#9e978d';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 255 * pxPerMeter, 232 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c7c0b5';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 232 * pxPerMeter, 208 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  bCtx.fillStyle = '#909090';
  bCtx.beginPath();
  bCtx.ellipse(cx, cy, 255 * pxPerMeter, 232 * pxPerMeter, 0, 0, Math.PI * 2);
  bCtx.fill();

  // Architectural Travertine stone block joints (radial + concentric courses)
  ctx.strokeStyle = 'rgba(68, 64, 60, 0.22)';
  bCtx.strokeStyle = '#484848';
  ctx.lineWidth = 1.5;
  bCtx.lineWidth = 1.5;
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 195 * pxPerMeter, cy + Math.sin(a) * 170 * pxPerMeter);
    ctx.lineTo(cx + Math.cos(a) * 255 * pxPerMeter, cy + Math.sin(a) * 232 * pxPerMeter);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(cx + Math.cos(a) * 195 * pxPerMeter, cy + Math.sin(a) * 170 * pxPerMeter);
    bCtx.lineTo(cx + Math.cos(a) * 255 * pxPerMeter, cy + Math.sin(a) * 232 * pxPerMeter);
    bCtx.stroke();
  }

  // 4 Travertine & Basalt Pedestrian Boulevards
  ctx.fillStyle = '#bab3a8';
  const blvdW = 48 * pxPerMeter;
  ctx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  ctx.fillRect(0, cy - blvdW / 2, size, blvdW);
  bCtx.fillStyle = '#888888';
  bCtx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  bCtx.fillRect(0, cy - blvdW / 2, size, blvdW);

  // Subtle bronze/stone pedestrian boulevard borders
  ctx.fillStyle = '#57534e';
  ctx.fillRect(cx - blvdW / 2, 0, 3, size);
  ctx.fillRect(cx + blvdW / 2 - 3, 0, 3, size);
  ctx.fillRect(0, cy - blvdW / 2, size, 3);
  ctx.fillRect(0, cy + blvdW / 2 - 3, size, 3);

  // Zebra pedestrian crosswalks where boulevards intersect the outer ring road
  ctx.fillStyle = 'rgba(231, 229, 228, 0.78)';
  for (const dir of [-1, 1]) {
    for (let s = -18; s <= 18; s += 6) {
      ctx.fillRect(cx + (s - 1.5) * pxPerMeter, cy + dir * 372 * pxPerMeter, 3 * pxPerMeter, 14 * pxPerMeter);
      ctx.fillRect(cx + dir * 372 * pxPerMeter, cy + (s - 1.5) * pxPerMeter, 14 * pxPerMeter, 3 * pxPerMeter);
    }
  }

  // Basalt/Granite Architectural Podium Pads under East, West, North, South Zones
  ctx.fillStyle = '#3f3e3c';
  ctx.fillRect(cx + 228 * pxPerMeter, cy - 115 * pxPerMeter, 135 * pxPerMeter, 230 * pxPerMeter);
  ctx.fillRect(cx - 363 * pxPerMeter, cy - 115 * pxPerMeter, 135 * pxPerMeter, 230 * pxPerMeter);
  ctx.fillRect(cx - 170 * pxPerMeter, cy - 355 * pxPerMeter, 340 * pxPerMeter, 132 * pxPerMeter);
  ctx.fillRect(cx - 130 * pxPerMeter, cy + 235 * pxPerMeter, 260 * pxPerMeter, 92 * pxPerMeter);

  // Inner Stadium Dark Architectural Basalt Sub-Base
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 168 * pxPerMeter, 142 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  const map = new THREE.CanvasTexture(canvas);
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 8;

  return { map, bumpMap };
}

function createCommercialPodiumGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const innerRx = ROOF_SPECS.supportRadiusX;
  const innerRz = ROOF_SPECS.supportRadiusZ;
  const outerRx = 196;
  const outerRz = 170;
  const height = 10.5;

  const profile: Array<[number, number, number]> = [
    [0, 0, 0],
    [0, height, 1],
    [1, height, 1],
    [1, 0, 0],
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (const [t, y, v] of profile) {
    const rx = THREE.MathUtils.lerp(innerRx, outerRx, t);
    const rz = THREE.MathUtils.lerp(innerRz, outerRz, t);
    for (let i = 0; i <= segments; i += 1) {
      const uFrac = i / segments;
      const angle = startAngle + uFrac * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, y, z);
      uvs.push(angle / (Math.PI * 2), v);
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
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Grand Approach Staircases on North, East, West, plus Twin Flanking South Staircases
 * leaving the center South axis completely unobstructed for the Metro Skywalk landing.
 */
function GrandTravertineStairways({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const stairs = useMemo(() => {
    const list: Array<{ x: number; z: number; rotY: number; length: number; width: number }> = [];
    const entries: Array<{ angle: number; width: number }> = [
      { angle: 0, width: 26 },
      { angle: Math.PI, width: 26 },
      { angle: Math.PI * 1.5, width: 26 },
      // Twin flanking South staircases cleanly clearing the center Skywalk at angle = PI/2
      { angle: Math.PI * 0.42, width: 16 },
      { angle: Math.PI * 0.58, width: 16 },
    ];

    for (const e of entries) {
      if (e.angle < startAngle - 0.05 || e.angle > endAngle + 0.05) {
        continue;
      }
      const [topX, topZ] = superEllipsePoint(e.angle, 196, 170);
      const [botX, botZ] = superEllipsePoint(e.angle, 224, 198);
      list.push({
        x: (topX + botX) / 2,
        z: (topZ + botZ) / 2,
        rotY: Math.atan2(botX - topX, botZ - topZ),
        length: Math.hypot(botX - topX, botZ - topZ),
        width: e.width,
      });
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="grand-travertine-stairways">
      {stairs.map((s, idx) => {
        const pitch = Math.atan2(10.5, s.length);
        const hyp = Math.hypot(s.length, 10.5);
        return (
          <group key={idx} position={[s.x, 5.25, s.z]} rotation={[0, s.rotY, 0]}>
            <mesh rotation={[pitch, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[s.width, 1.4, hyp]} />
              <meshStandardMaterial color="#c8c2b8" roughness={0.72} />
            </mesh>
            <mesh position={[0, -2.6, -s.length * 0.22]} receiveShadow>
              <boxGeometry args={[s.width - 1, 5.2, s.length * 0.5]} />
              <meshStandardMaterial color="#a8a29e" roughness={0.78} />
            </mesh>
            {[-(s.width / 2 + 0.3), s.width / 2 + 0.3].map((bx) => (
              <mesh key={bx} position={[bx, 0.8, 0]} rotation={[pitch, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 2.0, hyp]} />
                <meshStandardMaterial color="#c5a059" metalness={0.85} roughness={0.25} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Realistic Multi-Floor Slab-and-Curtain-Wall High-Rise Hotel Tower with actual 3D
 * horizontal floor slabs, vertical corner mullions, and rooftop mechanical crown.
 */
function RealFloorPlateTower({
  position,
  width,
  depth,
  floors,
  floorHeight,
  isNight,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  isNight: boolean;
}) {
  const slabsRef = useRef<THREE.InstancedMesh | null>(null);
  const totalHeight = floors * floorHeight;

  useEffect(() => {
    const mesh = slabsRef.current;
    if (!mesh) {
      return;
    }
    const dummy = new THREE.Object3D();
    for (let f = 0; f <= floors; f += 1) {
      dummy.position.set(0, f * floorHeight, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(f, dummy.matrix);
    }
    mesh.count = floors + 1;
    mesh.instanceMatrix.needsUpdate = true;
  }, [floors, floorHeight]);

  return (
    <group position={position}>
      {/* Reflective Dark Obsidian Architectural Curtain-Wall Core */}
      <mesh position={[0, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width - 1.2, totalHeight, depth - 1.2]} />
        <meshPhysicalMaterial
          color={isNight ? '#0a101d' : '#0b1324'}
          emissive={isNight ? '#fbbf24' : '#38bdf8'}
          emissiveIntensity={isNight ? 0.32 : 0.04}
          metalness={0.92}
          roughness={0.08}
        />
      </mesh>

      {/* 3D Projecting Warm Travertine Slab & Balcony Ledges */}
      <instancedMesh ref={slabsRef} args={[undefined, undefined, floors + 1]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.8, 0.45, depth + 0.8]} />
        <meshStandardMaterial color="#d6d3d1" metalness={0.25} roughness={0.58} />
      </instancedMesh>

      {/* Vertical Champagne-Bronze Structural Corner Fins */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
        [0, -depth / 2],
        [0, depth / 2],
      ].map(([mx, mz], idx) => (
        <mesh key={idx} position={[mx, totalHeight / 2, mz]} castShadow>
          <boxGeometry args={[0.9, totalHeight + 1.5, 0.9]} />
          <meshStandardMaterial color="#b89768" metalness={0.85} roughness={0.24} />
        </mesh>
      ))}

      {/* Rooftop Mechanical Penthouse Screen, Champagne Crown Trim & VIP Helipad */}
      <mesh position={[0, totalHeight + 2.2, 0]} castShadow>
        <boxGeometry args={[width * 0.65, 4.4, depth * 0.65]} />
        <meshStandardMaterial color="#27272a" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh position={[0, totalHeight + 0.35, 0]}>
        <boxGeometry args={[width + 1.1, 0.7, depth + 1.1]} />
        <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.22} />
      </mesh>
      <group position={[0, totalHeight + 4.55, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[7.5, 7.5, 0.35, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.72} metalness={0.25} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <ringGeometry args={[5.2, 5.8, 24]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-1.6, 0.21, 0]}>
          <boxGeometry args={[0.7, 0.08, 4.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[1.6, 0.21, 0]}>
          <boxGeometry args={[0.7, 0.08, 4.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[3.2, 0.08, 0.7]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Real Open-Deck 5-Story Architectural Concrete Parking Structure with exposed slabs & bronze louvers.
 */
function OpenDeckParkingGarage({ position }: { position: [number, number, number] }) {
  const levels = 5;
  const levelH = 3.4;
  const w = 48;
  const d = 32;

  return (
    <group position={position}>
      {Array.from({ length: levels }).map((_, lvl) => (
        <group key={lvl} position={[0, lvl * levelH + 0.4, 0]}>
          {/* Honed Architectural Concrete Deck Slab */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w, 0.45, d]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.8} />
          </mesh>
          {/* Low Perimeter Charcoal-Bronze Safety Spandrel */}
          <mesh position={[0, 0.65, d / 2 - 0.25]}>
            <boxGeometry args={[w, 0.9, 0.4]} />
            <meshStandardMaterial color="#57534e" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.65, -d / 2 + 0.25]}>
            <boxGeometry args={[w, 0.9, 0.4]} />
            <meshStandardMaterial color="#57534e" roughness={0.72} />
          </mesh>
        </group>
      ))}
      {/* Structural Perimeter Columns */}
      {[-22, -7, 7, 22].map((cx) =>
        [-15, 15].map((cz) => (
          <mesh key={`${cx}-${cz}`} position={[cx, (levels * levelH) / 2, cz]} castShadow>
            <boxGeometry args={[0.9, levels * levelH, 0.9]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.78} />
          </mesh>
        ))
      )}
    </group>
  );
}

/**
 * 5 Realistic Surrounding Complexes unified under Foster+Partners dark obsidian, travertine, & bronze palette:
 * - Zone 2 (South): Steel-Truss Metro Transit Hub + Elevated Rail Trains + Aligned Skywalk
 * - Zone 3 (East): Multi-Floor Slab-and-Curtain-Wall 5-Star Twin Hotels & Colonnade IBC
 * - Zone 4 (West): Ribbed Long-Span Arch Arena (15K) & Slanted-Glass Aquatics Center
 * - Zone 5 (North): FIFA Training Pitch + 2 Open-Deck 5-Story Parking Garages
 */
function RealServiceComplexes({
  isNight,
  liveSimActive,
}: {
  isNight: boolean;
  liveSimActive: boolean;
}) {
  const trainingPitchTex = useMemo(() => createTrainingPitchTexture(), []);
  const trainGroupRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    const train = trainGroupRef.current;
    if (!train || !liveSimActive) return;
    // 26s dual-track cycle: Eastbound arrive -> 4s dwell at x=0 -> depart -> Westbound arrive -> 4s dwell -> depart
    const cycle = 26;
    const t = clock.getElapsedTime() % cycle;
    const half = cycle / 2;
    const isEastbound = t < half;
    const localT = isEastbound ? t : t - half;
    const trackZ = isEastbound ? 296.2 : 299.8;
    const dir = isEastbound ? 1 : -1;

    let x = 0;
    if (localT < 4.5) {
      const u = localT / 4.5;
      const easeOut = 1 - Math.pow(1 - u, 3);
      x = -205 * dir + 205 * dir * easeOut;
    } else if (localT < 8.5) {
      x = 0;
    } else {
      const u = (localT - 8.5) / 4.5;
      const easeIn = u * u * u;
      x = 205 * dir * easeIn;
    }
    train.position.set(x, 15.8, trackZ);
  });

  return (
    <group name="real-world-service-complexes">
      {/* ZONE 2 (SOUTH): Steel-Truss Metro Station + Elevated Viaduct + Moving Metro Trains + Aligned Skywalk */}
      <group name="zone-2-metro-hub">
        {/* Elevated Honed Concrete Rail Viaduct */}
        <mesh position={[0, 13.5, 298]} castShadow receiveShadow>
          <boxGeometry args={[520, 1.5, 13]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.72} />
        </mesh>
        {[-210, -140, -70, 0, 70, 140, 210].map((px) => (
          <mesh key={px} position={[px, 6.5, 298]} castShadow>
            <cylinderGeometry args={[1.6, 2.2, 13.0, 12]} />
            <meshStandardMaterial color="#78716c" roughness={0.78} />
          </mesh>
        ))}

        {/* Sleek Dark-Graphite & Champagne Metro Trainset moving smoothly along dual-track viaduct */}
        <group ref={trainGroupRef} position={[0, 15.8, 296.2]}>
          {[-34, -17, 0, 17, 34].map((cx) => (
            <group key={cx} position={[cx, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[15.5, 3.2, 3.2]} />
                <meshPhysicalMaterial color="#27272a" metalness={0.85} roughness={0.18} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[15.6, 0.65, 3.26]} />
                <meshStandardMaterial
                  color="#c5a059"
                  emissive="#fbbf24"
                  emissiveIntensity={isNight ? 0.5 : 0.08}
                  metalness={0.85}
                  roughness={0.2}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Open-Span Obsidian Glass & Bronze Canopy Metro Station (z=274) */}
        <mesh position={[0, 5.2, 274]} castShadow receiveShadow>
          <boxGeometry args={[112, 10.4, 34]} />
          <meshPhysicalMaterial
            color="#0b1324"
            emissive={isNight ? '#fbbf24' : '#000000'}
            emissiveIntensity={isNight ? 0.22 : 0}
            transparent
            opacity={0.78}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Cantilevered Ivory-PTFE Ribbed Station Roof with Obsidian Skylight & Steel Purlins */}
        <mesh position={[0, 17.5, 282]} castShadow>
          <boxGeometry args={[124, 1.0, 48]} />
          <meshStandardMaterial color="#d6d3d1" metalness={0.42} roughness={0.35} />
        </mesh>
        <mesh position={[0, 18.08, 282]}>
          <boxGeometry args={[92, 0.45, 16]} />
          <meshPhysicalMaterial color="#0b1324" metalness={0.9} roughness={0.08} />
        </mesh>
        {[258, 274, 290, 306].map((lz) => (
          <mesh key={lz} position={[0, 18.18, lz]} castShadow>
            <boxGeometry args={[124.4, 0.55, 0.9]} />
            <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.24} />
          </mesh>
        ))}
        {[-48, -24, 0, 24, 48].map((rx) => (
          <mesh key={rx} position={[rx, 18.2, 282]} castShadow>
            <boxGeometry args={[1.1, 0.7, 48.5]} />
            <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.24} />
          </mesh>
        ))}
        {[-52, -26, 0, 26, 52].map((vx) => (
          <mesh key={vx} position={[vx, 9.0, 258]} rotation={[0.25, 0, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.65, 18, 8]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.82} roughness={0.25} />
          </mesh>
        ))}

        {/* Aligned Glass Skywalk connecting Metro (+10.5m) straight to South Podium (z=170m) */}
        <mesh position={[0, 10.5, 214]} castShadow receiveShadow>
          <boxGeometry args={[14, 1.1, 88]} />
          <meshStandardMaterial color="#c8c2b8" roughness={0.62} />
        </mesh>
        <mesh position={[0, 12.4, 214]}>
          <boxGeometry args={[13.2, 2.6, 86]} />
          <meshPhysicalMaterial color="#0f172a" transparent opacity={0.55} metalness={0.88} roughness={0.08} />
        </mesh>
        {[198, 230].map((sz) => (
          <mesh key={sz} position={[0, 5.0, sz]} castShadow>
            <cylinderGeometry args={[1.2, 1.6, 10.0, 10]} />
            <meshStandardMaterial color="#78716c" roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* ZONE 3 (EAST): True Multi-Floor Slab-and-Curtain-Wall 5-Star Twin Hotels & Colonnade IBC */}
      <group name="zone-3-hotel-ibc" position={[295, 0, 0]}>
        {/* 4-Story Obsidian Glass & Travertine Colonnade IBC Convention Podium */}
        <mesh position={[0, 8.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[62, 17, 148]} />
          <meshPhysicalMaterial
            color="#0b1324"
            emissive={isNight ? '#fbbf24' : '#000000'}
            emissiveIntensity={isNight ? 0.16 : 0}
            metalness={0.92}
            roughness={0.09}
          />
        </mesh>
        {/* Warm Travertine Podium Roof Slab + Deep Botanical Eco Terrace */}
        <mesh position={[0, 17.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[68, 1.0, 154]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.65} />
        </mesh>
        <mesh position={[0, 18.0, 0]}>
          <boxGeometry args={[60, 0.4, 144]} />
          <meshStandardMaterial color="#1f3b26" roughness={0.88} />
        </mesh>
        {/* Podium Perimeter Travertine Colonnade Columns */}
        {[-66, -44, -22, 0, 22, 44, 66].map((cz) => (
          <mesh key={cz} position={[-32.5, 8.5, cz]} castShadow>
            <boxGeometry args={[1.4, 17, 1.4]} />
            <meshStandardMaterial color="#d6d3d1" roughness={0.55} />
          </mesh>
        ))}

        {/* Twin Chamfered Multi-Floor 5-Star Hotel Towers */}
        <RealFloorPlateTower
          position={[0, 18, -38]}
          width={32}
          depth={26}
          floors={18}
          floorHeight={3.6}
          isNight={isNight}
        />
        <RealFloorPlateTower
          position={[0, 18, 38]}
          width={30}
          depth={24}
          floors={14}
          floorHeight={3.6}
          isNight={isNight}
        />
      </group>

      {/* ZONE 4 (WEST): Ribbed Long-Span Arch Arena (15K) & Slanted-Glass Aquatics Center */}
      <group name="zone-4-arena-aquatics" position={[-295, 0, 0]}>
        {/* Indoor 15K Arena with Exposed Champagne-Bronze Arch Ribs */}
        <group position={[0, 0, -52]}>
          <mesh position={[0, 9, 0]} castShadow receiveShadow>
            <boxGeometry args={[66, 18, 78]} />
            <meshPhysicalMaterial
              color="#0b1324"
              emissive={isNight ? '#38bdf8' : '#000000'}
              emissiveIntensity={isNight ? 0.14 : 0}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 18.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1, 0.36]} castShadow>
            <cylinderGeometry args={[30, 30, 82, 24, 1, false, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color="#e7e5e4" metalness={0.35} roughness={0.38} />
          </mesh>
          {[-34, -20, -6, 8, 22, 36].map((rz) => (
            <mesh key={rz} position={[0, 18.8, rz]} rotation={[0, Math.PI / 2, 0]} scale={[1.12, 0.38, 1]}>
              <torusGeometry args={[30, 0.65, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#27272a" metalness={0.86} roughness={0.24} />
            </mesh>
          ))}
        </group>

        {/* Aquatics Center with Obsidian Slanted Curtain Glass */}
        <group position={[0, 0, 52]}>
          <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[60, 15, 72]} />
            <meshPhysicalMaterial
              color="#091526"
              emissive={isNight ? '#0284c7' : '#000000'}
              emissiveIntensity={isNight ? 0.2 : 0}
              transparent
              opacity={0.82}
              metalness={0.9}
              roughness={0.08}
            />
          </mesh>
          <mesh position={[0, 16, 0]} rotation={[0, 0, -0.06]} castShadow>
            <boxGeometry args={[68, 1.2, 78]} />
            <meshStandardMaterial color="#d6d3d1" metalness={0.42} roughness={0.34} />
          </mesh>
          {[-28, -14, 0, 14, 28].map((rz) => (
            <mesh key={rz} position={[0, 16.8, rz]} rotation={[0, 0, -0.06]} castShadow>
              <boxGeometry args={[68.5, 0.7, 1.1]} />
              <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.24} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ZONE 5 (NORTH): FIFA Training Stadium & 2 Open-Deck 5-Story Parking Garages */}
      <group name="zone-5-training-and-parking">
        <group position={[0, 0, -295]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
            <planeGeometry args={[105, 68]} />
            <meshStandardMaterial map={trainingPitchTex} roughness={0.82} />
          </mesh>
          <mesh position={[0, 5.5, -42]} castShadow receiveShadow>
            <boxGeometry args={[100, 11, 16]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.75} />
          </mesh>
          <mesh position={[0, 12.5, -39]} rotation={[0.14, 0, 0]} castShadow>
            <boxGeometry args={[106, 1.0, 22]} />
            <meshStandardMaterial color="#e7e5e4" metalness={0.38} roughness={0.32} />
          </mesh>
        </group>

        <OpenDeckParkingGarage position={[-112, 0, -295]} />
        <OpenDeckParkingGarage position={[112, 0, -295]} />
      </group>
    </group>
  );
}

/**
 * Multi-cluster organic park trees & plaza light columns.
 */
function NaturalParkLandscaping({ isNight }: { isNight: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh | null>(null);
  const lobe1Ref = useRef<THREE.InstancedMesh | null>(null);
  const lobe2Ref = useRef<THREE.InstancedMesh | null>(null);
  const lobe3Ref = useRef<THREE.InstancedMesh | null>(null);
  const poleRef = useRef<THREE.InstancedMesh | null>(null);
  const lampRef = useRef<THREE.InstancedMesh | null>(null);

  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number; rot: number }> = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      if (Math.abs(Math.sin(a * 2)) < 0.22) {
        continue;
      }
      const rx = 250 + (i % 2) * 102;
      const rz = 232 + (i % 2) * 110;
      list.push({
        x: Math.cos(a) * rx,
        z: Math.sin(a) * rz,
        scale: 0.75 + (i % 3) * 0.14,
        rot: i * 1.1,
      });
    }
    for (const d of [236, 264, 294]) {
      for (const side of [-28, 28]) {
        list.push({ x: side, z: d, scale: 0.85, rot: d });
        list.push({ x: side, z: -d, scale: 0.85, rot: d });
        list.push({ x: d + 12, z: side, scale: 0.85, rot: d });
        list.push({ x: -(d + 12), z: side, scale: 0.85, rot: d });
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
      const s = t.scale;
      if (trunkRef.current) {
        dummy.position.set(t.x, 2.4 * s, t.z);
        dummy.rotation.set(0, t.rot, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      if (lobe1Ref.current) {
        dummy.position.set(t.x + Math.cos(t.rot) * 1.2 * s, 5.4 * s, t.z + Math.sin(t.rot) * 1.2 * s);
        dummy.scale.set(1.1 * s, 0.9 * s, 1.0 * s);
        dummy.updateMatrix();
        lobe1Ref.current.setMatrixAt(i, dummy.matrix);
      }
      if (lobe2Ref.current) {
        dummy.position.set(t.x - Math.cos(t.rot) * 1.1 * s, 5.8 * s, t.z - Math.sin(t.rot) * 1.1 * s);
        dummy.scale.set(0.95 * s, 0.85 * s, 1.05 * s);
        dummy.updateMatrix();
        lobe2Ref.current.setMatrixAt(i, dummy.matrix);
      }
      if (lobe3Ref.current) {
        dummy.position.set(t.x, 7.1 * s, t.z);
        dummy.scale.set(0.85 * s, 0.8 * s, 0.85 * s);
        dummy.updateMatrix();
        lobe3Ref.current.setMatrixAt(i, dummy.matrix);
      }
    });
    [trunkRef, lobe1Ref, lobe2Ref, lobe3Ref].forEach((r) => {
      if (r.current) {
        r.current.count = trees.length;
        r.current.instanceMatrix.needsUpdate = true;
      }
    });

    lightPoles.forEach((p, i) => {
      if (poleRef.current) {
        dummy.position.set(p.x, 4.5, p.z);
        dummy.rotation.set(0, 0, 0);
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
    <group name="natural-park-landscaping">
      <instancedMesh ref={trunkRef} args={[undefined, undefined, 120]} castShadow>
        <cylinderGeometry args={[0.25, 0.42, 4.8, 7]} />
        <meshStandardMaterial color="#422a1b" roughness={0.94} />
      </instancedMesh>
      <instancedMesh ref={lobe1Ref} args={[undefined, undefined, 120]} castShadow>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial color="#1a3320" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={lobe2Ref} args={[undefined, undefined, 120]} castShadow>
        <icosahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial color="#1f3f26" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lobe3Ref} args={[undefined, undefined, 120]} castShadow>
        <icosahedronGeometry args={[2.0, 1]} />
        <meshStandardMaterial color="#284e30" roughness={0.86} />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, 48]}>
        <cylinderGeometry args={[0.16, 0.22, 9.0, 6]} />
        <meshStandardMaterial color="#27272a" metalness={0.78} roughness={0.28} />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, 48]}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 2.4 : 0.2}
        />
      </instancedMesh>
    </group>
  );
}

/**
 * Reflecting Lagoon Basins framed by Dark Basalt Stone Coping Walls with real-time mirror reflections.
 */
function GraniteReflectingBasins() {
  const basins: Array<[number, number]> = [
    [-86, 198],
    [86, 198],
    [-86, -198],
    [86, -198],
  ];

  return (
    <group name="granite-reflecting-basins">
      {basins.map(([px, pz], idx) => (
        <group key={idx} position={[px, 0, pz]}>
          {/* Dark Recessed Pool Floor Bed */}
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <boxGeometry args={[74, 0.2, 24]} />
            <meshStandardMaterial color="#050b14" roughness={0.9} />
          </mesh>
          {/* 4-Sided Raised Honed Basalt Coping Parapet Frame */}
          {[-13, 13].map((cz) => (
            <mesh key={`cz-${cz}`} position={[0, 0.35, cz]} receiveShadow castShadow>
              <boxGeometry args={[78, 0.7, 2.0]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.65} metalness={0.16} />
            </mesh>
          ))}
          {[-38, 38].map((cx) => (
            <mesh key={`cx-${cx}`} position={[cx, 0.35, 0]} receiveShadow castShadow>
              <boxGeometry args={[2.0, 0.7, 24]} />
              <meshStandardMaterial color="#3f3f46" roughness={0.65} metalness={0.16} />
            </mesh>
          ))}
          {/* Real-Time Planar Mirror Reflecting Water Surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.42, 0]}>
            <planeGeometry args={[74, 24]} />
            <MeshReflectorMaterial
              resolution={512}
              blur={[140, 36]}
              mixBlur={0.75}
              mixStrength={1.8}
              mirror={0.88}
              depthScale={0}
              roughness={0.12}
              metalness={0.82}
              color="#0b1f38"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 1,500 Animated Exterior Pedestrians circulating along the 4 Boulevards,
 * South Metro Glass Skywalk, 5 Grand Travertine Stairways, and Elevated Podium + 36 Portals
 * governed by Weidmann horizontal/stair speed formulas.
 */
function LiveExteriorPedestrianFlows({
  startAngle,
  endAngle,
  occupancyPercent,
  liveSimActive,
}: {
  startAngle: number;
  endAngle: number;
  occupancyPercent: number;
  liveSimActive: boolean;
}) {
  const torsoRef = useRef<THREE.InstancedMesh | null>(null);
  const headRef = useRef<THREE.InstancedMesh | null>(null);

  const crowdMetrics = useMemo(
    () => calculateCrowdPhysicsMetrics(occupancyPercent, liveSimActive),
    [occupancyPercent, liveSimActive]
  );

  const pedestrians = useMemo(() => {
    const count = Math.round(280 + (occupancyPercent / 100) * 1220);
    const list: Array<{
      pathType: 'stair' | 'skywalk' | 'podium' | 'boulevard';
      subIndex: number;
      laneOffset: number;
      phase: number;
      dir: 1 | -1;
      shirtHex: string;
    }> = [];
    const palette = ['#e11d48', '#fbbf24', '#f8fafc', '#38bdf8', '#10b981', '#e2e8f0'];

    for (let i = 0; i < count; i += 1) {
      const hash = Math.abs(Math.sin(i * 53.17 + 19.7));
      const rMod = i % 10;
      const pathType: 'stair' | 'skywalk' | 'podium' | 'boulevard' =
        rMod < 2 ? 'stair' : rMod < 4 ? 'skywalk' : rMod < 7 ? 'podium' : 'boulevard';
      list.push({
        pathType,
        subIndex: i,
        laneOffset: hash - 0.5,
        phase: (i * 0.6180339887) % 1,
        dir: i % 2 === 0 ? 1 : -1,
        shirtHex: palette[i % palette.length],
      });
    }
    return list;
  }, [occupancyPercent]);

  useEffect(() => {
    if (!torsoRef.current) return;
    const color = new THREE.Color();
    pedestrians.forEach((p, idx) => {
      torsoRef.current!.setColorAt(idx, color.set(p.shirtHex));
    });
    if (torsoRef.current.instanceColor) {
      torsoRef.current.instanceColor.needsUpdate = true;
    }
  }, [pedestrians]);

  const stairEndpoints = useMemo(() => {
    const entries: Array<{ angle: number; width: number }> = [
      { angle: 0, width: 22 },
      { angle: Math.PI, width: 22 },
      { angle: Math.PI * 1.5, width: 22 },
      { angle: Math.PI * 0.42, width: 13 },
      { angle: Math.PI * 0.58, width: 13 },
    ];
    return entries.map((e) => {
      const [topX, topZ] = superEllipsePoint(e.angle, 196, 170);
      const [botX, botZ] = superEllipsePoint(e.angle, 224, 198);
      return { ...e, topX, topZ, botX, botZ };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const arcSpan = Math.max(0.1, endAngle - startAngle);

  useFrame(({ clock }) => {
    const torso = torsoRef.current;
    const head = headRef.current;
    if (!torso || !head) return;

    const t = liveSimActive ? clock.getElapsedTime() : 0;
    const walkV = crowdMetrics.walkingSpeedMps * 4.5;
    const stairV = crowdMetrics.stairSpeedMps * 4.5;
    let visible = 0;

    for (let i = 0; i < pedestrians.length; i += 1) {
      const p = pedestrians[i];
      let x = 0;
      let y = 0.05;
      let z = 0;
      let heading = 0;

      if (p.pathType === 'stair') {
        const s = stairEndpoints[p.subIndex % stairEndpoints.length];
        if (s.angle < startAngle - 0.05 || s.angle > endAngle + 0.05) {
          continue;
        }
        const prog = ((p.phase + (t * stairV * p.dir) / 30) % 1 + 1) % 1;
        const dx = s.topX - s.botX;
        const dz = s.topZ - s.botZ;
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        x = THREE.MathUtils.lerp(s.botX, s.topX, prog) + nx * p.laneOffset * s.width;
        z = THREE.MathUtils.lerp(s.botZ, s.topZ, prog) + nz * p.laneOffset * s.width;
        y = THREE.MathUtils.lerp(0.75, 11.2, prog);
        heading = Math.atan2(dx * p.dir, dz * p.dir);
      } else if (p.pathType === 'skywalk') {
        const prog = ((p.phase + (t * walkV * p.dir) / 88) % 1 + 1) % 1;
        z = THREE.MathUtils.lerp(170, 258, prog);
        x = p.laneOffset * 10.5;
        y = 11.08;
        heading = p.dir > 0 ? 0 : Math.PI;
      } else if (p.pathType === 'podium') {
        const ringT = Math.abs(p.laneOffset) * 2;
        const rx = THREE.MathUtils.lerp(170, 192, ringT);
        const rz = THREE.MathUtils.lerp(144, 166, ringT);
        let angle = ((p.phase * Math.PI * 2 + (t * walkV * p.dir) / rx) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (angle < startAngle + 0.02 || angle > endAngle - 0.02) {
          angle = startAngle + ((angle + i * 0.13) % (arcSpan - 0.06)) + 0.03;
        }
        [x, z] = superEllipsePoint(angle, rx, rz);
        y = 10.55;
        heading = -angle + (p.dir > 0 ? 0 : Math.PI);
      } else {
        const axis = p.subIndex % 4;
        const prog = ((p.phase + (t * walkV * p.dir) / 145) % 1 + 1) % 1;
        if (axis === 0) {
          x = THREE.MathUtils.lerp(222, 365, prog);
          z = p.laneOffset * 34;
          heading = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (axis === 1) {
          x = THREE.MathUtils.lerp(-222, -365, prog);
          z = p.laneOffset * 34;
          heading = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        } else if (axis === 2) {
          z = THREE.MathUtils.lerp(220, 355, prog);
          x = p.laneOffset * 34;
          heading = p.dir > 0 ? 0 : Math.PI;
        } else {
          z = THREE.MathUtils.lerp(-220, -355, prog);
          x = p.laneOffset * 34;
          heading = p.dir > 0 ? Math.PI : 0;
        }
        y = 0.05;
      }

      const bob = liveSimActive ? Math.abs(Math.sin(t * 7.8 + p.phase * 12)) * 0.09 : 0;
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);

      dummy.position.set(x, y + 0.72 + bob, z);
      dummy.updateMatrix();
      torso.setMatrixAt(visible, dummy.matrix);

      dummy.position.set(x, y + 1.48 + bob, z);
      dummy.updateMatrix();
      head.setMatrixAt(visible, dummy.matrix);
      visible += 1;
    }

    torso.count = visible;
    head.count = visible;
    torso.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="live-exterior-pedestrian-flows">
      <instancedMesh ref={torsoRef} args={[undefined, undefined, 1600]}>
        <boxGeometry args={[0.5, 0.96, 0.3]} />
        <meshStandardMaterial roughness={0.62} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, 1600]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#f5d0a9" roughness={0.58} />
      </instancedMesh>
    </group>
  );
}

/**
 * 40 Animated Shuttle Buses & Executive Vehicles driving in opposing lanes along the Outer 6-Lane Ring Road.
 */
function LiveRingRoadTraffic({ active }: { active: boolean }) {
  const busRef = useRef<THREE.InstancedMesh | null>(null);
  const carRef = useRef<THREE.InstancedMesh | null>(null);

  const vehicles = useMemo(() => {
    const buses: Array<{ angle: number; r: number; dir: 1 | -1; speed: number; color: string }> = [];
    const cars: Array<{ angle: number; r: number; dir: 1 | -1; speed: number; color: string }> = [];
    const carPalette = ['#e2e8f0', '#334155', '#64748b', '#1e293b', '#94a3b8'];

    for (let i = 0; i < 16; i += 1) {
      const dir = i % 2 === 0 ? 1 : -1;
      buses.push({
        angle: (i / 16) * Math.PI * 2,
        r: dir > 0 ? 378.5 : 391.5,
        dir,
        speed: 14.5 + (i % 3) * 1.4,
        color: i % 3 === 0 ? '#c5a059' : '#f1f5f9',
      });
    }
    for (let i = 0; i < 24; i += 1) {
      const dir = i % 2 === 0 ? 1 : -1;
      cars.push({
        angle: (i / 24) * Math.PI * 2 + 0.14,
        r: dir > 0 ? 381.2 : 388.8,
        dir,
        speed: 19.5 + (i % 4) * 1.8,
        color: carPalette[i % carPalette.length],
      });
    }
    return { buses, cars };
  }, []);

  useEffect(() => {
    const color = new THREE.Color();
    vehicles.buses.forEach((b, idx) => {
      busRef.current?.setColorAt(idx, color.set(b.color));
    });
    vehicles.cars.forEach((c, idx) => {
      carRef.current?.setColorAt(idx, color.set(c.color));
    });
    if (busRef.current?.instanceColor) busRef.current.instanceColor.needsUpdate = true;
    if (carRef.current?.instanceColor) carRef.current.instanceColor.needsUpdate = true;
  }, [vehicles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = active ? clock.getElapsedTime() : 0;

    if (busRef.current) {
      vehicles.buses.forEach((b, idx) => {
        const a = b.angle + ((t * b.speed) / b.r) * b.dir;
        const x = Math.cos(a) * b.r;
        const z = Math.sin(a) * b.r;
        const heading = -a + (b.dir > 0 ? 0 : Math.PI);
        dummy.position.set(x, 1.45, z);
        dummy.rotation.set(0, heading, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        busRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      busRef.current.count = vehicles.buses.length;
      busRef.current.instanceMatrix.needsUpdate = true;
    }

    if (carRef.current) {
      vehicles.cars.forEach((c, idx) => {
        const a = c.angle + ((t * c.speed) / c.r) * c.dir;
        const x = Math.cos(a) * c.r;
        const z = Math.sin(a) * c.r;
        const heading = -a + (c.dir > 0 ? 0 : Math.PI);
        dummy.position.set(x, 0.8, z);
        dummy.rotation.set(0, heading, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        carRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      carRef.current.count = vehicles.cars.length;
      carRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="live-ring-road-traffic">
      <instancedMesh ref={busRef} args={[undefined, undefined, 20]} castShadow>
        <boxGeometry args={[2.6, 2.8, 9.5]} />
        <meshStandardMaterial metalness={0.55} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={carRef} args={[undefined, undefined, 30]} castShadow>
        <boxGeometry args={[2.0, 1.5, 4.6]} />
        <meshStandardMaterial metalness={0.62} roughness={0.26} />
      </instancedMesh>
    </group>
  );
}

export function Surroundings({
  halfCutaway,
  isNight,
  bimFrameMode,
  occupancyPercent,
  liveSimActive = true,
}: SurroundingsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.45 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.95 : Math.PI * 2;
  const groundPbr = useMemo(() => createMasterplanGroundPbrTextures(), []);
  const podiumTexture = useMemo(() => createTravertineArcadeTexture(isNight), [isNight]);

  const commercialPodiumGeo = useMemo(
    () => createCommercialPodiumGeometry(startAngle, endAngle),
    [startAngle, endAngle]
  );

  return (
    <group name="resort-sports-park-masterplan">
      {/* Infinite Exterior Landscape Skirt melting seamlessly into atmospheric horizon fog */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <circleGeometry args={[2400, 64]} />
        <meshStandardMaterial color="#1a291e" roughness={0.94} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          map={groundPbr.map}
          bumpMap={groundPbr.bumpMap}
          bumpScale={0.35}
          roughness={0.88}
          metalness={0.04}
        />
      </mesh>

      {!bimFrameMode && (
        <mesh geometry={commercialPodiumGeo} receiveShadow castShadow>
          <meshStandardMaterial
            map={podiumTexture}
            emissive="#ffffff"
            emissiveMap={podiumTexture}
            emissiveIntensity={isNight ? 0.45 : 0.08}
            roughness={0.62}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <GrandTravertineStairways startAngle={startAngle} endAngle={endAngle} />

      <GraniteReflectingBasins />

      <RealServiceComplexes isNight={isNight} liveSimActive={liveSimActive} />

      <LiveExteriorPedestrianFlows
        startAngle={startAngle}
        endAngle={endAngle}
        occupancyPercent={occupancyPercent}
        liveSimActive={liveSimActive}
      />

      <LiveRingRoadTraffic active={liveSimActive} />

      <NaturalParkLandscaping isNight={isNight} />
    </group>
  );
}
