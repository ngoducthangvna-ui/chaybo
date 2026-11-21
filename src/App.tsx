import { Suspense, useState } from 'react';
import type { CameraPresetId, LightingMode } from './config/stadiumSpecs';
import { StadiumScene } from './scene/StadiumScene';
import { ControlPanel } from './components/ControlPanel';

export function App() {
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [xrayRoof, setXrayRoof] = useState(false);
  const [halfCutaway, setHalfCutaway] = useState(false);
  const [bimFrameMode, setBimFrameMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [occupancyPercent, setOccupancyPercent] = useState(85);
  const [roofOpenPercent, setRoofOpenPercent] = useState(75);
  const [showEvacPaths, setShowEvacPaths] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-300">
            Đang dựng mô hình BIM 3D Sân vận động 200.000 chỗ ngồi...
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
        />
      </Suspense>

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
      />
    </main>
  );
}

export default App;
