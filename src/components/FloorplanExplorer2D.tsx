import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Compass,
  Columns2,
  DoorOpen,
  Footprints,
  Layers,
  Maximize2,
  Navigation,
  ThermometerSnowflake,
  X,
} from 'lucide-react';
import {
  FLOOR_LEVEL_SPECS,
  type FloorLevelId,
  type FramePerformanceTelemetry,
  type StadiumRoomSpec,
  VERTICAL_CORES,
  findRoomAtPoint,
  getCorridorsByFloor,
  getRoomNpcPoses,
  getRoomSafeSpawnPoint,
  getRoomsByFloor,
  isDoorwayOpen,
  isPointInInteriorClearZone,
  stepExplorerAvatar,
} from '../config/interiorRooms';
import {
  type CameraPresetId,
  PITCH_SPECS,
  ROOF_SPECS,
  STRUCTURAL_GRID_LINES,
  superEllipsePoint,
} from '../config/stadiumSpecs';

interface FloorplanExplorer2DProps {
  isOpen: boolean;
  splitMode: boolean;
  fpsTelemetry?: FramePerformanceTelemetry;
  onToggleSplitMode: () => void;
  onClose: () => void;
  onSync3dCamera: (preset: CameraPresetId, enableCutaway: boolean) => void;
  onOpenWalkthrough3d: (room: StadiumRoomSpec) => void;
}

const CATEGORY_COLORS: Record<StadiumRoomSpec['category'], string> = {
  sports: '#e11d48',
  vip: '#c5a059',
  media: '#38bdf8',
  public: '#10b981',
  mep: '#f59e0b',
  medical: '#f43f5e',
};

const CATEGORY_LABELS: Record<StadiumRoomSpec['category'], string> = {
  sports: 'Khu Đội Bóng & Sân',
  vip: 'Khánh Tiết VIP',
  media: 'Truyền Thông & VAR',
  public: 'Đại Sảnh Công Cộng',
  mep: 'Kỹ Thuật Cơ Điện MEP',
  medical: 'Y Tế & Cấp Cứu',
};

function traceSuperEllipse(
  ctx: CanvasRenderingContext2D,
  toScreenX: (wx: number) => number,
  toScreenY: (wy: number) => number,
  rx: number,
  rz: number,
  segments = 72
) {
  ctx.beginPath();
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const [wx, wz] = superEllipsePoint(a, rx, rz, ROOF_SPECS.superEllipsePower);
    const sx = toScreenX(wx);
    const sy = toScreenY(wz);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
}

