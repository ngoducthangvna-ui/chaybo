import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FLOOR_ELEVATION_Y,
  type CorridorSegmentSpec,
  type FloorLevelId,
  type FurnitureItem,
  STADIUM_INTERIOR_ROOMS,
  type StadiumRoomSpec,
  VERTICAL_CORES,
  type VerticalCoreSpec,
  type Walkthrough3DCameraMode,
  getCorridorsByFloor,
  getRoomNpcPoses,
  isDoorwayOpen,
} from '../config/interiorRooms';

interface InteriorRooms3DProps {
  activeFloor: FloorLevelId;
  walkthrough3dActive: boolean;
  cameraMode: Walkthrough3DCameraMode;
  avatarX: number;
  avatarY: number;
  avatarHeading: number;
  avatarSpeed: number;
  activeRoomId: string | null;
}

const CATEGORY_ACCENT: Record<StadiumRoomSpec['category'], string> = {
  sports: '#e11d48',
  vip: '#c5a059',
  media: '#38bdf8',
  public: '#10b981',
  mep: '#f59e0b',
  medical: '#f43f5e',
};

function FurnitureItem3D({ item }: { item: FurnitureItem }) {
  const cx = item.x + item.w * 0.5;
  const cz = item.y + item.h * 0.5;

  if (item.kind === 'pool') {
    return (
      <group position={[cx, 0, cz]}>
        {/* Basalt Coping Pool Tub */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 0.84, item.h]} />
          <meshStandardMaterial color="#27272a" roughness={0.58} metalness={0.25} />
        </mesh>
        {/* Glowing Thermal Water Surface */}
        <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(0.4, item.w - 0.5), Math.max(0.4, item.h - 0.5)]} />
          <meshPhysicalMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={0.42}
            roughness={0.08}
            metalness={0.35}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Entry Coping Steps */}
        <mesh position={[-item.w * 0.5 - 0.28, 0.2, 0]} castShadow>
          <boxGeometry args={[0.56, 0.4, Math.min(2.2, item.h * 0.45)]} />
          <meshStandardMaterial color="#44403c" roughness={0.65} />
        </mesh>
        {/* Chrome Twin Entry Handrails */}
        {[-0.45, 0.45].map((rz) => (
          <group key={rz} position={[-item.w * 0.5 + 0.3, 0, rz]}>
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[1.35, 0.06, 0.06]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
            </mesh>
            <mesh position={[-0.6, 0.78, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.72, 6]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.16} />
            </mesh>
          </group>
        ))}
        {/* Digital Pool Temp Gauge Post */}
        <mesh position={[item.w * 0.5 - 0.2, 1.15, -item.h * 0.5 + 0.2]}>
          <boxGeometry args={[0.28, 0.7, 0.14]} />
          <meshStandardMaterial color="#0f172a" emissive={item.color} emissiveIntensity={0.55} />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'locker') {
    const isHorizontal = item.w >= item.h;
    const count = Math.max(4, Math.min(12, Math.floor(Math.max(item.w, item.h) / 1.85)));
    return (
      <group position={[cx, 0, cz]}>
        {/* Locker Structural Housing & Top Pelmet */}
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 2.2, item.h]} />
          <meshStandardMaterial color="#1f2937" roughness={0.68} />
        </mesh>
        {/* Warm Timber Bench Ledge */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[item.w + 0.42, 0.14, item.h + 0.42]} />
          <meshStandardMaterial color="#d6b47a" roughness={0.48} />
        </mesh>
        {/* Individual Player Cubbies + Hanging Match Jerseys */}
        {Array.from({ length: count }).map((_, idx) => {
          const offset = ((idx + 0.5) / count - 0.5) * (isHorizontal ? item.w - 0.6 : item.h - 0.6);
          return (
            <group key={idx} position={[isHorizontal ? offset : 0, 1.38, isHorizontal ? 0 : offset]}>
              <mesh>
                <boxGeometry
                  args={[
                    isHorizontal ? (item.w / count) * 0.78 : item.w + 0.08,
                    1.15,
                    isHorizontal ? item.h + 0.08 : (item.h / count) * 0.78,
                  ]}
                />
                <meshStandardMaterial color="#0f172a" roughness={0.62} />
              </mesh>
              <mesh position={[0, -0.04, 0]}>
                <boxGeometry
                  args={[
                    isHorizontal ? (item.w / count) * 0.48 : item.w + 0.16,
                    0.76,
                    isHorizontal ? item.h + 0.16 : (item.h / count) * 0.48,
                  ]}
                />
                <meshStandardMaterial
                  color={item.color}
                  emissive={item.color}
                  emissiveIntensity={0.24}
                  roughness={0.48}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (item.kind === 'table') {
    const chairCount = Math.max(2, Math.min(8, Math.floor(Math.max(item.w, item.h) / 2.5)));
    const alongX = item.w >= item.h;
    return (
      <group position={[cx, 0, cz]}>
        {/* Pedestal Base & Chamfered Table */}
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[item.w * 0.62, 0.72, item.h * 0.62]} />
          <meshStandardMaterial color="#1f2937" roughness={0.58} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 0.14, item.h]} />
          <meshStandardMaterial color={item.color} metalness={0.32} roughness={0.32} />
        </mesh>
        {/* Center Tactical Display / Banquet Runner */}
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[item.w * 0.68, 0.05, item.h * 0.52]} />
          <meshStandardMaterial
            color="#065f46"
            emissive="#10b981"
            emissiveIntensity={0.35}
            roughness={0.22}
          />
        </mesh>
        {/* Ergonomic Chairs with High Backrests Facing Table */}
        {Array.from({ length: chairCount }).map((_, idx) => {
          const offset = ((idx + 0.5) / chairCount - 0.5) * (alongX ? item.w * 0.84 : item.h * 0.84);
          return [-1, 1].map((side) => (
            <group
              key={`${idx}-${side}`}
              position={[
                alongX ? offset : side * (item.w * 0.5 + 0.52),
                0,
                alongX ? side * (item.h * 0.5 + 0.52) : offset,
              ]}
            >
              <mesh position={[0, 0.44, 0]} castShadow>
                <boxGeometry args={[0.56, 0.1, 0.56]} />
                <meshStandardMaterial color="#334155" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.42, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
              </mesh>
              <mesh
                position={[
                  alongX ? 0 : side * 0.24,
                  0.78,
                  alongX ? side * 0.24 : 0,
                ]}
                castShadow
              >
                <boxGeometry args={[alongX ? 0.56 : 0.1, 0.62, alongX ? 0.1 : 0.56]} />
                <meshStandardMaterial color="#1e293b" roughness={0.45} />
              </mesh>
            </group>
          ));
        })}
      </group>
    );
  }

  if (item.kind === 'screen') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 1.38, 0]} castShadow>
          <boxGeometry args={[item.w, 2.55, item.h]} />
          <meshStandardMaterial color="#090d16" metalness={0.78} roughness={0.25} />
        </mesh>
        <mesh position={[0, 1.48, 0]}>
          <boxGeometry args={[item.w + 0.12, 1.98, item.h + 0.12]} />
          <meshStandardMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={0.68}
            roughness={0.18}
          />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'bed') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[item.w * 0.86, 0.22, item.h * 0.86]} />
          <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w * 0.82, 0.26, item.h * 0.82]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.64, 0]}>
          <boxGeometry args={[item.w * 0.78, 0.1, item.h * 0.78]} />
          <meshStandardMaterial color={item.color} roughness={0.55} />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'machinery') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 2.4, item.h]} />
          <meshStandardMaterial color="#334155" metalness={0.82} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[item.w + 0.08, 0.5, item.h * 0.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.44, 0]}>
          <boxGeometry args={[item.w * 0.9, 0.16, item.h * 0.9]} />
          <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'turnstile') {
    const alongX = item.w >= item.h;
    const gates = Math.max(3, Math.min(10, Math.floor(Math.max(item.w, item.h) / 2.2)));
    return (
      <group position={[cx, 0, cz]}>
        {Array.from({ length: gates }).map((_, idx) => {
          const off = ((idx + 0.5) / gates - 0.5) * (alongX ? item.w : item.h);
          return (
            <group key={idx} position={[alongX ? off : 0, 0, alongX ? 0 : off]}>
              <mesh position={[0, 0.54, 0]} castShadow>
                <boxGeometry
                  args={[alongX ? 0.38 : item.w * 0.85, 1.08, alongX ? item.h * 0.85 : 0.38]}
                />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
              </mesh>
              <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[0.35, 0.08, 0.35]} />
                <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.65} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (item.kind === 'bar') {
    const isTunnelCarpet = item.label.includes('Thảm Đỏ');
    if (isTunnelCarpet) {
      return (
        <group position={[cx, 0, cz]}>
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <boxGeometry args={[item.w, 0.08, item.h]} />
            <meshStandardMaterial color="#9f1239" roughness={0.78} />
          </mesh>
          {/* Edge Gold Cleat Runner Trim */}
          {[-item.h * 0.48, item.h * 0.48].map((tz, i) => (
            <mesh key={i} position={[0, 0.06, tz]}>
              <boxGeometry args={[item.w, 0.05, 0.25]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.22} />
            </mesh>
          ))}
          {[-14, -7, 0, 7, 14].map((ax) => (
            <group key={ax} position={[ax, 0, 0]}>
              <mesh position={[0, 1.85, -item.h * 0.65]} castShadow>
                <boxGeometry args={[0.45, 3.7, 0.45]} />
                <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, 1.85, item.h * 0.65]} castShadow>
                <boxGeometry args={[0.45, 3.7, 0.45]} />
                <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, 3.7, 0]}>
                <boxGeometry args={[0.5, 0.35, item.h * 1.3 + 0.45]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#f59e0b"
                  emissiveIntensity={0.35}
                  metalness={0.85}
                />
              </mesh>
            </group>
          ))}
        </group>
      );
    }

    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 1.04, item.h]} />
          <meshStandardMaterial color="#1c1917" roughness={0.62} />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow>
          <boxGeometry args={[item.w + 0.45, 0.14, item.h + 0.45]} />
          <meshStandardMaterial color={item.color} metalness={0.5} roughness={0.22} />
        </mesh>
      </group>
    );
  }

  // 'seat': VIP / Press Seating Block Rows
  const rows = Math.max(1, Math.min(4, Math.floor(item.h / 1.8)));
  const cols = Math.max(3, Math.min(12, Math.floor(item.w / 1.9)));
  return (
    <group position={[cx, 0, cz]}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const sx = ((c + 0.5) / cols - 0.5) * (item.w - 0.6);
          const sz = ((r + 0.5) / rows - 0.5) * (item.h - 0.6);
          return (
            <group key={`${r}-${c}`} position={[sx, 0, sz]}>
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[0.85, 0.36, 0.78]} />
                <meshStandardMaterial color={item.color} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.64, -0.3]} castShadow>
                <boxGeometry args={[0.85, 0.58, 0.18]} />
                <meshStandardMaterial color={item.color} roughness={0.45} />
              </mesh>
            </group>
          );
        })
      )}
    </group>
  );
}

