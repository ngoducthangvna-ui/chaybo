import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FLOOR_ELEVATION_Y,
  type FloorLevelId,
  type FurnitureItem,
  STADIUM_INTERIOR_ROOMS,
  type StadiumRoomSpec,
  isDoorwayOpen,
} from '../config/interiorRooms';

interface InteriorRooms3DProps {
  activeFloor: FloorLevelId;
  walkthrough3dActive: boolean;
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
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 0.8, item.h]} />
          <meshStandardMaterial color="#27272a" roughness={0.62} metalness={0.22} />
        </mesh>
        {/* Glowing Water Surface */}
        <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(0.4, item.w - 0.5), Math.max(0.4, item.h - 0.5)]} />
          <meshPhysicalMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={0.48}
            roughness={0.1}
            metalness={0.35}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Chrome Entry Rail */}
        <mesh position={[0, 1.02, item.h * 0.5 - 0.15]}>
          <boxGeometry args={[Math.min(2.4, item.w * 0.55), 0.08, 0.08]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'locker') {
    const isHorizontal = item.w >= item.h;
    const count = Math.max(4, Math.min(12, Math.floor(Math.max(item.w, item.h) / 1.8)));
    return (
      <group position={[cx, 0, cz]}>
        {/* Locker Backing & Oak Ledge */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 2.1, item.h]} />
          <meshStandardMaterial color="#292524" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[item.w + 0.3, 0.16, item.h + 0.3]} />
          <meshStandardMaterial color="#d6b47a" roughness={0.55} />
        </mesh>
        {/* Individual Player Jersey Cubbies */}
        {Array.from({ length: count }).map((_, idx) => {
          const offset = ((idx + 0.5) / count - 0.5) * (isHorizontal ? item.w - 0.6 : item.h - 0.6);
          return (
            <mesh
              key={idx}
              position={[isHorizontal ? offset : 0, 1.35, isHorizontal ? 0 : offset]}
            >
              <boxGeometry
                args={[
                  isHorizontal ? (item.w / count) * 0.72 : item.w + 0.12,
                  0.85,
                  isHorizontal ? item.h + 0.12 : (item.h / count) * 0.72,
                ]}
              />
              <meshStandardMaterial
                color={item.color}
                emissive={item.color}
                emissiveIntensity={0.22}
                roughness={0.5}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (item.kind === 'table') {
    const chairCount = Math.max(2, Math.min(8, Math.floor(Math.max(item.w, item.h) / 2.6)));
    const alongX = item.w >= item.h;
    return (
      <group position={[cx, 0, cz]}>
        {/* Pedestal + Beveled Tabletop */}
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[item.w * 0.6, 0.72, item.h * 0.6]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 0.14, item.h]} />
          <meshStandardMaterial color={item.color} metalness={0.35} roughness={0.35} />
        </mesh>
        {/* Glowing Display / Tactical Board on Tabletop */}
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[item.w * 0.68, 0.05, item.h * 0.58]} />
          <meshStandardMaterial
            color="#065f46"
            emissive="#10b981"
            emissiveIntensity={0.38}
            roughness={0.25}
          />
        </mesh>
        {/* Surrounding 3D Chairs */}
        {Array.from({ length: chairCount }).map((_, idx) => {
          const offset = ((idx + 0.5) / chairCount - 0.5) * (alongX ? item.w * 0.82 : item.h * 0.82);
          return [-1, 1].map((side) => (
            <mesh
              key={`${idx}-${side}`}
              position={[
                alongX ? offset : side * (item.w * 0.5 + 0.45),
                0.42,
                alongX ? side * (item.h * 0.5 + 0.45) : offset,
              ]}
              castShadow
            >
              <boxGeometry args={[0.62, 0.75, 0.62]} />
              <meshStandardMaterial color="#334155" roughness={0.55} />
            </mesh>
          ));
        })}
      </group>
    );
  }

  if (item.kind === 'screen') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[item.w, 2.5, item.h]} />
          <meshStandardMaterial color="#090d16" metalness={0.75} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[item.w + 0.14, 1.95, item.h + 0.14]} />
          <meshStandardMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={0.72}
            roughness={0.18}
          />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'bed') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w * 0.85, 0.55, item.h * 0.85]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[item.w * 0.82, 0.14, item.h * 0.82]} />
          <meshStandardMaterial color={item.color} roughness={0.55} />
        </mesh>
      </group>
    );
  }

  if (item.kind === 'machinery') {
    return (
      <group position={[cx, 0, cz]}>
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[item.w, 2.3, item.h]} />
          <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.32} />
        </mesh>
        <mesh position={[0, 2.35, 0]}>
          <boxGeometry args={[item.w * 0.88, 0.2, item.h * 0.88]} />
          <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.35} />
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
              <mesh position={[0, 0.52, 0]} castShadow>
                <boxGeometry
                  args={[alongX ? 0.38 : item.w * 0.85, 1.04, alongX ? item.h * 0.85 : 0.38]}
                />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.22} />
              </mesh>
              <mesh position={[0, 1.06, 0]}>
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
            <meshStandardMaterial color="#9f1239" roughness={0.8} />
          </mesh>
          {[-12, -6, 0, 6, 12].map((ax) => (
            <group key={ax} position={[ax, 0, 0]}>
              <mesh position={[0, 1.8, -item.h * 0.5]} castShadow>
                <boxGeometry args={[0.45, 3.6, 0.45]} />
                <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, 1.8, item.h * 0.5]} castShadow>
                <boxGeometry args={[0.45, 3.6, 0.45]} />
                <meshStandardMaterial color="#c5a059" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh position={[0, 3.6, 0]}>
                <boxGeometry args={[0.5, 0.35, item.h + 0.5]} />
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
          <meshStandardMaterial color="#1c1917" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow>
          <boxGeometry args={[item.w + 0.45, 0.14, item.h + 0.45]} />
          <meshStandardMaterial color={item.color} metalness={0.5} roughness={0.25} />
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
                <boxGeometry args={[0.85, 0.38, 0.78]} />
                <meshStandardMaterial color={item.color} roughness={0.55} />
              </mesh>
              <mesh position={[0, 0.62, -0.28]} castShadow>
                <boxGeometry args={[0.85, 0.56, 0.2]} />
                <meshStandardMaterial color={item.color} roughness={0.5} />
              </mesh>
            </group>
          );
        })
      )}
    </group>
  );
}

