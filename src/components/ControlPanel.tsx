import { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Moon,
  RotateCw,
  Sun,
  Sunset,
  Users,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  type CameraPresetId,
  type LightingMode,
  PITCH_SPECS,
  ROOF_SPECS,
  STADIUM_TIERS,
  calculateTotalCapacity,
} from '../config/stadiumSpecs';

interface ControlPanelProps {
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  cameraPreset: CameraPresetId;
  onCameraPresetChange: (preset: CameraPresetId) => void;
  xrayRoof: boolean;
  onToggleXrayRoof: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

const LIGHTING_OPTIONS: Array<{
  mode: LightingMode;
  label: string;
  Icon: typeof Sun;
}> = [
  { mode: 'day', label: 'Ban ngày', Icon: Sun },
  { mode: 'sunset', label: 'Hoàng hôn', Icon: Sunset },
  { mode: 'night', label: 'Đêm thi đấu', Icon: Moon },
];

export function ControlPanel({
  lightingMode,
  onLightingChange,
  cameraPreset,
  onCameraPresetChange,
  xrayRoof,
  onToggleXrayRoof,
  autoRotate,
  onToggleAutoRotate,
}: ControlPanelProps) {
  const [specsOpen, setSpecsOpen] = useState(true);
  const totalCapacity = calculateTotalCapacity();

  return (
    <>
      {/* Top-Left Brand & Capacity Badge */}
      <header className="pointer-events-none fixed top-4 left-4 z-20 flex flex-col gap-2">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <h1 className="text-sm font-bold tracking-wider text-white uppercase">
              Vietnam 200K Stadium
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Thiết kế Kiến trúc Trống Đồng & Mô hình 3D Thời gian thực
          </p>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-300 border border-amber-400/20">
              <Users className="h-3.5 w-3.5" />
              {totalCapacity.toLocaleString('en-US')} chỗ ngồi
            </span>
            <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-slate-300 border border-white/10">
              4 Tầng khán đài
            </span>
          </div>
        </div>
      </header>

      {/* Top-Right Technical Specs Drawer */}
      <aside className="fixed top-4 right-4 z-20 w-72 rounded-2xl border border-white/10 bg-slate-950/75 backdrop-blur-md shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setSpecsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-200 uppercase hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            Thông số Kỹ thuật
          </span>
          {specsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {specsOpen && (
          <div className="border-t border-white/10 px-4 py-3 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Phủ bì mái</div>
                <div className="font-semibold text-white">
                  {ROOF_SPECS.outerRadiusX * 2}m × {ROOF_SPECS.outerRadiusZ * 2}m
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Chiều cao đỉnh</div>
                <div className="font-semibold text-white">{ROOF_SPECS.peakHeight}m</div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Mặt sân FIFA</div>
                <div className="font-semibold text-white">
                  {PITCH_SPECS.length}m × {PITCH_SPECS.width}m
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <div className="text-[10px] text-slate-400 uppercase">Hệ vòm thép</div>
                <div className="font-semibold text-white">{ROOF_SPECS.ribCount} nhịp</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase">
                Phân bổ 4 tầng khán đài
              </div>
              {STADIUM_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1.5"
                >
                  <span className="text-slate-300 truncate pr-2">{tier.name}</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {tier.seats.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Bottom-Center Interactive Controls */}
      <nav
        aria-label="Điều khiển mô hình 3D"
        className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-2 backdrop-blur-md shadow-2xl max-w-[95vw]"
      >
        {/* Lighting Mode */}
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          {LIGHTING_OPTIONS.map(({ mode, label, Icon }) => {
            const active = lightingMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onLightingChange(mode)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Camera Presets */}
        <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          <Camera className="mx-1.5 h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          {CAMERA_PRESETS.map((preset) => {
            const active = cameraPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onCameraPresetChange(preset.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleXrayRoof}
            aria-pressed={xrayRoof}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
              xrayRoof
                ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            X-Ray Mái
          </button>

          <button
            type="button"
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
              autoRotate
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            Xoay
          </button>
        </div>
      </nav>
    </>
  );
}