function FloorCorridors3D({
  corridors,
  elevationY,
  cameraMode,
}: {
  corridors: readonly CorridorSegmentSpec[];
  elevationY: number;
  cameraMode: Walkthrough3DCameraMode;
}) {
  const showOverhead = cameraMode !== 'cutaway3d';
  return (
    <group name="floor-corridors-3d" position={[0, elevationY, 0]}>
      {corridors.map((c) => {
        const cx = c.x + c.w * 0.5;
        const cz = c.y + c.h * 0.5;
        const alongX = c.w >= c.h;
        return (
          <group key={c.id} position={[cx, 0, cz]}>
            {/* Honed Basalt Corridor Floor Plate */}
            <mesh position={[0, -0.06, 0]} receiveShadow>
              <boxGeometry args={[c.w, 0.1, c.h]} />
              <meshStandardMaterial color="#0f172a" roughness={0.62} metalness={0.22} />
            </mesh>
            {/* Central Wayfinding Guidance Line */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[alongX ? c.w - 0.4 : 0.24, 0.02, alongX ? 0.24 : c.h - 0.4]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.42} />
            </mesh>
            {/* Low Architectural Curbs */}
            {alongX ? (
              <>
                <mesh position={[0, 0.18, -c.h * 0.5]}>
                  <boxGeometry args={[c.w, 0.36, 0.16]} />
                  <meshStandardMaterial color="#475569" roughness={0.55} />
                </mesh>
                <mesh position={[0, 0.18, c.h * 0.5]}>
                  <boxGeometry args={[c.w, 0.36, 0.16]} />
                  <meshStandardMaterial color="#475569" roughness={0.55} />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[-c.w * 0.5, 0.18, 0]}>
                  <boxGeometry args={[0.16, 0.36, c.h]} />
                  <meshStandardMaterial color="#475569" roughness={0.55} />
                </mesh>
                <mesh position={[c.w * 0.5, 0.18, 0]}>
                  <boxGeometry args={[0.16, 0.36, c.h]} />
                  <meshStandardMaterial color="#475569" roughness={0.55} />
                </mesh>
              </>
            )}
            {/* Suspended Linear LED Corridor Fixture */}
            {showOverhead && (
              <mesh position={[0, 3.35, 0]}>
                <boxGeometry args={[alongX ? c.w * 0.72 : 0.3, 0.08, alongX ? 0.3 : c.h * 0.72]} />
                <meshStandardMaterial color="#f8fafc" emissive="#bae6fd" emissiveIntensity={0.95} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function VerticalCores3D({
  cores,
  elevationY,
}: {
  cores: readonly VerticalCoreSpec[];
  elevationY: number;
}) {
  return (
    <group name="vertical-elevator-cores-3d" position={[0, elevationY, 0]}>
      {cores.map((core) => (
        <group key={core.id} position={[core.x, 0, core.y]}>
          {/* Terrazzo Elevator Lobby Platform */}
          <mesh position={[0, -0.04, 0]} receiveShadow>
            <boxGeometry args={[core.w, 0.12, core.h]} />
            <meshStandardMaterial color="#1e293b" roughness={0.48} metalness={0.3} />
          </mesh>
          {/* Champagne Safety Perimeter Frame Posts */}
          {[
            [-core.w * 0.45, -core.h * 0.45],
            [core.w * 0.45, -core.h * 0.45],
            [-core.w * 0.45, core.h * 0.45],
            [core.w * 0.45, core.h * 0.45],
          ].map(([px, pz], idx) => (
            <mesh key={idx} position={[px, 1.8, pz]} castShadow>
              <boxGeometry args={[0.28, 3.6, 0.28]} />
              <meshStandardMaterial color="#c5a059" metalness={0.86} roughness={0.22} />
            </mesh>
          ))}
          {/* Glass Lift Shaft & Brushed Stainless Elevator Doors */}
          <mesh position={[0, 1.85, -1.6]}>
            <boxGeometry args={[3.4, 3.4, 2.8]} />
            <meshPhysicalMaterial
              color="#7dd3fc"
              transparent
              opacity={0.26}
              metalness={0.65}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 1.35, -0.15]}>
            <boxGeometry args={[2.2, 2.5, 0.12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
          </mesh>
          {/* Glowing Amber Elevator Overhead Header */}
          <mesh position={[0, 2.85, -0.1]}>
            <boxGeometry args={[2.8, 0.35, 0.24]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.75} />
          </mesh>
          {/* Emergency Egress Stairwell Steps */}
          {[0, 1, 2, 3, 4].map((s) => (
            <mesh key={s} position={[2.3, 0.25 + s * 0.38, -2.0 + s * 0.72]} castShadow>
              <boxGeometry args={[1.6, 0.22, 0.68]} />
              <meshStandardMaterial color="#64748b" roughness={0.72} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function RoomPerimeter3D({
  room,
  isActiveFloor,
  isFocusedRoom,
  doorOpen,
  cameraMode,
}: {
  room: StadiumRoomSpec;
  isActiveFloor: boolean;
  isFocusedRoom: boolean;
  doorOpen: boolean;
  cameraMode: Walkthrough3DCameraMode;
}) {
  const { x, y: z, w, h } = room.bounds;
  const cx = x + w * 0.5;
  const cz = z + h * 0.5;
  const showCeiling = isActiveFloor && cameraMode !== 'cutaway3d';
  const wallH = showCeiling ? Math.min(room.ceilingHeightM, 3.65) : 2.65;
  const t = 0.34;
  const accent = CATEGORY_ACCENT[room.category];
  const slideRefL = useRef<THREE.Mesh | null>(null);
  const slideRefR = useRef<THREE.Mesh | null>(null);

  useFrame((_, delta) => {
    const target = doorOpen ? room.door.width * 0.45 : room.door.width * 0.25;
    const step = Math.min(1, delta * 8);
    if (slideRefL.current) {
      if (room.door.orientation === 'h') {
        slideRefL.current.position.x = THREE.MathUtils.lerp(slideRefL.current.position.x, -target, step);
      } else {
        slideRefL.current.position.z = THREE.MathUtils.lerp(slideRefL.current.position.z, -target, step);
      }
    }
    if (slideRefR.current) {
      if (room.door.orientation === 'h') {
        slideRefR.current.position.x = THREE.MathUtils.lerp(slideRefR.current.position.x, target, step);
      } else {
        slideRefR.current.position.z = THREE.MathUtils.lerp(slideRefR.current.position.z, target, step);
      }
    }
  });

  const doorOnNorth = room.door.orientation === 'h' && Math.abs(room.door.y - z) < 1.5;
  const doorOnSouth = room.door.orientation === 'h' && Math.abs(room.door.y - (z + h)) < 1.5;
  const doorOnWest = room.door.orientation === 'v' && Math.abs(room.door.x - x) < 1.5;
  const doorOnEast = room.door.orientation === 'v' && Math.abs(room.door.x - (x + w)) < 1.5;

  const renderPanoramicWindowSegment = (
    posX: number,
    posZ: number,
    spanLen: number,
    horizontal: boolean
  ) => {
    const mullionCount = Math.max(2, Math.floor(spanLen / 4.2));
    return (
      <group position={[posX, 0, posZ]}>
        {/* Lower Granite Sill Curb */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[horizontal ? spanLen : t, 0.44, horizontal ? t : spanLen]} />
          <meshStandardMaterial color="#1e293b" roughness={0.55} />
        </mesh>
        {/* Top Transom Beam */}
        <mesh position={[0, wallH - 0.14, 0]}>
          <boxGeometry args={[horizontal ? spanLen : t, 0.28, horizontal ? t : spanLen]} />
          <meshStandardMaterial color="#c5a059" metalness={0.84} roughness={0.25} />
        </mesh>
        {/* Crystal-Clear Bulletproof Curtain Glass */}
        <mesh position={[0, (wallH + 0.3) * 0.5, 0]}>
          <boxGeometry args={[horizontal ? spanLen : 0.08, wallH - 0.72, horizontal ? 0.08 : spanLen]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.14}
            metalness={0.5}
            roughness={0.08}
          />
        </mesh>
        {/* Champagne Aluminum Curtain Wall Mullions */}
        {Array.from({ length: mullionCount + 1 }).map((_, idx) => {
          const off = (idx / mullionCount - 0.5) * spanLen;
          return (
            <mesh key={idx} position={[horizontal ? off : 0, wallH * 0.5, horizontal ? 0 : off]}>
              <boxGeometry args={[0.16, wallH, 0.16]} />
              <meshStandardMaterial color="#b89768" metalness={0.85} roughness={0.24} />
            </mesh>
          );
        })}
      </group>
    );
  };

  const renderHorizontalSide = (wz: number, hasDoor: boolean, isWindow: boolean) => {
    if (!hasDoor) {
      return isWindow ? (
        renderPanoramicWindowSegment(cx, wz, w, true)
      ) : (
        <mesh position={[cx, wallH * 0.5, wz]} castShadow receiveShadow>
          <boxGeometry args={[w, wallH, t]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
      );
    }
    const leftLen = Math.max(0.5, room.door.x - room.door.width * 0.5 - x);
    const rightLen = Math.max(0.5, x + w - (room.door.x + room.door.width * 0.5));
    return (
      <>
        {isWindow ? (
          renderPanoramicWindowSegment(x + leftLen * 0.5, wz, leftLen, true)
        ) : (
          <mesh position={[x + leftLen * 0.5, wallH * 0.5, wz]} castShadow receiveShadow>
            <boxGeometry args={[leftLen, wallH, t]} />
            <meshStandardMaterial color="#334155" roughness={0.68} />
          </mesh>
        )}
        {isWindow ? (
          renderPanoramicWindowSegment(x + w - rightLen * 0.5, wz, rightLen, true)
        ) : (
          <mesh position={[x + w - rightLen * 0.5, wallH * 0.5, wz]} castShadow receiveShadow>
            <boxGeometry args={[rightLen, wallH, t]} />
            <meshStandardMaterial color="#334155" roughness={0.68} />
          </mesh>
        )}
      </>
    );
  };

  const renderVerticalSide = (wx: number, hasDoor: boolean, isWindow: boolean, portalOpen = false) => {
    if (portalOpen) {
      return (
        <group name="east-pitch-portal-arch" position={[wx, 0, cz]}>
          {[-h * 0.44, h * 0.44].map((pz, idx) => (
            <mesh key={idx} position={[0, wallH * 0.5, pz]} castShadow>
              <boxGeometry args={[0.7, wallH, 0.7]} />
              <meshStandardMaterial color="#c5a059" metalness={0.86} roughness={0.22} />
            </mesh>
          ))}
          <mesh position={[0, wallH - 0.25, 0]} castShadow>
            <boxGeometry args={[0.75, 0.55, h * 0.92]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.45} metalness={0.85} />
          </mesh>
        </group>
      );
    }

    if (!hasDoor) {
      return isWindow ? (
        renderPanoramicWindowSegment(wx, cz, h, false)
      ) : (
        <mesh position={[wx, wallH * 0.5, cz]} castShadow receiveShadow>
          <boxGeometry args={[t, wallH, h]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
      );
    }
    const topLen = Math.max(0.5, room.door.y - room.door.width * 0.5 - z);
    const botLen = Math.max(0.5, z + h - (room.door.y + room.door.width * 0.5));
    return (
      <>
        {isWindow ? (
          renderPanoramicWindowSegment(wx, z + topLen * 0.5, topLen, false)
        ) : (
          <mesh position={[wx, wallH * 0.5, z + topLen * 0.5]} castShadow receiveShadow>
            <boxGeometry args={[t, wallH, topLen]} />
            <meshStandardMaterial color="#334155" roughness={0.68} />
          </mesh>
        )}
        {isWindow ? (
          renderPanoramicWindowSegment(wx, z + h - botLen * 0.5, botLen, false)
        ) : (
          <mesh position={[wx, wallH * 0.5, z + h - botLen * 0.5]} castShadow receiveShadow>
            <boxGeometry args={[t, wallH, botLen]} />
            <meshStandardMaterial color="#334155" roughness={0.68} />
          </mesh>
        )}
      </>
    );
  };

  return (
    <group position={[0, FLOOR_ELEVATION_Y[room.floor], 0]}>
      {/* Finished Architectural Interior Floor Slab */}
      <mesh position={[cx, -0.05, cz]} receiveShadow>
        <boxGeometry args={[w, 0.12, h]} />
        <meshStandardMaterial
          color={room.category === 'vip' ? '#1c1917' : room.category === 'sports' ? '#172536' : '#111827'}
          roughness={0.5}
          metalness={0.22}
        />
      </mesh>
      {/* 4 Perimeter LED Accent Baseboard Strips */}
      {[
        [cx, z],
        [cx, z + h],
      ].map(([bx, bz], i) => (
        <mesh key={`bh-${i}`} position={[bx, 0.04, bz]}>
          <boxGeometry args={[w + 0.2, 0.06, 0.22]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={isFocusedRoom ? 0.58 : 0.16} />
        </mesh>
      ))}
      {[
        [x, cz],
        [x + w, cz],
      ].map(([bx, bz], i) => (
        <mesh key={`bv-${i}`} position={[bx, 0.04, bz]}>
          <boxGeometry args={[0.22, 0.06, h + 0.2]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={isFocusedRoom ? 0.58 : 0.16} />
        </mesh>
      ))}

      {/* Perimeter Walls & Panoramic Curtain Glass Facing Pitch */}
      {renderHorizontalSide(z, doorOnNorth, room.pitchWindowSide === 'north')}
      {renderHorizontalSide(z + h, doorOnSouth, room.pitchWindowSide === 'south')}
      {renderVerticalSide(x, doorOnWest, room.pitchWindowSide === 'west', false)}
      {renderVerticalSide(x + w, doorOnEast, room.pitchWindowSide === 'east', Boolean(room.eastPortalOpen))}

      {/* Animated Proximity Sliding Glass Door Leaves + Illuminated EXIT Sign */}
      <group position={[room.door.x, wallH * 0.45, room.door.y]}>
        <mesh ref={slideRefL}>
          <boxGeometry
            args={[
              room.door.orientation === 'h' ? room.door.width * 0.48 : 0.12,
              wallH * 0.84,
              room.door.orientation === 'h' ? 0.12 : room.door.width * 0.48,
            ]}
          />
          <meshPhysicalMaterial
            color="#bae6fd"
            emissive={doorOpen ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.25}
            transparent
            opacity={0.52}
            metalness={0.6}
            roughness={0.1}
          />
        </mesh>
        <mesh ref={slideRefR}>
          <boxGeometry
            args={[
              room.door.orientation === 'h' ? room.door.width * 0.48 : 0.12,
              wallH * 0.84,
              room.door.orientation === 'h' ? 0.12 : room.door.width * 0.48,
            ]}
          />
          <meshPhysicalMaterial
            color="#bae6fd"
            emissive={doorOpen ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.25}
            transparent
            opacity={0.52}
            metalness={0.6}
            roughness={0.1}
          />
        </mesh>
        {/* Illuminated Green EXIT Sign Above Doorway */}
        <mesh position={[0, wallH * 0.46, 0]}>
          <boxGeometry
            args={[
              room.door.orientation === 'h' ? 1.15 : 0.18,
              0.32,
              room.door.orientation === 'h' ? 0.18 : 1.15,
            ]}
          />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.95} />
        </mesh>
      </group>

      {/* Architectural Acoustic Ceiling Slab & Linear LED Troffers (FPS / Follow 3D Modes) */}
      {showCeiling && (
        <group name="room-ceiling-system">
          <mesh position={[cx, wallH + 0.08, cz]}>
            <boxGeometry args={[w, 0.16, h]} />
            <meshStandardMaterial color="#0b0f17" roughness={0.78} />
          </mesh>
          {[-0.25, 0.25].map((fracZ, idx) => (
            <mesh key={idx} position={[cx, wallH - 0.03, cz + h * fracZ]}>
              <boxGeometry args={[w * 0.72, 0.06, 0.38]} />
              <meshStandardMaterial color="#fef3c7" emissive="#fffbeb" emissiveIntensity={0.92} />
            </mesh>
          ))}
        </group>
      )}

      {/* Active Floor Furniture & Interior Lighting */}
      {isActiveFloor && (
        <>
          {room.furniture.map((item, idx) => (
            <FurnitureItem3D key={idx} item={item} />
          ))}
          {isFocusedRoom && (
            <pointLight position={[cx, Math.min(wallH - 0.3, 3.4), cz]} color="#fff7ed" intensity={160} distance={46} decay={1.6} />
          )}
        </>
      )}
    </group>
  );
}

/**
 * Renders all 16 stadium interior rooms, floor corridors, 4 vertical elevator cores,
 * panoramic pitch curtain glass, obstacle-free role-colored NPCs, and the Engineer Avatar.
 */
export function InteriorRooms3D({
  activeFloor,
  walkthrough3dActive,
  cameraMode,
  avatarX,
  avatarY,
  avatarHeading,
  avatarSpeed,
  activeRoomId,
}: InteriorRooms3DProps) {
  const npcTorsoRef = useRef<THREE.InstancedMesh | null>(null);
  const npcHeadRef = useRef<THREE.InstancedMesh | null>(null);
  const npcLeftLegRef = useRef<THREE.InstancedMesh | null>(null);
  const npcRightLegRef = useRef<THREE.InstancedMesh | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Mesh | null>(null);
  const rightArmRef = useRef<THREE.Mesh | null>(null);

  const floorRooms = useMemo(
    () => STADIUM_INTERIOR_ROOMS.filter((r) => r.floor === activeFloor),
    [activeFloor]
  );
  const floorCorridors = useMemo(() => getCorridorsByFloor(activeFloor), [activeFloor]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);
  const activeBaseY = FLOOR_ELEVATION_Y[activeFloor];

  // Apply per-category outfit colors whenever activeFloor changes
  useEffect(() => {
    if (!npcTorsoRef.current) return;
    let idx = 0;
    floorRooms.forEach((room) => {
      const poses = getRoomNpcPoses(room, 0);
      poses.forEach((pose) => {
        colorObj.set(pose.roleShirtHex);
        npcTorsoRef.current!.setColorAt(idx, colorObj);
        idx += 1;
      });
    });
    if (npcTorsoRef.current.instanceColor) {
      npcTorsoRef.current.instanceColor.needsUpdate = true;
    }
  }, [floorRooms, colorObj]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (walkthrough3dActive && avatarGroupRef.current) {
      const stride = avatarSpeed > 0.1 ? Math.sin(t * 10) * 0.55 : 0;
      const bob = avatarSpeed > 0.1 ? Math.abs(Math.sin(t * 10)) * 0.08 : 0;
      avatarGroupRef.current.position.set(avatarX, activeBaseY + bob, avatarY);
      avatarGroupRef.current.rotation.set(0, Math.PI / 2 - avatarHeading, 0);

      if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.8;
    }

    if (npcTorsoRef.current && npcHeadRef.current && npcLeftLegRef.current && npcRightLegRef.current) {
      let idx = 0;
      floorRooms.forEach((room) => {
        const poses = getRoomNpcPoses(room, t);
        poses.forEach((pose, k) => {
          const swing = pose.walking ? Math.sin(t * 5.2 + k) * 0.35 : 0;
          dummy.scale.set(1, 1, 1);

          dummy.rotation.set(0, Math.PI / 2 - pose.heading, 0);
          dummy.position.set(pose.x, activeBaseY + 1.08, pose.z);
          dummy.updateMatrix();
          npcTorsoRef.current!.setMatrixAt(idx, dummy.matrix);

          dummy.position.set(pose.x, activeBaseY + 1.66, pose.z);
          dummy.updateMatrix();
          npcHeadRef.current!.setMatrixAt(idx, dummy.matrix);

          dummy.rotation.set(swing, Math.PI / 2 - pose.heading, 0);
          dummy.position.set(pose.x - 0.12, activeBaseY + 0.38, pose.z);
          dummy.updateMatrix();
          npcLeftLegRef.current!.setMatrixAt(idx, dummy.matrix);

          dummy.rotation.set(-swing, Math.PI / 2 - pose.heading, 0);
          dummy.position.set(pose.x + 0.12, activeBaseY + 0.38, pose.z);
          dummy.updateMatrix();
          npcRightLegRef.current!.setMatrixAt(idx, dummy.matrix);

          idx += 1;
        });
      });
      npcTorsoRef.current.count = idx;
      npcHeadRef.current.count = idx;
      npcLeftLegRef.current.count = idx;
      npcRightLegRef.current.count = idx;
      npcTorsoRef.current.instanceMatrix.needsUpdate = true;
      npcHeadRef.current.instanceMatrix.needsUpdate = true;
      npcLeftLegRef.current.instanceMatrix.needsUpdate = true;
      npcRightLegRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!walkthrough3dActive) {
    return null;
  }

  return (
    <group name="interior-3d-furnished-rooms">
      {STADIUM_INTERIOR_ROOMS.map((room) => (
        <RoomPerimeter3D
          key={room.id}
          room={room}
          isActiveFloor={room.floor === activeFloor}
          isFocusedRoom={room.id === activeRoomId}
          doorOpen={room.floor === activeFloor && isDoorwayOpen(room, avatarX, avatarY)}
          cameraMode={cameraMode}
        />
      ))}

      <FloorCorridors3D
        corridors={floorCorridors}
        elevationY={activeBaseY}
        cameraMode={cameraMode}
      />

      <VerticalCores3D cores={VERTICAL_CORES} elevationY={activeBaseY} />

      {/* Obstacle-Free Articulated Interior NPCs */}
      <instancedMesh ref={npcTorsoRef} args={[undefined, undefined, 32]} castShadow>
        <boxGeometry args={[0.48, 0.72, 0.28]} />
        <meshStandardMaterial roughness={0.58} />
      </instancedMesh>
      <instancedMesh ref={npcHeadRef} args={[undefined, undefined, 32]} castShadow>
        <sphereGeometry args={[0.19, 10, 10]} />
        <meshStandardMaterial color="#f5d0a9" roughness={0.52} />
      </instancedMesh>
      <instancedMesh ref={npcLeftLegRef} args={[undefined, undefined, 32]} castShadow>
        <boxGeometry args={[0.16, 0.72, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={npcRightLegRef} args={[undefined, undefined, 32]} castShadow>
        <boxGeometry args={[0.16, 0.72, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.72} />
      </instancedMesh>

      {/* Articulated 3D Engineer Walkthrough Avatar (hidden in FPS so hat never blocks eye lens) */}
      <group
        ref={avatarGroupRef}
        position={[avatarX, activeBaseY, avatarY]}
        visible={cameraMode !== 'fps3d'}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.45, 0.68, 24]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.85} />
        </mesh>
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.56, 0.78, 0.32]} />
          <meshStandardMaterial color="#0284c7" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.72, 0]} castShadow>
          <sphereGeometry args={[0.21, 12, 12]} />
          <meshStandardMaterial color="#f5d0a9" roughness={0.52} />
        </mesh>
        {/* Amber Safety Hard Hat */}
        <mesh position={[0, 1.88, 0]}>
          <sphereGeometry args={[0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.32} metalness={0.2} />
        </mesh>
        <mesh ref={leftLegRef} position={[0.14, 0.42, 0]} castShadow>
          <boxGeometry args={[0.17, 0.76, 0.19]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh ref={rightLegRef} position={[-0.14, 0.42, 0]} castShadow>
          <boxGeometry args={[0.17, 0.76, 0.19]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh ref={leftArmRef} position={[0.37, 1.12, 0]} castShadow>
          <boxGeometry args={[0.14, 0.62, 0.15]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
        <mesh ref={rightArmRef} position={[-0.37, 1.12, 0]} castShadow>
          <boxGeometry args={[0.14, 0.62, 0.15]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}
