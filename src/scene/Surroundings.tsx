import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS, superEllipsePoint } from '../config/stadiumSpecs';

interface SurroundingsProps {
  halfCutaway: boolean;
  isNight: boolean;
  bimFrameMode: boolean;
}

/**
 * Generates an upscale Travertine & Champagne-Gold 36-Arch Commercial Arcade texture
 * for the stadium's 2-story Concourse Podium (+10.5m).
 */
function createTravertineArcadeTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Bright cream Travertine limestone base
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Upper level sapphire/warm gallery glazing
  ctx.fillStyle = isNight ? 'rgba(251, 191, 36, 0.55)' : '#0f2942';
  ctx.fillRect(0, 24, canvas.width, 84);

  // Champagne-Gold cornice band separating Level 1 & Level 2
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 108, canvas.width, 8);
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 116, canvas.width, 16);

  // Ground arcade with 36 Champagne-Gold arched turnstile portals
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 132, canvas.width, 124);

  const portalCount = 36;
  const step = canvas.width / portalCount;
  for (let i = 0; i < portalCount; i += 1) {
    const px = i * step + step * 0.5;
    // Champagne-gold arch trim
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, 178, 16, Math.PI, 0);
    ctx.lineTo(px + 16, 256);
    ctx.lineTo(px - 16, 256);
    ctx.closePath();
    ctx.fill();

    // Recessed warm-lit / dark glass entrance portal
    ctx.fillStyle = isNight ? '#fbbf24' : '#0f172a';
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

/**
 * Generates an upscale Sapphire Glass & Pearl Aluminum Mullion facade texture
 * for the 5-star elliptical Sail Hotel Towers and Convention Center.
 */
