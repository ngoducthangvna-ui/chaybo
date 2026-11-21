import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PITCH_SPECS, evaluateBallProjectile } from '../config/stadiumSpecs';

interface PitchProps {
  liveMatchActive?: boolean;
}

interface PassSegment {
  readonly from: readonly [number, number, number];
  readonly to: readonly [number, number, number];
  readonly duration: number;
  readonly peak: number;
}

const MATCH_SEQUENCE: readonly PassSegment[] = [
  { from: [0, 0.38, 0], to: [-18, 0.38, 8], duration: 1.5, peak: 0.45 },
  { from: [-18, 0.38, 8], to: [-8, 0.38, -22], duration: 2.1, peak: 4.8 },
  { from: [-8, 0.38, -22], to: [14, 0.38, -16], duration: 1.6, peak: 0.55 },
  { from: [14, 0.38, -16], to: [30, 0.38, 22], duration: 2.3, peak: 6.4 },
  { from: [30, 0.38, 22], to: [43, 0.38, 12], duration: 1.4, peak: 0.45 },
  { from: [43, 0.38, 12], to: [39, 0.38, -2], duration: 1.7, peak: 3.9 },
  { from: [39, 0.38, -2], to: [51.6, 1.4, 1.2], duration: 1.05, peak: 1.85 },
  { from: [49.5, 0.38, 0], to: [16, 0.38, 6], duration: 2.2, peak: 5.8 },
  { from: [16, 0.38, 6], to: [-12, 0.38, 18], duration: 1.8, peak: 0.65 },
  { from: [-12, 0.38, 18], to: [-32, 0.38, -18], duration: 2.2, peak: 5.4 },
  { from: [-32, 0.38, -18], to: [-42, 0.38, -6], duration: 1.4, peak: 0.45 },
  { from: [-42, 0.38, -6], to: [-51.5, 1.2, -1.0], duration: 1.05, peak: 1.75 },
  { from: [-49.5, 0.38, 0], to: [0, 0.38, 0], duration: 1.8, peak: 4.2 },
];

const TOTAL_SEQ_DURATION = MATCH_SEQUENCE.reduce((s, seg) => s + seg.duration, 0);

interface PitchActorSpec {
  readonly basePos: [number, number];
  readonly role: 'home' | 'away' | 'gk-home' | 'gk-away' | 'ref' | 'coach-home' | 'coach-away';
  readonly phaseOffset: number;
  readonly shiftFactor: number;
}

