import { Component, type ReactNode, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  type CameraPresetId,
  type LightingMode,
  getCameraPreset,
  getLightingConfig,
} from '../config/stadiumSpecs';
import { Pitch } from './Pitch';
import { BowlStands } from './BowlStands';
import { RoofStructure } from './RoofStructure';
import { Surroundings } from './Surroundings';

interface StadiumSceneProps {
  lightingMode: LightingMode;
  cameraPreset: CameraPresetId;
  xrayRoof: boolean;
  halfCutaway: boolean;
  autoRotate: boolean;
  occupancyPercent: number;
  roofOpenPercent: number;
  ceremonyMode: boolean;
  crowdWave: boolean;
  showEvacPaths: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#141417] p-6">
            <h2 className="text-lg font-semibold text-rose-400">Không thể khởi tạo WebGL 3D</h2>
            <p className="mt-2 text-sm text-slate-300">
              Trình duyệt hoặc thiết bị hiện tại không hỗ trợ WebGL. Vui lòng bật tăng tốc phần cứng và tải lại trang.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CameraRig({
  presetId,
  autoRotate,
}: {
  presetId: CameraPresetId;
  autoRotate: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3(245, 150, 235));
  const desiredTarget = useRef(new THREE.Vector3(0, 22, 0));
  const transitioning = useRef(false);

  useEffect(() => {
    const preset = getCameraPreset(presetId);
    desiredPos.current.set(...preset.position);
    desiredTarget.current.set(...preset.target);
    transitioning.current = true;
  }, [presetId]);

  useFrame((_, delta) => {
    if (!transitioning.current || !controlsRef.current) {
      return;
    }
    const step = Math.min(1, delta * 3.5);
    camera.position.lerp(desiredPos.current, step);
    controlsRef.current.target.lerp(desiredTarget.current, step);
    controlsRef.current.update();

    if (camera.position.distanceTo(desiredPos.current) < 0.8) {
      transitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      autoRotate={autoRotate}
      autoRotateSpeed={0.45}
      minDistance={28}
      maxDistance={460}
      maxPolarAngle={Math.PI / 2 - 0.03}
      onStart={() => {
        transitioning.current = false;
      }}
    />
  );
}

export function StadiumScene({
  lightingMode,
  cameraPreset,
  xrayRoof,
  halfCutaway,
  autoRotate,
  occupancyPercent,
  roofOpenPercent,
  ceremonyMode,
  crowdWave,
  showEvacPaths,
}: StadiumSceneProps) {
  const lighting = getLightingConfig(lightingMode);
  const showSightline = cameraPreset === 'sky' || cameraPreset === 'vip';

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [245, 150, 235], fov: 45, near: 1, far: 1500 }}
        className="h-full w-full"
      >
        <color attach="background" args={[lighting.skyColor]} />
        <fog attach="fog" args={[lighting.fogColor, 260, 740]} />

        {lightingMode === 'night' && (
          <Stars radius={380} depth={80} count={2500} factor={4} saturation={0.2} fade />
        )}

        <ambientLight intensity={lighting.ambientIntensity} />
        <directionalLight
          position={[...lighting.sunPosition]}
          color={lighting.sunColor}
          intensity={lighting.sunIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={650}
          shadow-camera-left={-220}
          shadow-camera-right={220}
          shadow-camera-top={220}
          shadow-camera-bottom={-220}
        />

        {lighting.floodlightIntensity > 0 && (
          <>
            <pointLight
              position={[0, 72, 0]}
              color="#fef9c3"
              intensity={lighting.floodlightIntensity * 2800}
              distance={260}
              decay={1.6}
            />
            <pointLight
              position={[55, 65, 35]}
              color="#fffbeb"
              intensity={lighting.floodlightIntensity * 1200}
              distance={200}
              decay={1.6}
            />
            <pointLight
              position={[-55, 65, -35]}
              color="#fffbeb"
              intensity={lighting.floodlightIntensity * 1200}
              distance={200}
              decay={1.6}
            />
          </>
        )}

        <Surroundings />
        <Pitch />
        <BowlStands
          ledGlowIntensity={lighting.ledGlowIntensity}
          halfCutaway={halfCutaway}
          occupancyPercent={occupancyPercent}
          crowdWave={crowdWave}
          showEvacPaths={showEvacPaths}
        />
        <RoofStructure
          xrayRoof={xrayRoof}
          halfCutaway={halfCutaway}
          floodlightIntensity={lighting.floodlightIntensity}
          facadeGlowColor={lighting.facadeGlowColor}
          roofOpenPercent={roofOpenPercent}
          ceremonyMode={ceremonyMode}
        />

        {showSightline && (
          <Line
            points={[
              [-158, 66, 0],
              [-52.5, 0.2, 0],
            ]}
            color="#38bdf8"
            lineWidth={2.5}
            dashed
            dashSize={3}
            gapSize={1.5}
          />
        )}

        <CameraRig presetId={cameraPreset} autoRotate={autoRotate} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
