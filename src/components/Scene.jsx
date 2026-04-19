import { memo, useEffect, useMemo, useRef } from "react";
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

const RESET_BOUNDS = {
  x: 120,
  y: 80,
  near: 24,
  far: -130,
};

const COLOR_SWATCHES = ["#ff7ecb", "#ffd4a5", "#d6b0ff", "#9cecff", "#ffc9df"];
const SHARD_COLORS = ["#ffc2e6", "#ffe7be", "#bcecff", "#dec2ff", "#ffd7b3"];

const TIER_CONFIGS = Object.freeze({
  low: Object.freeze({
    frameSkip: 2,
    colorUpdateStep: 2,
    sparkleSize: 1.8,
    ringRadialSegments: 16,
    ringTubularSegments: 96,
    cameraSmoothing: 5.2,
    particleSpeedScale: 0.82,
    bloomMultiplier: 0.72,
  }),
  medium: Object.freeze({
    frameSkip: 1,
    colorUpdateStep: 2,
    sparkleSize: 1.95,
    ringRadialSegments: 20,
    ringTubularSegments: 140,
    cameraSmoothing: 5.8,
    particleSpeedScale: 0.9,
    bloomMultiplier: 0.86,
  }),
  high: Object.freeze({
    frameSkip: 1,
    colorUpdateStep: 1,
    sparkleSize: 2.1,
    ringRadialSegments: 24,
    ringTubularSegments: 200,
    cameraSmoothing: 6,
    particleSpeedScale: 1,
    bloomMultiplier: 1,
  }),
});

const PHASE_PALETTES = [
  {
    background: "#241432",
    fog: "#332047",
    ambient: "#d39dff",
    key: "#ffe2bf",
    fill: "#ff9cd7",
    rim: "#a8ebff",
  },
  {
    background: "#2d1840",
    fog: "#3f2756",
    ambient: "#dfa8ff",
    key: "#ffe8c9",
    fill: "#ffb1df",
    rim: "#b8f1ff",
  },
  {
    background: "#1f1430",
    fog: "#2e1e43",
    ambient: "#bb95f1",
    key: "#ffd7b2",
    fill: "#ffbde7",
    rim: "#9eeaff",
  },
  {
    background: "#2a1428",
    fog: "#3d1d3b",
    ambient: "#d189d9",
    key: "#ffe1b3",
    fill: "#ff88c8",
    rim: "#ffb89f",
  },
  {
    background: "#3a1732",
    fog: "#512344",
    ambient: "#ff9fd6",
    key: "#ffebc6",
    fill: "#ff79bd",
    rim: "#ffd7a8",
  },
  {
    background: "#1c1328",
    fog: "#2a1d3b",
    ambient: "#b695dd",
    key: "#ffe0bd",
    fill: "#e2bcff",
    rim: "#ffd2b4",
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function resolveTierConfig(performanceProfile) {
  const tier = performanceProfile?.tier;

  if (tier === "low") {
    return TIER_CONFIGS.low;
  }

  if (tier === "high") {
    return TIER_CONFIGS.high;
  }

  return TIER_CONFIGS.medium;
}

function createParticleData(count) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const baseColors = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const driftA = new Float32Array(count);
  const driftB = new Float32Array(count);

  const palette = COLOR_SWATCHES.map((swatch) => new THREE.Color(swatch));

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = randomInRange(8, 116);
    const theta = Math.random() * Math.PI * 2;
    const spread = Math.pow(Math.random(), 0.62);

    positions[i3] = Math.cos(theta) * radius * spread;
    positions[i3 + 1] = Math.sin(theta) * radius * spread * 0.65 + randomInRange(-20, 20);
    positions[i3 + 2] = randomInRange(RESET_BOUNDS.far, RESET_BOUNDS.near);

    const dx = positions[i3];
    const dy = positions[i3 + 1];
    const dz = positions[i3 + 2];
    const directionLength = Math.hypot(dx, dy, dz) || 1;

    velocities[i3] = (dx / directionLength) * randomInRange(0.35, 1.2);
    velocities[i3 + 1] = (dy / directionLength) * randomInRange(0.35, 1.2);
    velocities[i3 + 2] = Math.abs(dz / directionLength) * randomInRange(0.5, 1.6);

    const color = palette[Math.floor(Math.random() * palette.length)];
    baseColors[i3] = color.r;
    baseColors[i3 + 1] = color.g;
    baseColors[i3 + 2] = color.b;

    colors[i3] = baseColors[i3];
    colors[i3 + 1] = baseColors[i3 + 1];
    colors[i3 + 2] = baseColors[i3 + 2];

    driftA[i] = Math.random() * Math.PI * 2;
    driftB[i] = Math.random() * Math.PI * 2;
  }

  return {
    count,
    positions,
    velocities,
    baseColors,
    colors,
    driftA,
    driftB,
  };
}

