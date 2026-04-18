import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const PARTICLE_COUNT = 2400;
const RESET_BOUNDS = {
  x: 120,
  y: 80,
  near: 24,
  far: -130,
};

const COLOR_SWATCHES = ["#ff4fa6", "#f2c45c", "#b76dff", "#ff82c4"];
const SHARD_COLORS = ["#ff95d5", "#ffe39a", "#95ecff", "#d1a4ff"];

const PHASE_PALETTES = [
  {
    background: "#140320",
    fog: "#220734",
    ambient: "#b16cff",
    key: "#ffd98e",
    fill: "#ff70cc",
    rim: "#6de0ff",
  },
  {
    background: "#1b0430",
    fog: "#2a0a42",
    ambient: "#c47aff",
    key: "#ffe59d",
    fill: "#ff7fc9",
    rim: "#8ef4ff",
  },
  {
    background: "#09051a",
    fog: "#1a0d31",
    ambient: "#8664cb",
    key: "#ffd38b",
    fill: "#ff96d8",
    rim: "#87e4ff",
  },
  {
    background: "#14060f",
    fog: "#2a0b1a",
    ambient: "#b460cd",
    key: "#ffd989",
    fill: "#ff5ea8",
    rim: "#ff8f65",
  },
  {
    background: "#250718",
    fog: "#3f0b21",
    ambient: "#ff86ca",
    key: "#ffe7ad",
    fill: "#ff53a5",
    rim: "#f2c45c",
  },
  {
    background: "#06010d",
    fog: "#120520",
    ambient: "#6f5da8",
    key: "#f4d79e",
    fill: "#d39dff",
    rim: "#ffc89c",
  },
];

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function resetParticle(index, positions, velocities) {
  const i3 = index * 3;
  const radius = randomInRange(10, 116);
  const theta = Math.random() * Math.PI * 2;

  positions[i3] = Math.cos(theta) * radius * randomInRange(0.35, 1);
  positions[i3 + 1] = Math.sin(theta) * radius * 0.7 * randomInRange(0.35, 1);
  positions[i3 + 2] = RESET_BOUNDS.far;

  const vx = positions[i3] * 0.01 + randomInRange(-0.08, 0.08);
  const vy = positions[i3 + 1] * 0.01 + randomInRange(-0.08, 0.08);
  const vz = randomInRange(0.35, 1.1);
  const length = Math.hypot(vx, vy, vz) || 1;

  velocities[i3] = vx / length;
  velocities[i3 + 1] = vy / length;
  velocities[i3 + 2] = vz / length;
}

function createParticleData() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const baseColors = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  const palette = COLOR_SWATCHES.map((swatch) => new THREE.Color(swatch));

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const i3 = i * 3;
    const radius = randomInRange(8, 116);
    const theta = Math.random() * Math.PI * 2;
    const spread = Math.pow(Math.random(), 0.62);

    positions[i3] = Math.cos(theta) * radius * spread;
    positions[i3 + 1] = Math.sin(theta) * radius * spread * 0.65 + randomInRange(-20, 20);
    positions[i3 + 2] = randomInRange(RESET_BOUNDS.far, RESET_BOUNDS.near);

    const direction = new THREE.Vector3(
      positions[i3],
      positions[i3 + 1],
      positions[i3 + 2],
    ).normalize();

    velocities[i3] = direction.x * randomInRange(0.35, 1.2);
    velocities[i3 + 1] = direction.y * randomInRange(0.35, 1.2);
    velocities[i3 + 2] = Math.abs(direction.z) * randomInRange(0.5, 1.6);

    const color = palette[Math.floor(Math.random() * palette.length)];
    baseColors[i3] = color.r;
    baseColors[i3 + 1] = color.g;
    baseColors[i3 + 2] = color.b;

    colors[i3] = baseColors[i3];
    colors[i3 + 1] = baseColors[i3 + 1];
    colors[i3 + 2] = baseColors[i3 + 2];
  }

  return {
    positions,
    velocities,
    baseColors,
    colors,
  };
}

