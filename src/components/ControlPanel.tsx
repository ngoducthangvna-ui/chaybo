import { useState } from 'react';
import {
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  GitBranch,
  Layers,
  Moon,
  RotateCw,
  Route,
  Scissors,
  Sun,
  Sunset,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  type CameraPresetId,
  LOOPFORGE_SOP_NODES,
  type LightingMode,
  PITCH_SPECS,
  ROOF_SPECS,
  STADIUM_TIERS,
  calculateEvacuationMetrics,
  calculateStructuralMetrics,
  calculateTotalCapacity,
} from '../config/stadiumSpecs';

interface ControlPanelProps {
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  cameraPreset: CameraPresetId;
  onCameraPresetChange: (preset: CameraPresetId) => void;
  xrayRoof: boolean;
  onToggleXrayRoof: () => void;
  halfCutaway: boolean;
  onToggleHalfCutaway: () => void;
  bimFrameMode: boolean;
  onToggleBimFrameMode: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  occupancyPercent: number;
  onOccupancyChange: (value: number) => void;
  roofOpenPercent: number;
  onRoofOpenChange: (value: number) => void;
  showEvacPaths: boolean;
  onToggleEvacPaths: () => void;
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
  halfCutaway,
  onToggleHalfCutaway,
  bimFrameMode,
  onToggleBimFrameMode,
  autoRotate,
  onToggleAutoRotate,
  occupancyPercent,
  onOccupancyChange,
  roofOpenPercent,
  onRoofOpenChange,
  showEvacPaths,
  onToggleEvacPaths,
}: ControlPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'sop'>('specs');

  const totalCapacity = calculateTotalCapacity();
  const evac = calculateEvacuationMetrics(occupancyPercent);
  const structural = calculateStructuralMetrics(
    occupancyPercent,
    roofOpenPercent,
    false,
    lightingMode
  );

  return (
    <>
      {/* Top-Left Brand & Structural Engineering Card */}
      <header className="pointer-events-none fixed top-4 left-4 z-20 flex flex-col gap-2">
        <div className="pointer-events-auto rounded-2xl border border-[#26262b] bg-[#141417]/90 px-4 py-3 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h1 className="text-sm font-bold tracking-wider text-[#ededf0] uppercase">
              Vietnam 200K Stadium
            </h1>
            <span className="rounded-md border border-sky-500/30 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
              BIM RC + TRUSS
            </span>
          </div>
          <p className="mt-1 text-xs text-[#a1a1aa]">
            48 Khung BTCT (Grid A–E) • 48 Dàn kèo thép không gian 2 lớp
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-300 border border-amber-400/20">
              <Users className="h-3.5 w-3.5" />
              {totalCapacity.toLocaleString('en-US')} chỗ ngồi
            </span>
            <span className="rounded-full bg-[#26262c] px-2.5 py-1 text-[#ededf0] border border-[#26262b]">
              {ROOF_SPECS.steelTonnage.toLocaleString('en-US')} tấn thép
            </span>
          </div>
        </div>
      </header>

      {/* Top-Right Artifact & Telemetry Drawer */}
      <aside className="fixed top-4 right-4 z-20 w-[340px] rounded-2xl border border-[#26262b] bg-[#141417]/92 backdrop-blur-md shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          className="flex w-full items-center justify-between bg-[#0a0a0b]/80 px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#ededf0] uppercase hover:bg-white/5 transition"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            Kỹ thuật & LoopForge SOP
          </span>
          {drawerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {drawerOpen && (
          <div className="border-t border-[#26262b]">
            <div className="grid grid-cols-2 gap-1 bg-[#0a0a0b] p-1.5 border-b border-[#26262b]">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${
                  activeTab === 'specs'
                    ? 'bg-[#26262c] text-[#ededf0] shadow'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Kỹ thuật & Kết cấu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sop')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                  activeTab === 'sop'
                    ? 'bg-[#26262c] text-[#ededf0] shadow'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                LoopForge SOP
              </button>
            </div>

            {activeTab === 'specs' ? (
              <div className="px-4 py-3 space-y-3 text-xs max-h-[68vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-[#ededf0]">
                  <div className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/60 p-2">
                    <div className="text-[10px] text-[#a1a1aa] uppercase flex items-center gap-1">
                      <Volume2 className="h-3 w-3 text-rose-400" />
                      Âm lượng cổ vũ
                    </div>
                    <div className="mt-0.5 font-mono font-semibold text-white">
                      {structural.crowdDecibels} dB
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/60 p-2">
                    <div className="text-[10px] text-[#a1a1aa] uppercase flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      Công suất điện
                    </div>
                    <div className="mt-0.5 font-mono font-semibold text-white">
                      {structural.powerConsumptionMw} MW
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/60 p-2">
                    <div className="text-[10px] text-[#a1a1aa] uppercase">Công-xôn thép / Gối E</div>
                    <div className="mt-0.5 font-semibold text-white">
                      100m · H={ROOF_SPECS.trussRootDepth}m→{ROOF_SPECS.trussTipDepth}m
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/60 p-2">
                    <div className="text-[10px] text-[#a1a1aa] uppercase">Tầm nhìn C-Value</div>
                    <div className="mt-0.5 font-semibold text-emerald-400">
                      {evac.cValueMm} mm (Chuẩn FIFA)
                    </div>
                  </div>
                </div>

                {/* Retractable Oculus Roof Slider */}
                <div className="rounded-xl border border-[#26262b] bg-[#0a0a0b]/60 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#ededf0] uppercase">
                      Mở mái trượt trung tâm
                    </span>
                    <span className="font-mono font-semibold text-sky-300">
                      {roofOpenPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={roofOpenPercent}
                    aria-label="Mức mở mái trượt trung tâm"
                    onChange={(e) => onRoofOpenChange(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {/* Crowd Occupancy & Evacuation Simulator */}
                <div className="rounded-xl border border-[#26262b] bg-[#0a0a0b]/60 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#ededf0] uppercase">
                      Lấp đầy khán giả ({evac.occupancyPercent}%)
                    </span>
                    <span className="font-mono font-semibold text-amber-300">
                      {evac.seatedCount.toLocaleString('en-US')} người
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={occupancyPercent}
                    aria-label="Tỷ lệ lấp đầy khán giả"
                    onChange={(e) => onOccupancyChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#a1a1aa]">
                    <span>{evac.exitGates} cửa • {PITCH_SPECS.length}×{PITCH_SPECS.width}m</span>
                    <span>
                      Thoát hiểm:{' '}
                      <strong className="text-emerald-400">{evac.estimatedEvacMinutes} phút</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleEvacPaths}
                    aria-pressed={showEvacPaths}
                    className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition border ${
                      showEvacPaths
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-[#26262b] bg-[#141417] text-[#a1a1aa] hover:text-white'
                    }`}
                  >
                    <Route className="h-3.5 w-3.5" />
                    {showEvacPaths ? 'Đang hiện Tuyến thoát hiểm 3D' : 'Hiển thị Tuyến thoát hiểm 3D'}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-[#a1a1aa] uppercase">
                    Phân bổ 4 tầng khán đài (Gối trên Grid A–E)
                  </div>
                  {STADIUM_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between rounded-md border border-[#26262b] bg-[#0a0a0b]/50 px-2.5 py-1"
                    >
                      <span className="text-[#ededf0] truncate pr-2">{tier.name}</span>
                      <span className="font-mono font-semibold text-amber-300">
                        {tier.seats.toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-2 text-xs max-h-[68vh] overflow-y-auto">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                  Quy trình chuẩn LoopForge DevFlow chạy trực tiếp qua{' '}
                  <code className="font-mono text-amber-300">workflow_state.py</code> và chuẩn{' '}
                  <code className="font-mono text-amber-300">design.md</code>.
                </div>
                {LOOPFORGE_SOP_NODES.map((node) => (
                  <div
                    key={node.id}
                    className="rounded-lg border border-[#26262b] bg-[#0a0a0b]/70 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#ededf0]">{node.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          node.status === 'passed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-sky-500/15 text-sky-300'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {node.status === 'passed' ? 'Hoàn thành' : 'Sẵn sàng'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#a1a1aa] flex items-center justify-between">
                      <span>{node.role}</span>
                      <code className="font-mono text-[10px] text-slate-400 truncate max-w-[155px]">
                        {node.artifact}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Bottom-Center Interactive Controls */}
      <nav
        aria-label="Điều khiển mô hình 3D"
        className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#26262b] bg-[#141417]/90 p-2 backdrop-blur-md shadow-2xl max-w-[97vw]"
      >
        <div className="flex items-center gap-1 rounded-xl bg-[#0a0a0b] p-1">
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
                    : 'text-[#a1a1aa] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#0a0a0b] p-1">
          <Camera className="mx-1 h-3.5 w-3.5 text-[#a1a1aa] hidden sm:block" />
          {CAMERA_PRESETS.map((preset) => {
            const active = cameraPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onCameraPresetChange(preset.id)}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-[#a1a1aa] hover:bg-white/10 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Structural BIM & Architectural Inspection Modes */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={onToggleBimFrameMode}
            aria-pressed={bimFrameMode}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition border ${
              bimFrameMode
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                : 'border-[#26262b] bg-[#0a0a0b] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            Khung Kết Cấu (BIM)
          </button>

          <button
            type="button"
            onClick={onToggleXrayRoof}
            aria-pressed={xrayRoof}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition border ${
              xrayRoof
                ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
                : 'border-[#26262b] bg-[#0a0a0b] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            X-Ray Mái
          </button>

          <button
            type="button"
            onClick={onToggleHalfCutaway}
            aria-pressed={halfCutaway}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition border ${
              halfCutaway
                ? 'border-violet-400/50 bg-violet-500/20 text-violet-300'
                : 'border-[#26262b] bg-[#0a0a0b] text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Mặt cắt 90°
          </button>

          <button
            type="button"
            onClick={onToggleAutoRotate}
            aria-pressed={autoRotate}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition border ${
              autoRotate
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                : 'border-[#26262b] bg-[#0a0a0b] text-[#a1a1aa] hover:text-white'
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
