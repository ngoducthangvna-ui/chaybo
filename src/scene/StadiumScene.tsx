import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Line, OrbitControls, Sky, Stars } from '@react-three/drei';
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
import { InteriorRooms3D } from './InteriorRooms3D';
import {
  type FloorLevelId,
  STADIUM_INTERIOR_ROOMS,
  type StadiumRoomSpec,
  type Walkthrough3DCameraMode,
  getRoom3dWalkthroughPose,
} from '../config/interiorRooms';

interface StadiumSceneProps {
  lightingMode: LightingMode;
  cameraPreset: CameraPresetId;
  xrayRoof: boolean;
  halfCutaway: boolean;
  bimFrameMode: boolean;
  autoRotate: boolean;
  occupancyPercent: number;
  roofOpenPercent: number;
  showEvacPaths: boolean;
  liveSimActive: boolean;
  walkthrough3dActive?: boolean;
  walkthroughFloor?: FloorLevelId;
  walkthroughCameraMode?: Walkthrough3DCameraMode;
  walkthroughAvatar?: { x: number; y: number; heading: number; speedMps: number };
  walkthroughRoom?: StadiumRoomSpec | null;
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

/**
 * Custom architectural HDRI studio environment built from positioned Lightformer panels
 * so metallic diagrids, dark obsidian glazing, and PTFE membranes catch crisp directional speculars.
 */
function CustomStudioEnvironment({
  lightingMode,
  sunColor,
}: {
  lightingMode: LightingMode;
  sunColor: string;
}) {
  const { gl } = useThree();
  const isNight = lightingMode === 'night';
  const isSunset = lightingMode === 'sunset';

  useEffect(() => {
    gl.toneMappingExposure = isNight ? 1.12 : 0.98;
  }, [gl, isNight]);
  const envIntensity = isNight ? 0.55 : isSunset ? 0.78 : 0.92;
  const zenithColor = isNight ? '#1e293b' : isSunset ? '#1e3a5f' : '#bae6fd';
  const keyColor = isNight ? '#fde68a' : sunColor;
  const fillColor = isNight ? '#38bdf8' : isSunset ? '#fbbf24' : '#e0f2fe';

  return (
    <Environment key={lightingMode} resolution={512} frames={2} environmentIntensity={envIntensity}>
      <group rotation={[-Math.PI / 3, 0, 0.35]}>
        {/* Overhead zenith sky softbox */}
        <Lightformer
          form="circle"
          intensity={isNight ? 0.9 : 1.7}
          color={zenithColor}
          position={[0, 12, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={24}
        />
        {/* High-energy solar specular key panel */}
        <Lightformer
          form="circle"
          intensity={isNight ? 2.6 : isSunset ? 7.5 : 8.5}
          color={keyColor}
          position={[14, 9, 10]}
          scale={12}
          target={[0, 0, 0]}
        />
        {/* Cool architectural sky rim strip */}
        <Lightformer
          form="rect"
          intensity={isNight ? 1.5 : 2.3}
          color={fillColor}
          position={[-16, 6, -12]}
          scale={[22, 6, 1]}
          target={[0, 0, 0]}
        />
        {/* Warm travertine & floodlight horizon bounce ring */}
        <Lightformer
          form="ring"
          intensity={isNight ? 1.15 : 0.75}
          color={isNight || isSunset ? '#fbbf24' : '#d6d3d1'}
          position={[0, -6, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={28}
        />
      </group>
    </Environment>
  );
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
      <sphereGeometry args={[1250, 32, 24]} />
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
  walkthrough3dActive,
  walkthroughCameraMode,
  walkthroughAvatar,
  walkthroughRoom,
}: {
  presetId: CameraPresetId;
  autoRotate: boolean;
  walkthrough3dActive: boolean;
  walkthroughCameraMode: Walkthrough3DCameraMode;
  walkthroughAvatar: { x: number; y: number; heading: number; speedMps: number };
  walkthroughRoom: StadiumRoomSpec;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const desiredPos = useRef(new THREE.Vector3(365, 205, 355));
  const desiredTarget = useRef(new THREE.Vector3(0, 14, 0));
  const transitioning = useRef(false);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const nextNear = walkthrough3dActive ? 0.35 : 2;
    if (cam.near !== nextNear) {
      cam.near = nextNear;
      cam.updateProjectionMatrix();
    }
    if (walkthrough3dActive) return;
    const preset = getCameraPreset(presetId);
    desiredPos.current.set(...preset.position);
    desiredTarget.current.set(...preset.target);
    transitioning.current = true;
  }, [camera, presetId, walkthrough3dActive]);

  useEffect(() => {
    if (!walkthrough3dActive) return;
    const pose = getRoom3dWalkthroughPose(
      walkthroughRoom,
      walkthroughAvatar.x,
      walkthroughAvatar.y,
      walkthroughAvatar.heading,
      walkthroughCameraMode
    );
    desiredPos.current.set(...pose.cameraPos);
    desiredTarget.current.set(...pose.targetPos);
    transitioning.current = true;
  }, [
    walkthrough3dActive,
    walkthroughCameraMode,
    walkthroughAvatar.x,
    walkthroughAvatar.y,
    walkthroughAvatar.heading,
    walkthroughRoom,
  ]);

  useFrame((_, delta) => {
    if (!transitioning.current || !controlsRef.current) {
      return;
    }
    const speedMult = walkthrough3dActive ? 9.5 : 3.5;
    const step = Math.min(1, delta * speedMult);
    camera.position.lerp(desiredPos.current, step);
    controlsRef.current.target.lerp(desiredTarget.current, step);
    controlsRef.current.update();

    if (camera.position.distanceTo(desiredPos.current) < (walkthrough3dActive ? 0.08 : 0.8)) {
      transitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      autoRotate={autoRotate && !walkthrough3dActive}
      autoRotateSpeed={0.35}
      minDistance={walkthrough3dActive ? 0.8 : 28}
      maxDistance={760}
      maxPolarAngle={walkthrough3dActive ? Math.PI - 0.15 : Math.PI / 2 - 0.03}
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
  bimFrameMode,
  autoRotate,
  occupancyPercent,
  roofOpenPercent,
  showEvacPaths,
  liveSimActive,
  walkthrough3dActive = false,
  walkthroughFloor = 'B0',
  walkthroughCameraMode = 'follow3d',
  walkthroughAvatar = { x: -110, y: -33, heading: -Math.PI / 2, speedMps: 0 },
  walkthroughRoom = null,
}: StadiumSceneProps) {
  const lighting = getLightingConfig(lightingMode);
  const showSightline = !walkthrough3dActive && (cameraPreset === 'sky' || cameraPreset === 'vip');
  const isNight = lightingMode !== 'day';
  const activeRoomForRig = walkthroughRoom ?? STADIUM_INTERIOR_ROOMS[0];

  return (
    <SceneErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isNight ? 1.12 : 0.98,
        }}
        camera={{ position: [365, 205, 355], fov: 45, near: 2, far: 12000 }}
        className="h-full w-full"
      >
        <color attach="background" args={[lighting.skyColor]} />
        <fog attach="fog" args={[lighting.fogColor, 720, 1950]} />

        <CustomStudioEnvironment lightingMode={lightingMode} sunColor={lighting.sunColor} />

        {lightingMode === 'night' ? (
          <>
            <SkyDome topColor={lighting.skyColor} horizonColor={lighting.horizonColor} />
            <Stars radius={520} depth={90} count={2500} factor={4} saturation={0.2} fade />
          </>
        ) : (
          <Sky
            distance={4800}
            sunPosition={[...lighting.sunPosition]}
            turbidity={lightingMode === 'sunset' ? 7.5 : 3.2}
            rayleigh={lightingMode === 'sunset' ? 3.4 : 2.1}
            mieCoefficient={lightingMode === 'sunset' ? 0.008 : 0.004}
            mieDirectionalG={0.86}
          />
        )}

        <hemisphereLight
          args={[
            lighting.skyColor,
            lightingMode === 'night' ? '#0f172a' : '#292524',
            lightingMode === 'day' ? 0.28 : 0.22,
          ]}
        />
        <ambientLight intensity={lighting.ambientIntensity * 0.45} />
        <directionalLight
          position={[-220, 115, -185]}
          color={lightingMode === 'sunset' ? '#60a5fa' : '#cbd5e1'}
          intensity={lightingMode === 'night' ? 0.35 : 0.48}
        />
        <directionalLight
          position={[...lighting.sunPosition]}
          color={lighting.sunColor}
          intensity={lighting.sunIntensity}
          castShadow
          shadow-mapSize-width={1536}
          shadow-mapSize-height={1536}
          shadow-camera-near={10}
          shadow-camera-far={1100}
          shadow-camera-left={-420}
          shadow-camera-right={420}
          shadow-camera-top={420}
          shadow-camera-bottom={-420}
          shadow-bias={-0.0003}
          shadow-normalBias={0.04}
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

        <Surroundings
          halfCutaway={halfCutaway}
          isNight={isNight}
          bimFrameMode={bimFrameMode}
          occupancyPercent={occupancyPercent}
          liveSimActive={liveSimActive}
        />
        <Pitch liveMatchActive={liveSimActive} />
        <BowlStands
          ledGlowIntensity={lighting.ledGlowIntensity}
          halfCutaway={halfCutaway}
          bimFrameMode={bimFrameMode}
          occupancyPercent={occupancyPercent}
          showEvacPaths={showEvacPaths}
          liveSimActive={liveSimActive}
          walkthrough3dActive={walkthrough3dActive}
          walkthroughCameraMode={walkthroughCameraMode}
        />
        <InteriorRooms3D
          activeFloor={walkthroughFloor}
          walkthrough3dActive={walkthrough3dActive}
          cameraMode={walkthroughCameraMode}
          avatarX={walkthroughAvatar.x}
          avatarY={walkthroughAvatar.y}
          avatarHeading={walkthroughAvatar.heading}
          avatarSpeed={walkthroughAvatar.speedMps}
          activeRoomId={activeRoomForRig.id}
        />
        <RoofStructure
          xrayRoof={xrayRoof || (walkthrough3dActive && walkthroughCameraMode === 'cutaway3d')}
          halfCutaway={halfCutaway}
          bimFrameMode={bimFrameMode}
          floodlightIntensity={lighting.floodlightIntensity}
          roofOpenPercent={roofOpenPercent}
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

        <CameraRig
          presetId={cameraPreset}
          autoRotate={autoRotate}
          walkthrough3dActive={walkthrough3dActive}
          walkthroughCameraMode={walkthroughCameraMode}
          walkthroughAvatar={walkthroughAvatar}
          walkthroughRoom={activeRoomForRig}
        />
      </Canvas>
    </SceneErrorBoundary>
  );
}
