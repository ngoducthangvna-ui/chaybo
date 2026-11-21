import { useMemo } from 'react';
import * as THREE from 'three';
import { PITCH_SPECS } from '../config/stadiumSpecs';

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
      <mesh position={[dir * (d / 2), h / 2, 0]}>
        <boxGeometry args={[d, h, PITCH_SPECS.goalWidth]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.25} wireframe />
      </mesh>
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
        <group key={x} position={[x, 0, 39.5]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[12, 2.2, 2.4]} />
            <meshPhysicalMaterial
              color="#94a3b8"
              transparent
              opacity={0.42}
              metalness={0.5}
              roughness={0.18}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[11.6, 0.6, 1.8]} />
            <meshStandardMaterial color="#334155" roughness={0.55} />
          </mesh>
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
      {[-boardDistX, boardDistX].map((x, idx) => (
        <mesh key={`lx-${idx}`} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.35, 0.95, 74]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e293b" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function Pitch() {
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
    </group>
  );
}
