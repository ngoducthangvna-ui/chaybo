import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  DoorOpen,
  Eye,
  Footprints,
  Layers,
  Map as MapIcon,
  PanelRight,
  ThermometerSnowflake,
  X,
} from 'lucide-react';
import {
  FLOOR_ELEVATION_Y,
  FLOOR_LEVEL_SPECS,
  type FloorLevelId,
  type FramePerformanceTelemetry,
  type StadiumRoomSpec,
  VERTICAL_CORES,
  type VerticalCoreSpec,
  type Walkthrough3DCameraMode,
  findNearestVerticalCore,
  getCorridorsByFloor,
  getRoomsByFloor,
} from '../config/interiorRooms';

interface Walkthrough3DHudProps {
  activeFloor: FloorLevelId;
  cameraMode: Walkthrough3DCameraMode;
  activeRoom: StadiumRoomSpec | null;
  selectedRoom: StadiumRoomSpec;
  avatarX: number;
  avatarY: number;
  avatarHeading: number;
  avatarSpeed: number;
  fpsTelemetry?: FramePerformanceTelemetry;
  onSelectFloor: (floor: FloorLevelId) => void;
  onUseElevatorCore: (floor: FloorLevelId, core: VerticalCoreSpec) => void;
  onCameraModeChange: (mode: Walkthrough3DCameraMode) => void;
  onTeleportToRoom: (room: StadiumRoomSpec) => void;
  onSetDpadInput: (dx: number, dy: number) => void;
  onOpen2dMap: () => void;
  onExitWalkthrough: () => void;
}

