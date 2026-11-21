import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOF_SPECS, superEllipsePoint } from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  halfCutaway: boolean;
  floodlightIntensity: number;
  facadeGlowColor: string;
  roofOpenPercent: number;
  ceremonyMode: boolean;
}

/**
 * Generates an architectural glazed curtain-wall & concourse gallery texture
 * wrapped behind the exterior golden-bronze diagrid exoskeleton.
 */
function createCurtainWallTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Deep architectural tinted glass background
  ctx.fillStyle = isNight ? '#090d16' : '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 4 horizontal concourse gallery bands glowing softly behind glass
  const floorBands = [
    { y: 380, h: 105, glow: 'rgba(251, 191, 36, 0.42)' },
    { y: 265, h: 95, glow: 'rgba(245, 158, 11, 0.36)' },
    { y: 150, h: 95, glow: 'rgba(56, 189, 248, 0.25)' },
    { y: 40, h: 90, glow: 'rgba(251, 191, 36, 0.22)' },
  ];

  for (const band of floorBands) {
    const grad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    grad.addColorStop(0, isNight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(51, 65, 85, 0.7)');
    grad.addColorStop(0.55, band.glow);
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, band.y, canvas.width, band.h);

    // Concrete floor slab edge line
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, band.y + band.h - 10, canvas.width, 10);
  }

  // Fine vertical aluminum curtain-wall mullions
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  for (let x = 0; x < canvas.width; x += 16) {
    ctx.fillRect(x, 0, 3, canvas.height);
  }

  // 4 Grand Entrance Arch Portals at 0°, 90°, 180°, 270°
  const portalCenters = [0, 512, 1024, 1536, 2048];
  for (const px of portalCenters) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.fillRect(px - 68, 300, 136, 212);
    ctx.fillStyle = '#020617';
    ctx.fillRect(px - 56, 314, 112, 198);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.fillRect(px - 68, 294, 136, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates the outer curved architectural facade curtain wall along super-ellipse contours.
 */
function createCurtainWallGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const rings = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= rings; r += 1) {
    const vt = r / rings;
    const y = THREE.MathUtils.lerp(3.2, ROOF_SPECS.eaveHeight, vt);
    // Subtle sculptural outward waist curve characteristic of iconic stadium bowls
    const bulge = Math.sin(vt * Math.PI) * 5.0;
    const rx = 165 + bulge;
    const rz = 139 + bulge;

    for (let i = 0; i <= segments; i += 1) {
      const ut = i / segments;
      const angle = startAngle + ut * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, y, z);
      uvs.push(angle / (Math.PI * 2), vt);
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
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Generates the translucent PTFE roof canopy mesh from outer compression ring to inner tension ring.
 */
function createRoofCanopyGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const rings = 10;
  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= rings; r += 1) {
    const t = r / rings;
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, t);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, t);

    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      const wave = Math.sin(angle * 24) * 0.9 * (1 - t);
      const arch = Math.sin(t * Math.PI * 0.78) * (ROOF_SPECS.peakHeight - ROOF_SPECS.eaveHeight);
      const y = ROOF_SPECS.eaveHeight + arch + wave;
      positions.push(x, y, z);
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
 * Creates a smooth horizontal structural ring tube along a super-ellipse contour.
 */
