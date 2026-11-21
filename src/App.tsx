import { Suspense, useState } from 'react';
import type { CameraPresetId, LightingMode } from './config/stadiumSpecs';
import { StadiumScene } from './scene/StadiumScene';
import { ControlPanel } from './components/ControlPanel';

export function App() {
  const [lightingMode, setLightingMode] = useState<LightingMode>('night');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [xrayRoof, setXrayRoof] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-300">
            Đang dựng mô hình 3D Sân vận động 200.000 chỗ ngồi...
          </div>
        }
      >
        <StadiumScene
          lightingMode={lightingMode}
          cameraPreset={cameraPreset}
          xrayRoof={xrayRoof}
          autoRotate={autoRotate}
        />
      </Suspense>

      <ControlPanel
        lightingMode={lightingMode}
        onLightingChange={setLightingMode}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
        xrayRoof={xrayRoof}
        onToggleXrayRoof={() => setXrayRoof((v) => !v)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((v) => !v)}
      />
    </main>
  );
}

export default App;
