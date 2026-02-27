import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── Floating particles that drift slowly ───────────────────────────
function Particles({ count = 200 }) {
    const mesh = useRef();
    const elapsed = useRef(0);
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        return pos;
    }, [count]);

    const sizes = useMemo(() => {
        const s = new Float32Array(count);
        for (let i = 0; i < count; i++) s[i] = Math.random() * 0.03 + 0.01;
        return s;
    }, [count]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        elapsed.current += delta;
        const time = elapsed.current;
        const pos = mesh.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] += Math.sin(time * 0.3 + i) * 0.001;
            pos[i * 3] += Math.cos(time * 0.2 + i * 0.5) * 0.0005;
        }
        mesh.current.geometry.attributes.position.needsUpdate = true;
        mesh.current.rotation.y = time * 0.015;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.035}
                color="#c4b5fd"
                transparent
                opacity={0.35}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

// ─── Glowing wireframe shapes that float ────────────────────────────
function FloatingShape({ position, color, speed = 1, size = 0.4 }) {
    const mesh = useRef();
    const elapsed = useRef(0);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        elapsed.current += delta;
        const t = elapsed.current * speed;
        mesh.current.rotation.x = t * 0.4;
        mesh.current.rotation.z = t * 0.3;
    });

    return (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
            <mesh ref={mesh} position={position}>
                <octahedronGeometry args={[size, 0]} />
                <meshBasicMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.08}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </Float>
    );
}

// ─── Ambient light ring ─────────────────────────────────────────────
function GlowRing({ radius = 5, color = '#818cf8' }) {
    const mesh = useRef();
    const elapsed = useRef(0);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        elapsed.current += delta;
        mesh.current.rotation.x = Math.PI / 2 + Math.sin(elapsed.current * 0.2) * 0.1;
        mesh.current.rotation.z = elapsed.current * 0.05;
    });

    return (
        <mesh ref={mesh} position={[0, 0, -3]}>
            <torusGeometry args={[radius, 0.01, 8, 80]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.06}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

// ─── Main Background Scene ──────────────────────────────────────────
function SceneContent() {
    return (
        <>
            {/* Starfield */}
            <Stars
                radius={50}
                depth={30}
                count={1500}
                factor={3}
                saturation={0.2}
                fade
                speed={0.5}
            />

            {/* Floating particles */}
            <Particles count={150} />

            {/* Subtle floating wireframe shapes */}
            <FloatingShape position={[-6, 3, -5]} color="#e879f9" speed={0.8} size={0.6} />
            <FloatingShape position={[7, -2, -4]} color="#a78bfa" speed={0.6} size={0.5} />
            <FloatingShape position={[-3, -4, -6]} color="#fb7185" speed={1.0} size={0.3} />
            <FloatingShape position={[5, 4, -7]} color="#fbbf24" speed={0.7} size={0.4} />
            <FloatingShape position={[0, 0, -8]} color="#c4b5fd" speed={0.5} size={0.7} />

            {/* Glow rings */}
            <GlowRing radius={6} color="#a78bfa" />
            <GlowRing radius={4} color="#e879f9" />

            {/* Ambient fog */}
            <fog attach="fog" args={['#0a0816', 8, 30]} />
        </>
    );
}

function ThreeBackground() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 8], fov: 60 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <SceneContent />
            </Canvas>
        </div>
    );
}

export default ThreeBackground;