function createSuperEllipseRingTube(
  radiusX: number,
  radiusZ: number,
  elevation: number,
  tubeRadius: number,
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.TubeGeometry {
  const pts: THREE.Vector3[] = [];
  const isClosed = endAngle - startAngle >= Math.PI * 1.99;
  const arcSpan = endAngle - startAngle;

  for (let i = 0; i <= segments; i += 1) {
    const angle = startAngle + (i / segments) * arcSpan;
    const [x, z] = superEllipsePoint(angle, radiusX, radiusZ);
    pts.push(new THREE.Vector3(x, elevation, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, isClosed);
  return new THREE.TubeGeometry(curve, segments, tubeRadius, 8, isClosed);
}

/**
 * Generates curved Golden-Bronze exoskeleton diagrid ribs spiraling from the granite plinth
 * at y=3.2m up to the outer compression ring at y=68m, plus radial roof space-truss chords.
 */
function createArchitecturalRibs(startAngle: number, endAngle: number) {
  const roofRibs: THREE.TubeGeometry[] = [];
  const diagCw: THREE.TubeGeometry[] = [];
  const diagCcw: THREE.TubeGeometry[] = [];
  const count = ROOF_SPECS.ribCount;

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
      continue;
    }

    // Main exterior rib + roof cantilever truss
    const [xBase, zBase] = superEllipsePoint(angle, ROOF_SPECS.outerRadiusX + 1, ROOF_SPECS.outerRadiusZ + 1);
    const [xMid, zMid] = superEllipsePoint(angle, ROOF_SPECS.outerRadiusX + 6, ROOF_SPECS.outerRadiusZ + 6);
    const [xEave, zEave] = superEllipsePoint(angle, ROOF_SPECS.outerRadiusX, ROOF_SPECS.outerRadiusZ);
    const [xPeak, zPeak] = superEllipsePoint(
      angle,
      (ROOF_SPECS.outerRadiusX + ROOF_SPECS.oculusRadiusX) * 0.52,
      (ROOF_SPECS.outerRadiusZ + ROOF_SPECS.oculusRadiusZ) * 0.52
    );
    const [xOculus, zOculus] = superEllipsePoint(angle, ROOF_SPECS.oculusRadiusX, ROOF_SPECS.oculusRadiusZ);

    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xBase, 3.0, zBase),
      new THREE.Vector3(xMid, 36.0, zMid),
      new THREE.Vector3(xEave, ROOF_SPECS.eaveHeight, zEave),
      new THREE.Vector3(xPeak, ROOF_SPECS.peakHeight, zPeak),
      new THREE.Vector3(xOculus, 74.0, zOculus),
    ]);
    roofRibs.push(new THREE.TubeGeometry(mainCurve, 26, 0.72, 6, false));

    // Crisscrossing Dong Son golden-bronze diagrid lattice on the exterior facade
    const shift = ((Math.PI * 2) / count) * 2.0;
    const angleCw = angle + shift;
    const angleCcw = angle - shift;

    if (angleCw >= startAngle - 0.05 && angleCw <= endAngle + 0.05) {
      const [xTop1, zTop1] = superEllipsePoint(angleCw, ROOF_SPECS.outerRadiusX, ROOF_SPECS.outerRadiusZ);
      const [xWaist1, zWaist1] = superEllipsePoint(
        (angle + angleCw) / 2,
        ROOF_SPECS.outerRadiusX + 6.2,
        ROOF_SPECS.outerRadiusZ + 6.2
      );
      diagCw.push(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(xBase, 3.0, zBase),
            new THREE.Vector3(xWaist1, 36.0, zWaist1),
            new THREE.Vector3(xTop1, ROOF_SPECS.eaveHeight, zTop1),
          ]),
          10,
          0.42,
          5,
          false
        )
      );
    }

    if (angleCcw >= startAngle - 0.05 && angleCcw <= endAngle + 0.05) {
      const [xTop2, zTop2] = superEllipsePoint(angleCcw, ROOF_SPECS.outerRadiusX, ROOF_SPECS.outerRadiusZ);
      const [xWaist2, zWaist2] = superEllipsePoint(
        (angle + angleCcw) / 2,
        ROOF_SPECS.outerRadiusX + 6.2,
        ROOF_SPECS.outerRadiusZ + 6.2
      );
      diagCcw.push(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(xBase, 3.0, zBase),
            new THREE.Vector3(xWaist2, 36.0, zWaist2),
            new THREE.Vector3(xTop2, ROOF_SPECS.eaveHeight, zTop2),
          ]),
          10,
          0.42,
          5,
          false
        )
      );
    }
  }

  return { roofRibs, diagCw, diagCcw };
}

