import { Suspense, useState } from 'react';
import type { CameraPresetId, LightingMode } from './config/stadiumSpecs';
import { StadiumScene } from './scene/StadiumScene';
import { ControlPanel } from './components/ControlPanel';
import { FloorplanExplorer2D } from './components/FloorplanExplorer2D';

export function App() {
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('masterplan');
  const [xrayRoof, setXrayRoof] = useState(false);
  const [halfCutaway, setHalfCutaway] = useState(false);
  const [bimFrameMode, setBimFrameMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [occupancyPercent, setOccupancyPercent] = useState(100);
  const [roofOpenPercent, setRoofOpenPercent] = useState(75);
  const [showEvacPaths, setShowEvacPaths] = useState(false);
  const [liveSimActive, setLiveSimActive] = useState(true);
  const [explorer2dOpen, setExplorer2dOpen] = useState(false);
  const [explorerSplitMode, setExplorerSplitMode] = useState(true);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div
        className={`h-full w-full transition-all duration-300 ${
          explorer2dOpen && explorerSplitMode ? 'lg:pl-[58vw]' : ''
        }`}
      >
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-300">
              Đang dựng Quần thể Sân vận động Quốc gia 200.000 chỗ ngồi...
            </div>
          }
        >
          <StadiumScene
            lightingMode={lightingMode}
            cameraPreset={cameraPreset}
            xrayRoof={xrayRoof}
            halfCutaway={halfCutaway}
            bimFrameMode={bimFrameMode}
            autoRotate={autoRotate}
            occupancyPercent={occupancyPercent}
            roofOpenPercent={roofOpenPercent}
            showEvacPaths={showEvacPaths}
            liveSimActive={liveSimActive}
          />
        </Suspense>
      </div>

      {!explorer2dOpen && (
        <ControlPanel
          lightingMode={lightingMode}
          onLightingChange={setLightingMode}
          cameraPreset={cameraPreset}
          onCameraPresetChange={setCameraPreset}
          xrayRoof={xrayRoof}
          onToggleXrayRoof={() => setXrayRoof((v) => !v)}
          halfCutaway={halfCutaway}
          onToggleHalfCutaway={() => setHalfCutaway((v) => !v)}
          bimFrameMode={bimFrameMode}
          onToggleBimFrameMode={() => setBimFrameMode((v) => !v)}
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate((v) => !v)}
          occupancyPercent={occupancyPercent}
          onOccupancyChange={setOccupancyPercent}
          roofOpenPercent={roofOpenPercent}
          onRoofOpenChange={setRoofOpenPercent}
          showEvacPaths={showEvacPaths}
          onToggleEvacPaths={() => setShowEvacPaths((v) => !v)}
          liveSimActive={liveSimActive}
          onToggleLiveSim={() => setLiveSimActive((v) => !v)}
          explorer2dOpen={explorer2dOpen}
          onToggleExplorer2d={() => setExplorer2dOpen((v) => !v)}
        />
      )}

      <FloorplanExplorer2D
        isOpen={explorer2dOpen}
        splitMode={explorerSplitMode}
        onToggleSplitMode={() => setExplorerSplitMode((v) => !v)}
        onClose={() => setExplorer2dOpen(false)}
        onSync3dCamera={(preset, enableCutaway) => {
          setCameraPreset(preset);
          setHalfCutaway(enableCutaway);
        }}
      />
    </main>
  );
}

export default App;