export function Walkthrough3DHud({
  activeFloor,
  cameraMode,
  activeRoom,
  selectedRoom,
  avatarX,
  avatarY,
  avatarHeading,
  avatarSpeed,
  fpsTelemetry = { fps: 120, frameTimeMs: 2.2, budgetPercent: 26, modeLabel: '120 FPS ULTRA' },
  onSelectFloor,
  onUseElevatorCore,
  onCameraModeChange,
  onTeleportToRoom,
  onSetDpadInput,
  onOpen2dMap,
  onExitWalkthrough,
}: Walkthrough3DHudProps) {
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [radarOpen, setRadarOpen] = useState(true);
  const floorRooms = getRoomsByFloor(activeFloor);
  const floorCorridors = getCorridorsByFloor(activeFloor);
  const nearestCore = findNearestVerticalCore(avatarX, avatarY, 10.5);
  const fallbackCore =
    VERTICAL_CORES.reduce((best, core) =>
      Math.hypot(avatarX - core.x, avatarY - core.y) <
      Math.hypot(avatarX - best.x, avatarY - best.y)
        ? core
        : best
    ) ?? VERTICAL_CORES[0];
  const activeElevatorCore = nearestCore ?? fallbackCore;
  const displayRoom = activeRoom ?? selectedRoom;
  const elevationY = FLOOR_ELEVATION_Y[activeFloor];

  // Draw live bottom-left 2D radar mini-map synchronized with 3D avatar coordinates
  useEffect(() => {
    if (!radarOpen) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = 1.9;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const toX = (wx: number) => cx + (wx - avatarX) * scale;
    const toY = (wz: number) => cy + (wz - avatarY) * scale;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Subtle radar grid
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let g = -160; g <= 160; g += 10) {
      const gx = toX(g);
      const gy = toY(g);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Floor corridor paths connecting rooms & cores
    floorCorridors.forEach((c) => {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
      ctx.fillRect(toX(c.x), toY(c.y), c.w * scale, c.h * scale);
    });

    // Nearby rooms on active floor
    floorRooms.forEach((room) => {
      const rx = toX(room.bounds.x);
      const ry = toY(room.bounds.y);
      const rw = room.bounds.w * scale;
      const rh = room.bounds.h * scale;
      const inside = activeRoom?.id === room.id;

      ctx.fillStyle = inside ? 'rgba(245, 158, 11, 0.2)' : 'rgba(30, 41, 59, 0.55)';
      ctx.fillRect(rx, ry, rw, rh);

      room.furniture.forEach((item) => {
        ctx.fillStyle = `${item.color}66`;
        ctx.fillRect(toX(item.x), toY(item.y), item.w * scale, item.h * scale);
      });

      ctx.strokeStyle = inside ? '#fbbf24' : '#64748b';
      ctx.lineWidth = inside ? 1.8 : 1;
      ctx.strokeRect(rx, ry, rw, rh);
    });

    // Vertical elevator cores
    VERTICAL_CORES.forEach((core) => {
      const cxCore = toX(core.x - core.w * 0.5);
      const cyCore = toY(core.y - core.h * 0.5);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.fillRect(cxCore, cyCore, core.w * scale, core.h * scale);
      ctx.strokeRect(cxCore, cyCore, core.w * scale, core.h * scale);
    });

    // Engineer Avatar heading triangle at center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(avatarHeading);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-5, -4.5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-5, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [activeFloor, floorRooms, floorCorridors, activeRoom, avatarX, avatarY, avatarHeading, radarOpen]);

  return (
    <>
      {/* Single-Row Slim Top 3D Walkthrough Header */}
      <header className="fixed top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#26262b] bg-[#0f131a]/92 px-2.5 py-1.5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
            <Footprints className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-bold text-white uppercase tracking-wide">Đi Bộ 3D</span>
          <span className="rounded border border-emerald-400/50 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
            {fpsTelemetry.fps} FPS
          </span>
        </div>

        <div className="flex items-center gap-1">
          {FLOOR_LEVEL_SPECS.map((floor) => {
            const active = floor.id === activeFloor;
            const shortLabel = floor.label.replace('Tầng ', '').replace('.0m', 'm');
            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => onSelectFloor(floor.id)}
                className={`rounded-md px-2 py-1 text-[10.5px] font-semibold transition border whitespace-nowrap ${
                  active
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                    : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'follow3d', label: 'Follow 3D', Icon: Compass },
              { id: 'fps3d', label: 'Nhập Vai FPS', Icon: Eye },
              { id: 'cutaway3d', label: 'Dollhouse', Icon: Box },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = cameraMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onCameraModeChange(id)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium transition border whitespace-nowrap ${
                  active
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-300'
                    : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpen2dMap}
            className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[10.5px] font-medium text-amber-200 hover:bg-amber-500/25 whitespace-nowrap"
          >
            <MapIcon className="h-3 w-3" />
            CAD 2D
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Ẩn hoặc hiện bảng phòng"
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium whitespace-nowrap transition ${
              sidebarOpen
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <PanelRight className="h-3 w-3" />
            Bảng Phòng
          </button>

          <button
            type="button"
            onClick={onExitWalkthrough}
            className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/20 px-2 py-1 text-[10.5px] font-semibold text-rose-200 hover:bg-rose-500/30 whitespace-nowrap"
          >
            <X className="h-3 w-3" />
            Thoát 3D
          </button>
        </div>
      </header>

      {/* Compact Collapsible Right-Hand 3D Room Drawer (252px) */}
      {sidebarOpen && (
        <aside className="fixed top-[54px] right-2.5 bottom-2.5 z-20 w-[252px] flex flex-col rounded-xl border border-[#26262b] bg-[#0f131a]/92 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="p-2.5 border-b border-[#26262b] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-300">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {activeRoom ? 'Trong Phòng 3D' : 'Phòng Đã Chọn'}
              </span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[#a1a1aa]">{displayRoom.code}</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Thu gọn bảng phòng"
                  className="rounded p-0.5 text-[#a1a1aa] hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#26262b] bg-[#080c14] p-2 space-y-1.5 text-xs">
              <div className="font-semibold text-[11px] text-white leading-snug">{displayRoom.name}</div>

              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="rounded bg-[#141417] px-1.5 py-1 border border-[#26262b]">
                  <div className="text-[9px] text-[#a1a1aa]">Diện tích</div>
                  <div className="font-mono font-bold text-white">{displayRoom.areaM2}m²</div>
                </div>
                <div className="rounded bg-[#141417] px-1.5 py-1 border border-[#26262b]">
                  <div className="text-[9px] text-[#a1a1aa]">Trần</div>
                  <div className="font-mono font-bold text-white">{displayRoom.ceilingHeightM}m</div>
                </div>
                <div className="rounded bg-[#141417] px-1.5 py-1 border border-[#26262b]">
                  <div className="text-[9px] text-[#a1a1aa] flex items-center gap-0.5">
                    <ThermometerSnowflake className="h-2.5 w-2.5 text-sky-400" /> HVAC
                  </div>
                  <div className="font-mono font-bold text-sky-300">{displayRoom.hvacKw}kW</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailsExpanded((v) => !v)}
                className="flex w-full items-center justify-between text-[10px] text-sky-300 hover:text-sky-200 pt-0.5"
              >
                <span>{detailsExpanded ? 'Thu gọn chi tiết thiết bị' : 'Xem chi tiết thiết bị'}</span>
                {detailsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {detailsExpanded && (
                <div className="space-y-1 pt-1 border-t border-[#26262b]">
                  <div className="text-[10px] text-sky-300">{displayRoom.gridZone}</div>
                  <p className="text-[10px] text-[#a1a1aa] leading-relaxed">{displayRoom.description}</p>
                  <ul className="space-y-0.5 text-[10px] text-[#d4d4d8] list-disc pl-3">
                    {displayRoom.equipmentList.map((eq, idx) => (
                      <li key={idx}>{eq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="px-2.5 py-1.5 border-b border-[#26262b] bg-[#0a0e14]/70 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 font-semibold uppercase text-amber-300">
                <ArrowUpDown className="h-2.5 w-2.5" />
                {nearestCore ? nearestCore.code : activeElevatorCore.code}
              </span>
              <span className="text-[#a1a1aa]">Thang B0↔L3</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {FLOOR_LEVEL_SPECS.map((fl) => (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => onUseElevatorCore(fl.id, activeElevatorCore)}
                  className={`rounded py-0.5 text-[10px] font-bold border transition ${
                    activeFloor === fl.id
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                      : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {fl.id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[10px] font-semibold uppercase text-[#a1a1aa] px-0.5">
              Phòng 3D ({floorRooms.length})
            </div>
            {floorRooms.map((room) => {
              const inside = activeRoom?.id === room.id;
              const selected = displayRoom.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onTeleportToRoom(room)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-left transition ${
                    inside
                      ? 'border-amber-400/70 bg-amber-500/15'
                      : selected
                        ? 'border-sky-400/50 bg-[#141a24]'
                        : 'border-[#26262b] bg-[#0a0e14] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-amber-300">{room.code}</span>
                    <span className="inline-flex items-center gap-0.5 text-emerald-300">
                      <DoorOpen className="h-2.5 w-2.5" />
                      {room.areaM2}m²
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-white truncate">{room.name}</div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Compact Collapsible Bottom-Left 2D Radar & Telemetry */}
      <div className="fixed bottom-2.5 left-2.5 z-20">
        {radarOpen ? (
          <div className="rounded-xl border border-[#26262b] bg-[#0f131a]/92 p-1.5 backdrop-blur-md shadow-2xl">
            <div className="relative">
              <canvas
                ref={miniCanvasRef}
                width={144}
                height={104}
                className="rounded-lg border border-[#1e293b] block"
              />
              <button
                type="button"
                onClick={() => setRadarOpen(false)}
                aria-label="Thu gọn Radar"
                className="absolute top-1 right-1 rounded bg-[#0f131a]/85 px-1.5 py-0.5 text-[9px] text-[#a1a1aa] hover:text-white border border-[#26262b]"
              >
                Thu gọn
              </button>
            </div>
            <div className="mt-1 font-mono text-[9.5px] text-emerald-300">
              {fpsTelemetry.fps} FPS · X:{avatarX.toFixed(0)} Y:{elevationY.toFixed(1)} Z:{avatarY.toFixed(0)} · v={avatarSpeed}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRadarOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#26262b] bg-[#0f131a]/92 px-2.5 py-1 font-mono text-[10px] text-emerald-300 backdrop-blur-md shadow-xl hover:border-emerald-400/50"
          >
            <span>
              {fpsTelemetry.fps} FPS · X:{avatarX.toFixed(0)} Z:{avatarY.toFixed(0)}
            </span>
            <span className="text-amber-300">Hiện Radar</span>
          </button>
        )}
      </div>

      {/* Compact On-Screen 3D D-Pad */}
      <div
        className={`fixed bottom-2.5 z-20 grid grid-cols-3 gap-0.5 rounded-xl border border-[#26262b] bg-[#0f131a]/92 p-1 backdrop-blur-md shadow-2xl transition-all ${
          sidebarOpen ? 'right-[264px]' : 'right-2.5'
        }`}
      >
        <div />
        <button
          type="button"
          aria-label="Đi tới 3D"
          onPointerDown={() => onSetDpadInput(0, -1)}
          onPointerUp={() => onSetDpadInput(0, 0)}
          onPointerLeave={() => onSetDpadInput(0, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1c212b] text-white hover:bg-emerald-500 hover:text-slate-950"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <div />
        <button
          type="button"
          aria-label="Xoay trái 3D"
          onPointerDown={() => onSetDpadInput(-1, 0)}
          onPointerUp={() => onSetDpadInput(0, 0)}
          onPointerLeave={() => onSetDpadInput(0, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1c212b] text-white hover:bg-emerald-500 hover:text-slate-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Đi lùi 3D"
          onPointerDown={() => onSetDpadInput(0, 1)}
          onPointerUp={() => onSetDpadInput(0, 0)}
          onPointerLeave={() => onSetDpadInput(0, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1c212b] text-white hover:bg-emerald-500 hover:text-slate-950"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Xoay phải 3D"
          onPointerDown={() => onSetDpadInput(1, 0)}
          onPointerUp={() => onSetDpadInput(0, 0)}
          onPointerLeave={() => onSetDpadInput(0, 0)}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1c212b] text-white hover:bg-emerald-500 hover:text-slate-950"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}