/**
 * Generates curved elliptical half-dome shells for the retractable Oculus roof.
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
      const [sx, sz] = superEllipsePoint(
        angle,
        ROOF_SPECS.oculusRadiusX * rt,
        ROOF_SPECS.oculusRadiusZ * rt
      );
      const x = Math.abs(sx) * side;
      const z = sz;
      const domeArch = Math.cos((rt * Math.PI) / 2) * 6.5;
      const y = 73.5 + domeArch;
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

function RetractableOculusPanels({
  roofOpenPercent,
  xrayRoof,
}: {
  roofOpenPercent: number;
  xrayRoof: boolean;
}) {
  const leftDomeGeo = useMemo(() => createOculusDomeHalfGeometry(-1), []);
  const rightDomeGeo = useMemo(() => createOculusDomeHalfGeometry(1), []);
  const slideOffset = (roofOpenPercent / 100) * 44;

  return (
    <group name="retractable-oculus-dome">
      {[-44, 44].map((zTrack) => (
        <mesh key={zTrack} position={[0, 73.5, zTrack]}>
          <boxGeometry args={[214, 0.85, 1.0]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
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
      const [originX, originZ] = superEllipsePoint(
        baseAngle,
        ROOF_SPECS.oculusRadiusX + 12,
        ROOF_SPECS.oculusRadiusZ + 12
      );
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
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const isNight = floodlightIntensity > 0.5;

  const curtainTex = useMemo(() => createCurtainWallTexture(isNight), [isNight]);
  const curtainGeo = useMemo(() => createCurtainWallGeometry(startAngle, endAngle), [startAngle, endAngle]);
  const canopyGeo = useMemo(() => createRoofCanopyGeometry(startAngle, endAngle), [startAngle, endAngle]);

  const { roofRibs, diagCw, diagCcw } = useMemo(
    () => createArchitecturalRibs(startAngle, endAngle),
    [startAngle, endAngle]
  );

  const compressionRingGeo = useMemo(
    () =>
      createSuperEllipseRingTube(
        ROOF_SPECS.outerRadiusX,
        ROOF_SPECS.outerRadiusZ,
        ROOF_SPECS.eaveHeight,
        1.15,
        startAngle,
        endAngle
      ),
    [startAngle, endAngle]
  );

  const waistCrownRingGeo = useMemo(
    () =>
      createSuperEllipseRingTube(
        ROOF_SPECS.outerRadiusX + 6.2,
        ROOF_SPECS.outerRadiusZ + 6.2,
        36.0,
        0.75,
        startAngle,
        endAngle
      ),
    [startAngle, endAngle]
  );

  const tensionRingGeo = useMemo(
    () =>
      createSuperEllipseRingTube(
        ROOF_SPECS.oculusRadiusX,
        ROOF_SPECS.oculusRadiusZ,
        74.0,
        1.1,
        startAngle,
        endAngle
      ),
    [startAngle, endAngle]
  );

  const floodlightPositions = useMemo(() => {
    const items: Array<{ pos: [number, number, number]; angle: number }> = [];
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }
      const [x, z] = superEllipsePoint(
        angle,
        ROOF_SPECS.oculusRadiusX + 2.5,
        ROOF_SPECS.oculusRadiusZ + 2.5
      );
      items.push({ pos: [x, 72.5, z], angle });
    }
    return items;
  }, [startAngle, endAngle]);

  return (
    <group name="dong-son-architecture">
      {/* Glazed Exterior Concourse Curtain Wall enclosing the stadium bowl */}
      <mesh geometry={curtainGeo} receiveShadow>
        <meshStandardMaterial
          map={curtainTex}
          emissive="#ffffff"
          emissiveMap={curtainTex}
          emissiveIntensity={isNight ? 0.85 : 0.25}
          metalness={0.6}
          roughness={0.25}
          transparent={xrayRoof}
          opacity={xrayRoof ? 0.3 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Translucent PTFE Roof Canopy */}
      <mesh geometry={canopyGeo} castShadow={!xrayRoof} receiveShadow>
        <meshPhysicalMaterial
          color={xrayRoof ? '#38bdf8' : '#f8fafc'}
          transparent
          opacity={xrayRoof ? 0.16 : 0.86}
          wireframe={xrayRoof}
          roughness={0.32}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Curved Retractable Inner Oculus Dome */}
      {!halfCutaway && (
        <RetractableOculusPanels roofOpenPercent={roofOpenPercent} xrayRoof={xrayRoof} />
      )}

      {/* 48 Primary Structural Steel & Golden-Bronze Cantilever Ribs */}
      {roofRibs.map((geo, idx) => (
        <mesh key={`rib-${idx}`} geometry={geo} castShadow>
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#e2e8f0' : '#f59e0b'}
            metalness={0.8}
            roughness={0.24}
          />
        </mesh>
      ))}

      {/* Golden-Bronze Dong Son Diagrid Exoskeleton Shell */}
      {diagCw.map((geo, idx) => (
        <mesh key={`cw-${idx}`} geometry={geo}>
          <meshStandardMaterial
            color="#d97706"
            emissive={facadeGlowColor}
            emissiveIntensity={isNight ? 0.28 : 0.04}
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
      ))}
      {diagCcw.map((geo, idx) => (
        <mesh key={`ccw-${idx}`} geometry={geo}>
          <meshStandardMaterial
            color="#f59e0b"
            emissive={facadeGlowColor}
            emissiveIntensity={isNight ? 0.28 : 0.04}
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
      ))}

      {/* Outer Compression Ring, Waist Crown Ring & Inner Tension Ring */}
      <mesh geometry={compressionRingGeo}>
        <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh geometry={waistCrownRingGeo}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh geometry={tensionRingGeo} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Stadium Floodlights & Volumetric Cones */}
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

      {ceremonyMode && <CeremonyFireworks />}
    </group>
  );
}
