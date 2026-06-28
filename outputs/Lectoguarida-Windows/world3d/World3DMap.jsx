import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Orb({ position, color, scale = 1, speed = 1.2 }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed * 0.6;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.12;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.35} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.54, 0.78, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Portal({ zone, index, onSelect }) {
  const ref = useRef();
  const active = zone.complete || zone.unlocked;
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (zone.locked ? 0.12 : 0.22);
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.35 + index) * (zone.locked ? 0.04 : 0.08);
  });
  const x = (index % 5 - 2) * 2.28;
  const z = Math.floor(index / 5) * 3.12 - 1.5;
  return (
    <group position={[x, 0, z]} onClick={() => onSelect(zone.id)}>
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <cylinderGeometry args={[1.02, 1.18, 0.44, 8]} />
        <meshStandardMaterial color={zone.color || '#3157b7'} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.06, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.98, 0.24, 8]} />
        <meshStandardMaterial color={active ? '#243d86' : '#19285e'} emissive={active ? zone.color || '#69e7ff' : '#0b1436'} emissiveIntensity={active ? 0.15 : 0.05} />
      </mesh>
      <group ref={ref}>
        <mesh castShadow>
          <torusGeometry args={[0.66, 0.14, 10, 32]} />
          <meshStandardMaterial color={zone.complete ? '#ffd85e' : zone.locked ? '#7f8ab7' : '#69e7ff'} emissive={zone.complete ? '#8b5b00' : '#065f73'} emissiveIntensity={1.2} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.48, 28]} />
          <meshBasicMaterial color={zone.locked ? '#48527c' : '#9d72ff'} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.14]} />
          <meshStandardMaterial color={active ? zone.color || '#9edfff' : '#55608b'} roughness={0.45} />
        </mesh>
      </group>
      <mesh position={[0, 0.96, 0]} castShadow>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color={zone.complete ? '#fff1a8' : zone.locked ? '#6a76a4' : '#ffffff'} emissive={zone.complete ? '#ffdb64' : '#0f1c4a'} emissiveIntensity={0.8} />
      </mesh>
      <Orb position={[0.8, 0.54, 0]} color={zone.color || '#9edfff'} scale={0.55} speed={1.6 + index * 0.04} />
    </group>
  );
}

function World({ zones, onSelect }) {
  const orbiters = useMemo(() => [
    ['#ffd45f', [-4.2, 2.4, -2.4]],
    ['#62e7a8', [4.1, 3.1, -0.6]],
    ['#65dfff', [-1.8, 4.1, 2.6]],
    ['#ae8cff', [2.8, 2.7, 3.6]],
    ['#ff8fbd', [-4.8, 1.9, 3.2]]
  ], []);

  return (
    <>
      <fog attach="fog" args={['#14214f', 9, 20]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 8, 5]} intensity={2.1} castShadow />
      <directionalLight position={[-4, 5, -2]} intensity={0.8} color="#88dfff" />
      <pointLight position={[-5, 3, -2]} color="#64f5d3" intensity={17} />
      <pointLight position={[4, 2, 3]} color="#ffb86d" intensity={10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[16, 11, 1, 1]} />
        <meshStandardMaterial color="#203b87" roughness={0.95} metalness={0.06} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
        <ringGeometry args={[2.1, 6.1, 40]} />
        <meshBasicMaterial color="#4cccf2" transparent opacity={0.11} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]} receiveShadow>
        <ringGeometry args={[5.4, 7.6, 40]} />
        <meshBasicMaterial color="#ffcf61" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]} receiveShadow>
        <cylinderGeometry args={[6.6, 7.4, 0.18, 10]} />
        <meshStandardMaterial color="#132454" roughness={1} />
      </mesh>
      {zones.map((zone, index) => (
        <Portal key={zone.id} zone={zone} index={index} onSelect={onSelect} />
      ))}
      {orbiters.map(([color, position], index) => (
        <Orb key={`${color}-${index}`} position={position} color={color} scale={0.5 + index * 0.03} speed={0.8 + index * 0.18} />
      ))}
    </>
  );
}

let root;
window.LectoguaridaWorld3D = {
  mount(el, zones, onSelect) {
    root?.unmount();
    root = createRoot(el);
    root.render(
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 7.2, 9.2], fov: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <World zones={zones} onSelect={onSelect} />
      </Canvas>
    );
  },
  unmount() {
    root?.unmount();
    root = null;
  }
};
