import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS, superEllipsePoint } from '../config/stadiumSpecs';

interface SurroundingsProps {
  halfCutaway: boolean;
  isNight: boolean;
  bimFrameMode: boolean;
}

/**
 * Generates an architectural retail/turnstile commercial facade texture for the 2-story Podium.
 */
function createPodiumFacadeTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Upper level mall glazing + aluminum mullions
  ctx.fillStyle = isNight ? 'rgba(251, 191, 36, 0.35)' : '#1e293b';
  ctx.fillRect(0, 26, canvas.width, 96);

  // Concrete horizontal spandrel beam between Level 1 & Level 2
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 122, canvas.width, 18);

  // Ground level retail / 36 turnstile entrance portals
  ctx.fillStyle = isNight ? 'rgba(248, 250, 252, 0.25)' : '#334155';
  ctx.fillRect(0, 140, canvas.width, 116);

  const portalCount = 36;
  const step = canvas.width / portalCount;
  for (let i = 0; i < portalCount; i += 1) {
    const px = i * step + step * 0.5;
    // Recessed dark entrance gate
    ctx.fillStyle = '#09090b';
    ctx.fillRect(px - 14, 152, 28, 104);
    // Gate signage header
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px - 16, 144, 32, 6);
    // Mullions
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(i * step, 26, 4, 230);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates an architectural high-rise curtain wall texture for the 5-star Hotels, IBC & Garages.
 */