function createShardData() {
  return Array.from({ length: 26 }, (_, index) => ({
    id: index,
    radius: randomInRange(3.8, 8.8),
    yOffset: randomInRange(-1.7, 1.7),
    depth: randomInRange(-2.8, 2.5),
    size: randomInRange(0.18, 0.48),
    speed: randomInRange(0.38, 1.08),
    pulse: randomInRange(1.3, 3.2),
    offset: Math.random() * Math.PI * 2,
    color: SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)],
  }));
}

function ParticleField({ sceneRig }) {
  const pointsRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);

  const { positions, velocities, baseColors, colors } = useMemo(
    () => createParticleData(),
    [],
  );

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;
    const driftStrength = 0.18 + rig.orbit * 0.95;
    const speed = 6.2 + rig.particleSpeed * 11.4;
    const explosion = rig.explosion;
    const burst = rig.colorBurst;

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const i3 = i * 3;

      positions[i3 + 2] += speed * delta;
      positions[i3] += Math.sin(elapsed * 0.78 + i * 0.012) * delta * driftStrength;
      positions[i3 + 1] += Math.cos(elapsed * 0.71 + i * 0.016) * delta * driftStrength * 0.75;

      if (explosion > 0.001) {
        positions[i3] += velocities[i3] * explosion * delta * 18;
        positions[i3 + 1] += velocities[i3 + 1] * explosion * delta * 18;
        positions[i3 + 2] += velocities[i3 + 2] * explosion * delta * 24;
      }

      if (
        positions[i3 + 2] > RESET_BOUNDS.near ||
        Math.abs(positions[i3]) > RESET_BOUNDS.x ||
        Math.abs(positions[i3 + 1]) > RESET_BOUNDS.y
      ) {
        resetParticle(i, positions, velocities);
      }

      const glowGain = 1 + burst * 2.45;
      colors[i3] = Math.min(baseColors[i3] * glowGain + burst * 0.2, 1);
      colors[i3 + 1] = Math.min(baseColors[i3 + 1] * glowGain + burst * 0.1, 1);
      colors[i3 + 2] = Math.min(baseColors[i3 + 2] * glowGain + burst * 0.3, 1);
    }

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.opacity =
        0.38 + Math.min(rig.bloom * 0.1 + rig.colorBurst * 0.46, 0.62);
      materialRef.current.size = 0.052 + rig.particleSpeed * 0.015 + rig.colorBurst * 0.04;
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.z = elapsed * 0.04 + rig.orbit * 0.12;
      pointsRef.current.rotation.x = Math.sin(elapsed * 0.21) * 0.06;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function EnergyCore({ sceneRig }) {
  const coreRef = useRef(null);
  const haloRef = useRef(null);
  const shellRef = useRef(null);
  const lightRef = useRef(null);

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;

    const pulse = 1 + Math.sin(elapsed * 2.7) * 0.08 + rig.ambientPulse * 0.08;
    const boost = 1 + rig.coreGlow * 0.12 + rig.colorBurst * 0.16;

    if (coreRef.current) {
      coreRef.current.rotation.x += delta * (0.22 + rig.spin * 0.7);
      coreRef.current.rotation.y += delta * (0.35 + rig.spin * 0.9);
      coreRef.current.scale.setScalar(pulse * boost);

      const emissiveIntensity = 1.3 + rig.coreGlow * 1.25 + rig.colorBurst * 1.45;
      coreRef.current.material.emissiveIntensity = emissiveIntensity;
    }

    if (haloRef.current) {
      haloRef.current.rotation.z -= delta * (0.18 + rig.spin * 0.58);
      haloRef.current.scale.setScalar(
        2.48 + rig.coreGlow * 0.36 + Math.sin(elapsed * 1.8) * 0.08,
      );
      haloRef.current.material.opacity = 0.16 + rig.bloom * 0.06 + rig.colorBurst * 0.32;
    }

    if (shellRef.current) {
      shellRef.current.rotation.y += delta * (0.16 + rig.spin * 0.6);
      shellRef.current.material.opacity = 0.08 + rig.colorBurst * 0.3;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 3.3 + rig.coreGlow * 4.1 + rig.colorBurst * 9;
      lightRef.current.distance = 28 + rig.zoom * 8 + rig.colorBurst * 16;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.18} floatIntensity={0.24}>
      <group position={[0, 0, -10]}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.35, 18]} />
          <meshStandardMaterial
            color="#ff7dca"
            emissive="#ff3ea9"
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>

        <mesh ref={haloRef}>
          <sphereGeometry args={[2.3, 40, 40]} />
          <meshBasicMaterial
            color="#b879ff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={shellRef}>
          <torusGeometry args={[2.8, 0.08, 28, 120]} />
          <meshBasicMaterial
            color="#ffd17a"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <pointLight
          ref={lightRef}
          position={[0, 0, 0]}
          color="#ff6ec4"
          intensity={5}
          distance={32}
          decay={2}
        />
      </group>
    </Float>
  );
}

