import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROOF_SPECS, superEllipsePoint } from '../config/stadiumSpecs';

interface RoofStructureProps {
  xrayRoof: boolean;
  halfCutaway: boolean;
  bimFrameMode: boolean;
  floodlightIntensity: number;
  roofOpenPercent: number;
}

const SUPPORT_U = 0.074;

function getTrussNodeHeights(u: number): { yBot: number; yTop: number } {
  const yBot = 68.5 + (u - SUPPORT_U) * 4.3;
  const depth =
    u < SUPPORT_U
      ? THREE.MathUtils.lerp(3.2, ROOF_SPECS.trussRootDepth, u / SUPPORT_U)
      : THREE.MathUtils.lerp(ROOF_SPECS.trussRootDepth, ROOF_SPECS.trussTipDepth, (u - SUPPORT_U) / (1 - SUPPORT_U));
  return { yBot, yTop: yBot + depth };
}

function createCurtainWallTexture(isNight: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const floorBands = [
    { y: 380, h: 105, glow: 'rgba(226, 232, 240, 0.24)' },
    { y: 265, h: 95, glow: 'rgba(148, 163, 184, 0.22)' },
    { y: 150, h: 95, glow: 'rgba(203, 213, 225, 0.18)' },
    { y: 40, h: 90, glow: 'rgba(226, 232, 240, 0.16)' },
  ];

  for (const band of floorBands) {
    const grad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    grad.addColorStop(0, isNight ? 'rgba(15, 23, 42, 0.9)' : 'rgba(51, 65, 85, 0.72)');
    grad.addColorStop(0.5, isNight ? 'rgba(251, 191, 36, 0.28)' : band.glow);
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, band.y, canvas.width, band.h);

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, band.y + band.h - 10, canvas.width, 10);
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  for (let x = 0; x < canvas.width; x += 16) {
    ctx.fillRect(x, 0, 3, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCurtainWallGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const rings = 4;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= rings; r += 1) {
    const vt = r / rings;
    const y = THREE.MathUtils.lerp(10.5, ROOF_SPECS.supportHeight, vt);
    for (let i = 0; i <= segments; i += 1) {
      const ut = i / segments;
      const angle = startAngle + ut * arcSpan;
      const [x, z] = superEllipsePoint(angle, ROOF_SPECS.supportRadiusX, ROOF_SPECS.supportRadiusZ);
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

function createRoofCanopyGeometry(
  startAngle: number,
  endAngle: number,
  segments = 108
): THREE.BufferGeometry {
  const bays = ROOF_SPECS.trussBays;
  const positions: number[] = [];
  const indices: number[] = [];
  const arcSpan = endAngle - startAngle;

  for (let r = 0; r <= bays; r += 1) {
    const u = r / bays;
    const rx = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, u);
    const rz = THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, u);
    const { yTop } = getTrussNodeHeights(u);

    for (let i = 0; i <= segments; i += 1) {
      const angle = startAngle + (i / segments) * arcSpan;
      const [x, z] = superEllipsePoint(angle, rx, rz);
      positions.push(x, yTop + 0.18, z);
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
  return new THREE.TubeGeometry(curve, segments, tubeRadius, 6, isClosed);
}

/**
 * 48 Tapered Double-Chord Triangulated Cantilever Steel Trusses seated on Grid E (y=68.5m).
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
        const { yBot, yTop } = getTrussNodeHeights(u);
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
        addStrut(nodes[b].bot, nodes[b].top, b === 1 ? 0.36 : 0.24);
        if (b < bays) {
          addStrut(nodes[b].top, nodes[b + 1].top, 0.34);
          addStrut(nodes[b].bot, nodes[b + 1].bot, 0.34);
          if (b === 0) {
            addStrut(nodes[0].bot, nodes[1].top, 0.22);
          } else {
            addStrut(nodes[b].top, nodes[b + 1].bot, 0.22);
          }
        }
      }

      const nextAngle = ((i + 1) / count) * Math.PI * 2;
      if (nextAngle <= endAngle + 0.03) {
        const nextNodes = getNodesForAngle(nextAngle);
        for (let b = 0; b <= bays; b += 1) {
          const isPrimaryRing = b === 1 || b === bays;
          addStrut(nodes[b].top, nextNodes[b].top, isPrimaryRing ? 0.35 : 0.18);
          if (b === 1 || b === 5 || b === bays) {
            addStrut(nodes[b].bot, nextNodes[b].bot, isPrimaryRing ? 0.35 : 0.2);
          }
          if (i % 4 === 0 && b < bays && b % 2 === 1) {
            addStrut(nodes[b].top, nextNodes[b + 1].top, 0.14);
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
      <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.26} />
    </instancedMesh>
  );
}

/**
 * 24 Cable-Stayed Pylon Masts rising from Grid E (y=68.5m -> 102m) with Forestay Suspension Cables
 * holding the roof cantilever & Backstay Tie-Down Cables anchored to Concrete Counterweight Blocks (r=196m).
 */
function CableStayedPylonSystem({
  startAngle,
  endAngle,
}: {
  startAngle: number;
  endAngle: number;
}) {
  const steelRef = useRef<THREE.InstancedMesh | null>(null);
  const cableRef = useRef<THREE.InstancedMesh | null>(null);
  const anchorRef = useRef<THREE.InstancedMesh | null>(null);

  const { pylons, cables, anchors } = useMemo(() => {
    const pList: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }> = [];
    const cList: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }> = [];
    const aList: Array<{ pos: [number, number, number]; rotY: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);

    const addSeg = (
      target: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number }>,
      p1: THREE.Vector3,
      p2: THREE.Vector3
    ) => {
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      target.push({ pos: [mid.x, mid.y, mid.z], quat, len });
    };

    for (let i = 0; i < ROOF_SPECS.ribCount; i += 2) {
      const angle = (i / ROOF_SPECS.ribCount) * Math.PI * 2;
      if (angle < startAngle - 0.02 || angle > endAngle + 0.02) {
        continue;
      }

      // Base of pylon sits directly on Grid E column bearing (y=68.5m)
      const [bx, bz] = superEllipsePoint(angle, ROOF_SPECS.supportRadiusX, ROOF_SPECS.supportRadiusZ);
      // Tip leans slightly outward (+8m) to balance cantilever moment
      const [tx, tz] = superEllipsePoint(angle, ROOF_SPECS.supportRadiusX + 8, ROOF_SPECS.supportRadiusZ + 8);
      const pBase = new THREE.Vector3(bx, ROOF_SPECS.supportHeight, bz);
      const pTip = new THREE.Vector3(tx, ROOF_SPECS.pylonHeightM, tz);
      addSeg(pList, pBase, pTip);

      // Forestay cable 1 -> Mid-cantilever truss node (u=0.5)
      const [mx, mz] = superEllipsePoint(
        angle,
        THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusX, ROOF_SPECS.oculusRadiusX, 0.5),
        THREE.MathUtils.lerp(ROOF_SPECS.outerRadiusZ, ROOF_SPECS.oculusRadiusZ, 0.5)
      );
      const { yTop: yMid } = getTrussNodeHeights(0.5);
      addSeg(cList, pTip, new THREE.Vector3(mx, yMid, mz));

      // Forestay cable 2 -> Inner tension ring (u=1.0)
      const [ix, iz] = superEllipsePoint(angle, ROOF_SPECS.oculusRadiusX, ROOF_SPECS.oculusRadiusZ);
      const { yTop: yTip } = getTrussNodeHeights(1.0);
      addSeg(cList, pTip, new THREE.Vector3(ix, yTip, iz));

      // Backstay tie-down cable -> Concrete Anchor Block on Podium perimeter (r=196m, y=10.5m)
      const [ax, az] = superEllipsePoint(angle, 196, 170);
      const pAnchor = new THREE.Vector3(ax, 10.5, az);
      addSeg(cList, pTip, pAnchor);
      aList.push({ pos: [ax, 9.0, az], rotY: -angle });
    }

    return { pylons: pList, cables: cList, anchors: aList };
  }, [startAngle, endAngle]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (steelRef.current) {
      pylons.forEach((p, idx) => {
        dummy.position.set(...p.pos);
        dummy.quaternion.copy(p.quat);
        dummy.scale.set(0.65, p.len, 0.65);
        dummy.updateMatrix();
        steelRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      steelRef.current.count = pylons.length;
      steelRef.current.instanceMatrix.needsUpdate = true;
    }

    if (cableRef.current) {
      cables.forEach((c, idx) => {
        dummy.position.set(...c.pos);
        dummy.quaternion.copy(c.quat);
        dummy.scale.set(0.14, c.len, 0.14);
        dummy.updateMatrix();
        cableRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      cableRef.current.count = cables.length;
      cableRef.current.instanceMatrix.needsUpdate = true;
    }

    if (anchorRef.current) {
      anchors.forEach((a, idx) => {
        dummy.position.set(...a.pos);
        dummy.rotation.set(0, a.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        anchorRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      anchorRef.current.count = anchors.length;
      anchorRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pylons, cables, anchors]);

  return (
    <group name="cable-stayed-pylon-system">
      <instancedMesh ref={steelRef} args={[undefined, undefined, 32]} castShadow>
        <cylinderGeometry args={[0.7, 1.15, 1, 8]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={cableRef} args={[undefined, undefined, 96]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={anchorRef} args={[undefined, undefined, 32]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 5.0, 4.5]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

/**
 * Twin Monumental 390m-Span Triangulated Steel Space Arches (Wembley/My Dinh style)
 * arching from East & West ground thrust abutments up to y=124m with vertical hanger cables
 * carrying the central oculus tension ring.
 */
function TwinMegaArches() {
  const trussRef = useRef<THREE.InstancedMesh | null>(null);

  const members = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; quat: THREE.Quaternion; len: number; radius: number }> = [];
    const up = new THREE.Vector3(0, 1, 0);
    const segs = 32;
    const halfSpan = ROOF_SPECS.archSpanM / 2;

    const addSeg = (p1: THREE.Vector3, p2: THREE.Vector3, radius: number) => {
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      if (len < 0.05) {
        return;
      }
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      list.push({ pos: [mid.x, mid.y, mid.z], quat, len, radius });
    };

    const archOffsets = [-22, 22];
    const archTopPts: THREE.Vector3[][] = [[], []];
    const archBotPts: THREE.Vector3[][] = [[], []];

    archOffsets.forEach((zOff, aIdx) => {
      for (let i = 0; i <= segs; i += 1) {
        const u = i / segs;
        const x = THREE.MathUtils.lerp(-halfSpan, halfSpan, u);
        const normX = (u - 0.5) * 2;
        const yBot = (1 - normX * normX) * (ROOF_SPECS.archPeakHeightM - 4.5);
        const yTop = (1 - normX * normX) * ROOF_SPECS.archPeakHeightM;
        archBotPts[aIdx].push(new THREE.Vector3(x, Math.max(0, yBot), zOff));
        archTopPts[aIdx].push(new THREE.Vector3(x, Math.max(0.5, yTop), zOff));
      }

      for (let i = 0; i < segs; i += 1) {
        addSeg(archBotPts[aIdx][i], archBotPts[aIdx][i + 1], 0.75);
        addSeg(archTopPts[aIdx][i], archTopPts[aIdx][i + 1], 0.75);
        addSeg(archBotPts[aIdx][i], archTopPts[aIdx][i + 1], 0.42);
        addSeg(archBotPts[aIdx][i], archTopPts[aIdx][i], 0.42);
      }
    });

    // Lateral cross-trusses tying the Twin Mega-Arches together
    for (let i = 2; i < segs - 1; i += 2) {
      addSeg(archTopPts[0][i], archTopPts[1][i], 0.45);
      addSeg(archBotPts[0][i], archBotPts[1][i], 0.45);
      addSeg(archTopPts[0][i], archTopPts[1][i + 1], 0.25);
    }

    // Vertical Tension Hanger Cables suspending the Oculus Tension Ring from the Mega-Arches
    for (let i = 10; i <= 22; i += 2) {
      archOffsets.forEach((zOff, aIdx) => {
        const pArch = archBotPts[aIdx][i];
        if (pArch.y > 76) {
          addSeg(pArch, new THREE.Vector3(pArch.x, 75.2, zOff * 1.4), 0.16);
        }
      });
    }

    return list;
  }, []);

  useEffect(() => {
    const mesh = trussRef.current;
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
    <group name="twin-mega-arches">
      <instancedMesh ref={trussRef} args={[undefined, undefined, 450]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.22} />
      </instancedMesh>

      {/* Massive Concrete Thrust Abutment Blocks anchoring East & West Arch Bases at y=0 */}
      {[-ROOF_SPECS.archSpanM / 2, ROOF_SPECS.archSpanM / 2].map((ax) =>
        [-22, 22].map((az) => (
          <mesh key={`${ax}-${az}`} position={[ax, 3.0, az]} castShadow receiveShadow>
            <boxGeometry args={[14, 7.0, 10]} />
            <meshStandardMaterial color="#475569" roughness={0.85} />
          </mesh>
        ))
      )}
    </group>
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
      const y = 73.2 + domeArch;
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
      {[-45, 45].map((zTrack) => (
        <mesh key={zTrack} position={[0, 72.8, zTrack]}>
          <boxGeometry args={[216, 0.7, 0.9]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.25} />
        </mesh>
      ))}

      <mesh
        geometry={leftDomeGeo}
        position={[-slideOffset, -0.35 * (roofOpenPercent / 100), 0]}
        castShadow={!xrayRoof}
      >
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={xrayRoof ? 0.14 : 0.56}
          wireframe={xrayRoof}
          roughness={0.22}
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
          opacity={xrayRoof ? 0.14 : 0.56}
          wireframe={xrayRoof}
          roughness={0.22}
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

  const curtainTex = useMemo(() => createCurtainWallTexture(isNight), [isNight]);
  const curtainGeo = useMemo(() => createCurtainWallGeometry(startAngle, endAngle), [startAngle, endAngle]);
  const canopyGeo = useMemo(() => createRoofCanopyGeometry(startAngle, endAngle), [startAngle, endAngle]);

  const louverRings = useMemo(
    () =>
      [15, 22, 30, 38, 46, 54, 62].map((elev) =>
        createSuperEllipseRingTube(
          ROOF_SPECS.supportRadiusX + 1.8,
          ROOF_SPECS.supportRadiusZ + 1.8,
          elev,
          0.32,
          startAngle,
          endAngle
        )
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
      items.push({ pos: [x, 72.0, z], angle });
    }
    return items;
  }, [startAngle, endAngle]);

  return (
    <group name="buildable-roof-and-facade">
      {/* 48 Tapered Double-Chord Cantilever Steel Space Trusses */}
      <TriangulatedSpaceTrussRoof startAngle={startAngle} endAngle={endAngle} />

      {/* 24 Cable-Stayed Pylon Masts + Forestay & Backstay Anchor System */}
      <CableStayedPylonSystem startAngle={startAngle} endAngle={endAngle} />

      {/* Twin 390m-Span Steel Mega-Arches (y=124m) */}
      <TwinMegaArches />

      {/* Glazed Exterior Curtain Wall & Aluminum Louvers */}
      {!bimFrameMode && (
        <>
          <mesh geometry={curtainGeo} receiveShadow>
            <meshStandardMaterial
              map={curtainTex}
              emissive="#ffffff"
              emissiveMap={curtainTex}
              emissiveIntensity={isNight ? 0.75 : 0.18}
              metalness={0.62}
              roughness={0.28}
              transparent={xrayRoof}
              opacity={xrayRoof ? 0.25 : 1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {louverRings.map((ringGeo, idx) => (
            <mesh key={`louver-${idx}`} geometry={ringGeo}>
              <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.28} />
            </mesh>
          ))}
        </>
      )}

      {/* Tensile PTFE Roof Membrane resting atop Truss Top Chords */}
      {!bimFrameMode && (
        <mesh geometry={canopyGeo} castShadow={!xrayRoof} receiveShadow>
          <meshPhysicalMaterial
            color={xrayRoof ? '#38bdf8' : '#f8fafc'}
            transparent
            opacity={xrayRoof ? 0.15 : 0.88}
            wireframe={xrayRoof}
            roughness={0.38}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Retractable Inner Oculus Dome */}
      {!halfCutaway && !bimFrameMode && (
        <RetractableOculusPanels roofOpenPercent={roofOpenPercent} xrayRoof={xrayRoof} />
      )}

      {!bimFrameMode &&
        floodlightPositions.map(({ pos, angle }, idx) => (
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