function RoomPerimeter3D({
  room,
  isActiveFloor,
  isFocusedRoom,
  doorOpen,
}: {
  room: StadiumRoomSpec;
  isActiveFloor: boolean;
  isFocusedRoom: boolean;
  doorOpen: boolean;
}) {
  const { x, y: z, w, h } = room.bounds;
  const cx = x + w * 0.5;
  const cz = z + h * 0.5;
  const wallH = 2.65;
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

  // Build 4 perimeter walls leaving a clean gap on the side containing room.door
  const doorOnNorth = room.door.orientation === 'h' && Math.abs(room.door.y - z) < 1.5;
  const doorOnSouth = room.door.orientation === 'h' && Math.abs(room.door.y - (z + h)) < 1.5;
  const doorOnWest = room.door.orientation === 'v' && Math.abs(room.door.x - x) < 1.5;
  const doorOnEast = room.door.orientation === 'v' && Math.abs(room.door.x - (x + w)) < 1.5;

  const renderSplitHorizontalWall = (wz: number, hasDoor: boolean) => {
    if (!hasDoor) {
      return (
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
        <mesh position={[x + leftLen * 0.5, wallH * 0.5, wz]} castShadow receiveShadow>
          <boxGeometry args={[leftLen, wallH, t]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
        <mesh position={[x + w - rightLen * 0.5, wallH * 0.5, wz]} castShadow receiveShadow>
          <boxGeometry args={[rightLen, wallH, t]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
      </>
    );
  };

  const renderSplitVerticalWall = (wx: number, hasDoor: boolean) => {
    if (!hasDoor) {
      return (
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
        <mesh position={[wx, wallH * 0.5, z + topLen * 0.5]} castShadow receiveShadow>
          <boxGeometry args={[t, wallH, topLen]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
        <mesh position={[wx, wallH * 0.5, z + h - botLen * 0.5]} castShadow receiveShadow>
          <boxGeometry args={[t, wallH, botLen]} />
          <meshStandardMaterial color="#334155" roughness={0.68} />
        </mesh>
      </>
    );
  };

  return (
    <group position={[0, FLOOR_ELEVATION_Y[room.floor], 0]}>
      {/* Finished Interior Floor Slab */}
      <mesh position={[cx, -0.05, cz]} receiveShadow>
        <boxGeometry args={[w, 0.12, h]} />
        <meshStandardMaterial
          color={room.category === 'vip' ? '#1c1917' : room.category === 'sports' ? '#172536' : '#111827'}
          roughness={0.52}
          metalness={0.2}
        />
      </mesh>
      {/* 4 Perimeter LED Accent Baseboard Strips */}
      {[
        [cx, z],
        [cx, z + h],
      ].map(([bx, bz], i) => (
        <mesh key={`bh-${i}`} position={[bx, 0.04, bz]}>
          <boxGeometry args={[w + 0.2, 0.06, 0.22]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={isFocusedRoom ? 0.65 : 0.18} />
        </mesh>
      ))}
      {[
        [x, cz],
        [x + w, cz],
      ].map(([bx, bz], i) => (
        <mesh key={`bv-${i}`} position={[bx, 0.04, bz]}>
          <boxGeometry args={[0.22, 0.06, h + 0.2]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={isFocusedRoom ? 0.65 : 0.18} />
        </mesh>
      ))}

      {/* Open-Top Partition Walls leaving true door cutout */}
      {renderSplitHorizontalWall(z, doorOnNorth)}
      {renderSplitHorizontalWall(z + h, doorOnSouth)}
      {renderSplitVerticalWall(x, doorOnWest)}
      {renderSplitVerticalWall(x + w, doorOnEast)}

      {/* Animated Proximity Sliding Glass Door Leaves */}
      <group position={[room.door.x, wallH * 0.45, room.door.y]}>
        <mesh ref={slideRefL}>
          <boxGeometry
            args={[
              room.door.orientation === 'h' ? room.door.width * 0.48 : 0.12,
              wallH * 0.88,
              room.door.orientation === 'h' ? 0.12 : room.door.width * 0.48,
            ]}
          />
          <meshPhysicalMaterial
            color="#bae6fd"
            emissive={doorOpen ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.28}
            transparent
            opacity={0.55}
            metalness={0.6}
            roughness={0.1}
          />
        </mesh>
        <mesh ref={slideRefR}>
          <boxGeometry
            args={[
              room.door.orientation === 'h' ? room.door.width * 0.48 : 0.12,
              wallH * 0.88,
              room.door.orientation === 'h' ? 0.12 : room.door.width * 0.48,
            ]}
          />
          <meshPhysicalMaterial
            color="#bae6fd"
            emissive={doorOpen ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.28}
            transparent
            opacity={0.55}
            metalness={0.6}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Active Floor Furniture & Interior Lighting */}
      {isActiveFloor && (
        <>
          {room.furniture.map((item, idx) => (
            <FurnitureItem3D key={idx} item={item} />
          ))}
          {isFocusedRoom && (
            <pointLight position={[cx, 3.8, cz]} color="#fff7ed" intensity={180} distance={48} decay={1.6} />
          )}
        </>
      )}
    </group>
  );
}

/**
 * Renders all 16 stadium interior rooms as true 3D architectural spaces with sliding glass doors,
 * extruded furniture/equipment, interior NPCs, and the 3D Engineer Walkthrough Avatar.
 */
export function InteriorRooms3D({
  activeFloor,
  walkthrough3dActive,
  avatarX,
  avatarY,
  avatarHeading,
  avatarSpeed,
  activeRoomId,
}: InteriorRooms3DProps) {
  const npcTorsoRef = useRef<THREE.InstancedMesh | null>(null);
  const npcHeadRef = useRef<THREE.InstancedMesh | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Mesh | null>(null);
  const rightArmRef = useRef<THREE.Mesh | null>(null);

  const floorRooms = useMemo(
    () => STADIUM_INTERIOR_ROOMS.filter((r) => r.floor === activeFloor),
    [activeFloor]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const activeBaseY = FLOOR_ELEVATION_Y[activeFloor];

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

    if (npcTorsoRef.current && npcHeadRef.current) {
      let idx = 0;
      floorRooms.forEach((room, rIdx) => {
        for (let k = 0; k < 3; k += 1) {
          const nx =
            room.bounds.x +
            room.bounds.w * (0.22 + 0.26 * k) +
            Math.cos(t * 0.8 + rIdx + k * 2.1) * Math.min(2.6, room.bounds.w * 0.12);
          const nz =
            room.bounds.y +
            room.bounds.h * (0.3 + 0.2 * (k % 2)) +
            Math.sin(t * 1.05 + rIdx + k * 1.7) * Math.min(2.2, room.bounds.h * 0.12);

          dummy.rotation.set(0, t * 0.5 + k, 0);
          dummy.scale.set(1, 1, 1);

          dummy.position.set(nx, activeBaseY + 0.95, nz);
          dummy.updateMatrix();
          npcTorsoRef.current!.setMatrixAt(idx, dummy.matrix);

          dummy.position.set(nx, activeBaseY + 1.56, nz);
          dummy.updateMatrix();
          npcHeadRef.current!.setMatrixAt(idx, dummy.matrix);
          idx += 1;
        }
      });
      npcTorsoRef.current.count = idx;
      npcHeadRef.current.count = idx;
      npcTorsoRef.current.instanceMatrix.needsUpdate = true;
      npcHeadRef.current.instanceMatrix.needsUpdate = true;
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
        />
      ))}

      {/* Animated Interior Personnel (Athletes, Staff, VIP Guests) */}
      <instancedMesh ref={npcTorsoRef} args={[undefined, undefined, 32]} castShadow>
        <boxGeometry args={[0.52, 0.86, 0.3]} />
        <meshStandardMaterial color="#e11d48" roughness={0.62} />
      </instancedMesh>
      <instancedMesh ref={npcHeadRef} args={[undefined, undefined, 32]} castShadow>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color="#f5d0a9" roughness={0.55} />
      </instancedMesh>

      {/* Articulated 3D Walkthrough Engineer Avatar */}
      <group ref={avatarGroupRef} position={[avatarX, activeBaseY, avatarY]}>
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
