import { useEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ROOF_SPECS,
  STADIUM_TIERS,
  STRUCTURAL_GRID_LINES,
  type TierSpec,
  calculateCrowdPhysicsMetrics,
  superEllipsePoint,
} from '../config/stadiumSpecs';

interface BowlStandsProps {
  ledGlowIntensity: number;
  halfCutaway: boolean;
  bimFrameMode: boolean;
  occupancyPercent: number;
  showEvacPaths: boolean;
  liveSimActive?: boolean;
}

/**
 * Generates realistic precast-concrete, champagne-gold VIP, and ruby stadium seating PBR maps.
 */
function createSeatingBowlPbrTextures(occupancyPercent: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d');

  if (!ctx || !bCtx) {
    return {
      map: new THREE.CanvasTexture(canvas),
      bumpMap: new THREE.CanvasTexture(bumpCanvas),
    };
  }

  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#757575';
  bCtx.fillRect(0, 0, w, h);

  const rowCount = 32;
  const seatCols = 24;
  const rowH = h / rowCount;
  const colW = w / seatCols;
  const fillThreshold = occupancyPercent / 100;

  for (let r = 0; r < rowCount; r += 1) {
    const y = r * rowH;
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, y, w, 4);
    bCtx.fillStyle = '#282828';
    bCtx.fillRect(0, y, w, 5);

    for (let c = 0; c < seatCols; c += 1) {
      const x = c * colW;
      if (c === 0 || c === seatCols - 1) {
        ctx.fillStyle = '#c8c2b8';
        ctx.fillRect(x, y + 4, colW, rowH - 4);
        ctx.fillStyle = '#c5a059';
        ctx.fillRect(x + 2, y + 4, colW - 4, 3);
        bCtx.fillStyle = '#a0a0a0';
        bCtx.fillRect(x, y + 4, colW, rowH - 4);
        continue;
      }

      if (r >= 13 && r <= 17 && c >= 10 && c <= 13) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x, y, colW, rowH);
        bCtx.fillStyle = '#323232';
        bCtx.fillRect(x, y, colW, rowH);
        if (r === 13) {
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(x, y, colW, 5);
        }
        continue;
      }

      const isGoldRow = r === 0 || r === rowCount - 1;
      ctx.fillStyle = isGoldRow ? '#c5a059' : r % 2 === 0 ? '#881337' : '#9f1239';
      ctx.fillRect(x + 2, y + 6, colW - 4, rowH - 8);
      bCtx.fillStyle = '#dcdcdc';
      bCtx.fillRect(x + 2, y + 6, colW - 4, rowH - 8);

      const hash = Math.abs(Math.sin(r * 78.233 + c * 37.719));
      if (hash < fillThreshold) {
        ctx.fillStyle =
          hash < fillThreshold * 0.2 ? '#e5c158' : hash < fillThreshold * 0.65 ? '#be123c' : '#e7e5e4';
        ctx.fillRect(x + 4, y + 8, colW - 8, rowH - 12);
        bCtx.fillStyle = '#f5f5f5';
        bCtx.fillRect(x + 4, y + 8, colW - 8, rowH - 12);
      }
    }
  }

  const configureTex = (target: HTMLCanvasElement, isColor: boolean) => {
    const tex = new THREE.CanvasTexture(target);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(48, 1);
    tex.anisotropy = 8;
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    return tex;
  };

  return {
    map: configureTex(canvas, true),
    bumpMap: configureTex(bumpCanvas, false),
  };
}

/**
 * Generates an architectural BIM structural section texture with concrete formwork strata,
 * slab edges, and expansion joints for the 90-degree cutaway end-caps.
 */
function createCutawaySectionPbrTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (ctx && bCtx) {
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#8a8a8a';
    bCtx.fillRect(0, 0, size, size);

    // Concrete horizontal lift pours & slab band lines
    for (let y = 0; y < size; y += 64) {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(0, y, size, 8);
      ctx.fillStyle = '#d6d3d1';
      ctx.fillRect(0, y + 8, size, 6);

      bCtx.fillStyle = '#484848';
      bCtx.fillRect(0, y, size, 8);
      bCtx.fillStyle = '#d0d0d0';
      bCtx.fillRect(0, y + 8, size, 6);
    }

    // Vertical structural bay joints + subtle section hatching
    ctx.strokeStyle = 'rgba(39, 39, 42, 0.22)';
    bCtx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    bCtx.lineWidth = 2;
    for (let x = 0; x < size; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(x, 0);
      bCtx.lineTo(x, size);
      bCtx.stroke();
    }

    // Subtle aggregate micro-noise
    for (let i = 0; i < 6000; i += 1) {
      const h = ((i * 2654435761) >>> 0) % (size * size);
      const px = h % size;
      const py = Math.floor(h / size);
      ctx.fillStyle = (i & 1) === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(24,24,27,0.05)';
      ctx.fillRect(px, py, 2, 2);
      bCtx.fillStyle = (i & 1) === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      bCtx.fillRect(px, py, 2, 2);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  return { map, bumpMap };
}

function createHaloLedTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 0, canvas.width, 10);
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

    for (let k = 0; k < 4; k += 1) {
      const cx = k * 512 + 256;
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIETNAM NATIONAL STADIUM • 200,000 SEATS', cx, 66);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px monospace';
      ctx.fillText('VIE  3 : 0  ALL', cx, 152);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('DONG SON SPORTS PARK • FIFA WORLD STANDARD', cx, 206);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRibbonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VIETNAM NATIONAL STADIUM  •  200,000 CAPACITY  •  C-VALUE 95MM', canvas.width / 2, 42);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(12, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSteppedTierGeometry(
  tier: TierSpec,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const stepCount = 12;
  const profile: Array<[number, number, number]> = [];

  for (let s = 0; s < stepCount; s += 1) {
    const t0 = s / stepCount;
    const t1 = (s + 1) / stepCount;
    const y0 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t0);
    const y1 = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, t1);
    profile.push([t0, y0, t0]);
    profile.push([t1, y0, t1]);
    profile.push([t1, y1, t1]);
  }
  const slabThickness = 0.9;
  profile.push([1.0, tier.topElevation - slabThickness, 1.0]);
  profile.push([0.0, tier.baseElevation - slabThickness, 0.0]);
  profile.push([0.0, tier.baseElevation, 0.0]);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const arcSpan = endAngle - startAngle;
  for (const [t, y, v] of profile) {
    const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, t);
    const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, t);
    for (let i = 0; i <= segments; i += 1) {
      const uFrac = i / segments;
      const angle = startAngle + uFrac * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, y, z);
      uvs.push(uFrac * (arcSpan / (Math.PI * 2)), v);
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

