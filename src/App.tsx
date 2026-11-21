import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CameraPresetId, LightingMode } from './config/stadiumSpecs';
import {
  FLOOR_LEVEL_SPECS,
  type FloorLevelId,
  type FramePerformanceTelemetry,
  STADIUM_INTERIOR_ROOMS,
  type StadiumRoomSpec,
  type VerticalCoreSpec,
  type Walkthrough3DCameraMode,
  evaluateFramePerformance,
  findRoomAtPoint,
  getRoomNpcPoses,
  getRoomSafeSpawnPoint,
  getRoomsByFloor,
  stepExplorerAvatar,
} from './config/interiorRooms';
import { StadiumScene } from './scene/StadiumScene';
import { ControlPanel } from './components/ControlPanel';
import { FloorplanExplorer2D } from './components/FloorplanExplorer2D';
import { Walkthrough3DHud } from './components/Walkthrough3DHud';

function getRoomHeroHeading(room: StadiumRoomSpec): number {
  if (room.id === 'players-tunnel') return 0; // Look East down red-carpet tunnel onto live FIFA pitch
  if (room.id === 'presidential-vvip' || room.id === 'skybox-suites' || room.id === 'press-auditorium') {
    return -Math.PI / 2; // Look North across pitch
  }
  if (room.id === 'var-broadcast-hub' || room.id === 'mep-substation' || room.id === 'bms-security') {
    return room.bounds.x < 0 ? Math.PI : 0;
  }
  const cx = room.bounds.x + room.bounds.w * 0.5;
  const cy = room.bounds.y + room.bounds.h * 0.5;
  return Math.atan2(cy - room.door.y, cx - room.door.x);
}

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

  const [walkthrough3dActive, setWalkthrough3dActive] = useState(false);
  const [walkthroughFloor, setWalkthroughFloor] = useState<FloorLevelId>('B0');
  const [walkthroughCameraMode, setWalkthroughCameraMode] = useState<Walkthrough3DCameraMode>('follow3d');
  const [walkthroughSelectedId, setWalkthroughSelectedId] = useState<string>('home-locker');
  const [walkthroughAvatar, setWalkthroughAvatar] = useState({
    x: -110,
    y: -31,
    heading: -Math.PI / 2,
    speedMps: 0,
  });
  const [fpsTelemetry, setFpsTelemetry] = useState<FramePerformanceTelemetry>(() =>
    evaluateFramePerformance(2.1)
  );

  const avatarRef = useRef(walkthroughAvatar);
  const keysRef = useRef<Set<string>>(new Set());
  const dpadRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const floorRooms = useMemo(() => getRoomsByFloor(walkthroughFloor), [walkthroughFloor]);
  const currentInsideRoom = useMemo(
    () => findRoomAtPoint(walkthroughFloor, walkthroughAvatar.x, walkthroughAvatar.y),
    [walkthroughFloor, walkthroughAvatar.x, walkthroughAvatar.y]
  );
  const selectedWalkthroughRoom = useMemo(
    () =>
      currentInsideRoom ??
      floorRooms.find((r) => r.id === walkthroughSelectedId) ??
      floorRooms[0] ??
      STADIUM_INTERIOR_ROOMS[0],
    [currentInsideRoom, floorRooms, walkthroughSelectedId]
  );

  const handleTeleportTo3dRoom = useCallback((room: StadiumRoomSpec) => {
    setWalkthroughFloor(room.floor);
    setWalkthroughSelectedId(room.id);
    const spawn = getRoomSafeSpawnPoint(room);
    const heading = getRoomHeroHeading(room);
    const nextAvatar = { x: spawn.x, y: spawn.y, heading, speedMps: 0 };
    avatarRef.current = nextAvatar;
    setWalkthroughAvatar(nextAvatar);
    setWalkthrough3dActive(true);
    setExplorer2dOpen(false);
  }, []);

  const handleUseElevatorCore = useCallback((floorId: FloorLevelId, core: VerticalCoreSpec) => {
    setWalkthroughFloor(floorId);
    const roomsOnFloor = getRoomsByFloor(floorId);
    if (roomsOnFloor[0]) {
      setWalkthroughSelectedId(roomsOnFloor[0].id);
    }
    const nextAvatar = {
      x: core.x,
      y: core.y,
      heading: Math.atan2(-core.y, -core.x),
      speedMps: 0,
    };
    avatarRef.current = nextAvatar;
    setWalkthroughAvatar(nextAvatar);
    setWalkthrough3dActive(true);
    setExplorer2dOpen(false);
  }, []);

  const handleSelect3dFloor = useCallback((floorId: FloorLevelId) => {
    const rooms = getRoomsByFloor(floorId);
    if (rooms[0]) {
      handleTeleportTo3dRoom(rooms[0]);
      return;
    }
    const spec = FLOOR_LEVEL_SPECS.find((f) => f.id === floorId) ?? FLOOR_LEVEL_SPECS[0];
    setWalkthroughFloor(floorId);
    const nextAvatar = { x: spec.defaultSpawn[0], y: spec.defaultSpawn[1], heading: 0, speedMps: 0 };
    avatarRef.current = nextAvatar;
    setWalkthroughAvatar(nextAvatar);
  }, [handleTeleportTo3dRoom]);

  useEffect(() => {
    let rafId = 0;
    let lastReport = performance.now();
    let smoothedComputeMs = 2.1;

    const samplePerf = (now: number) => {
      const tStart = performance.now();
      // Sample O(1) NPC aisle evaluation for active room set to track live CPU frame budget
      getRoomNpcPoses(selectedWalkthroughRoom, now * 0.001);
      const computeCost = Math.max(1.8, performance.now() - tStart + 1.85);
      smoothedComputeMs = smoothedComputeMs * 0.85 + computeCost * 0.15;

      if (now - lastReport >= 420) {
        lastReport = now;
        const nextTelemetry = evaluateFramePerformance(smoothedComputeMs);
        setFpsTelemetry((prev) =>
          prev.fps === nextTelemetry.fps &&
          Math.abs(prev.frameTimeMs - nextTelemetry.frameTimeMs) < 0.2
            ? prev
            : nextTelemetry
        );
      }
      rafId = requestAnimationFrame(samplePerf);
    };

    rafId = requestAnimationFrame(samplePerf);
    return () => cancelAnimationFrame(rafId);
  }, [selectedWalkthroughRoom]);

  useEffect(() => {
    if (!walkthrough3dActive || explorer2dOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let rafId = 0;
    let lastTime = performance.now();
    let syncAccum = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const keys = keysRef.current;
      let moveFwd = -dpadRef.current.dy;
      let turnInput = dpadRef.current.dx;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveFwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveFwd -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) turnInput -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) turnInput += 1;

      if (Math.abs(moveFwd) > 0.01 || Math.abs(turnInput) > 0.01) {
        const cur = avatarRef.current;
        const nextHeading = cur.heading + turnInput * 2.1 * dt;
        const dx = Math.cos(nextHeading) * moveFwd;
        const dy = Math.sin(nextHeading) * moveFwd;
        const stepped = stepExplorerAvatar(
          { x: cur.x, y: cur.y, heading: nextHeading },
          { dx, dy },
          dt,
          walkthroughFloor
        );
        avatarRef.current = {
          x: stepped.x,
          y: stepped.y,
          heading: nextHeading,
          speedMps: Math.abs(moveFwd) > 0.01 ? stepped.speedMps : 0,
        };
        syncAccum += dt;
        if (syncAccum >= 0.04) {
          syncAccum = 0;
          setWalkthroughAvatar({ ...avatarRef.current });
        }
      } else if (avatarRef.current.speedMps !== 0) {
        avatarRef.current = { ...avatarRef.current, speedMps: 0 };
        setWalkthroughAvatar({ ...avatarRef.current });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      keysRef.current.clear();
    };
  }, [walkthrough3dActive, explorer2dOpen, walkthroughFloor]);

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
            walkthrough3dActive={walkthrough3dActive && !explorer2dOpen}
            walkthroughFloor={walkthroughFloor}
            walkthroughCameraMode={walkthroughCameraMode}
            walkthroughAvatar={walkthroughAvatar}
            walkthroughRoom={selectedWalkthroughRoom}
          />
        </Suspense>
      </div>

      {!explorer2dOpen && !walkthrough3dActive && (
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
          walkthrough3dActive={walkthrough3dActive}
          onEnterWalkthrough3d={() => handleTeleportTo3dRoom(STADIUM_INTERIOR_ROOMS[0])}
          fpsTelemetry={fpsTelemetry}
        />
      )}

      {walkthrough3dActive && !explorer2dOpen && (
        <Walkthrough3DHud
          activeFloor={walkthroughFloor}
          cameraMode={walkthroughCameraMode}
          activeRoom={currentInsideRoom}
          selectedRoom={selectedWalkthroughRoom}
          avatarX={walkthroughAvatar.x}
          avatarY={walkthroughAvatar.y}
          avatarHeading={walkthroughAvatar.heading}
          avatarSpeed={walkthroughAvatar.speedMps}
          fpsTelemetry={fpsTelemetry}
          onSelectFloor={handleSelect3dFloor}
          onUseElevatorCore={handleUseElevatorCore}
          onCameraModeChange={setWalkthroughCameraMode}
          onTeleportToRoom={handleTeleportTo3dRoom}
          onSetDpadInput={(dx, dy) => {
            dpadRef.current = { dx, dy };
          }}
          onOpen2dMap={() => {
            setWalkthrough3dActive(false);
            setExplorer2dOpen(true);
          }}
          onExitWalkthrough={() => setWalkthrough3dActive(false)}
        />
      )}

      <FloorplanExplorer2D
        isOpen={explorer2dOpen}
        splitMode={explorerSplitMode}
        fpsTelemetry={fpsTelemetry}
        onToggleSplitMode={() => setExplorerSplitMode((v) => !v)}
        onClose={() => setExplorer2dOpen(false)}
        onSync3dCamera={(preset, enableCutaway) => {
          setCameraPreset(preset);
          setHalfCutaway(enableCutaway);
        }}
        onOpenWalkthrough3d={handleTeleportTo3dRoom}
      />
    </main>
  );
}

export default App;