export function FloorplanExplorer2D({
  isOpen,
  splitMode,
  fpsTelemetry = { fps: 120, frameTimeMs: 2.2, budgetPercent: 26, modeLabel: '120 FPS ULTRA' },
  onToggleSplitMode,
  onClose,
  onSync3dCamera,
  onOpenWalkthrough3d,
}: FloorplanExplorer2DProps) {
  const [activeFloor, setActiveFloor] = useState<FloorLevelId>('B0');
  const [zoomMode, setZoomMode] = useState<'follow' | 'blueprint'>('follow');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('home-locker');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [hudTelemetry, setHudTelemetry] = useState({ x: -108, y: -12, speedMps: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const dpadInputRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const walkTargetRef = useRef<{ x: number; y: number } | null>(null);
  const avatarRef = useRef<{ x: number; y: number; heading: number; speedMps: number }>({
    x: -108,
    y: -12,
    heading: 0,
    speedMps: 0,
  });
  const doorProgressRef = useRef<Record<string, number>>({});
  const transformRef = useRef<{ cx: number; cy: number; camX: number; camY: number; ppm: number }>({
    cx: 400,
    cy: 300,
    camX: 0,
    camY: 0,
    ppm: 2,
  });

  const floorRooms = useMemo(() => getRoomsByFloor(activeFloor), [activeFloor]);
  const floorSpec = useMemo(
    () => FLOOR_LEVEL_SPECS.find((f) => f.id === activeFloor) ?? FLOOR_LEVEL_SPECS[0],
    [activeFloor]
  );

  const activeRoom = useMemo(() => {
    const inside = currentRoomId
      ? floorRooms.find((r) => r.id === currentRoomId)
      : undefined;
    return inside ?? floorRooms.find((r) => r.id === selectedRoomId) ?? floorRooms[0];
  }, [currentRoomId, floorRooms, selectedRoomId]);

  const handleSelectFloor = (floorId: FloorLevelId) => {
    setActiveFloor(floorId);
    const spec = FLOOR_LEVEL_SPECS.find((f) => f.id === floorId) ?? FLOOR_LEVEL_SPECS[0];
    const rooms = getRoomsByFloor(floorId);
    avatarRef.current = {
      x: spec.defaultSpawn[0],
      y: spec.defaultSpawn[1],
      heading: 0,
      speedMps: 0,
    };
    walkTargetRef.current = null;
    if (rooms[0]) {
      setSelectedRoomId(rooms[0].id);
    }
    setCurrentRoomId(findRoomAtPoint(floorId, spec.defaultSpawn[0], spec.defaultSpawn[1])?.id ?? null);
  };

  const handleMoveToRoom = (room: StadiumRoomSpec) => {
    if (room.floor !== activeFloor) {
      setActiveFloor(room.floor);
    }
    setSelectedRoomId(room.id);
    const safeTarget = getRoomSafeSpawnPoint(room);
    avatarRef.current = {
      x: room.door.x,
      y: room.door.y,
      heading: Math.atan2(safeTarget.y - room.door.y, safeTarget.x - room.door.x),
      speedMps: 0,
    };
    walkTargetRef.current = safeTarget;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keysPressedRef.current.add(e.code);
        walkTargetRef.current = null;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    let lastTime = performance.now();
    let uiTimer = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsedSec = now * 0.001;

      const keys = keysPressedRef.current;
      let dx = dpadInputRef.current.dx;
      let dy = dpadInputRef.current.dy;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;

      const nextAvatar = stepExplorerAvatar(
        avatarRef.current,
        {
          dx,
          dy,
          targetX: walkTargetRef.current?.x ?? null,
          targetY: walkTargetRef.current?.y ?? null,
        },
        dt,
        activeFloor
      );
      avatarRef.current = nextAvatar;

      if (walkTargetRef.current && nextAvatar.speedMps === 0) {
        walkTargetRef.current = null;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.max(320, Math.floor(rect.width * dpr));
        const targetH = Math.max(240, Math.floor(rect.height * dpr));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          const w = rect.width;
          const h = rect.height;

          const ppm =
            zoomMode === 'follow'
              ? Math.max(7.2, Math.min(11.5, w / 86))
              : Math.min(w / 410, h / 355);
          const camX = zoomMode === 'follow' ? nextAvatar.x : 0;
          const camY = zoomMode === 'follow' ? nextAvatar.y : 0;
          const cx = w * 0.5;
          const cy = h * 0.5;
          transformRef.current = { cx, cy, camX, camY, ppm };

          const toX = (wx: number) => cx + (wx - camX) * ppm;
          const toY = (wy: number) => cy + (wy - camY) * ppm;

          // CAD Blueprint Dark Background
          ctx.fillStyle = '#080c14';
          ctx.fillRect(0, 0, w, h);

          // 10m CAD Grid Lines
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
          const minWorldX = Math.floor((camX - w / (2 * ppm)) / 10) * 10;
          const maxWorldX = Math.ceil((camX + w / (2 * ppm)) / 10) * 10;
          const minWorldY = Math.floor((camY - h / (2 * ppm)) / 10) * 10;
          const maxWorldY = Math.ceil((camY + h / (2 * ppm)) / 10) * 10;
          ctx.beginPath();
          for (let gx = minWorldX; gx <= maxWorldX; gx += 10) {
            const sx = toX(gx);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
          }
          for (let gy = minWorldY; gy <= maxWorldY; gy += 10) {
            const sy = toY(gy);
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
          }
          ctx.stroke();

          // Annular Concourse Corridor Floor & Podium Super-Ellipse Envelope
          ctx.fillStyle = '#0f172a';
          traceSuperEllipse(ctx, toX, toY, 196, 170);
          ctx.fill();

          // Radial Structural Bay Axes (16 major axes)
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 16; i += 1) {
            const a = (i / 16) * Math.PI * 2;
            const [ix, iz] = superEllipsePoint(a, 72, 52);
            const [ox, oz] = superEllipsePoint(a, 196, 170);
            ctx.beginPath();
            ctx.moveTo(toX(ix), toY(iz));
            ctx.lineTo(toX(ox), toY(oz));
            ctx.stroke();
          }

          // Structural Grid Rings A-E
          STRUCTURAL_GRID_LINES.forEach((grid) => {
            ctx.strokeStyle = grid.id === 'E' ? 'rgba(197, 160, 89, 0.55)' : 'rgba(100, 116, 139, 0.35)';
            ctx.setLineDash(grid.id === 'E' ? [] : [5, 5]);
            traceSuperEllipse(ctx, toX, toY, grid.rx, grid.rz);
            ctx.stroke();
          });
          ctx.setLineDash([]);

          // Central FIFA Pitch Blueprint (105x68m)
          const pw = PITCH_SPECS.length * ppm;
          const ph = PITCH_SPECS.width * ppm;
          const px0 = toX(-PITCH_SPECS.length / 2);
          const py0 = toY(-PITCH_SPECS.width / 2);
          ctx.fillStyle = '#11301e';
          ctx.fillRect(px0, py0, pw, ph);
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px0, py0, pw, ph);
          ctx.beginPath();
          ctx.moveTo(toX(0), py0);
          ctx.lineTo(toX(0), py0 + ph);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(toX(0), toY(0), PITCH_SPECS.centerCircleRadius * ppm, 0, Math.PI * 2);
          ctx.stroke();

          // 16 Perimeter Ramp Core Symbols (skipping interior rooms) + Connected Corridors + 4 Vertical Elevator Cores
          ctx.fillStyle = 'rgba(197, 160, 89, 0.22)';
          ctx.strokeStyle = '#c5a059';
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 16; i += 1) {
            const a = (i / 16) * Math.PI * 2;
            const [rx, rz] = superEllipsePoint(a, 155, 129);
            if (isPointInInteriorClearZone(rx, rz, 5.5).inRoom) {
              continue;
            }
            const esx = toX(rx);
            const esy = toY(rz);
            const size = 4.5 * ppm;
            ctx.fillRect(esx - size / 2, esy - size / 2, size, size);
            ctx.strokeRect(esx - size / 2, esy - size / 2, size, size);
          }

          const corridors = getCorridorsByFloor(activeFloor);
          corridors.forEach((c) => {
            const cxCorr = toX(c.x);
            const cyCorr = toY(c.y);
            const cw = c.w * ppm;
            const ch = c.h * ppm;
            ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 1;
            ctx.fillRect(cxCorr, cyCorr, cw, ch);
            ctx.strokeRect(cxCorr, cyCorr, cw, ch);
          });

          VERTICAL_CORES.forEach((core) => {
            const vx = toX(core.x - core.w * 0.5);
            const vy = toY(core.y - core.h * 0.5);
            const vw = core.w * ppm;
            const vh = core.h * ppm;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.6;
            ctx.fillRect(vx, vy, vw, vh);
            ctx.strokeRect(vx, vy, vw, vh);
            ctx.fillStyle = '#fde68a';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(core.code, vx + vw * 0.5, vy + vh * 0.5 + 3);
          });

          // Render All Rooms on Current Floor with Furniture, Sliding Doors & NPCs
          const rooms = getRoomsByFloor(activeFloor);
          const insideRoom = findRoomAtPoint(activeFloor, nextAvatar.x, nextAvatar.y);

          rooms.forEach((room) => {
            const rx = toX(room.bounds.x);
            const ry = toY(room.bounds.y);
            const rw = room.bounds.w * ppm;
            const rh = room.bounds.h * ppm;
            const isInside = insideRoom?.id === room.id;
            const catColor = CATEGORY_COLORS[room.category];

            // Room Floor Fill
            ctx.fillStyle = isInside ? 'rgba(245, 158, 11, 0.14)' : 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(rx, ry, rw, rh);

            // Render Interior Furniture & Equipment
            room.furniture.forEach((item) => {
              const fx = toX(item.x);
              const fy = toY(item.y);
              const fw = item.w * ppm;
              const fh = item.h * ppm;

              ctx.fillStyle = `${item.color}38`;
              ctx.strokeStyle = item.color;
              ctx.lineWidth = 1.25;
              ctx.fillRect(fx, fy, fw, fh);
              ctx.strokeRect(fx, fy, fw, fh);

              if (item.kind === 'pool') {
                const ripple = (Math.sin(elapsedSec * 3) + 1) * 0.18;
                ctx.beginPath();
                ctx.ellipse(
                  fx + fw * 0.5,
                  fy + fh * 0.5,
                  Math.max(2, fw * (0.25 + ripple * 0.25)),
                  Math.max(2, fh * (0.25 + ripple * 0.25)),
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
              } else if (item.kind === 'locker' || item.kind === 'turnstile') {
                const segs = Math.max(3, Math.floor(Math.max(fw, fh) / Math.max(6, ppm * 1.4)));
                ctx.beginPath();
                for (let s = 1; s < segs; s += 1) {
                  if (fw >= fh) {
                    const lx = fx + (fw * s) / segs;
                    ctx.moveTo(lx, fy);
                    ctx.lineTo(lx, fy + fh);
                  } else {
                    const ly = fy + (fh * s) / segs;
                    ctx.moveTo(fx, ly);
                    ctx.lineTo(fx + fw, ly);
                  }
                }
                ctx.stroke();
              } else if (item.kind === 'machinery') {
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(fx + fw, fy + fh);
                ctx.moveTo(fx + fw, fy);
                ctx.lineTo(fx, fy + fh);
                ctx.stroke();
              }

              if (zoomMode === 'follow') {
                ctx.save();
                ctx.fillStyle = '#e2e8f0';
                ctx.font = '600 10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const cxItem = fx + fw * 0.5;
                const cyItem = fy + fh * 0.5;
                if (fh > fw * 1.4 && fh > 60) {
                  ctx.translate(cxItem, cyItem);
                  ctx.rotate(-Math.PI / 2);
                  ctx.fillText(item.label, 0, 0, Math.max(24, fh - 8));
                } else {
                  ctx.fillText(item.label, cxItem, cyItem, Math.max(24, fw - 8));
                }
                ctx.restore();
              }
            });

            // Interior Animated Staff / Athletes strictly along unobstructed aisles
            getRoomNpcPoses(room, elapsedSec).forEach((pose) => {
              ctx.fillStyle = pose.roleShirtHex;
              ctx.beginPath();
              ctx.arc(toX(pose.x), toY(pose.z), Math.max(2.6, ppm * 0.42), 0, Math.PI * 2);
              ctx.fill();
            });

            // Structural Room Perimeter Wall
            ctx.strokeStyle = isInside ? '#f59e0b' : catColor;
            ctx.lineWidth = isInside ? 3.2 : 2.2;
            ctx.strokeRect(rx, ry, rw, rh);

            // Automatic Proximity Sliding Doorway
            const doorTargetOpen = isDoorwayOpen(room, nextAvatar.x, nextAvatar.y) ? 1 : 0;
            const prevOpen = doorProgressRef.current[room.id] ?? 0;
            const nextOpen = prevOpen + (doorTargetOpen - prevOpen) * Math.min(1, dt * 8);
            doorProgressRef.current[room.id] = nextOpen;

            const doorPx = toX(room.door.x);
            const doorPy = toY(room.door.y);
            const doorSpan = room.door.width * ppm;
            const slidePx = nextOpen * doorSpan * 0.48;

            ctx.fillStyle = '#080c14';
            if (room.door.orientation === 'h') {
              ctx.fillRect(doorPx - doorSpan * 0.5, doorPy - 4, doorSpan, 8);
              ctx.strokeStyle = doorTargetOpen ? '#10b981' : '#fbbf24';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(doorPx - doorSpan * 0.5, doorPy);
              ctx.lineTo(doorPx - slidePx, doorPy);
              ctx.moveTo(doorPx + slidePx, doorPy);
              ctx.lineTo(doorPx + doorSpan * 0.5, doorPy);
              ctx.stroke();
            } else {
              ctx.fillRect(doorPx - 4, doorPy - doorSpan * 0.5, 8, doorSpan);
              ctx.strokeStyle = doorTargetOpen ? '#10b981' : '#fbbf24';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(doorPx, doorPy - doorSpan * 0.5);
              ctx.lineTo(doorPx, doorPy - slidePx);
              ctx.moveTo(doorPx, doorPy + slidePx);
              ctx.lineTo(doorPx, doorPy + doorSpan * 0.5);
              ctx.stroke();
            }

            // Room Architectural Label Badge
            ctx.fillStyle = 'rgba(9, 13, 22, 0.86)';
            const labelText = `${room.code} · ${room.name}`;
            ctx.font = 'bold 11px sans-serif';
            const textW = Math.min(rw - 8, ctx.measureText(labelText).width + 14);
            if (textW > 40) {
              ctx.fillRect(rx + 6, ry + 6, textW, 20);
              ctx.fillStyle = isInside ? '#fcd34d' : '#f8fafc';
              ctx.textAlign = 'left';
              ctx.fillText(labelText, rx + 12, ry + 20, rw - 16);
            }
          });

          // Draw Click-to-Walk Navigation Path Line
          if (walkTargetRef.current) {
            const tx = toX(walkTargetRef.current.x);
            const ty = toY(walkTargetRef.current.y);
            ctx.save();
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(toX(nextAvatar.x), toY(nextAvatar.y));
            ctx.lineTo(tx, ty);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(tx, ty, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.restore();
          }

          // Draw Engineer Explorer Avatar with FOV Vision Cone
          const ax = toX(nextAvatar.x);
          const ay = toY(nextAvatar.y);
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(nextAvatar.heading);

          // Vision Flashlight Cone
          const coneGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 22 * ppm);
          coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
          coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 22 * ppm, -0.52, 0.52);
          ctx.closePath();
          ctx.fill();

          // Avatar Shoulders & White Safety Hard-Hat
          const rBody = Math.max(5.5, ppm * 0.72);
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.ellipse(0, 0, rBody * 0.75, rBody * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, rBody * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          ctx.restore();
        }
      }

      if (now - uiTimer > 110) {
        uiTimer = now;
        const found = findRoomAtPoint(activeFloor, nextAvatar.x, nextAvatar.y);
        setCurrentRoomId(found?.id ?? null);
        if (found) {
          setSelectedRoomId(found.id);
        }
        setHudTelemetry({
          x: Number(nextAvatar.x.toFixed(1)),
          y: Number(nextAvatar.y.toFixed(1)),
          speedMps: nextAvatar.speedMps,
        });
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, activeFloor, zoomMode]);

  if (!isOpen) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { cx, cy, camX, camY, ppm } = transformRef.current;
    const worldX = camX + (clickX - cx) / ppm;
    const worldY = camY + (clickY - cy) / ppm;
    walkTargetRef.current = { x: worldX, y: worldY };
  };

  return (
    <section
      aria-label="Khám phá mặt bằng nội khu 2D tự do"
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-[#080c14]/98 border-r border-[#26262b] shadow-2xl ${
        splitMode ? 'w-full lg:w-[58vw]' : 'w-full'
      }`}
    >
      {/* Top 2D CAD Explorer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#26262b] bg-[#0f131a] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Compass className="h-4 w-4 text-amber-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Mặt Bằng CAD/BIM 2D • Di Chuyển Tự Do Nội Khu</span>
              <span className="rounded border border-emerald-400/40 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {fpsTelemetry.fps} FPS CAD
              </span>
            </h2>
            <p className="text-[11px] text-[#a1a1aa]">{floorSpec.elevationLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FLOOR_LEVEL_SPECS.map((floor) => {
            const active = activeFloor === floor.id;
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => handleSelectFloor(floor.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition border ${
                  active
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                    : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
                }`}
              >
                {floor.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomMode((m) => (m === 'follow' ? 'blueprint' : 'follow'))}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-500/25"
          >
            <Maximize2 className="h-3 w-3" />
            {zoomMode === 'follow' ? 'Tổng Mặt Bằng CAD' : 'Cận Cảnh Đi Bộ'}
          </button>

          <button
            type="button"
            onClick={onToggleSplitMode}
            className="inline-flex items-center gap-1 rounded-lg border border-[#26262b] bg-[#141417] px-2.5 py-1 text-[11px] font-medium text-[#ededf0] hover:bg-white/10"
          >
            <Columns2 className="h-3 w-3 text-emerald-400" />
            {splitMode ? 'Toàn Màn Hình 2D' : 'Chia Đôi 2D + 3D'}
          </button>

          <button
            type="button"
            onClick={() => onOpenWalkthrough3d(activeRoom)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30"
          >
            <Footprints className="h-3 w-3" />
            Lên 3D Thực Tế
          </button>

          <button
            type="button"
            onClick={() => setInspectorOpen((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              inspectorOpen
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            {inspectorOpen ? 'Ẩn Hồ Sơ' : 'Hồ Sơ Phòng'}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng khám phá 2D"
            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/15 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/25"
          >
            <X className="h-3.5 w-3.5" />
            Đóng
          </button>
        </div>
      </div>

      {/* Main Split Area: Interactive Floorplan Canvas + Room Inspector Sidebar */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Interactive Canvas Area */}
        <div className="relative flex-1 min-h-[280px] bg-[#080c14]">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="h-full w-full cursor-crosshair block"
          />

          {/* Bottom-Left Live Position Telemetry & Instructions */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5">
            <div className="rounded-xl border border-[#26262b] bg-[#0f131a]/90 px-3 py-2 text-[11px] backdrop-blur-md">
              <div className="flex items-center gap-2 font-mono text-emerald-300">
                <Navigation className="h-3.5 w-3.5" />
                <span>
                  X: {hudTelemetry.x}m · Z: {hudTelemetry.y}m · v = {hudTelemetry.speedMps} m/s
                </span>
              </div>
              <div className="mt-1 text-[10px] text-[#a1a1aa]">
                Dùng <strong className="text-white">W A S D</strong> /{' '}
                <strong className="text-white">Phím mũi tên</strong> hoặc{' '}
                <strong className="text-emerald-300">Click lên bản đồ</strong> để đi vào từng phòng
              </div>
            </div>
          </div>

          {/* Bottom-Right On-Screen D-Pad */}
          <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-1 rounded-xl border border-[#26262b] bg-[#0f131a]/90 p-1.5 backdrop-blur-md">
            <div />
            <button
              type="button"
              aria-label="Đi lên"
              onPointerDown={() => {
                walkTargetRef.current = null;
                dpadInputRef.current.dy = -1;
              }}
              onPointerUp={() => {
                dpadInputRef.current.dy = 0;
              }}
              onPointerLeave={() => {
                dpadInputRef.current.dy = 0;
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c212b] text-white hover:bg-amber-500 hover:text-slate-950"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <div />
            <button
              type="button"
              aria-label="Sang trái"
              onPointerDown={() => {
                walkTargetRef.current = null;
                dpadInputRef.current.dx = -1;
              }}
              onPointerUp={() => {
                dpadInputRef.current.dx = 0;
              }}
              onPointerLeave={() => {
                dpadInputRef.current.dx = 0;
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c212b] text-white hover:bg-amber-500 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Đi xuống"
              onPointerDown={() => {
                walkTargetRef.current = null;
                dpadInputRef.current.dy = 1;
              }}
              onPointerUp={() => {
                dpadInputRef.current.dy = 0;
              }}
              onPointerLeave={() => {
                dpadInputRef.current.dy = 0;
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c212b] text-white hover:bg-amber-500 hover:text-slate-950"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sang phải"
              onPointerDown={() => {
                walkTargetRef.current = null;
                dpadInputRef.current.dx = 1;
              }}
              onPointerUp={() => {
                dpadInputRef.current.dx = 0;
              }}
              onPointerLeave={() => {
                dpadInputRef.current.dx = 0;
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c212b] text-white hover:bg-amber-500 hover:text-slate-950"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Architectural Room Inspector & Quick Teleport List (Collapsible) */}
        {inspectorOpen && (
          <aside className="w-full md:w-[268px] border-t md:border-t-0 md:border-l border-[#26262b] bg-[#0f131a] flex flex-col min-h-0">
          <div className="p-3 border-b border-[#26262b] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-amber-300">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {currentRoomId ? 'Đang Bên Trong Phòng' : 'Hồ Sơ Phòng Đã Chọn'}
              </span>
              <span className="font-mono text-[#a1a1aa]">{activeRoom.code}</span>
            </div>

            <div className="rounded-xl border border-[#26262b] bg-[#080c14] p-2.5 space-y-1.5 text-xs">
              <div className="font-semibold text-white">{activeRoom.name}</div>
              <div className="text-[11px] text-sky-300">
                {CATEGORY_LABELS[activeRoom.category]} · {activeRoom.gridZone}
              </div>
              <p className="text-[11px] text-[#a1a1aa] leading-relaxed">{activeRoom.description}</p>

              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                <div className="rounded-md bg-[#141417] p-1.5 border border-[#26262b]">
                  <div className="text-[#a1a1aa]">Diện tích</div>
                  <div className="font-mono font-bold text-white">{activeRoom.areaM2} m²</div>
                </div>
                <div className="rounded-md bg-[#141417] p-1.5 border border-[#26262b]">
                  <div className="text-[#a1a1aa]">Thông thủy</div>
                  <div className="font-mono font-bold text-white">{activeRoom.ceilingHeightM} m</div>
                </div>
                <div className="rounded-md bg-[#141417] p-1.5 border border-[#26262b]">
                  <div className="text-[#a1a1aa] flex items-center gap-0.5">
                    <ThermometerSnowflake className="h-2.5 w-2.5 text-sky-400" /> HVAC
                  </div>
                  <div className="font-mono font-bold text-sky-300">{activeRoom.hvacKw} kW</div>
                </div>
              </div>

              <div className="text-[10px] text-emerald-300 font-mono">
                PCCC: {activeRoom.fireRating}
              </div>

              <ul className="space-y-0.5 pt-1 text-[10px] text-[#d4d4d8] list-disc pl-3.5">
                {activeRoom.equipmentList.map((eq, i) => (
                  <li key={i}>{eq}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onOpenWalkthrough3d(activeRoom)}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
              >
                <Footprints className="h-3.5 w-3.5" />
                Lên 3D Thực Tế (Đi Bộ Trong Phòng 3D)
              </button>
              <button
                type="button"
                onClick={() => onSync3dCamera(activeRoom.camera3dPreset, true)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30 transition"
              >
                <Box className="h-3.5 w-3.5" />
                Đồng Bộ Góc Nhìn 3D (Mặt Cắt)
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase text-[#a1a1aa] pb-1">
              Danh sách phòng {floorSpec.label} ({floorRooms.length} khu)
            </div>
            {floorRooms.map((room) => {
              const isInside = currentRoomId === room.id;
              const isSelected = activeRoom.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleMoveToRoom(room)}
                  className={`w-full rounded-xl border p-2 text-left transition ${
                    isInside
                      ? 'border-amber-400/70 bg-amber-500/15'
                      : isSelected
                        ? 'border-sky-400/50 bg-[#141a24]'
                        : 'border-[#26262b] bg-[#0a0e14] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-amber-300">{room.code}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                      <DoorOpen className="h-3 w-3" />
                      {room.areaM2} m²
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-white truncate">{room.name}</div>
                </button>
              );
            })}
          </div>
        </aside>
        )}
      </div>
    </section>
  );
}