function EnergyShards({ sceneRig }) {
  const groupRef = useRef(null);
  const shards = useMemo(() => createShardData(), []);

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;

    if (!groupRef.current) {
      return;
    }

    groupRef.current.children.forEach((mesh, index) => {
      const shard = shards[index];
      if (!shard) {
        return;
      }

      const orbitSpeed = shard.speed * (0.85 + rig.spin * 0.7);
      const angle = elapsed * orbitSpeed + shard.offset;
      const radialPulse = Math.sin(elapsed * 0.95 + shard.offset) * (0.45 + rig.orbit * 0.55);
      const radius = shard.radius + radialPulse;
      const lift = Math.sin(elapsed * 1.2 + shard.offset) * (0.7 + rig.colorBurst * 0.9);

      mesh.position.set(
        Math.cos(angle) * radius,
        shard.yOffset + Math.sin(angle * 1.35) * radius * 0.42 + lift * 0.26,
        shard.depth + Math.sin(elapsed * 1.05 + shard.offset) * 1.4,
      );

      const scale =
        1 + Math.sin(elapsed * shard.pulse + shard.offset) * 0.22 + rig.colorBurst * 0.38;

      mesh.scale.setScalar(scale);

      mesh.rotation.x += delta * (0.8 + rig.spin * 1.7 + shard.speed * 0.2);
      mesh.rotation.y += delta * (0.6 + rig.spin * 1.3 + shard.speed * 0.2);
      mesh.rotation.z += delta * (0.5 + rig.orbit * 0.8 + shard.speed * 0.16);

      mesh.material.emissiveIntensity =
        0.9 + rig.coreGlow * 0.86 + rig.colorBurst * 1.45;
      mesh.material.opacity = 0.34 + rig.colorBurst * 0.5;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      {shards.map((shard) => (
        <mesh key={shard.id} position={[shard.radius, shard.yOffset, shard.depth]}>
          <octahedronGeometry args={[shard.size, 0]} />
          <meshStandardMaterial
            color={shard.color}
            emissive={shard.color}
            emissiveIntensity={1.2}
            roughness={0.14}
            metalness={0.35}
            transparent
            opacity={0.44}
          />
        </mesh>
      ))}
    </group>
  );
}

function AtmosphericRings({ sceneRig }) {
  const groupRef = useRef(null);

  const ringData = useMemo(
    () => [
      {
        radius: 8.2,
        thickness: 0.08,
        color: "#ff7acb",
        speed: 0.12,
        tilt: 0.6,
        pulse: 1.2,
        baseScale: 1,
        opacity: 0.14,
        offset: 0,
      },
      {
        radius: 10.5,
        thickness: 0.06,
        color: "#8defff",
        speed: -0.1,
        tilt: 0.8,
        pulse: 1.5,
        baseScale: 1.05,
        opacity: 0.12,
        offset: 1.3,
      },
      {
        radius: 12.4,
        thickness: 0.09,
        color: "#ffd886",
        speed: 0.08,
        tilt: 0.5,
        pulse: 1.1,
        baseScale: 1.08,
        opacity: 0.1,
        offset: 2.5,
      },
    ],
    [],
  );

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;

    if (!groupRef.current) {
      return;
    }

    groupRef.current.children.forEach((mesh, index) => {
      const ring = ringData[index];
      if (!ring) {
        return;
      }

      mesh.rotation.z += delta * ring.speed * (1 + rig.spin * 0.9);
      mesh.rotation.x += delta * ring.tilt * (0.3 + rig.orbit * 0.7);

      const wave =
        1 + Math.sin(elapsed * ring.pulse + ring.offset) * (0.05 + rig.colorBurst * 0.1);

      mesh.scale.setScalar(ring.baseScale * wave);
      mesh.material.opacity = ring.opacity + rig.bloom * 0.04 + rig.colorBurst * 0.24;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -11.5]}>
      {ringData.map((ring, index) => (
        <mesh key={index} rotation={[Math.PI / (2.2 + index * 0.4), 0, 0]}>
          <torusGeometry args={[ring.radius, ring.thickness, 24, 200]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ReactiveSparkles({ sceneRig }) {
  const sparklesRef = useRef(null);

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;

    if (!sparklesRef.current) {
      return;
    }

    sparklesRef.current.rotation.y += delta * (0.03 + rig.orbit * 0.1);
    sparklesRef.current.rotation.x = Math.sin(elapsed * 0.22) * 0.1;

    if (sparklesRef.current.material) {
      sparklesRef.current.material.opacity =
        0.22 + rig.bloom * 0.08 + rig.colorBurst * 0.36;
    }
  });

  return (
    <Sparkles
      ref={sparklesRef}
      count={380}
      scale={[125, 72, 150]}
      size={2.35}
      speed={0.45}
      noise={1.2}
      color="#ffd6fb"
    />
  );
}

function Scene({ sceneRig, cursorRef }) {
  const bloomRef = useRef(null);
  const aberrationRef = useRef(null);

  const ambientLightRef = useRef(null);
  const keyLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const rimLightRef = useRef(null);

  const cameraTarget = useRef(new THREE.Vector3(0, 0, -10));
  const cameraPosition = useRef(new THREE.Vector3(0, 0, 18));

  const backgroundColor = useRef(new THREE.Color(PHASE_PALETTES[0].background));
  const fogColor = useRef(new THREE.Color(PHASE_PALETTES[0].fog));
  const ambientColor = useRef(new THREE.Color(PHASE_PALETTES[0].ambient));
  const keyColor = useRef(new THREE.Color(PHASE_PALETTES[0].key));
  const fillColor = useRef(new THREE.Color(PHASE_PALETTES[0].fill));
  const rimColor = useRef(new THREE.Color(PHASE_PALETTES[0].rim));

  const lerpStartColor = useRef(new THREE.Color());
  const lerpEndColor = useRef(new THREE.Color());

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;
    const cursor = cursorRef.current;

    const drift = 0.075 + rig.drift * 0.62;
    const orbit = rig.orbit;

    const baseX =
      Math.sin(elapsed * 0.37) * drift +
      Math.sin(elapsed * 0.93 + 1.3) * drift * 0.4 +
      cursor.x * 0.94;

    const baseY =
      Math.cos(elapsed * 0.29) * drift * 0.7 +
      Math.cos(elapsed * 0.81) * drift * 0.3 +
      cursor.y * 0.56;

    const orbitX = Math.sin(elapsed * (0.55 + orbit * 0.92)) * orbit * 0.92;
    const orbitY = Math.cos(elapsed * (0.5 + orbit * 0.84)) * orbit * 0.52;

    const shakeX = rig.shake > 0.001 ? (Math.random() - 0.5) * rig.shake * 0.8 : 0;
    const shakeY = rig.shake > 0.001 ? (Math.random() - 0.5) * rig.shake * 0.62 : 0;
    const shakeZ = rig.shake > 0.001 ? (Math.random() - 0.5) * rig.shake * 0.44 : 0;

    const targetZ = 18 - rig.push * 4.5 - rig.zoom * 4.45 + shakeZ;

    cameraPosition.current.set(baseX + orbitX + shakeX, baseY + orbitY + shakeY, targetZ);

    state.camera.position.lerp(cameraPosition.current, 1 - Math.exp(-delta * 6));

    cameraTarget.current.set(
      orbitX * 0.45 + cursor.x * 0.22,
      orbitY * 0.35 + cursor.y * 0.18,
      -10 + rig.zoom * 0.82,
    );

    state.camera.lookAt(cameraTarget.current);

    const bank = Math.sin(elapsed * 0.63) * 0.02 + rig.spin * 0.012;
    state.camera.rotation.z += (bank - state.camera.rotation.z) * (1 - Math.exp(-delta * 6));

    const phaseIndex = clamp(rig.phaseColor ?? 0, 0, PHASE_PALETTES.length - 1);
    const phaseFloor = Math.floor(phaseIndex);
    const phaseCeil = Math.min(PHASE_PALETTES.length - 1, phaseFloor + 1);
    const phaseMix = phaseIndex - phaseFloor;

    const startPalette = PHASE_PALETTES[phaseFloor];
    const endPalette = PHASE_PALETTES[phaseCeil];

    lerpStartColor.current.set(startPalette.background);
    lerpEndColor.current.set(endPalette.background);
    backgroundColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    lerpStartColor.current.set(startPalette.fog);
    lerpEndColor.current.set(endPalette.fog);
    fogColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    lerpStartColor.current.set(startPalette.ambient);
    lerpEndColor.current.set(endPalette.ambient);
    ambientColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    lerpStartColor.current.set(startPalette.key);
    lerpEndColor.current.set(endPalette.key);
    keyColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    lerpStartColor.current.set(startPalette.fill);
    lerpEndColor.current.set(endPalette.fill);
    fillColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    lerpStartColor.current.set(startPalette.rim);
    lerpEndColor.current.set(endPalette.rim);
    rimColor.current.lerpColors(lerpStartColor.current, lerpEndColor.current, phaseMix);

    state.scene.background = backgroundColor.current;

    if (state.scene.fog) {
      state.scene.fog.color.copy(fogColor.current);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(ambientColor.current);
      ambientLightRef.current.intensity = 0.26 + rig.bloom * 0.26;
    }

    if (keyLightRef.current) {
      keyLightRef.current.color.copy(keyColor.current);
      keyLightRef.current.intensity = 0.52 + rig.coreGlow * 0.2;
    }

    if (fillLightRef.current) {
      fillLightRef.current.color.copy(fillColor.current);
      fillLightRef.current.intensity = 0.42 + rig.bloom * 0.22;
    }

    if (rimLightRef.current) {
      rimLightRef.current.color.copy(rimColor.current);
      rimLightRef.current.intensity = 0.45 + rig.colorBurst * 0.9;
      rimLightRef.current.distance = 48 + rig.zoom * 8;
    }

    if (bloomRef.current) {
      bloomRef.current.intensity = 0.78 + rig.bloom * 2.15 + rig.colorBurst * 2.7;
    }

    if (aberrationRef.current) {
      const offset = 0.0005 + rig.shake * 0.0018 + rig.colorBurst * 0.0024;
      aberrationRef.current.offset.set(offset, offset * 1.2);
    }
  });

  return (
    <>
      <color attach="background" args={["#040109"]} />
      <fog attach="fog" args={["#090116", 18, 150]} />

      <ambientLight ref={ambientLightRef} intensity={0.2} color="#a26eff" />
      <directionalLight
        ref={keyLightRef}
        position={[-8, 10, 5]}
        color="#ffd289"
        intensity={0.45}
      />
      <directionalLight
        ref={fillLightRef}
        position={[9, -5, 2]}
        color="#ff78c8"
        intensity={0.35}
      />
      <pointLight
        ref={rimLightRef}
        position={[0, 5, 2]}
        color="#f2c45c"
        intensity={0.4}
        distance={48}
        decay={2}
      />

      <ParticleField sceneRig={sceneRig} />
      <ReactiveSparkles sceneRig={sceneRig} />
      <EnergyCore sceneRig={sceneRig} />
      <AtmosphericRings sceneRig={sceneRig} />
      <EnergyShards sceneRig={sceneRig} />

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom
          ref={bloomRef}
          intensity={1.1}
          mipmapBlur
          luminanceThreshold={0.12}
          luminanceSmoothing={0.3}
        />

        <ChromaticAberration
          ref={aberrationRef}
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.001, 0.0012)}
          radialModulation
          modulationOffset={0.24}
        />

        <Noise opacity={0.07} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Vignette eskil={false} offset={0.16} darkness={0.82} />
      </EffectComposer>
    </>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default memo(Scene);