function createConcourseSlabGeometry(
  innerRx: number,
  innerRz: number,
  outerRx: number,
  outerRz: number,
  elevation: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let ring = 0; ring <= 1; ring += 1) {
    const rx = ring === 0 ? innerRx : outerRx;
    const rz = ring === 0 ? innerRz : outerRz;
    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, elevation, z);
    }
  }

  const stride = segments + 1;
  for (let i = 0; i < segments; i += 1) {
    const a = i;
    const b = i + 1;
    const c = stride + i;
    const d = c + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createServiceVolumeRingGeometry(
  innerRx: number,
  innerRz: number,
  outerRx: number,
  outerRz: number,
  botY: number,
  topY: number,
  startAngle: number,
  endAngle: number,
  segments = 96
): THREE.BufferGeometry {
  const profile: Array<[number, number]> = [
    [0, botY],
    [0, topY],
    [1, topY],
    [1, botY],
    [0, botY],
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

function createSuperEllipseBandGeometry(
  radiusX: number,
  radiusZ: number,
  height: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let i = 0; i <= segments; i += 1) {
    const uFrac = i / segments;
    const angle = startAngle + uFrac * arcSpan;
    const [x, z] = superEllipsePoint(angle, radiusX, radiusZ);
    positions.push(x, 0, z, x, height, z);
    const u = uFrac * (arcSpan / (Math.PI * 2));
    uvs.push(u, 0, u, 1);
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 48 Internal Reinforced-Concrete Portal Frames (Grid A-E) tucked neatly INSIDE
 * the sculpted architectural vessel envelope (r <= 166m), visible in Cutaway or BIM Frame mode.
 */
function RCFrameBents({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const columnsRef = useRef<THREE.InstancedMesh | null>(null);
  const beamsRef = useRef<THREE.InstancedMesh | null>(null);
  const coresRef = useRef<THREE.InstancedMesh | null>(null);
  const bentCount = ROOF_SPECS.ribCount;

  const { columns, beams, cores } = useMemo(() => {
    const colList: Array<{ pos: [number, number, number]; rotY: number; scale: [number, number, number] }> = [];
    const beamList: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; scale: [number, number, number] }> = [];
    const coreList: Array<{ pos: [number, number, number]; rotY: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);

    const addBeam = (p1: THREE.Vector3, p2: THREE.Vector3, width: number, depth: number) => {
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      if (len < 0.1) {
        return;
      }
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      beamList.push({ pos: [mid.x, mid.y, mid.z], quat, scale: [width, len, depth] });
    };

    for (let i = 0; i < bentCount; i += 1) {
      const angle = (i / bentCount) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }

      for (const grid of STRUCTURAL_GRID_LINES) {
        const [gx, gz] = superEllipsePoint(angle, grid.rx, grid.rz);
        const colW = grid.id === 'E' ? 1.8 : 1.3;
        const colD = grid.id === 'E' ? 3.0 : 1.6;
        colList.push({
          pos: [gx, grid.topElevation / 2, gz],
          rotY: -angle,
          scale: [colW, grid.topElevation, colD],
        });
      }

      for (const tier of STADIUM_TIERS) {
        const [xIn, zIn] = superEllipsePoint(angle, tier.innerRadiusX, tier.innerRadiusZ);
        const [xOut, zOut] = superEllipsePoint(angle, tier.outerRadiusX, tier.outerRadiusZ);
        addBeam(
          new THREE.Vector3(xIn, tier.baseElevation - 1.3, zIn),
          new THREE.Vector3(xOut, tier.topElevation - 1.3, zOut),
          1.0,
          1.3
        );
      }

      const [ax, az] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[0].rx, STRUCTURAL_GRID_LINES[0].rz);
      const [bx, bz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[1].rx, STRUCTURAL_GRID_LINES[1].rz);
      const [cx, cz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[2].rx, STRUCTURAL_GRID_LINES[2].rz);
      const [dx, dz] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[3].rx, STRUCTURAL_GRID_LINES[3].rz);
      const [ex, ez] = superEllipsePoint(angle, STRUCTURAL_GRID_LINES[4].rx, STRUCTURAL_GRID_LINES[4].rz);

      addBeam(new THREE.Vector3(ax, 5.8, az), new THREE.Vector3(bx, 5.8, bz), 0.85, 0.95);
      addBeam(new THREE.Vector3(bx, 17.5, bz), new THREE.Vector3(ex, 17.5, ez), 0.95, 1.1);
      addBeam(new THREE.Vector3(cx, 32.5, cz), new THREE.Vector3(ex, 32.5, ez), 0.95, 1.1);
      addBeam(new THREE.Vector3(dx, 52.5, dz), new THREE.Vector3(ex, 52.5, ez), 0.95, 1.1);

      const nextAngle = ((i + 1) / bentCount) * Math.PI * 2;
      if (nextAngle <= endAngle + 0.03) {
        const [ex2, ez2] = superEllipsePoint(nextAngle, STRUCTURAL_GRID_LINES[4].rx, STRUCTURAL_GRID_LINES[4].rz);
        for (const elev of [17.5, 32.5, 52.5, 68.0]) {
          addBeam(new THREE.Vector3(ex, elev, ez), new THREE.Vector3(ex2, elev, ez2), 0.9, 1.2);
        }
      }

      // 8 Internal RC Shear-Wall Cores for circulation ramps, elevators & lateral seismic resistance
      if (i % 6 === 3) {
        const [coreX, coreZ] = superEllipsePoint(angle, 155, 129);
        coreList.push({ pos: [coreX, 34.0, coreZ], rotY: -angle });
      }
    }

    return { columns: colList, beams: beamList, cores: coreList };
  }, [startAngle, endAngle, bentCount]);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (columnsRef.current) {
      columns.forEach((c, idx) => {
        dummy.position.set(...c.pos);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(...c.scale);
        dummy.updateMatrix();
        columnsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      columnsRef.current.count = columns.length;
      columnsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (beamsRef.current) {
      beams.forEach((b, idx) => {
        dummy.position.set(...b.pos);
        dummy.quaternion.copy(b.quat);
        dummy.scale.set(...b.scale);
        dummy.updateMatrix();
        beamsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      beamsRef.current.count = beams.length;
      beamsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (coresRef.current) {
      cores.forEach((core, idx) => {
        dummy.position.set(...core.pos);
        dummy.rotation.set(0, core.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        coresRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      coresRef.current.count = cores.length;
      coresRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [columns, beams, cores]);

  return (
    <group name="internal-rc-portal-frames">
      <instancedMesh ref={columnsRef} args={[undefined, undefined, bentCount * 5]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.82} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={beamsRef} args={[undefined, undefined, bentCount * 16]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} metalness={0.08} />
      </instancedMesh>
      <instancedMesh ref={coresRef} args={[undefined, undefined, 12]} castShadow receiveShadow>
        <boxGeometry args={[10.0, 68.0, 5.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

function HaloLedRing({
  startAngle,
  endAngle,
  ledGlowIntensity,
}: {
  startAngle: number;
  endAngle: number;
  ledGlowIntensity: number;
}) {
  const haloTex = useMemo(() => createHaloLedTexture(), []);
  const boardGeo = useMemo(
    () =>
      createSuperEllipseBandGeometry(
        ROOF_SPECS.oculusRadiusX + 1.5,
        ROOF_SPECS.oculusRadiusZ + 1.5,
        5.2,
        startAngle,
        endAngle,
        96
      ),
    [startAngle, endAngle]
  );

  const hangers = useMemo(() => {
    const list: Array<[number, number, number]> = [];
    const count = 24;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }
      const [x, z] = superEllipsePoint(
        angle,
        ROOF_SPECS.oculusRadiusX + 1.5,
        ROOF_SPECS.oculusRadiusZ + 1.5
      );
      list.push([x, 70.0, z]);
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="halo-360-video-board">
      <mesh geometry={boardGeo} position={[0, 62.8, 0]}>
        <meshStandardMaterial
          map={haloTex}
          emissive="#ffffff"
          emissiveMap={haloTex}
          emissiveIntensity={0.6 + ledGlowIntensity * 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hangers.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <cylinderGeometry args={[0.2, 0.2, 5.2, 6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function createSectionCapQuad(
  positions: number[],
  uvs: number[],
  indices: number[],
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
) {
  const base = positions.length / 3;
  positions.push(...p0, ...p1, ...p2, ...p3);
  for (const pt of [p0, p1, p2, p3]) {
    const radialDist = Math.hypot(pt[0], pt[2]);
    uvs.push(radialDist / 24, pt[1] / 18);
  }
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/**
 * Generates true hollow structural cross-section faces at cutAngle so 90° cutaway exposes
 * the 4 inclined raker slabs, 5 horizontal floor plates, 5 RC column piers A-E, and open concourse galleries.
 */
function createCutawaySectionCapGeometry(cutAngle: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 1. Inclined precast raker slabs for Tiers 1..4
  for (const tier of STADIUM_TIERS) {
    const [ix, iz] = superEllipsePoint(cutAngle, tier.innerRadiusX, tier.innerRadiusZ);
    const [ox, oz] = superEllipsePoint(cutAngle, tier.outerRadiusX, tier.outerRadiusZ);
    createSectionCapQuad(
      positions,
      uvs,
      indices,
      [ix, tier.baseElevation - 1.1, iz],
      [ix, tier.baseElevation, iz],
      [ox, tier.topElevation, oz],
      [ox, tier.topElevation - 1.1, oz]
    );
  }

  // 2. Five horizontal structural concrete floor plates
  const floorPlates: Array<[number, number, number, number, number, number]> = [
    [72, 52, 166, 140, 0.0, 0.85],
    [100, 78, 196, 170, 9.65, 10.5],
    [100, 78, 166, 140, 17.0, 17.85],
    [122, 98, 166, 140, 32.0, 32.85],
    [146, 120, 166, 140, 52.0, 52.85],
  ];
  for (const [irx, irz, orx, orz, botY, topY] of floorPlates) {
    const [ix, iz] = superEllipsePoint(cutAngle, irx, irz);
    const [ox, oz] = superEllipsePoint(cutAngle, orx, orz);
    createSectionCapQuad(
      positions,
      uvs,
      indices,
      [ix, botY, iz],
      [ix, topY, iz],
      [ox, topY, oz],
      [ox, botY, oz]
    );
  }

  // 3. Five vertical RC structural column piers along Grid Lines A-E
  for (const grid of STRUCTURAL_GRID_LINES) {
    const [ix, iz] = superEllipsePoint(cutAngle, grid.rx - 1.1, grid.rz - 1.1);
    const [ox, oz] = superEllipsePoint(cutAngle, grid.rx + 1.1, grid.rz + 1.1);
    createSectionCapQuad(
      positions,
      uvs,
      indices,
      [ix, 0.0, iz],
      [ix, grid.topElevation, iz],
      [ox, grid.topElevation, oz],
      [ox, 0.0, oz]
    );
  }

  // 4. Narrowed inner utility core walls + outer podium edge wall (leaving outer concourse galleries open)
  const coreWalls: Array<[number, number, number, number, number, number]> = [
    [102, 80, 120, 96, 0.2, 17.5],
    [124, 100, 136, 112, 18.0, 32.5],
    [148, 122, 154, 128, 33.0, 52.5],
    [193, 167, 196, 170, 0.0, 10.5],
  ];
  for (const [irx, irz, orx, orz, botY, topY] of coreWalls) {
    const [ix, iz] = superEllipsePoint(cutAngle, irx, irz);
    const [ox, oz] = superEllipsePoint(cutAngle, orx, orz);
    createSectionCapQuad(
      positions,
      uvs,
      indices,
      [ix, botY, iz],
      [ix, topY, iz],
      [ox, topY, oz],
      [ox, botY, oz]
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function EvacuationFlowPaths({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const routes = useMemo(() => {
    const list: Array<Array<[number, number, number]>> = [];
    const portalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const a of portalAngles) {
      if (a < startAngle - 0.05 || a > endAngle + 0.05) {
        continue;
      }
      const [x1, z1] = superEllipsePoint(a, 100, 78);
      const [x2, z2] = superEllipsePoint(a, 174, 148);
      const [x3, z3] = superEllipsePoint(a, 212, 186);
      const [x4, z4] = superEllipsePoint(a, 280, 255);
      list.push([
        [x1, 18.6, z1],
        [x2, 11.2, z2],
        [x3, 1.2, z3],
        [x4, 0.8, z4],
      ]);
    }
    return list;
  }, [startAngle, endAngle]);

  return (
    <group name="evacuation-flow-paths">
      {routes.map((pts, idx) => (
        <Line key={idx} points={pts} color="#10b981" lineWidth={3.5} dashed dashSize={4} gapSize={2} />
      ))}
    </group>
  );
}

/**
 * 16 Multi-Story Helical/Switchback Pedestrian Ramp & Escalator Cores linking Ground (+0.2m),
 * Podium (+10.5m), and Concourses 1..3 (+17.8m, +32.8m, +52.8m) between Grid D and Grid E.
 */
function VerticalCirculationCores({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const rampFlightsRef = useRef<THREE.InstancedMesh | null>(null);
  const coreColumnsRef = useRef<THREE.InstancedMesh | null>(null);

  const { flights, columns } = useMemo(() => {
    const flightList: Array<{ pos: [number, number, number]; rotY: number; pitch: number; len: number }> = [];
    const colList: Array<[number, number, number]> = [];
    const coreCount = 16;
    const levels = [0.2, 10.5, 17.8, 32.8, 52.8];

    for (let i = 0; i < coreCount; i += 1) {
      const a = (i / coreCount) * Math.PI * 2;
      if (a < startAngle - 0.03 || a > endAngle + 0.03) {
        continue;
      }
      const [cx, cz] = superEllipsePoint(a, 155, 129);
      const tangentAngle = -a + Math.PI / 2;

      for (const offset of [-4.2, 4.2]) {
        colList.push([cx + Math.cos(tangentAngle) * offset, 26.5, cz - Math.sin(tangentAngle) * offset]);
      }

      for (let l = 0; l < levels.length - 1; l += 1) {
        const y0 = levels[l];
        const y1 = levels[l + 1];
        const rise = y1 - y0;
        const run = 16.5;
        const hyp = Math.hypot(run, rise);
        const dirSign = l % 2 === 0 ? 1 : -1;
        const pitch = Math.atan2(rise, run) * dirSign;
        flightList.push({
          pos: [cx, (y0 + y1) / 2, cz],
          rotY: tangentAngle,
          pitch,
          len: hyp,
        });
      }
    }
    return { flights: flightList, columns: colList };
  }, [startAngle, endAngle]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (rampFlightsRef.current) {
      flights.forEach((f, idx) => {
        dummy.position.set(...f.pos);
        dummy.rotation.set(0, f.rotY, 0);
        dummy.rotateX(f.pitch);
        dummy.scale.set(1, 1, f.len);
        dummy.updateMatrix();
        rampFlightsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      rampFlightsRef.current.count = flights.length;
      rampFlightsRef.current.instanceMatrix.needsUpdate = true;
    }
    if (coreColumnsRef.current) {
      columns.forEach((pos, idx) => {
        dummy.position.set(...pos);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        coreColumnsRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      coreColumnsRef.current.count = columns.length;
      coreColumnsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [flights, columns]);

  return (
    <group name="vertical-circulation-ramp-cores">
      <instancedMesh ref={rampFlightsRef} args={[undefined, undefined, 96]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 0.55, 1]} />
        <meshStandardMaterial color="#c8c2b8" roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={coreColumnsRef} args={[undefined, undefined, 64]} castShadow>
        <boxGeometry args={[0.95, 53.0, 0.95]} />
        <meshStandardMaterial color="#c5a059" metalness={0.82} roughness={0.28} />
      </instancedMesh>
    </group>
  );
}

interface SeatSpectatorRecord {
  x: number;
  baseY: number;
  z: number;
  angle: number;
  seed: number;
  shirtHex: string;
}

/**
 * 5,600 Instanced 3D Spectators occupying all 4 tiers in direct proportion to occupancyPercent,
 * performing travelling Mexican wave and cheering motion via direct instanceMatrix Y writes (60 FPS).
 */
function LiveSeatedSpectatorCrowd({
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

  const spectators = useMemo(() => {
    const list: SeatSpectatorRecord[] = [];
    const stepCount = 12;
    const colsPerTier = [172, 140, 160, 120];
    const fillRatio = Math.min(1, Math.max(0, occupancyPercent / 100));

    STADIUM_TIERS.forEach((tier, tIdx) => {
      const angularCols = colsPerTier[tIdx];

      for (let s = 0; s < stepCount; s += 1) {
        const yTread = THREE.MathUtils.lerp(tier.baseElevation, tier.topElevation, s / stepCount);
        const rowT = (s + 0.55) / stepCount;
        const rx = THREE.MathUtils.lerp(tier.innerRadiusX, tier.outerRadiusX, rowT);
        const rz = THREE.MathUtils.lerp(tier.innerRadiusZ, tier.outerRadiusZ, rowT);
        const baseY = yTread + 0.14;

        for (let c = 0; c < angularCols; c += 1) {
          // Reserve clean 48 radial stair aisles & mid-bowl vomitory portals
          if (c % 4 === 0 || (s >= 4 && s <= 6 && c % 8 === 2)) {
            continue;
          }
          const angle = ((c + (s % 2) * 0.25) / angularCols) * Math.PI * 2;
          if (angle < startAngle + 0.02 || angle > endAngle - 0.02) {
            continue;
          }
          const hash = Math.abs(Math.sin(tIdx * 31.7 + s * 78.233 + c * 17.13));
          if (hash >= fillRatio) {
            continue;
          }
          const [x, z] = superEllipsePoint(angle, rx, rz);
          const shirtHex = hash < 0.7 ? '#e11d48' : hash < 0.88 ? '#fbbf24' : '#f8fafc';
          list.push({ x, baseY, z, angle, seed: hash, shirtHex });
        }
      }
    });
    return list;
  }, [startAngle, endAngle, occupancyPercent]);

  useEffect(() => {
    const torso = torsoRef.current;
    const head = headRef.current;
    if (!torso || !head) {
      return;
    }
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    spectators.forEach((s, idx) => {
      const rotY = Math.atan2(-s.x, -s.z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(1, 1, 1);

      dummy.position.set(s.x, s.baseY + 0.36, s.z);
      dummy.updateMatrix();
      torso.setMatrixAt(idx, dummy.matrix);
      torso.setColorAt(idx, color.set(s.shirtHex));

      dummy.position.set(s.x, s.baseY + 0.9, s.z);
      dummy.updateMatrix();
      head.setMatrixAt(idx, dummy.matrix);
    });

    torso.count = spectators.length;
    head.count = spectators.length;
    torso.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    if (torso.instanceColor) {
      torso.instanceColor.needsUpdate = true;
    }
  }, [spectators]);

  useFrame(({ clock }) => {
    if (!liveSimActive || !torsoRef.current || !headRef.current || spectators.length === 0) {
      return;
    }
    const t = clock.getElapsedTime();
    const torsoArr = torsoRef.current.instanceMatrix.array as Float32Array;
    const headArr = headRef.current.instanceMatrix.array as Float32Array;

    for (let i = 0; i < spectators.length; i += 1) {
      const s = spectators[i];
      const wave = Math.max(0, Math.sin(s.angle * 2 - t * 3.1));
      const dy = Math.pow(wave, 4) * 0.52 + (Math.sin(t * 7.2 + s.seed * 6.283) + 1) * 0.08;
      const matYIdx = i * 16 + 13;
      torsoArr[matYIdx] = s.baseY + 0.36 + dy;
      headArr[matYIdx] = s.baseY + 0.9 + dy;
    }

    torsoRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="live-seated-200k-crowd">
      <instancedMesh ref={torsoRef} args={[undefined, undefined, 6000]}>
        <boxGeometry args={[0.52, 0.68, 0.36]} />
        <meshStandardMaterial roughness={0.68} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, 6000]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#f5d0a9" roughness={0.62} />
      </instancedMesh>
    </group>
  );
}

/**
 * 900 Walking Concourse & Ramp Pedestrians circulating at Weidmann velocities
 * along Concourses 1..3 (+17.8m, +32.8m, +52.8m) and Vertical Ramp Cores.
 */
function LiveConcoursePedestrians({
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

  const agents = useMemo(() => {
    const list: Array<{
      mode: 'concourse' | 'ramp';
      rx: number;
      rz: number;
      y: number;
      baseAngle: number;
      dir: 1 | -1;
      phase: number;
      shirtHex: string;
    }> = [];
    const levels = [
      { y: 17.85, rx: 132, rz: 108 },
      { y: 32.85, rx: 144, rz: 118 },
      { y: 52.85, rx: 156, rz: 130 },
    ];
    const palette = ['#e11d48', '#fbbf24', '#38bdf8', '#f8fafc', '#10b981'];
    const totalAgents = Math.round(180 + (occupancyPercent / 100) * 720);

    for (let i = 0; i < totalAgents; i += 1) {
      const hash = Math.abs(Math.sin(i * 41.73 + 9.13));
      const shirtHex = palette[i % palette.length];
      if (i % 5 === 0) {
        const coreIdx = i % 16;
        const coreAngle = (coreIdx / 16) * Math.PI * 2;
        list.push({
          mode: 'ramp',
          rx: 155,
          rz: 129,
          y: 0.2,
          baseAngle: coreAngle,
          dir: i % 2 === 0 ? 1 : -1,
          phase: hash,
          shirtHex,
        });
      } else {
        const lvl = levels[i % levels.length];
        const radialOffset = (hash - 0.5) * 14;
        list.push({
          mode: 'concourse',
          rx: lvl.rx + radialOffset,
          rz: lvl.rz + radialOffset * 0.85,
          y: lvl.y,
          baseAngle: (i / totalAgents) * Math.PI * 2,
          dir: i % 2 === 0 ? 1 : -1,
          phase: hash,
          shirtHex,
        });
      }
    }
    return list;
  }, [occupancyPercent]);

  useEffect(() => {
    if (!torsoRef.current) return;
    const color = new THREE.Color();
    agents.forEach((a, idx) => {
      torsoRef.current!.setColorAt(idx, color.set(a.shirtHex));
    });
    if (torsoRef.current.instanceColor) {
      torsoRef.current.instanceColor.needsUpdate = true;
    }
  }, [agents]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const arcSpan = Math.max(0.1, endAngle - startAngle);

  useFrame(({ clock }) => {
    const torso = torsoRef.current;
    const head = headRef.current;
    if (!torso || !head) return;

    const t = liveSimActive ? clock.getElapsedTime() : 0;
    const speedMps = crowdMetrics.walkingSpeedMps;
    const stairSpeed = crowdMetrics.stairSpeedMps;

    let visibleCount = 0;
    for (let i = 0; i < agents.length; i += 1) {
      const a = agents[i];
      let x = 0;
      let y = a.y;
      let z = 0;
      let heading = 0;

      if (a.mode === 'concourse') {
        const angularVel = (speedMps / a.rx) * a.dir;
        let angle = (a.baseAngle + t * angularVel) % (Math.PI * 2);
        if (angle < 0) angle += Math.PI * 2;
        if (angle < startAngle + 0.02 || angle > endAngle - 0.02) {
          angle = startAngle + ((angle + i) % (arcSpan - 0.06)) + 0.03;
        }
        [x, z] = superEllipsePoint(angle, a.rx, a.rz);
        heading = -angle + (a.dir > 0 ? 0 : Math.PI);
      } else {
        const angle = a.baseAngle;
        if (angle < startAngle + 0.02 || angle > endAngle - 0.02) {
          continue;
        }
        const [cx, cz] = superEllipsePoint(angle, a.rx, a.rz);
        const tangentAngle = -angle + Math.PI / 2;
        const progress = ((a.phase + (t * stairSpeed) / 35) % 1 + 1) % 1;
        const yRamp = THREE.MathUtils.lerp(0.5, 52.8, a.dir > 0 ? progress : 1 - progress);
        const localAlong = Math.sin(progress * Math.PI * 4) * 7.2;
        x = cx + Math.cos(tangentAngle) * localAlong;
        z = cz - Math.sin(tangentAngle) * localAlong;
        y = yRamp;
        heading = tangentAngle + (Math.cos(progress * Math.PI * 4) >= 0 ? 0 : Math.PI);
      }

      const strideBob = liveSimActive ? Math.abs(Math.sin(t * 7.5 + a.phase * 10)) * 0.09 : 0;
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);

      dummy.position.set(x, y + 0.72 + strideBob, z);
      dummy.updateMatrix();
      torso.setMatrixAt(visibleCount, dummy.matrix);

      dummy.position.set(x, y + 1.46 + strideBob, z);
      dummy.updateMatrix();
      head.setMatrixAt(visibleCount, dummy.matrix);

      visibleCount += 1;
    }

    torso.count = visibleCount;
    head.count = visibleCount;
    torso.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="live-concourse-pedestrians">
      <instancedMesh ref={torsoRef} args={[undefined, undefined, 950]}>
        <boxGeometry args={[0.48, 0.95, 0.28]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, 950]}>
        <sphereGeometry args={[0.19, 6, 6]} />
        <meshStandardMaterial color="#f5d0a9" roughness={0.58} />
      </instancedMesh>
    </group>
  );
}

export function BowlStands({
  ledGlowIntensity,
  halfCutaway,
  bimFrameMode,
  occupancyPercent,
  showEvacPaths,
  liveSimActive = true,
}: BowlStandsProps) {
  const startAngle = halfCutaway ? Math.PI * 0.45 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.95 : Math.PI * 2;

  const seatingPbr = useMemo(() => createSeatingBowlPbrTextures(occupancyPercent), [occupancyPercent]);
  const sectionCapPbr = useMemo(() => createCutawaySectionPbrTextures(), []);
  const ribbonTexture = useMemo(() => createRibbonTexture(), []);

  const tierGeos = useMemo(
    () => STADIUM_TIERS.map((tier) => createSteppedTierGeometry(tier, startAngle, endAngle)),
    [startAngle, endAngle]
  );

  // Inner utility spine cores (tucked beneath upper bowl tiers so outer concourse galleries stay open)
  const serviceVolumes = useMemo(
    () => [
      createServiceVolumeRingGeometry(102, 80, 120, 96, 0.2, 17.5, startAngle, endAngle),
      createServiceVolumeRingGeometry(124, 100, 136, 112, 18.0, 32.5, startAngle, endAngle),
      createServiceVolumeRingGeometry(148, 122, 154, 128, 33.0, 52.5, startAngle, endAngle),
    ],
    [startAngle, endAngle]
  );

  const ribbonGeos = useMemo(
    () =>
      STADIUM_TIERS.map((tier) =>
        createSuperEllipseBandGeometry(
          tier.innerRadiusX - 0.25,
          tier.innerRadiusZ - 0.25,
          1.3,
          startAngle,
          endAngle
        )
      ),
    [startAngle, endAngle]
  );

  const pitchRetainingWallGeo = useMemo(
    () =>
      createSuperEllipseBandGeometry(
        STADIUM_TIERS[0].innerRadiusX,
        STADIUM_TIERS[0].innerRadiusZ,
        STADIUM_TIERS[0].baseElevation,
        startAngle,
        endAngle
      ),
    [startAngle, endAngle]
  );

  const glassRails = useMemo(
    () =>
      STADIUM_TIERS.slice(1).map((tier) =>
        createSuperEllipseBandGeometry(
          tier.innerRadiusX - 0.15,
          tier.innerRadiusZ - 0.15,
          1.1,
          startAngle,
          endAngle
        )
      ),
    [startAngle, endAngle]
  );

  const concourseSlabs = useMemo(
    () => [
      createConcourseSlabGeometry(100, 78, 166, 140, 10.5, startAngle, endAngle),
      createConcourseSlabGeometry(100, 78, 166, 140, 17.8, startAngle, endAngle),
      createConcourseSlabGeometry(122, 98, 166, 140, 32.8, startAngle, endAngle),
      createConcourseSlabGeometry(146, 120, 166, 140, 52.8, startAngle, endAngle),
    ],
    [startAngle, endAngle]
  );

  const skyboxGeo = useMemo(
    () => createSuperEllipseBandGeometry(120, 96, 3.0, startAngle, endAngle),
    [startAngle, endAngle]
  );

  const foundationSlabGeo = useMemo(
    () => createConcourseSlabGeometry(72, 52, 166, 140, 0.18, startAngle, endAngle),
    [startAngle, endAngle]
  );

  const sectionCapStartGeo = useMemo(
    () => (halfCutaway ? createCutawaySectionCapGeometry(startAngle) : null),
    [halfCutaway, startAngle]
  );
  const sectionCapEndGeo = useMemo(
    () => (halfCutaway ? createCutawaySectionCapGeometry(endAngle) : null),
    [halfCutaway, endAngle]
  );

  return (
    <group name="stadium-bowl-200k">
      <RCFrameBents startAngle={startAngle} endAngle={endAngle} />

      <VerticalCirculationCores startAngle={startAngle} endAngle={endAngle} />

      {!bimFrameMode && occupancyPercent > 0 && (
        <LiveSeatedSpectatorCrowd
          startAngle={startAngle}
          endAngle={endAngle}
          occupancyPercent={occupancyPercent}
          liveSimActive={liveSimActive}
        />
      )}

      {liveSimActive && (
        <LiveConcoursePedestrians
          startAngle={startAngle}
          endAngle={endAngle}
          occupancyPercent={occupancyPercent}
          liveSimActive={liveSimActive}
        />
      )}

      {/* Solid Sub-Bowl Foundation Slab closing ground floor under Tier 1 */}
      <mesh geometry={foundationSlabGeo} receiveShadow>
        <meshStandardMaterial color="#57534e" roughness={0.86} side={THREE.DoubleSide} />
      </mesh>

      {/* Solid Architectural Cross-Section End-Caps when 90° Cutaway is enabled */}
      {halfCutaway && !bimFrameMode && sectionCapStartGeo && sectionCapEndGeo && (
        <group name="cutaway-section-endcaps">
          <mesh geometry={sectionCapStartGeo} receiveShadow>
            <meshStandardMaterial
              map={sectionCapPbr.map}
              bumpMap={sectionCapPbr.bumpMap}
              bumpScale={0.22}
              roughness={0.82}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={sectionCapEndGeo} receiveShadow>
            <meshStandardMaterial
              map={sectionCapPbr.map}
              bumpMap={sectionCapPbr.bumpMap}
              bumpScale={0.22}
              roughness={0.82}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      <mesh geometry={pitchRetainingWallGeo} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#3f3f46" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>

      {!bimFrameMode &&
        serviceVolumes.map((volGeo, idx) => (
          <mesh key={`svc-${idx}`} geometry={volGeo} receiveShadow>
            <meshStandardMaterial color="#a8a29e" roughness={0.78} side={THREE.DoubleSide} />
          </mesh>
        ))}

      {concourseSlabs.map((slabGeo, idx) => (
        <mesh key={`slab-${idx}`} geometry={slabGeo} receiveShadow>
          <meshStandardMaterial
            color="#d6d3d1"
            roughness={0.78}
            transparent={bimFrameMode}
            opacity={bimFrameMode ? 0.35 : 1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {STADIUM_TIERS.map((tier, idx) => (
        <group key={tier.id} name={tier.id}>
          <mesh geometry={tierGeos[idx]} castShadow={!bimFrameMode} receiveShadow>
            <meshStandardMaterial
              map={seatingPbr.map}
              bumpMap={seatingPbr.bumpMap}
              bumpScale={0.28}
              roughness={0.68}
              metalness={0.06}
              transparent={bimFrameMode}
              opacity={bimFrameMode ? 0.22 : 1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {!bimFrameMode && (
            <mesh geometry={ribbonGeos[idx]} position={[0, tier.baseElevation - 1.4, 0]}>
              <meshStandardMaterial
                map={ribbonTexture}
                emissive="#ffffff"
                emissiveMap={ribbonTexture}
                emissiveIntensity={0.4 + ledGlowIntensity * 0.28}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {!bimFrameMode &&
        STADIUM_TIERS.slice(1).map((tier, idx) => (
          <mesh key={`rail-${tier.id}`} geometry={glassRails[idx]} position={[0, tier.baseElevation, 0]}>
            <meshPhysicalMaterial
              color="#e0f2fe"
              transparent
              opacity={0.35}
              metalness={0.4}
              roughness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {!bimFrameMode && (
        <mesh geometry={skyboxGeo} position={[0, 31.6, 0]}>
          <meshPhysicalMaterial
            color="#0b1324"
            emissive="#fbbf24"
            emissiveIntensity={ledGlowIntensity * 0.28}
            transparent
            opacity={0.75}
            metalness={0.9}
            roughness={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {!bimFrameMode && (
        <HaloLedRing
          startAngle={startAngle}
          endAngle={endAngle}
          ledGlowIntensity={ledGlowIntensity}
        />
      )}

      {showEvacPaths && <EvacuationFlowPaths startAngle={startAngle} endAngle={endAngle} />}
    </group>
  );
}
