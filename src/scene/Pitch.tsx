import { useMemo } from 'react';
import * as THREE from 'three';
import { PITCH_SPECS } from '../config/stadiumSpecs';

/**
 * Generates a high-resolution procedural FIFA pitch texture with alternating
 * mowing stripes and regulation white field markings.
 */
function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1320;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Base mowing stripes (18 alternating bands)
  const stripeCount = 18;
  const stripeWidth = canvas.width / stripeCount;
  for (let i = 0; i < stripeCount; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#1e6b34' : '#247c3d';
    ctx.fillRect(i * stripeWidth, 0, stripeWidth + 1, canvas.height);
  }

  // Subtle grass grain noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 4000; i += 1) {
    const x = (i * 73) % canvas.width;
    const y = (i * 137) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  // Regulation white lines
  const padX = 90;
  const padY = 64;
  const fieldW = canvas.width - padX * 2;
  const fieldH = canvas.height - padY * 2;
  const scaleX = fieldW / PITCH_SPECS.length;
  const scaleY = fieldH / PITCH_SPECS.width;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 6;

  // Outer touchline & goal lines
  ctx.strokeRect(padX, padY, fieldW, fieldH);

  // Halfway line & center circle
  const midX = padX + fieldW / 2;
  const midY = padY + fieldH / 2;
  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + fieldH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, PITCH_SPECS.centerCircleRadius * scaleX, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(midX, midY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Penalty areas & goal areas (left & right)
  const penW = PITCH_SPECS.penaltyAreaLength * scaleX;
  const penH = PITCH_SPECS.penaltyAreaWidth * scaleY;
  const goalW = PITCH_SPECS.goalAreaLength * scaleX;
  const goalH = PITCH_SPECS.goalAreaWidth * scaleY;

  ctx.strokeRect(padX, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX + fieldW - penW, midY - penH / 2, penW, penH);

  ctx.strokeRect(padX, midY - goalH / 2, goalW, goalH);
  ctx.strokeRect(padX + fieldW - goalW, midY - goalH / 2, goalW, goalH);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function GoalFrame({ positionX, flip }: { positionX: number; flip: boolean }) {
  const dir = flip ? -1 : 1;
  const halfW = PITCH_SPECS.goalWidth / 2;
  const h = PITCH_SPECS.goalHeight;
  const d = PITCH_SPECS.goalDepth;

  return (
    <group position={[positionX, 0, 0]}>
      {/* Left & right posts */}
      <mesh position={[0, h / 2, -halfW]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, h, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, h / 2, halfW]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, h, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, PITCH_SPECS.goalWidth, 12]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* Translucent net box */}
      <mesh position={[dir * (d / 2), h / 2, 0]}>
        <boxGeometry args={[d, h, PITCH_SPECS.goalWidth]} />
        <meshStandardMaterial
          color="#e2e8f0"
          transparent
          opacity={0.22}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function Pitch() {
  const pitchTexture = useMemo(() => createPitchTexture(), []);

  return (
    <group name="fifa-pitch">
      {/* Technical apron / athletics surround */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.apronLength + 16, PITCH_SPECS.apronWidth + 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Red track / technical perimeter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.apronLength, PITCH_SPECS.apronWidth]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>

      {/* FIFA grass turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <planeGeometry args={[PITCH_SPECS.length + 8, PITCH_SPECS.width + 6]} />
        <meshStandardMaterial map={pitchTexture} roughness={0.78} metalness={0.02} />
      </mesh>

      {/* Goals */}
      <GoalFrame positionX={-PITCH_SPECS.length / 2} flip={true} />
      <GoalFrame positionX={PITCH_SPECS.length / 2} flip={false} />
    </group>
  );
}