function resetParticle(index, data) {
  const i3 = index * 3;
  const radius = randomInRange(10, 116);
  const theta = Math.random() * Math.PI * 2;

  data.positions[i3] = Math.cos(theta) * radius * randomInRange(0.35, 1);
  data.positions[i3 + 1] = Math.sin(theta) * radius * 0.7 * randomInRange(0.35, 1);
  data.positions[i3 + 2] = RESET_BOUNDS.far;

  const vx = data.positions[i3] * 0.01 + randomInRange(-0.08, 0.08);
  const vy = data.positions[i3 + 1] * 0.01 + randomInRange(-0.08, 0.08);
  const vz = randomInRange(0.35, 1.1);
  const length = Math.hypot(vx, vy, vz) || 1;

  data.velocities[i3] = vx / length;
  data.velocities[i3 + 1] = vy / length;
  data.velocities[i3 + 2] = vz / length;

  data.driftA[index] = Math.random() * Math.PI * 2;
  data.driftB[index] = Math.random() * Math.PI * 2;
}

function createShardData(shardCount) {
  return Array.from({ length: shardCount }, (_, index) => ({
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

function ParticleField({ sceneRig, particleCount, tierConfig }) {
  const pointsRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const frameCounterRef = useRef(0);

  const data = useMemo(() => createParticleData(particleCount), [particleCount]);

  useFrame((state) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;
    const frame = ++frameCounterRef.current;

    const shouldSkip = tierConfig.frameSkip > 1 && frame % tierConfig.frameSkip !== 0;
    const effectiveDelta = Math.min(delta * (shouldSkip ? tierConfig.frameSkip : 1), 0.06);

    if (shouldSkip) {
      if (pointsRef.current) {
        pointsRef.current.rotation.z = elapsed * 0.04 + rig.orbit * 0.12;
        pointsRef.current.rotation.x = Math.sin(elapsed * 0.21) * 0.06;
      }

      return;
    }

    const driftStrength = 0.18 + rig.orbit * 0.95;
    const speed = (6.2 + rig.particleSpeed * 11.4) * tierConfig.particleSpeedScale;
    const explosion = rig.explosion;
    const burst = rig.colorBurst;
    const shouldRefreshColor = frame % tierConfig.colorUpdateStep === 0;

    for (let i = 0; i < data.count; i += 1) {
      const i3 = i * 3;

      data.positions[i3 + 2] += speed * effectiveDelta;
      data.positions[i3] += Math.sin(elapsed * 0.78 + data.driftA[i]) * effectiveDelta * driftStrength;
      data.positions[i3 + 1] +=
        Math.cos(elapsed * 0.71 + data.driftB[i]) * effectiveDelta * driftStrength * 0.75;

      if (explosion > 0.001) {
        data.positions[i3] += data.velocities[i3] * explosion * effectiveDelta * 18;
        data.positions[i3 + 1] += data.velocities[i3 + 1] * explosion * effectiveDelta * 18;
        data.positions[i3 + 2] += data.velocities[i3 + 2] * explosion * effectiveDelta * 24;
      }

      if (
        data.positions[i3 + 2] > RESET_BOUNDS.near ||
        Math.abs(data.positions[i3]) > RESET_BOUNDS.x ||
        Math.abs(data.positions[i3 + 1]) > RESET_BOUNDS.y
      ) {
        resetParticle(i, data);
      }

      if (shouldRefreshColor) {
        const glowGain = 1 + burst * 2.45;
        data.colors[i3] = Math.min(data.baseColors[i3] * glowGain + burst * 0.2, 1);
        data.colors[i3 + 1] = Math.min(data.baseColors[i3 + 1] * glowGain + burst * 0.1, 1);
        data.colors[i3 + 2] = Math.min(data.baseColors[i3 + 2] * glowGain + burst * 0.3, 1);
      }
    }

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true;

      if (shouldRefreshColor) {
        geometryRef.current.attributes.color.needsUpdate = true;
      }
    }

    if (materialRef.current) {
      materialRef.current.opacity =
        0.38 + Math.min(rig.bloom * 0.1 + rig.colorBurst * 0.46, 0.62);
      materialRef.current.size = 0.05 + rig.particleSpeed * 0.012 + rig.colorBurst * 0.032;
    }

    if (pointsRef.current) {
      pointsRef.current.rotation.z = elapsed * 0.04 + rig.orbit * 0.12;
      pointsRef.current.rotation.x = Math.sin(elapsed * 0.21) * 0.06;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
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
      coreRef.current.material.emissiveIntensity = 1.3 + rig.coreGlow * 1.25 + rig.colorBurst * 1.45;
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
          <icosahedronGeometry args={[1.35, 12]} />
          <meshStandardMaterial
            color="#ff7dca"
            emissive="#ff3ea9"
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>

        <mesh ref={haloRef}>
          <sphereGeometry args={[2.3, 28, 28]} />
          <meshBasicMaterial
            color="#b879ff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={shellRef}>
          <torusGeometry args={[2.8, 0.08, 18, 84]} />
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

function EnergyShards({ sceneRig, shardCount }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const shards = useMemo(() => createShardData(shardCount), [shardCount]);
  const colors = useMemo(
    () => shards.map((shard) => new THREE.Color(shard.color)),
    [shards],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    shards.forEach((shard, index) => {
      tempObject.position.set(shard.radius, shard.yOffset, shard.depth);
      tempObject.scale.setScalar(shard.size * 2.2);
      tempObject.rotation.set(0, 0, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
      mesh.setColorAt(index, colors[index]);
    });

    mesh.instanceMatrix.needsUpdate = true;

    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [colors, shards, tempObject]);

  useFrame((state, delta) => {
    const rig = sceneRig.current;
    const elapsed = state.clock.elapsedTime;
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    for (let i = 0; i < shards.length; i += 1) {
      const shard = shards[i];
      const orbitSpeed = shard.speed * (0.85 + rig.spin * 0.7);
      const angle = elapsed * orbitSpeed + shard.offset;
      const radialPulse = Math.sin(elapsed * 0.95 + shard.offset) * (0.45 + rig.orbit * 0.55);
      const radius = shard.radius + radialPulse;
      const lift = Math.sin(elapsed * 1.2 + shard.offset) * (0.7 + rig.colorBurst * 0.9);
      const scale =
        (1 + Math.sin(elapsed * shard.pulse + shard.offset) * 0.22 + rig.colorBurst * 0.38) *
        shard.size *
        2.2;

      tempObject.position.set(
        Math.cos(angle) * radius,
        shard.yOffset + Math.sin(angle * 1.35) * radius * 0.42 + lift * 0.26,
        shard.depth + Math.sin(elapsed * 1.05 + shard.offset) * 1.4,
      );

      tempObject.rotation.set(
        elapsed * (0.8 + rig.spin * 1.7 + shard.speed * 0.2),
        elapsed * (0.6 + rig.spin * 1.3 + shard.speed * 0.2),
        elapsed * (0.5 + rig.orbit * 0.8 + shard.speed * 0.16),
      );
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.9 + rig.coreGlow * 0.86 + rig.colorBurst * 1.45;
      materialRef.current.opacity = 0.3 + rig.colorBurst * 0.4;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, shardCount]} position={[0, 0, -10]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffd8f3"
        emissive="#ff98d6"
        emissiveIntensity={1.2}
        vertexColors
        roughness={0.14}
        metalness={0.35}
        transparent
        opacity={0.4}
      />
    </instancedMesh>
  );
}

function AtmosphericRings({ sceneRig, ringCount, tierConfig }) {
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
    ].slice(0, ringCount),
    [ringCount],
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

      const wave = 1 + Math.sin(elapsed * ring.pulse + ring.offset) * (0.05 + rig.colorBurst * 0.1);

      mesh.scale.setScalar(ring.baseScale * wave);
      mesh.material.opacity = ring.opacity + rig.bloom * 0.04 + rig.colorBurst * 0.24;
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -11.5]}>
      {ringData.map((ring, index) => (
        <mesh key={index} rotation={[Math.PI / (2.2 + index * 0.4), 0, 0]}>
          <torusGeometry
            args={[
              ring.radius,
              ring.thickness,
              tierConfig.ringRadialSegments,
              tierConfig.ringTubularSegments,
            ]}
          />
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

function ReactiveSparkles({ sceneRig, sparkleCount, tierConfig }) {
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
      sparklesRef.current.material.opacity = 0.18 + rig.bloom * 0.07 + rig.colorBurst * 0.3;
    }
  });

  if (sparkleCount < 1) {
    return null;
  }

  return (
    <Sparkles
      ref={sparklesRef}
      count={sparkleCount}
      scale={[125, 72, 150]}
      size={tierConfig.sparkleSize}
      speed={0.45}
      noise={1.2}
      color="#ffe4f8"
    />
  );
}

function Scene({ sceneRig, cursorRef, performanceProfile }) {
  const tierConfig = useMemo(() => resolveTierConfig(performanceProfile), [performanceProfile?.tier]);

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
    const safeDelta = Math.min(delta, 0.05);

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

    state.camera.position.lerp(
      cameraPosition.current,
      1 - Math.exp(-safeDelta * tierConfig.cameraSmoothing),
    );

    cameraTarget.current.set(
      orbitX * 0.45 + cursor.x * 0.22,
      orbitY * 0.35 + cursor.y * 0.18,
      -10 + rig.zoom * 0.82,
    );

    state.camera.lookAt(cameraTarget.current);

    const bank = Math.sin(elapsed * 0.63) * 0.02 + rig.spin * 0.012;
    state.camera.rotation.z += (bank - state.camera.rotation.z) * (1 - Math.exp(-safeDelta * 6));

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
      bloomRef.current.intensity =
        (0.84 + rig.bloom * 1.78 + rig.colorBurst * 2.15) * tierConfig.bloomMultiplier;
    }

    if (aberrationRef.current && performanceProfile?.enableChromatic) {
      const offset = 0.0004 + rig.shake * 0.0014 + rig.colorBurst * 0.002;
      aberrationRef.current.offset.set(offset, offset * 1.2);
    }
  });

  const chromaticOffset = useMemo(() => new THREE.Vector2(0.001, 0.0012), []);

  return (
    <>
      <color attach="background" args={["#140d21"]} />
      <fog attach="fog" args={["#201633", 18, 150]} />

      <ambientLight ref={ambientLightRef} intensity={0.24} color="#c496ff" />
      <directionalLight
        ref={keyLightRef}
        position={[-8, 10, 5]}
        color="#ffe3bf"
        intensity={0.45}
      />
      <directionalLight
        ref={fillLightRef}
        position={[9, -5, 2]}
        color="#ffb0df"
        intensity={0.35}
      />
      <pointLight
        ref={rimLightRef}
        position={[0, 5, 2]}
        color="#ffd6a8"
        intensity={0.4}
        distance={48}
        decay={2}
      />

      <ParticleField
        sceneRig={sceneRig}
        particleCount={performanceProfile?.particleCount ?? 1100}
        tierConfig={tierConfig}
      />
      <ReactiveSparkles
        sceneRig={sceneRig}
        sparkleCount={performanceProfile?.sparkleCount ?? 240}
        tierConfig={tierConfig}
      />
      <EnergyCore sceneRig={sceneRig} />
      <AtmosphericRings
        sceneRig={sceneRig}
        ringCount={performanceProfile?.ringCount ?? 3}
        tierConfig={tierConfig}
      />
      <EnergyShards sceneRig={sceneRig} shardCount={performanceProfile?.shardCount ?? 18} />

      {performanceProfile?.enableComposer !== false ? (
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom
            ref={bloomRef}
            intensity={1}
            mipmapBlur={performanceProfile?.tier !== "low"}
            luminanceThreshold={performanceProfile?.tier === "low" ? 0.12 : 0.1}
            luminanceSmoothing={performanceProfile?.tier === "low" ? 0.34 : 0.42}
          />

          {performanceProfile?.enableChromatic ? (
            <ChromaticAberration
              ref={aberrationRef}
              blendFunction={BlendFunction.NORMAL}
              offset={chromaticOffset}
              radialModulation
              modulationOffset={0.24}
            />
          ) : null}

          {performanceProfile?.enableNoise ? (
            <Noise opacity={performanceProfile?.tier === "high" ? 0.04 : 0.025} blendFunction={BlendFunction.SOFT_LIGHT} />
          ) : null}

          <Vignette
            eskil={false}
            offset={performanceProfile?.tier === "low" ? 0.24 : 0.2}
            darkness={performanceProfile?.tier === "low" ? 0.58 : 0.64}
          />
        </EffectComposer>
      ) : null}
    </>
  );
}

export default memo(Scene);