const PITCH_ACTORS: readonly PitchActorSpec[] = [
  // Vietnam Home Goalkeeper + 10 Outfield Players (Crimson Red #e11d48)
  { basePos: [-49.5, 0], role: 'gk-home', phaseOffset: 0.2, shiftFactor: 0.04 },
  { basePos: [-32, -18], role: 'home', phaseOffset: 1.1, shiftFactor: 0.48 },
  { basePos: [-34, -6], role: 'home', phaseOffset: 2.3, shiftFactor: 0.42 },
  { basePos: [-34, 6], role: 'home', phaseOffset: 3.1, shiftFactor: 0.42 },
  { basePos: [-32, 18], role: 'home', phaseOffset: 0.7, shiftFactor: 0.48 },
  { basePos: [-12, -12], role: 'home', phaseOffset: 1.9, shiftFactor: 0.65 },
  { basePos: [-14, 0], role: 'home', phaseOffset: 4.2, shiftFactor: 0.62 },
  { basePos: [-12, 12], role: 'home', phaseOffset: 2.8, shiftFactor: 0.65 },
  { basePos: [14, -20], role: 'home', phaseOffset: 5.1, shiftFactor: 0.72 },
  { basePos: [18, 0], role: 'home', phaseOffset: 3.7, shiftFactor: 0.76 },
  { basePos: [14, 20], role: 'home', phaseOffset: 0.9, shiftFactor: 0.72 },

  // Visiting Team Goalkeeper + 10 Outfield Players (Crisp White #f8fafc)
  { basePos: [49.5, 0], role: 'gk-away', phaseOffset: 1.4, shiftFactor: 0.04 },
  { basePos: [32, -19], role: 'away', phaseOffset: 2.5, shiftFactor: 0.48 },
  { basePos: [35, -7], role: 'away', phaseOffset: 3.9, shiftFactor: 0.42 },
  { basePos: [35, 7], role: 'away', phaseOffset: 1.7, shiftFactor: 0.42 },
  { basePos: [32, 19], role: 'away', phaseOffset: 4.8, shiftFactor: 0.48 },
  { basePos: [10, -10], role: 'away', phaseOffset: 2.1, shiftFactor: 0.64 },
  { basePos: [10, 10], role: 'away', phaseOffset: 0.5, shiftFactor: 0.64 },
  { basePos: [-4, -18], role: 'away', phaseOffset: 3.3, shiftFactor: 0.7 },
  { basePos: [-6, 0], role: 'away', phaseOffset: 5.5, shiftFactor: 0.68 },
  { basePos: [-4, 18], role: 'away', phaseOffset: 4.1, shiftFactor: 0.7 },
  { basePos: [-22, 0], role: 'away', phaseOffset: 1.3, shiftFactor: 0.74 },

  // 3 Match Referees (High-Vis Amber-Gold #facc15)
  { basePos: [0, -8], role: 'ref', phaseOffset: 2.2, shiftFactor: 0.52 },
  { basePos: [-18, -35.2], role: 'ref', phaseOffset: 0.8, shiftFactor: 0.45 },
  { basePos: [18, 35.2], role: 'ref', phaseOffset: 3.6, shiftFactor: 0.45 },

  // 2 Head Coaches pacing along technical areas facing pitch
  { basePos: [-18, 36.2], role: 'coach-home', phaseOffset: 0.4, shiftFactor: 0 },
  { basePos: [18, 36.2], role: 'coach-away', phaseOffset: 2.6, shiftFactor: 0 },
];

function getActorShirtColor(role: PitchActorSpec['role']): string {
  if (role === 'home') return '#e11d48';
  if (role === 'away') return '#f8fafc';
  if (role === 'gk-home') return '#10b981';
  if (role === 'gk-away') return '#0ea5e9';
  if (role === 'coach-home') return '#be123c';
  if (role === 'coach-away') return '#1e293b';
  return '#facc15';
}

/**
 * Simulates 22 footballers, 3 referees, 2 technical coaches, and a 3D ball governed by gravity/bounce trajectories.
 */
