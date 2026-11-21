import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react';
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

function SkyDome({ topColor, horizonColor }: { topColor: string; horizonColor: string }) {
  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color(topColor) },
      uHorizonColor: { value: new THREE.Color(horizonColor) },
    }),
    []
  );

  useEffect(() => {
    uniforms.uTopColor.value.set(topColor);
    uniforms.uHorizonColor.value.set(horizonColor);
  }, [topColor, horizonColor, uniforms]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[900, 32, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 uTopColor;
          uniform vec3 uHorizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float factor = pow(max(h, 0.0), 0.55);
            gl_FragColor = vec4(mix(uHorizonColor, uTopColor, factor), 1.0);
          }
        `}
      />
    </mesh>
  );
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
  const desiredPos = useRef(new THREE.Vector3(248, 138, 238));
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
      maxDistance={480}
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
  const isNight = lightingMode !== 'day';

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{ position: [248, 138, 238], fov: 45, near: 1, far: 1800 }}
        className="h-full w-full"
      >
        <color attach="background" args={[lighting.skyColor]} />
        <fog attach="fog" args={[lighting.fogColor, 360, 880]} />

        <SkyDome topColor={lighting.skyColor} horizonColor={lighting.horizonColor} />

        {lightingMode === 'night' && (
          <Stars radius={420} depth={80} count={2500} factor={4} saturation={0.2} fade />
        )}

        <hemisphereLight args={[lighting.skyColor, '#334155', 0.88]} />
        <ambientLight intensity={lighting.ambientIntensity} />
        <directionalLight
          position={[...lighting.sunPosition]}
          color={lighting.sunColor}
          intensity={lighting.sunIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={700}
          shadow-camera-left={-240}
          shadow-camera-right={240}
          shadow-camera-top={240}
          shadow-camera-bottom={-240}
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

        <Surroundings halfCutaway={halfCutaway} isNight={isNight} />
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
