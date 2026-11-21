import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PITCH_SPECS } from '../config/stadiumSpecs';

/**
 * Generates a high-resolution procedural FIFA pitch texture with alternating
 * mowing stripes, Dong Son center emblem, and regulation white field markings.
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

  const padX = 90;
  const padY = 64;
  const fieldW = canvas.width - padX * 2;
  const fieldH = canvas.height - padY * 2;
  const scaleX = fieldW / PITCH_SPECS.length;
  const scaleY = fieldH / PITCH_SPECS.width;
  const midX = padX + fieldW / 2;
  const midY = padY + fieldH / 2;
  const centerR = PITCH_SPECS.centerCircleRadius * scaleX;

  // Dong Son sun-rays & star watermark inside the center circle
  ctx.save();
  ctx.translate(midX, midY);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, centerR * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  for (let r = 0; r < 16; r += 1) {
    const a = (r / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (centerR * 0.42), Math.sin(a) * (centerR * 0.42));
    ctx.lineTo(Math.cos(a) * (centerR * 0.76), Math.sin(a) * (centerR * 0.76));
    ctx.stroke();
  }

  // Central 5-point star watermark
  ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
  ctx.beginPath();
  for (let p = 0; p < 10; p += 1) {
    const rad = p % 2 === 0 ? centerR * 0.38 : centerR * 0.16;
    const ang = (p * Math.PI) / 5 - Math.PI / 2;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (p === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Regulation white lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = 6;
  ctx.strokeRect(padX, padY, fieldW, fieldH);

  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + fieldH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, centerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
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
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.22} wireframe />
      </mesh>
    </group>
  );
}

function TeamDugouts() {
  return (
    <group name="team-dugouts">
      {[-18, 18].map((x) => (
        <group key={x} position={[x, 0, 39]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[12, 2.2, 2.4]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              transparent
              opacity={0.45}
              metalness={0.6}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[11.6, 0.6, 1.8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AnimatedPlayersAndBall() {
  const playerRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ballRef = useRef<THREE.Mesh | null>(null);

  const players = useMemo(() => {
    const list: Array<{ baseX: number; baseZ: number; team: 'red' | 'white'; phase: number }> = [];
    for (let i = 0; i < 11; i += 1) {
      const lane = (i % 4) - 1.5;
      const depth = Math.floor(i / 4);
      list.push({
        baseX: -34 + depth * 14,
        baseZ: lane * 14,
        team: 'red',
        phase: i * 0.7,
      });
      list.push({
        baseX: 34 - depth * 14,
        baseZ: -lane * 14,
        team: 'white',
        phase: i * 0.9 + 1.4,
      });
    }
    return list;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    players.forEach((p, idx) => {
      const mesh = playerRefs.current[idx];
      if (!mesh) {
        return;
      }
      mesh.position.x = p.baseX + Math.sin(t * 0.9 + p.phase) * 4.5;
      mesh.position.z = p.baseZ + Math.cos(t * 1.1 + p.phase) * 3.5;
    });

    if (ballRef.current) {
      ballRef.current.position.x = Math.sin(t * 1.4) * 26;
      ballRef.current.position.z = Math.cos(t * 1.9) * 18;
      ballRef.current.position.y = 0.35 + Math.abs(Math.sin(t * 3.6)) * 1.4;
    }
  });

  return (
    <group name="live-match-players">
      {players.map((p, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            playerRefs.current[idx] = el;
          }}
          position={[p.baseX, 0.95, p.baseZ]}
          castShadow
        >
          <capsuleGeometry args={[0.35, 1.0, 4, 8]} />
          <meshStandardMaterial color={p.team === 'red' ? '#ef4444' : '#f8fafc'} roughness={0.5} />
        </mesh>
      ))}
      <mesh ref={ballRef} position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.35} />
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

      <GoalFrame positionX={-PITCH_SPECS.length / 2} flip={true} />
      <GoalFrame positionX={PITCH_SPECS.length / 2} flip={false} />
      <TeamDugouts />
      <AnimatedPlayersAndBall />
    </group>
  );
}