function createSapphireGlassTexture(isNight: boolean, floors: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = isNight ? '#0c192c' : '#0369a1';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 512 / floors;
  for (let f = 0; f < floors; f += 1) {
    const y = f * rowH;
    // Pearl aluminum spandrel band
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, y, 512, Math.max(4, rowH * 0.24));

    for (let w = 0; w < 16; w += 1) {
      const lit = isNight && Math.abs(Math.sin(f * 13.7 + w * 7.3)) > 0.4;
      ctx.fillStyle = lit ? 'rgba(253, 224, 71, 0.8)' : 'rgba(125, 211, 252, 0.55)';
      ctx.fillRect(w * 32 + 2, y + rowH * 0.28, 28, rowH * 0.68);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
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
      ctx.fillStyle = i % 2 === 0 ? '#16a34a' : '#22c55e';
      ctx.fillRect((i * canvas.width) / 14, 0, canvas.width / 14 + 1, canvas.height);
    }
    ctx.strokeStyle = '#ffffff';
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
 * Generates a bright, resort-grade 1000m x 1000m Sports Park Masterplan ground texture:
 * vibrant emerald green eco-park lawns, cream Travertine stone plazas, Champagne-Gold Dong Son rings,
 * pearl stone pedestrian boulevards, and clean urban ring roads.
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
  const pxPerMeter = size / 1000;

  // Lush resort emerald park turf
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, size, size);

  // Alternating soft lawn mowing rings for depth
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.14)';
  ctx.lineWidth = 28 * pxPerMeter;
  for (const r of [295, 445]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer Urban Boulevard Ring Road (r=385m)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 26 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 385 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.setLineDash([14, 14]);
  for (const off of [-6.5, 6.5]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (385 + off) * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Bright Cream Travertine Ceremonial Plaza around Stadium
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 255 * pxPerMeter, 232 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner Pearl Stone Terrace Ring
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 232 * pxPerMeter, 208 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // Delicate Champagne-Gold Dong Son Lotus Rings inlaid into the Travertine Plaza
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 3;
  for (const r of [218, 240]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * pxPerMeter, (r - 22) * pxPerMeter, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4 Sweeping Pearl-White Travertine Pedestrian Boulevards
  ctx.fillStyle = '#f1f5f9';
  const blvdW = 42 * pxPerMeter;
  ctx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  ctx.fillRect(0, cy - blvdW / 2, size, blvdW);

  // Subtle green planted boulevard medians
  ctx.fillStyle = '#16a34a';
  const medW = 6 * pxPerMeter;
  ctx.fillRect(cx - medW / 2, 0, medW, cy - 235 * pxPerMeter);
  ctx.fillRect(cx - medW / 2, cy + 235 * pxPerMeter, medW, cy - 235 * pxPerMeter);
  ctx.fillRect(0, cy - medW / 2, cx - 255 * pxPerMeter, medW);
  ctx.fillRect(cx + 255 * pxPerMeter, cy - medW / 2, cx - 255 * pxPerMeter, medW);

  // Bright Limestone Plaza Pads under surrounding Complex Zones
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(cx + 295 * pxPerMeter, cy, 75 * pxPerMeter, 110 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - 295 * pxPerMeter, cy, 75 * pxPerMeter, 110 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy - 285 * pxPerMeter, 175 * pxPerMeter, 65 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner Stadium Sub-Base
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 168 * pxPerMeter, 142 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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

function GrandTravertineStairways({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const stairs = useMemo(() => {
    const list: Array<{ x: number; z: number; rotY: number; length: number }> = [];
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2;
      if (angle < startAngle - 0.05 || angle > endAngle + 0.05) {
        continue;
      }
      const [topX, topZ] = superEllipsePoint(angle, 196, 170);
      const [botX, botZ] = superEllipsePoint(angle, 224, 198);
      list.push({
        x: (topX + botX) / 2,
        z: (topZ + botZ) / 2,
        rotY: Math.atan2(botX - topX, botZ - topZ),
        length: Math.hypot(botX - topX, botZ - topZ),
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
              <boxGeometry args={[28, 1.4, hyp]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
            </mesh>
            <mesh position={[0, -2.6, -s.length * 0.22]} receiveShadow>
              <boxGeometry args={[27, 5.2, s.length * 0.5]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
            </mesh>
            {[-14.2, 14.2].map((bx) => (
              <mesh key={bx} position={[bx, 0.8, 0]} rotation={[pitch, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 2.0, hyp]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * 5 Sculptural, Modern Aerodynamic Surrounding Complexes (ZERO ugly dark boxes):
 * - South: Winged Pearl-White Metro Terminal + Glass Skywalk
 * - East: Curved Elliptical Sapphire-Glass 5-Star Sail Hotel Towers + Green-Roof Convention Center
 * - West: Pearl-White & Gold Dome Indoor Arena + Wave-Vaulted Aquatics Pavilion
 * - North: FIFA Training Pitch with Curved Canopy + Green-Roof Eco Parking Pavilions
 */
function SculpturalServiceComplexes({ isNight }: { isNight: boolean }) {
  const towerGlassTex = useMemo(() => createSapphireGlassTexture(isNight, 22), [isNight]);
  const lowGlassTex = useMemo(() => createSapphireGlassTexture(isNight, 5), [isNight]);
  const trainingPitchTex = useMemo(() => createTrainingPitchTexture(), []);

  return (
    <group name="sculptural-service-complexes">
      {/* ZONE 2 (SOUTH): Winged Pearl-White Metro Hub & Glass Skywalk */}
      <group name="zone-2-metro-hub">
        {/* Elevated Pearl Concrete Rail Viaduct */}
        <mesh position={[0, 13.5, 298]} castShadow receiveShadow>
          <boxGeometry args={[520, 1.6, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
        </mesh>
        {[-210, -140, -70, 0, 70, 140, 210].map((px) => (
          <mesh key={px} position={[px, 6.5, 298]} castShadow>
            <cylinderGeometry args={[1.8, 2.4, 13.0, 12]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
        ))}

        {/* Elliptical Glazed Metro Concourse & Pearl Shell Roof */}
        <mesh position={[0, 7.5, 268]} scale={[2.4, 1, 0.9]} castShadow receiveShadow>
          <cylinderGeometry args={[22, 24, 15, 32]} />
          <meshStandardMaterial map={lowGlassTex} roughness={0.3} metalness={0.45} />
        </mesh>
        <mesh position={[0, 15.5, 268]} scale={[2.55, 0.35, 1.05]} castShadow>
          <sphereGeometry args={[24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.25} />
        </mesh>

        {/* Sleek Pearl-White & Glass Skywalk Bridge linking Metro to South Podium */}
        <mesh position={[0, 10.5, 212]} castShadow receiveShadow>
          <boxGeometry args={[16, 1.2, 82]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
        </mesh>
        <mesh position={[0, 12.4, 212]}>
          <boxGeometry args={[15.2, 2.6, 80]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.38} metalness={0.5} roughness={0.12} />
        </mesh>
        {[196, 228].map((sz) => (
          <mesh key={sz} position={[0, 5.0, sz]} castShadow>
            <cylinderGeometry args={[1.6, 2.2, 10.0, 12]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
          </mesh>
        ))}
      </group>

      {/* ZONE 3 (EAST): Elliptical 5-Star Sapphire Sail Hotel Towers & Green-Roof IBC */}
      <group name="zone-3-hotel-ibc" position={[295, 0, 0]}>
        {/* Rounded Travertine & Glass Convention Podium with Green Eco-Terrace Roof */}
        <mesh position={[0, 7.5, 0]} scale={[0.78, 1, 1.45]} castShadow receiveShadow>
          <cylinderGeometry args={[46, 48, 15, 36]} />
          <meshStandardMaterial map={lowGlassTex} roughness={0.3} metalness={0.45} />
        </mesh>
        <mesh position={[0, 15.1, 0]} scale={[0.74, 1, 1.38]}>
          <cylinderGeometry args={[46, 46, 0.5, 36]} />
          <meshStandardMaterial color="#16a34a" roughness={0.85} />
        </mesh>

        {/* Sail Tower North (Elliptical Sapphire Glass + Champagne Crown) */}
        <group position={[0, 0, -34]}>
          <mesh position={[0, 48, 0]} scale={[1.25, 1, 0.78]} castShadow receiveShadow>
            <cylinderGeometry args={[16, 19, 68, 28]} />
            <meshStandardMaterial map={towerGlassTex} roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 82.8, 0]} scale={[1.25, 1, 0.78]}>
            <cylinderGeometry args={[16.4, 16.4, 1.8, 28]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.22} />
          </mesh>
        </group>

        {/* Sail Tower South */}
        <group position={[0, 0, 34]}>
          <mesh position={[0, 40, 0]} scale={[1.2, 1, 0.78]} castShadow receiveShadow>
            <cylinderGeometry args={[15, 17.5, 52, 28]} />
            <meshStandardMaterial map={towerGlassTex} roughness={0.25} metalness={0.6} />
          </mesh>
          <mesh position={[0, 66.8, 0]} scale={[1.2, 1, 0.78]}>
            <cylinderGeometry args={[15.4, 15.4, 1.6, 28]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.22} />
          </mesh>
        </group>
      </group>

      {/* ZONE 4 (WEST): Pearl-White Dome 15K Indoor Arena & Aquatics Center */}
      <group name="zone-4-arena-aquatics" position={[-295, 0, 0]}>
        <group position={[0, 0, -52]}>
          <mesh position={[0, 11, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[36, 40, 22, 36]} />
            <meshStandardMaterial map={lowGlassTex} roughness={0.3} metalness={0.45} />
          </mesh>
          <mesh position={[0, 22, 0]} scale={[1, 0.38, 1]} castShadow>
            <sphereGeometry args={[37, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.24} />
          </mesh>
          <mesh position={[0, 22.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[36.8, 0.7, 8, 36]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.22} />
          </mesh>
        </group>

        <group position={[0, 0, 52]}>
          <mesh position={[0, 9, 0]} scale={[0.9, 1, 1.3]} castShadow receiveShadow>
            <cylinderGeometry args={[30, 33, 18, 32]} />
            <meshStandardMaterial map={lowGlassTex} roughness={0.3} metalness={0.45} />
          </mesh>
          <mesh position={[0, 18, 0]} scale={[0.92, 0.35, 1.32]} castShadow>
            <sphereGeometry args={[31, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.85} metalness={0.25} roughness={0.18} />
          </mesh>
        </group>
      </group>

      {/* ZONE 5 (NORTH): FIFA Training Stadium & Green-Roof Eco Parking Pavilions */}
      <group name="zone-5-training-and-parking" position={[0, 0, -285]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <planeGeometry args={[105, 68]} />
          <meshStandardMaterial map={trainingPitchTex} roughness={0.8} />
        </mesh>
        <mesh position={[0, 5.5, -42]} castShadow receiveShadow>
          <boxGeometry args={[100, 11, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
        </mesh>
        <mesh position={[0, 12.5, -39]} rotation={[0.14, 0, 0]} castShadow>
          <boxGeometry args={[106, 1.0, 22]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.25} />
        </mesh>

        {/* Rounded-corner Green-Roof Eco Parking Pavilions */}
        {[-112, 112].map((gx) => (
          <group key={gx} position={[gx, 0, 4]}>
            <mesh position={[0, 7.5, 0]} scale={[1.35, 1, 0.9]} castShadow receiveShadow>
              <cylinderGeometry args={[30, 32, 15, 24]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
            </mesh>
            <mesh position={[0, 15.2, 0]} scale={[1.3, 1, 0.86]}>
              <cylinderGeometry args={[30, 30, 0.6, 24]} />
              <meshStandardMaterial color="#16a34a" roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function LushParkLandscaping({ isNight }: { isNight: boolean }) {
  const trunkRef = useRef<THREE.InstancedMesh | null>(null);
  const lowerCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const upperCanopyRef = useRef<THREE.InstancedMesh | null>(null);
  const poleRef = useRef<THREE.InstancedMesh | null>(null);
  const lampRef = useRef<THREE.InstancedMesh | null>(null);

  const trees = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number }> = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      if (Math.abs(Math.sin(a * 2)) < 0.2) {
        continue;
      }
      const rx = 248 + (i % 2) * 105;
      const rz = 228 + (i % 2) * 112;
      list.push({
        x: Math.cos(a) * rx,
        z: Math.sin(a) * rz,
        scale: 0.95 + (i % 3) * 0.16,
      });
    }
    for (const d of [236, 264, 294]) {
      for (const side of [-26, 26]) {
        list.push({ x: side, z: d, scale: 1.0 });
        list.push({ x: side, z: -d, scale: 1.0 });
        list.push({ x: d + 12, z: side, scale: 1.0 });
        list.push({ x: -(d + 12), z: side, scale: 1.0 });
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
    <group name="resort-park-landscaping">
      <instancedMesh ref={trunkRef} args={[undefined, undefined, 120]} castShadow>
        <cylinderGeometry args={[0.32, 0.5, 4.4, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lowerCanopyRef} args={[undefined, undefined, 120]} castShadow>
        <sphereGeometry args={[3.2, 12, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={upperCanopyRef} args={[undefined, undefined, 120]} castShadow>
        <sphereGeometry args={[2.6, 12, 10]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, 48]}>
        <cylinderGeometry args={[0.18, 0.25, 9.0, 6]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, 48]}>
        <sphereGeometry args={[0.65, 8, 8]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 2.2 : 0.15}
        />
      </instancedMesh>
    </group>
  );
}

export function Surroundings({ halfCutaway, isNight, bimFrameMode }: SurroundingsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const groundTexture = useMemo(() => createMasterplanGroundTexture(), []);
  const podiumTexture = useMemo(() => createTravertineArcadeTexture(isNight), [isNight]);

  const commercialPodiumGeo = useMemo(
    () => createCommercialPodiumGeometry(startAngle, endAngle),
    [startAngle, endAngle]
  );

  return (
    <group name="resort-sports-park-masterplan">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={groundTexture} roughness={0.85} metalness={0.05} />
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

      {/* Turquoise Reflecting Lagoons flanking North & South Approaches */}
      {[
        [-84, 198],
        [84, 198],
        [-84, -198],
        [84, -198],
      ].map(([px, pz], idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.06, pz]}>
          <planeGeometry args={[76, 26]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.08} />
        </mesh>
      ))}

      <SculpturalServiceComplexes isNight={isNight} />

      <LushParkLandscaping isNight={isNight} />
    </group>
  );
}