function LiveMatchSimulation({ active }: { active: boolean }) {
  const torsoRef = useRef<THREE.InstancedMesh | null>(null);
  const headRef = useRef<THREE.InstancedMesh | null>(null);
  const leftLegRef = useRef<THREE.InstancedMesh | null>(null);
  const rightLegRef = useRef<THREE.InstancedMesh | null>(null);
  const leftArmRef = useRef<THREE.InstancedMesh | null>(null);
  const rightArmRef = useRef<THREE.InstancedMesh | null>(null);
  const shadowRef = useRef<THREE.InstancedMesh | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const ballShadowRef = useRef<THREE.Mesh | null>(null);

  const actorPositions = useMemo(
    () => PITCH_ACTORS.map((a) => new THREE.Vector3(a.basePos[0], 0.08, a.basePos[1])),
    []
  );
  const simTimeRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const targetVec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const color = new THREE.Color();
    PITCH_ACTORS.forEach((actor, idx) => {
      const shirtHex = getActorShirtColor(actor.role);
      torsoRef.current?.setColorAt(idx, color.set(shirtHex));
      leftArmRef.current?.setColorAt(idx, color.set(shirtHex));
      rightArmRef.current?.setColorAt(idx, color.set(shirtHex));
      if (roleIsSkin(actor.role)) {
        headRef.current?.setColorAt(idx, color.set('#fdba74'));
      }
      const shortHex =
        actor.role === 'home' ? '#9f1239' : actor.role === 'away' ? '#1e293b' : '#18181b';
      leftLegRef.current?.setColorAt(idx, color.set(shortHex));
      rightLegRef.current?.setColorAt(idx, color.set(shortHex));
    });
    if (torsoRef.current?.instanceColor) torsoRef.current.instanceColor.needsUpdate = true;
    if (leftArmRef.current?.instanceColor) leftArmRef.current.instanceColor.needsUpdate = true;
    if (rightArmRef.current?.instanceColor) rightArmRef.current.instanceColor.needsUpdate = true;
    if (headRef.current?.instanceColor) headRef.current.instanceColor.needsUpdate = true;
    if (leftLegRef.current?.instanceColor) leftLegRef.current.instanceColor.needsUpdate = true;
    if (rightLegRef.current?.instanceColor) rightLegRef.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    if (active) {
      simTimeRef.current = (simTimeRef.current + dt) % TOTAL_SEQ_DURATION;
    }
    const tSeq = simTimeRef.current;

    let acc = 0;
    let activeSeg = MATCH_SEQUENCE[0];
    let localT = 0;
    for (const seg of MATCH_SEQUENCE) {
      if (tSeq <= acc + seg.duration) {
        activeSeg = seg;
        localT = tSeq - acc;
        break;
      }
      acc += seg.duration;
    }

    const ballState = evaluateBallProjectile(
      localT,
      activeSeg.from,
      activeSeg.to,
      activeSeg.duration,
      activeSeg.peak
    );
    const [bx, by, bz] = ballState.position;

    if (ballRef.current) {
      ballRef.current.position.set(bx, by, bz);
      if (active) {
        ballRef.current.rotation.x += dt * 9;
        ballRef.current.rotation.z += dt * 7;
      }
    }
    if (ballShadowRef.current) {
      ballShadowRef.current.position.set(bx, 0.11, bz);
      const scale = Math.max(0.45, 1.0 - (by - 0.38) * 0.08);
      ballShadowRef.current.scale.set(scale, scale, 1);
    }

    const globalTime = active ? performance.now() * 0.001 : 0;

    PITCH_ACTORS.forEach((actor, idx) => {
      if (actor.role === 'coach-home' || actor.role === 'coach-away') {
        targetVec.set(
          actor.basePos[0] + Math.sin(globalTime * 0.9 + actor.phaseOffset) * 2.4,
          0.08,
          actor.basePos[1]
        );
      } else if (actor.role === 'gk-home' || actor.role === 'gk-away') {
        const clampedZ = THREE.MathUtils.clamp(bz * 0.28, -4.1, 4.1);
        targetVec.set(actor.basePos[0], 0.08, clampedZ);
      } else if (actor.role === 'ref') {
        const isAssistant = Math.abs(actor.basePos[1]) > 30;
        if (isAssistant) {
          targetVec.set(THREE.MathUtils.clamp(bx * 0.72, -46, 46), 0.08, actor.basePos[1]);
        } else {
          targetVec.set(
            THREE.MathUtils.clamp(bx * 0.65 - 6, -40, 40),
            0.08,
            THREE.MathUtils.clamp(bz * 0.55 - 8, -28, 28)
          );
        }
      } else {
        const weaveX = Math.sin(globalTime * 0.85 + actor.phaseOffset) * 5.2;
        const weaveZ = Math.cos(globalTime * 1.15 + actor.phaseOffset * 1.4) * 4.4;
        targetVec.set(
          THREE.MathUtils.clamp(actor.basePos[0] + bx * actor.shiftFactor * 0.65 + weaveX, -48, 48),
          0.08,
          THREE.MathUtils.clamp(actor.basePos[1] + bz * actor.shiftFactor * 0.45 + weaveZ, -31, 31)
        );
      }

      const pos = actorPositions[idx];
      const dx = targetVec.x - pos.x;
      const dz = targetVec.z - pos.z;
      const dist = Math.hypot(dx, dz);
      const speed = active ? Math.min(7.8, dist * 1.9) : 0;
      if (dist > 0.05 && active) {
        const moveStep = Math.min(dist, speed * dt);
        pos.x += (dx / dist) * moveStep;
        pos.z += (dz / dist) * moveStep;
      }

      const isCoach = actor.role === 'coach-home' || actor.role === 'coach-away';
      const heading =
        isCoach || dist <= 0.15 ? Math.atan2(bx - pos.x, bz - pos.z) : Math.atan2(dx, dz);
      const stridePhase = globalTime * (3.2 + speed * 1.1) + actor.phaseOffset;
      const legSwing = active ? Math.sin(stridePhase) * Math.min(0.65, speed * 0.14) : 0;
      const armSwing = -legSwing * 0.85;
      const bob = active ? Math.abs(Math.sin(stridePhase)) * Math.min(0.14, speed * 0.025) : 0;

      // Ground contact shadow
      dummy.position.set(pos.x, 0.1, pos.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      shadowRef.current?.setMatrixAt(idx, dummy.matrix);

      // Torso
      dummy.position.set(pos.x, pos.y + 1.12 + bob, pos.z);
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      torsoRef.current?.setMatrixAt(idx, dummy.matrix);

      // Head
      dummy.position.set(pos.x, pos.y + 1.72 + bob, pos.z);
      dummy.rotation.set(0, heading, 0);
      dummy.updateMatrix();
      headRef.current?.setMatrixAt(idx, dummy.matrix);

      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);

      // Left Leg
      dummy.position.set(pos.x + cosH * 0.14, pos.y + 0.42 + bob * 0.5, pos.z - sinH * 0.14);
      dummy.rotation.set(0, heading, 0);
      dummy.rotateX(legSwing);
      dummy.updateMatrix();
      leftLegRef.current?.setMatrixAt(idx, dummy.matrix);

      // Right Leg
      dummy.position.set(pos.x - cosH * 0.14, pos.y + 0.42 + bob * 0.5, pos.z + sinH * 0.14);
      dummy.rotation.set(0, heading, 0);
      dummy.rotateX(-legSwing);
      dummy.updateMatrix();
      rightLegRef.current?.setMatrixAt(idx, dummy.matrix);

      // Left Arm (counter-phase swing)
      dummy.position.set(pos.x + cosH * 0.36, pos.y + 1.12 + bob, pos.z - sinH * 0.36);
      dummy.rotation.set(0, heading, 0);
      dummy.rotateX(armSwing);
      dummy.updateMatrix();
      leftArmRef.current?.setMatrixAt(idx, dummy.matrix);

      // Right Arm (counter-phase swing)
      dummy.position.set(pos.x - cosH * 0.36, pos.y + 1.12 + bob, pos.z + sinH * 0.36);
      dummy.rotation.set(0, heading, 0);
      dummy.rotateX(-armSwing);
      dummy.updateMatrix();
      rightArmRef.current?.setMatrixAt(idx, dummy.matrix);
    });

    if (torsoRef.current) torsoRef.current.instanceMatrix.needsUpdate = true;
    if (headRef.current) headRef.current.instanceMatrix.needsUpdate = true;
    if (leftLegRef.current) leftLegRef.current.instanceMatrix.needsUpdate = true;
    if (rightLegRef.current) rightLegRef.current.instanceMatrix.needsUpdate = true;
    if (leftArmRef.current) leftArmRef.current.instanceMatrix.needsUpdate = true;
    if (rightArmRef.current) rightArmRef.current.instanceMatrix.needsUpdate = true;
    if (shadowRef.current) shadowRef.current.instanceMatrix.needsUpdate = true;
  });

  const actorCount = PITCH_ACTORS.length;

  return (
    <group name="live-match-physics-simulation">
      <instancedMesh ref={shadowRef} args={[undefined, undefined, actorCount]}>
        <circleGeometry args={[0.48, 12]} />
        <meshBasicMaterial color="#090d16" transparent opacity={0.45} />
      </instancedMesh>
      <instancedMesh ref={torsoRef} args={[undefined, undefined, actorCount]} castShadow>
        <boxGeometry args={[0.56, 0.78, 0.32]} />
        <meshStandardMaterial roughness={0.62} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, actorCount]} castShadow>
        <sphereGeometry args={[0.21, 10, 10]} />
        <meshStandardMaterial roughness={0.58} />
      </instancedMesh>
      <instancedMesh ref={leftLegRef} args={[undefined, undefined, actorCount]} castShadow>
        <boxGeometry args={[0.17, 0.76, 0.19]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={rightLegRef} args={[undefined, undefined, actorCount]} castShadow>
        <boxGeometry args={[0.17, 0.76, 0.19]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={leftArmRef} args={[undefined, undefined, actorCount]} castShadow>
        <boxGeometry args={[0.14, 0.62, 0.15]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={rightArmRef} args={[undefined, undefined, actorCount]} castShadow>
        <boxGeometry args={[0.14, 0.62, 0.15]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>

      {/* Match Football & Projected Turf Shadow */}
      <mesh ref={ballRef} position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#fef08a" emissiveIntensity={0.22} roughness={0.35} />
      </mesh>
      <mesh ref={ballShadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function roleIsSkin(_role: PitchActorSpec['role']): boolean {
  return true;
}

/**
 * Generates high-resolution FIFA grass pitch albedo & velvety turf bumpMap textures.
 */
function createPitchPbrTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const w = 2048;
  const h = 1320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d');

  if (!ctx || !bCtx) {
    return {
      map: new THREE.CanvasTexture(canvas),
      bumpMap: new THREE.CanvasTexture(bumpCanvas),
    };
  }

  const stripeCount = 18;
  const stripeWidth = w / stripeCount;
  for (let i = 0; i < stripeCount; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#1a5c2c' : '#216b35';
    ctx.fillRect(i * stripeWidth, 0, stripeWidth + 1, h);

    bCtx.fillStyle = i % 2 === 0 ? '#787878' : '#9c9c9c';
    bCtx.fillRect(i * stripeWidth, 0, stripeWidth + 1, h);
  }

  for (let i = 0; i < 24000; i += 1) {
    const hash = ((i * 2654435761) >>> 0) % (w * h);
    const x = hash % w;
    const y = Math.floor(hash / w);
    const light = (i & 1) === 0;
    ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.022)' : 'rgba(10, 30, 15, 0.035)';
    ctx.fillRect(x, y, 2, 2);
    bCtx.fillStyle = light ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)';
    bCtx.fillRect(x, y, 2, 2);
  }

  const padX = 90;
  const padY = 64;
  const fieldW = w - padX * 2;
  const fieldH = h - padY * 2;
  const scaleX = fieldW / PITCH_SPECS.length;
  const scaleY = fieldH / PITCH_SPECS.width;
  const midX = padX + fieldW / 2;
  const midY = padY + fieldH / 2;
  const centerR = PITCH_SPECS.centerCircleRadius * scaleX;

  ctx.strokeStyle = 'rgba(245, 245, 244, 0.92)';
  ctx.lineWidth = 6;
  ctx.strokeRect(padX, padY, fieldW, fieldH);

  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + fieldH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, centerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f5f5f4';
  ctx.beginPath();
  ctx.arc(midX, midY, 5, 0, Math.PI * 2);
  ctx.fill();

  const penW = PITCH_SPECS.penaltyAreaLength * scaleX;
  const penH = PITCH_SPECS.penaltyAreaWidth * scaleY;
  const goalW = PITCH_SPECS.goalAreaLength * scaleX;
  const goalH = PITCH_SPECS.goalAreaWidth * scaleY;

  ctx.strokeRect(padX, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX + fieldW - penW, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX, midY - goalH / 2, goalW, goalH);
  ctx.strokeRect(padX + fieldW - goalW, midY - goalH / 2, goalW, goalH);

  // 2 Penalty Spots (11m from goal lines) & Penalty Box "D" Arcs
  const penSpotLeftX = padX + 11 * scaleX;
  const penSpotRightX = padX + fieldW - 11 * scaleX;
  const arcHalfAngle = Math.acos((16.5 - 11) / 9.15);

  ctx.fillStyle = '#f5f5f4';
  for (const spotX of [penSpotLeftX, penSpotRightX]) {
    ctx.beginPath();
    ctx.arc(spotX, midY, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(penSpotLeftX, midY, centerR, -arcHalfAngle, arcHalfAngle);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(penSpotRightX, midY, centerR, Math.PI - arcHalfAngle, Math.PI + arcHalfAngle);
  ctx.stroke();

  // 4 Corner Kick Quarter-Circle Arcs
  const cornerR = 1.4 * scaleX;
  ctx.beginPath();
  ctx.arc(padX, padY, cornerR, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY, cornerR, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY + fieldH, cornerR, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX, padY + fieldH, cornerR, Math.PI * 1.5, Math.PI * 2);
  ctx.stroke();

  // 2 Dashed Technical Area Boxes along bench touchline
  ctx.save();
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 8]);
  for (const offsetM of [-18, 18]) {
    const boxCenterX = midX + offsetM * scaleX;
    const boxW = 14 * scaleX;
    const boxD = 2.4 * scaleY;
    ctx.strokeRect(boxCenterX - boxW / 2, padY + fieldH + 4, boxW, boxD);
  }
  ctx.restore();

  const map = new THREE.CanvasTexture(canvas);
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 8;

  return { map, bumpMap };
}

function GoalFrame({ positionX, flip }: { positionX: number; flip: boolean }) {
  const dir = flip ? -1 : 1;
  const halfW = PITCH_SPECS.goalWidth / 2;
  const h = PITCH_SPECS.goalHeight;
  const d = PITCH_SPECS.goalDepth;

  return (
    <group position={[positionX, 0, 0]}>
      {/* Front Goal Posts & Crossbar */}
      <mesh position={[0, h / 2, -halfW]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, h, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, h / 2, halfW]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, h, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, PITCH_SPECS.goalWidth, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>

      {/* Rear Net Stanchions & Ground Base Frame */}
      <mesh position={[dir * d, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, PITCH_SPECS.goalWidth, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-halfW, halfW].map((z) => (
        <group key={z}>
          <mesh position={[dir * d, h / 2, z]}>
            <cylinderGeometry args={[0.04, 0.04, h, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[dir * (d / 2), h, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, d, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[dir * (d / 2), 0.05, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, d, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 4 Open-Front Fine Woven Net Panels (zero obstruction across goal mouth) */}
      <mesh position={[dir * d, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[PITCH_SPECS.goalWidth, h, 14, 6]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.32} wireframe side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[dir * (d / 2), h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[d, PITCH_SPECS.goalWidth, 5, 14]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.32} wireframe side={THREE.DoubleSide} />
      </mesh>
      {[-halfW, halfW].map((z) => (
        <mesh key={`net-${z}`} position={[dir * (d / 2), h / 2, z]}>
          <planeGeometry args={[d, h, 5, 6]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.32} wireframe side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function CornerFlags() {
  const halfL = PITCH_SPECS.length / 2;
  const halfW = PITCH_SPECS.width / 2;
  const corners: Array<[number, number]> = [
    [-halfL, -halfW],
    [-halfL, halfW],
    [halfL, -halfW],
    [halfL, halfW],
  ];

  return (
    <group name="corner-flags">
      {corners.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0.2, 1.35, 0]}>
            <boxGeometry args={[0.4, 0.25, 0.04]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TeamDugouts() {
  return (
    <group name="team-dugouts">
      {[-18, 18].map((x) => (
        <group key={x} position={[x, 0, 39.8]}>
          {/* Dark Stone Base Plinth */}
          <mesh position={[0, 0.12, 0]} receiveShadow>
            <boxGeometry args={[12.4, 0.25, 2.4]} />
            <meshStandardMaterial color="#27272a" roughness={0.78} />
          </mesh>
          {/* Cantilevered Dark Steel & Obsidian Shelter Canopy */}
          <mesh position={[0, 2.25, 0]} castShadow>
            <boxGeometry args={[12.4, 0.16, 2.6]} />
            <meshStandardMaterial color="#18181b" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[0, 1.2, 1.18]}>
            <boxGeometry args={[12.2, 2.1, 0.1]} />
            <meshPhysicalMaterial color="#0f172a" transparent opacity={0.58} metalness={0.88} roughness={0.08} />
          </mesh>
          {[-6.1, -2.0, 2.0, 6.1].map((rx) => (
            <mesh key={rx} position={[rx, 1.2, 0.4]} castShadow>
              <boxGeometry args={[0.14, 2.2, 1.8]} />
              <meshStandardMaterial color="#27272a" metalness={0.8} roughness={0.28} />
            </mesh>
          ))}
          {/* 8 Red Sports Bucket Seats inside Dugout */}
          {[-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2].map((sx) => (
            <group key={sx} position={[sx, 0.25, 0.35]}>
              <mesh position={[0, 0.22, 0]}>
                <boxGeometry args={[0.62, 0.14, 0.56]} />
                <meshStandardMaterial color="#e11d48" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.56, 0.22]}>
                <boxGeometry args={[0.62, 0.72, 0.14]} />
                <meshStandardMaterial color="#be123c" roughness={0.42} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function PitchLedPerimeter() {
  const boardDistX = 59.5;
  const boardDistZ = 37.5;
  return (
    <group name="pitch-led-perimeter">
      {[-boardDistZ, boardDistZ].map((z, idx) => (
        <mesh key={`lz-${idx}`} position={[0, 0.55, z]}>
          <boxGeometry args={[114, 0.95, 0.35]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* West LED perimeter split around central |z| < 6.5m Players' Tunnel Vomitory opening */}
      {[-21.75, 21.75].map((zPos, idx) => (
        <mesh key={`lx-west-${idx}`} position={[-boardDistX, 0.55, zPos]}>
          <boxGeometry args={[0.35, 0.95, 30.5]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[boardDistX, 0.55, 0]}>
        <boxGeometry args={[0.35, 0.95, 74]} />
        <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export function Pitch({ liveMatchActive = true }: PitchProps) {
  const pitchPbr = useMemo(() => createPitchPbrTextures(), []);

  return (
    <group name="fifa-pitch">
      {/* Concrete technical apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.apronLength + 20, PITCH_SPECS.apronWidth + 20]} />
        <meshStandardMaterial color="#27272a" roughness={0.88} />
      </mesh>

      {/* Synthetic perimeter turf surround */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.apronLength, PITCH_SPECS.apronWidth]} />
        <meshStandardMaterial color="#163820" roughness={0.86} />
      </mesh>

      {/* FIFA grass pitch with turf micro-relief bump */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.length + 8, PITCH_SPECS.width + 6]} />
        <meshStandardMaterial
          map={pitchPbr.map}
          bumpMap={pitchPbr.bumpMap}
          bumpScale={0.05}
          roughness={0.82}
          metalness={0.02}
        />
      </mesh>

      <GoalFrame positionX={-PITCH_SPECS.length / 2} flip={true} />
      <GoalFrame positionX={PITCH_SPECS.length / 2} flip={false} />
      <CornerFlags />
      <TeamDugouts />
      <PitchLedPerimeter />
      <LiveMatchSimulation active={liveMatchActive} />
    </group>
  );
}
