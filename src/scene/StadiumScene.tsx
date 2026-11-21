import { Component, type ReactNode, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
  autoRotate: boolean;
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
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6">
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
  const desiredPos = useRef(new THREE.Vector3(235, 145, 225));
  const desiredTarget = useRef(new THREE.Vector3(0, 20, 0));
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
      autoRotateSpeed={0.55}
      minDistance={30}
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
  autoRotate,
}: StadiumSceneProps) {
  const lighting = getLightingConfig(lightingMode);

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [235, 145, 225], fov: 45, near: 1, far: 1500 }}
        className="h-full w-full"
      >
        <color attach="background" args={[lighting.skyColor]} />
        <fog attach="fog" args={[lighting.fogColor, 260, 720]} />

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

        {/* Stadium floodlight pools illuminating the FIFA pitch */}
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
        <BowlStands ledGlowIntensity={lighting.ledGlowIntensity} />
        <RoofStructure
          xrayRoof={xrayRoof}
          floodlightIntensity={lighting.floodlightIntensity}
        />

        <CameraRig presetId={cameraPreset} autoRotate={autoRotate} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
