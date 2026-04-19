import { useMemo } from "react";

const PROFILE_CONFIG = Object.freeze({
  low: Object.freeze({
    tier: "low",
    dprMax: 1.15,
    antialias: false,
    pointerTracking: false,
    particleCount: 760,
    sparkleCount: 140,
    shardCount: 12,
    ringCount: 2,
    petalCount: 5,
    heartCount: 3,
    flareCount: 2,
    enableComposer: true,
    enableChromatic: false,
    enableNoise: false,
    bloomBoost: 0.72,
    speedlineOpacityScale: 0.82,
    progressStep: 0.018,
    intensityUpdateStep: 0.12,
    cutStride: 2,
  }),
  medium: Object.freeze({
    tier: "medium",
    dprMax: 1.35,
    antialias: false,
    pointerTracking: true,
    particleCount: 1100,
    sparkleCount: 240,
    shardCount: 18,
    ringCount: 3,
    petalCount: 8,
    heartCount: 5,
    flareCount: 3,
    enableComposer: true,
    enableChromatic: false,
    enableNoise: true,
    bloomBoost: 0.88,
    speedlineOpacityScale: 0.92,
    progressStep: 0.012,
    intensityUpdateStep: 0.09,
    cutStride: 1,
  }),
  high: Object.freeze({
    tier: "high",
    dprMax: 1.6,
    antialias: true,
    pointerTracking: true,
    particleCount: 1600,
    sparkleCount: 360,
    shardCount: 24,
    ringCount: 3,
    petalCount: 11,
    heartCount: 7,
    flareCount: 3,
    enableComposer: true,
    enableChromatic: true,
    enableNoise: true,
    bloomBoost: 1,
    speedlineOpacityScale: 1,
    progressStep: 0.008,
    intensityUpdateStep: 0.065,
    cutStride: 1,
  }),
});

function detectPerformanceTier() {
  if (typeof window === "undefined") {
    return PROFILE_CONFIG.medium;
  }

  const nav = navigator;
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const saveData = Boolean(nav.connection?.saveData);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);

  let score = 0;
  score += cores >= 12 ? 3 : cores >= 8 ? 2 : cores >= 6 ? 1 : -1;
  score += memory >= 8 ? 2 : memory >= 6 ? 1 : memory <= 3 ? -2 : -1;

  if (coarsePointer) {
    score -= 1;
  }

  if (isMobileUa) {
    score -= 1;
  }

  if (saveData || reducedMotion) {
    score -= 2;
  }

  if (score <= -1) {
    return PROFILE_CONFIG.low;
  }

  if (score <= 2) {
    return PROFILE_CONFIG.medium;
  }

  return PROFILE_CONFIG.high;
}

export function usePerformanceProfile() {
  return useMemo(() => detectPerformanceTier(), []);
}
