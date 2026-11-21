import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ROOF_SPECS,
  getUndulatingRimHeight,
  superEllipsePoint,
} from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  halfCutaway: boolean;
  bimFrameMode: boolean;
  floodlightIntensity: number;
  roofOpenPercent: number;
}

const SUPPORT_U = 0.08;

/**
 * Computes undulating roof truss Top & Bottom chord elevations at normalized radial position u
 * and perimeter angle, matching the Saddle Roof profile seamlessly.
 */
function getSaddleTrussHeights(u: number, angle: number): { yBot: number; yTop: number } {
  const rimH = getUndulatingRimHeight(angle);
  const oculusH = 73.5 + Math.cos(angle * 2) * 2.2;
  const crownArch = Math.sin(u * Math.PI) * 5.2;
  const yBot = THREE.MathUtils.lerp(rimH - 1.2, oculusH - 2.0, u) + crownArch * 0.65;
  const depth =
    u < SUPPORT_U
      ? THREE.MathUtils.lerp(2.6, ROOF_SPECS.trussRootDepth, u / SUPPORT_U)
      : THREE.MathUtils.lerp(ROOF_SPECS.trussRootDepth, ROOF_SPECS.trussTipDepth, (u - SUPPORT_U) / (1 - SUPPORT_U));
  return { yBot, yTop: yBot + depth };
}

/**
 * Generates an upscale architectural glazed sapphire-turquoise & warm champagne curtain-wall texture.
 */
function createLuxuryCurtainWallTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = isNight ? '#0c192c' : '#0f2942';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const floorBands = [
    { y: 382, h: 100, glow: isNight ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.35)' },
    { y: 266, h: 94, glow: isNight ? 'rgba(245, 158, 11, 0.45)' : 'rgba(186, 230, 253, 0.32)' },
    { y: 152, h: 94, glow: isNight ? 'rgba(56, 189, 248, 0.35)' : 'rgba(125, 211, 252, 0.28)' },
    { y: 42, h: 90, glow: isNight ? 'rgba(251, 191, 36, 0.38)' : 'rgba(224, 242, 254, 0.25)' },
  ];

  for (const band of floorBands) {
    const grad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    grad.addColorStop(0, isNight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(14, 116, 144, 0.45)');
    grad.addColorStop(0.55, band.glow);
    grad.addColorStop(1, isNight ? '#0f172a' : '#164e63');
    ctx.fillStyle = grad;
    ctx.fillRect(0, band.y, canvas.width, band.h);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, band.y + band.h - 7, canvas.width, 7);
  }

  // Fine champagne-silver curtain mullions
  ctx.fillStyle = 'rgba(226, 232, 240, 0.28)';
  for (let x = 0; x < canvas.width; x += 20) {
    ctx.fillRect(x, 0, 2, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates the flared sculptural "Jade Vessel" glazed facade rising from Podium (+10.5m)
 * seamlessly into the undulating Saddle Roof outer rim.
 */
function createSculptedVesselFacadeGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const rings = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= rings; r += 1) {
    const vt = r / rings;
    // Graceful outward vessel flare from Podium (+10.5m) up to Saddle Roof eave
    const flare = Math.pow(vt, 0.85);
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.supportRadiusX, ROOF_SPECS.outerRadiusX - 1.5, flare);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.supportRadiusZ, ROOF_SPECS.outerRadiusZ - 1.5, flare);

    for (let i = 0; i <= segments; i += 1) {
      const ut = i / segments;
      const angle = startAngle + ut * arcSpan;
      const topY = getUndulatingRimHeight(angle);
      const y = THREE.MathUtils.lerp(10.5, topY, vt);
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
 * Generates the Pearl-White ETFE tensile Saddle Roof membrane with radial cushion ribs
 * and a clear inner daylight skylight ring around the Oculus.
 */
function createSaddleRoofCanopyGeometry(
  startAngle: number,
  endAngle: number,
  innerStartRatio: number,
  outerEndRatio: number,
  segments = 108
): THREE.BufferGeometry {
  const bays = 8;
  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= bays; r += 1) {
    const u = THREE.MathUtils.lerp(innerStartRatio, outerEndRatio, r / bays);
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, u);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, u);

    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      const { yTop } = getSaddleTrussHeights(u, angle);
      // Subtle aerodynamic ETFE cushion pillowing between the 48 radial trusses
      const pillow = Math.abs(Math.sin(angle * 24)) * 0.42;
      positions.push(x, yTop + 0.25 + pillow, z);
    }
  }

  const stride = segments + 1;
  for (let r = 0; r < bays; r += 1) {
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

function createUndulatingRimTube(
  radiusX: number,
  radiusZ: number,
  offsetY: number,
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
    pts.push(new THREE.Vector3(x, getUndulatingRimHeight(angle) + offsetY, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, isClosed);
  return new THREE.TubeGeometry(curve, segments, tubeRadius, 8, isClosed);
}

/**
 * Sculpted Champagne-Gold & Pearl-White Dong Son Diagrid Facade Lattice wrapping
 * cleanly around the flared glass vessel from Podium (+10.5m) up to the Saddle Roof Rim.
 */
function SculptedDiagridFacade({
  startAngle,
  endAngle,
  isNight,
}: {
  startAngle: number;
  endAngle: number;
  isNight: boolean;
}) {
  const goldRef = useRef<THREE.InstancedMesh | null>(null);
  const pearlRef = useRef<THREE.InstancedMesh | null>(null);

  const { goldStruts, pearlStruts } = useMemo(() => {
    const gold: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }> = [];
    const pearl: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);
    const count = 48;
    const tiers = 5;

    const addSeg = (
      target: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }>,
      p1: THREE.Vector3,
      p2: THREE.Vector3
    ) => {
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      if (len < 0.1) {
        return;
      }
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      target.push({ pos: [mid.x, mid.y, mid.z], quat, len });
    };

    const pointAt = (angle: number, vt: number) => {
      const flare = Math.pow(vt, 0.85);
      const rx = THREE.MathUtils.lerp(ROOF_SPECS.supportRadiusX + 0.8, ROOF_SPECS.outerRadiusX + 0.4, flare);
      const rz = THREE.MathUtils.lerp(ROOF_SPECS.supportRadiusZ + 0.8, ROOF_SPECS.outerRadiusZ + 0.4, flare);
      const [x, z] = superEllipsePoint(angle, rx, rz);
      const y = THREE.MathUtils.lerp(10.5, getUndulatingRimHeight(angle), vt);
      return new THREE.Vector3(x, y, z);
    };

    for (let i = 0; i < count; i += 1) {
      const a0 = (i / count) * Math.PI * 2;
      const a1 = ((i + 1) / count) * Math.PI * 2;
      if (a0 < startAngle - 0.02 || a1 > endAngle + 0.03) {
        continue;
      }

      for (let t = 0; t < tiers; t += 1) {
        const vt0 = t / tiers;
        const vt1 = (t + 1) / tiers;
        const shift = t % 2 === 0 ? 0 : 0.5;
        const angA = ((i + shift) / count) * Math.PI * 2;
        const angB = ((i + 1 + shift) / count) * Math.PI * 2;
        const angMid = (angA + angB) / 2;

        // Intersecting lotus/Dong Son diamond ribs
        addSeg(gold, pointAt(angA, vt0), pointAt(angMid, vt1));
        addSeg(gold, pointAt(angB, vt0), pointAt(angMid, vt1));
        // Sleek horizontal pearl ring accent every 2 tiers
        if (t % 2 === 1) {
          addSeg(pearl, pointAt(a0, vt0), pointAt(a1, vt0));
        }
      }
    }

    return { goldStruts: gold, pearlStruts: pearl };
  }, [startAngle, endAngle]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (goldRef.current) {
      goldStruts.forEach((s, idx) => {
        dummy.position.set(...s.pos);
        dummy.quaternion.copy(s.quat);
        dummy.scale.set(0.32, s.len, 0.32);
        dummy.updateMatrix();
        goldRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      goldRef.current.count = goldStruts.length;
      goldRef.current.instanceMatrix.needsUpdate = true;
    }
    if (pearlRef.current) {
      pearlStruts.forEach((s, idx) => {
        dummy.position.set(...s.pos);
        dummy.quaternion.copy(s.quat);
        dummy.scale.set(0.36, s.len, 0.36);
        dummy.updateMatrix();
        pearlRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      pearlRef.current.count = pearlStruts.length;
      pearlRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [goldStruts, pearlStruts]);

  return (
    <group name="champagne-gold-vessel-diagrid">
      <instancedMesh ref={goldRef} args={[undefined, undefined, 700]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={isNight ? 0.35 : 0.06}
          metalness={0.82}
          roughness={0.22}
        />
      </instancedMesh>
      <instancedMesh ref={pearlRef} args={[undefined, undefined, 300]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.55} roughness={0.25} />
      </instancedMesh>
    </group>
  );
}

/**
 * Hidden 48 Tapered Double-Chord Triangulated Steel Cantilever Roof Trusses following
 * the undulating Saddle Roof contour (exposed in BIM Frame or X-Ray mode).
 */
function TriangulatedSpaceTrussRoof({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const members = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number; radius: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);
    const count = ROOF_SPECS.ribCount;
    const bays = ROOF_SPECS.trussBays;

    const addStrut = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number) => {
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      if (len < 0.05) {
        return;
      }
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      list.push({ pos: [mid.x, mid.y, mid.z], quat, len, radius });
    };

    const getNodesForAngle = (angle: number) => {
      const nodes: Array<{ top: THREE.Vector3; bot: THREE.Vector3 }> = [];
      for (let b = 0; b <= bays; b += 1) {
        const u = b === 1 ? SUPPORT_U : b / bays;
        const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, u);
        const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, u);
        const [x, z] = superEllipsePoint(angle, rx, rz);
        const { yBot, yTop } = getSaddleTrussHeights(u, angle);
        nodes.push({
          bot: new THREE.Vector3(x, yBot, z),
          top: new THREE.Vector3(x, yTop, z),
        });
      }
      return nodes;
    };

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }

      const nodes = getNodesForAngle(angle);

      for (let b = 0; b <= bays; b += 1) {
        addStrut(nodes[b].bot, nodes[b].top, b === 1 ? 0.34 : 0.22);
        if (b < bays) {
          addStrut(nodes[b].top, nodes[b + 1].top, 0.32);
          addStrut(nodes[b].bot, nodes[b + 1].bot, 0.32);
          if (b === 0) {
            addStrut(nodes[0].bot, nodes[1].top, 0.2);
          } else {
            addStrut(nodes[b].top, nodes[b + 1].bot, 0.2);
          }
        }
      }

      const nextAngle = ((i + 1) / count) * Math.PI * 2;
      if (nextAngle <= endAngle + 0.03) {
        const nextNodes = getNodesForAngle(nextAngle);
        for (let b = 0; b <= bays; b += 1) {
          const isPrimaryRing = b === 1 || b === bays;
          addStrut(nodes[b].top, nextNodes[b].top, isPrimaryRing ? 0.34 : 0.16);
          if (b === 1 || b === 5 || b === bays) {
            addStrut(nodes[b].bot, nextNodes[b].bot, isPrimaryRing ? 0.34 : 0.18);
          }
        }
      }
    }

    return list;
  }, [startAngle, endAngle]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    const dummy = new THREE.Object3D();
    members.forEach((m, idx) => {
      dummy.position.set(...m.pos);
      dummy.quaternion.copy(m.quat);
      dummy.scale.set(m.radius, m.len, m.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.count = members.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [members]);

  return (
    <instancedMesh
      ref={meshRef}
      name="triangulated-steel-space-truss"
      args={[undefined, undefined, 4500]}
      castShadow
    >
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial color="#f1f5f9" metalness={0.8} roughness={0.25} />
    </instancedMesh>
  );
}

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
      const domeArch = Math.cos((rt * Math.PI) / 2) * 4.5;
      const y = 74.0 + domeArch;
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
      <mesh
        geometry={leftDomeGeo}
        position={[-slideOffset, -0.35 * (roofOpenPercent / 100), 0]}
        castShadow={!xrayRoof}
      >
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={xrayRoof ? 0.14 : 0.52}
          wireframe={xrayRoof}
          roughness={0.18}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        geometry={rightDomeGeo}
        position={[slideOffset, -0.35 * (roofOpenPercent / 100), 0]}
        castShadow={!xrayRoof}
      >
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={xrayRoof ? 0.14 : 0.52}
          wireframe={xrayRoof}
          roughness={0.18}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function RoofStructure({
  xrayRoof,
  halfCutaway,
  bimFrameMode,
  floodlightIntensity,
  roofOpenPercent,
}: RoofStructureProps) {
  const startAngle = halfCutaway ? Math.PI * 0.52 : 0;
  const endAngle = halfCutaway ? Math.PI * 1.98 : Math.PI * 2;
  const isNight = floodlightIntensity > 0.5;

  const curtainTex = useMemo(() => createLuxuryCurtainWallTexture(isNight), [isNight]);
  const vesselCurtainGeo = useMemo(
    () => createSculptedVesselFacadeGeometry(startAngle, endAngle),
    [startAngle, endAngle]
  );

  // Outer Pearl-White ETFE Roof (0..0.78) + Inner Daylight Glass Skylight Ring (0.78..1.0)
  const etfeCanopyGeo = useMemo(
    () => createSaddleRoofCanopyGeometry(startAngle, endAngle, 0, 0.78),
    [startAngle, endAngle]
  );
  const skylightRingGeo = useMemo(
    () => createSaddleRoofCanopyGeometry(startAngle, endAngle, 0.78, 1.0),
    [startAngle, endAngle]
  );

  const outerPearlFasciaGeo = useMemo(
    () =>
      createUndulatingRimTube(
        ROOF_SPECS.outerRadiusX + 0.6,
        ROOF_SPECS.outerRadiusZ + 0.6,
        2.5,
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
    <group name="sculpted-champagne-pearl-stadium">
      {/* Hidden 48 Triangulated Steel Space Trusses (visible in BIM or X-Ray mode) */}
      {(bimFrameMode || xrayRoof) && (
        <TriangulatedSpaceTrussRoof startAngle={startAngle} endAngle={endAngle} />
      )}

      {/* Sculptural Jade-Sapphire Vessel Glass Facade + Champagne-Gold Dong Son Diagrid */}
      {!bimFrameMode && (
        <>
          <mesh geometry={vesselCurtainGeo} receiveShadow>
            <meshStandardMaterial
              map={curtainTex}
              emissive="#ffffff"
              emissiveMap={curtainTex}
              emissiveIntensity={isNight ? 0.85 : 0.25}
              metalness={0.65}
              roughness={0.22}
              transparent={xrayRoof}
              opacity={xrayRoof ? 0.28 : 0.96}
              side={THREE.DoubleSide}
            />
          </mesh>

          <SculptedDiagridFacade
            startAngle={startAngle}
            endAngle={endAngle}
            isNight={isNight}
          />

          {/* Pearl-White Undulating Saddle Fascia Rim */}
          <mesh geometry={outerPearlFasciaGeo} castShadow>
            <meshStandardMaterial color="#f8fafc" metalness={0.5} roughness={0.24} />
          </mesh>
        </>
      )}

      {/* Pearl-White ETFE Tensile Cushions + Translucent Daylight Skylight Ring */}
      {!bimFrameMode && (
        <>
          <mesh geometry={etfeCanopyGeo} castShadow={!xrayRoof} receiveShadow>
            <meshPhysicalMaterial
              color={xrayRoof ? '#38bdf8' : '#ffffff'}
              transparent
              opacity={xrayRoof ? 0.14 : 0.94}
              wireframe={xrayRoof}
              roughness={0.28}
              metalness={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={skylightRingGeo}>
            <meshPhysicalMaterial
              color="#e0f2fe"
              transparent
              opacity={xrayRoof ? 0.14 : 0.54}
              roughness={0.12}
              metalness={0.15}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Retractable Inner Oculus Dome */}
      {!halfCutaway && !bimFrameMode && (
        <RetractableOculusPanels roofOpenPercent={roofOpenPercent} xrayRoof={xrayRoof} />
      )}

      {!bimFrameMode &&
        floodlightPositions.map(({ pos, angle }, idx) => (
          <group key={idx} position={pos} rotation={[0, -angle, 0]}>
            <mesh>
              <boxGeometry args={[3.6, 1.2, 1.8]} />
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
                  opacity={0.04}
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