function createBuildingFacadeTexture(isNight: boolean, floors: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 512 / floors;
  for (let f = 0; f < floors; f += 1) {
    const y = f * rowH;
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, y, 512, Math.max(4, rowH * 0.28));

    for (let w = 0; w < 16; w += 1) {
      const lit = isNight && Math.abs(Math.sin(f * 13.7 + w * 7.3)) > 0.45;
      ctx.fillStyle = lit ? 'rgba(253, 224, 71, 0.72)' : 'rgba(56, 189, 248, 0.22)';
      ctx.fillRect(w * 32 + 3, y + rowH * 0.32, 26, rowH * 0.62);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a miniature FIFA training pitch texture (105m x 68m) for the North Training Complex.
 */
function createTrainingPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 660;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#1e6b34' : '#247c3d';
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
 * Generates a realistic 1000m x 1000m National Sports Complex site masterplan texture.
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

  // Landscaped park turf
  ctx.fillStyle = '#1e3a2a';
  ctx.fillRect(0, 0, size, size);

  // Outer Asphalt Arterial Ring Road (r=380m, width=28m)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 28 * pxPerMeter;
  ctx.beginPath();
  ctx.arc(cx, cy, 380 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();

  // Ring Road painted lanes
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 380 * pxPerMeter, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.setLineDash([14, 14]);
  for (const off of [-7, 7]) {
    ctx.beginPath();
    ctx.arc(cx, cy, (380 + off) * pxPerMeter, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Central Granite Ceremonial Plaza around Stadium
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 245 * pxPerMeter, 225 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 Wide Granite Pedestrian Boulevards linking Stadium to all 4 Service Zones
  ctx.fillStyle = '#64748b';
  const blvdW = 42 * pxPerMeter;
  ctx.fillRect(cx - blvdW / 2, 0, blvdW, size);
  ctx.fillRect(0, cy - blvdW / 2, size, blvdW);

  // Paved Concrete Service Pads under East Hotel/IBC, West Arena/Aquatics, South Metro, North Garages
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx + 225 * pxPerMeter, cy - 110 * pxPerMeter, 140 * pxPerMeter, 220 * pxPerMeter);
  ctx.fillRect(cx - 365 * pxPerMeter, cy - 110 * pxPerMeter, 140 * pxPerMeter, 220 * pxPerMeter);
  ctx.fillRect(cx - 180 * pxPerMeter, cy - 355 * pxPerMeter, 360 * pxPerMeter, 140 * pxPerMeter);
  ctx.fillRect(cx - 140 * pxPerMeter, cy + 215 * pxPerMeter, 280 * pxPerMeter, 110 * pxPerMeter);

  // Painted parking stalls around North Garages & East/West drop-off bays
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = 1.5;
  for (let px = -165; px <= 165; px += 10) {
    ctx.beginPath();
    ctx.moveTo(cx + px * pxPerMeter, cy - 242 * pxPerMeter);
    ctx.lineTo(cx + px * pxPerMeter, cy - 226 * pxPerMeter);
    ctx.stroke();
  }

  // Inner Stadium Concrete Floor Sub-Base
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 168 * pxPerMeter, 142 * pxPerMeter, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates the 2-story Commercial & Turnstile Podium Ring geometry (y=0..10.5m, r=166..204m).
 */
function createCommercialPodiumGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const innerRx = ROOF_SPECS.supportRadiusX;
  const innerRz = ROOF_SPECS.supportRadiusZ;
  const outerRx = 204;
  const outerRz = 178;
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
 * 8 Monumental Exterior Grand Approach Staircases connecting ground plaza (y=0)
 * up onto the Elevated Concourse Podium (+10.5m).
 */
function GrandApproachStaircases({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const stairs = useMemo(() => {
    const list: Array<{ x: number; z: number; rotY: number; length: number }> = [];
    for (let i = 0; i < ROOF_SPECS.grandStaircases; i += 1) {
      const angle = (i / ROOF_SPECS.grandStaircases) * Math.PI * 2;
      if (angle < startAngle - 0.05 || angle > endAngle + 0.05) {
        continue;
      }
      const [topX, topZ] = superEllipsePoint(angle, 204, 178);
      const [botX, botZ] = superEllipsePoint(angle, 232, 206);
      const midX = (topX + botX) / 2;
      const midZ = (topZ + botZ) / 2;
      const length = Math.hypot(botX - topX, botZ - topZ);
      const rotY = Math.atan2(botX - topX, botZ - topZ);
      list.push({ x: midX, z: midZ, rotY, length });
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="grand-approach-staircases">
      {stairs.map((s, idx) => {
        const pitch = Math.atan2(10.5, s.length);
        const hyp = Math.hypot(s.length, 10.5);
        return (
          <group key={idx} position={[s.x, 5.25, s.z]} rotation={[0, s.rotY, 0]}>
            {/* Sloped Stair Flight */}
            <mesh rotation={[pitch, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[24, 1.4, hyp]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.78} />
            </mesh>
            {/* Concrete Support Wedge beneath Staircase */}
            <mesh position={[0, -2.6, -s.length * 0.22]} castShadow receiveShadow>
              <boxGeometry args={[23, 5.2, s.length * 0.5]} />
              <meshStandardMaterial color="#475569" roughness={0.85} />
            </mesh>
            {/* Left & Right Parapet Walls */}
            {[-12.2, 12.2].map((bx) => (
              <mesh key={bx} position={[bx, 0.8, 0]} rotation={[pitch, 0, 0]} castShadow>
                <boxGeometry args={[0.9, 2.2, hyp]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * 5 Real-World Surrounding Service, Transit, Hospitality & Training Complexes:
 * - Zone 2 (South): Central Metro Station + Elevated Viaduct + Skywalk to Stadium Podium
 * - Zone 3 (East): 5-Star Twin Hotel Towers & International Broadcast/Convention Center (IBC)
 * - Zone 4 (West): 15,000-Seat Indoor Arena & National Aquatics Center
 * - Zone 5 (North): FIFA Training Stadium (105x68m) & 4 Multi-Story Parking Garages
 */
function ServiceComplexBuildings({ isNight }: { isNight: boolean }) {
  const towerTex = useMemo(() => createBuildingFacadeTexture(isNight, 20), [isNight]);
  const podiumBuildingTex = useMemo(() => createBuildingFacadeTexture(isNight, 5), [isNight]);
  const trainingPitchTex = useMemo(() => createTrainingPitchTexture(), []);

  return (
    <group name="national-sports-service-complex">
      {/* ZONE 2 (SOUTH): Central Metro Station + Elevated Rail Viaduct + Pedestrian Skywalk */}
      <group name="zone-2-metro-transit-hub">
        {/* Elevated Rail Viaduct Deck along z=+296m */}
        <mesh position={[0, 14.0, 296]} castShadow receiveShadow>
          <boxGeometry args={[520, 1.8, 14]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>
        {/* Viaduct T-Piers */}
        {[-210, -140, -70, 0, 70, 140, 210].map((px) => (
          <mesh key={px} position={[px, 6.8, 296]} castShadow receiveShadow>
            <boxGeometry args={[4.5, 13.6, 5.5]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
        ))}
        {/* Central Metro Station Hall */}
        <mesh position={[0, 8.5, 268]} castShadow receiveShadow>
          <boxGeometry args={[112, 17, 38]} />
          <meshStandardMaterial map={podiumBuildingTex} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Vaulted Station Roof */}
        <mesh position={[0, 18.5, 268]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[20, 20, 118, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Elevated Pedestrian Skywalk linking Metro Mezzanine (+10.5m) straight to Stadium Podium */}
        <mesh position={[0, 10.5, 214]} castShadow receiveShadow>
          <boxGeometry args={[18, 1.6, 74]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.75} />
        </mesh>
        <mesh position={[0, 12.6, 214]}>
          <boxGeometry args={[17.2, 2.8, 72]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} metalness={0.5} roughness={0.15} />
        </mesh>
        {[196, 228].map((sz) => (
          <mesh key={sz} position={[0, 5.0, sz]} castShadow>
            <boxGeometry args={[14, 10.0, 2.8]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* ZONE 3 (EAST): 5-Star Twin Hotel Towers & International Broadcast/Convention Center (IBC) */}
      <group name="zone-3-hotel-ibc-complex" position={[295, 0, 0]}>
        {/* 4-Story Convention & IBC Podium */}
        <mesh position={[0, 9.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[64, 18, 140]} />
          <meshStandardMaterial map={podiumBuildingTex} roughness={0.45} metalness={0.35} />
        </mesh>
        {/* Hotel Tower North (86m) */}
        <mesh position={[0, 52, -36]} castShadow receiveShadow>
          <boxGeometry args={[34, 68, 34]} />
          <meshStandardMaterial map={towerTex} roughness={0.35} metalness={0.55} />
        </mesh>
        {/* Hotel Tower South (70m) */}
        <mesh position={[0, 44, 36]} castShadow receiveShadow>
          <boxGeometry args={[32, 52, 32]} />
          <meshStandardMaterial map={towerTex} roughness={0.35} metalness={0.55} />
        </mesh>
      </group>

      {/* ZONE 4 (WEST): 15,000-Seat Indoor Arena & National Aquatics Center */}
      <group name="zone-4-arena-aquatics-complex" position={[-295, 0, 0]}>
        {/* Indoor Multi-Sport Arena */}
        <group position={[0, 0, -52]}>
          <mesh position={[0, 13, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[38, 42, 26, 32]} />
            <meshStandardMaterial map={podiumBuildingTex} roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, 26, 0]} scale={[1, 0.35, 1]} castShadow>
            <sphereGeometry args={[39, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.28} />
          </mesh>
        </group>
        {/* National Aquatics Center */}
        <group position={[0, 0, 52]}>
          <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <boxGeometry args={[56, 20, 76]} />
            <meshStandardMaterial map={podiumBuildingTex} roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh position={[0, 20, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.25, 1, 0.4]} castShadow>
            <cylinderGeometry args={[23, 23, 78, 24, 1, false, -Math.PI / 2, Math.PI]} />
            <meshPhysicalMaterial color="#bae6fd" transparent opacity={0.75} metalness={0.3} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ZONE 5 (NORTH): FIFA Training Stadium & 4 Five-Story Parking Garages */}
      <group name="zone-5-training-and-parking" position={[0, 0, -285]}>
        {/* FIFA Standard Training Pitch (105m x 68m) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <planeGeometry args={[105, 68]} />
          <meshStandardMaterial map={trainingPitchTex} roughness={0.8} />
        </mesh>
        {/* 5,000-Seat Training Grandstand */}
        <mesh position={[0, 6.5, -44]} castShadow receiveShadow>
          <boxGeometry args={[104, 13, 18]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 14.5, -41]} rotation={[0.14, 0, 0]} castShadow>
          <boxGeometry args={[108, 1.0, 24]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* 4 Five-Story Multi-Level Concrete Parking Garages (East & West flanks) */}
        {[-125, -80, 80, 125].map((gx) => (
          <group key={gx} position={[gx, 0, 8]}>
            <mesh position={[0, 8.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[36, 17, 58]} />
              <meshStandardMaterial map={podiumBuildingTex} roughness={0.78} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
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
      if (Math.abs(Math.sin(a * 2)) < 0.25) {
        continue;
      }
      const rx = 342;
      const rz = 335;
      list.push({
        x: Math.cos(a) * rx,
        z: Math.sin(a) * rz,
        scale: 0.95 + (i % 3) * 0.14,
      });
    }
    return list;
  }, []);

  const lightPoles = useMemo(() => {
    const list: Array<{ x: number; z: number }> = [];
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      const [x, z] = superEllipsePoint(a, 224, 198);
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

export function Surroundings({ halfCutaway, isNight, bimFrameMode }: SurroundingsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const groundTexture = useMemo(() => createMasterplanGroundTexture(), []);
  const podiumTexture = useMemo(() => createPodiumFacadeTexture(isNight), [isNight]);

  const commercialPodiumGeo = useMemo(
    () => createCommercialPodiumGeometry(startAngle, endAngle),
    [startAngle, endAngle]
  );

  return (
    <group name="stadium-masterplan">
      {/* 1000m x 1000m National Sports Complex Site Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={groundTexture} roughness={0.88} metalness={0.05} />
      </mesh>

      {/* 2-Story Commercial, F&B & Turnstile Podium Ring (+10.5m Elevated Plaza) */}
      {!bimFrameMode && (
        <mesh geometry={commercialPodiumGeo} receiveShadow castShadow>
          <meshStandardMaterial
            map={podiumTexture}
            emissive="#ffffff"
            emissiveMap={podiumTexture}
            emissiveIntensity={isNight ? 0.35 : 0.08}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 8 Monumental Exterior Grand Approach Staircases */}
      <GrandApproachStaircases startAngle={startAngle} endAngle={endAngle} />

      {/* 5 Surrounding Service, Transit, Hospitality & Training Complexes */}
      <ServiceComplexBuildings isNight={isNight} />

      <LushBoulevardLandscaping isNight={isNight} />
    </group>
  );
}
