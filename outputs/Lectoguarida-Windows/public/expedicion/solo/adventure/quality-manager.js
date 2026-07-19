/**
 * quality-manager.js
 * Detecta la calidad gráfica (LOW / MEDIUM / HIGH) sin usar métricas de dispositivo.
 * Aplica presupuestos de pixelRatio, sombras, partículas y vegetación.
 */

export var QUALITY_TIERS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export function detectQuality(options) {
  options = options || {};
  if (options.force) return options.force;

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* noop */ }

  var smallScreen = false;
  try {
    smallScreen = (window.innerWidth || 1280) <= 480;
  } catch (e) { /* noop */ }

  if (reducedMotion || smallScreen) return QUALITY_TIERS.LOW;

  var cores = 4;
  try { if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) cores = navigator.hardwareConcurrency; } catch (e) {}
  var mem = 4;
  try { if (typeof navigator !== 'undefined' && navigator.deviceMemory) mem = navigator.deviceMemory; } catch (e) {}

  if (cores <= 2 || mem <= 2) return QUALITY_TIERS.LOW;
  if (cores >= 6 && mem >= 4) return QUALITY_TIERS.HIGH;
  return QUALITY_TIERS.MEDIUM;
}

export function getQualityConfig(tier) {
  switch (tier) {
    case QUALITY_TIERS.LOW:
      return {
        tier: QUALITY_TIERS.LOW,
        maxPixelRatio: 1,
        shadowsEnabled: false,
        shadowMapSize: 0,
        maxParticles: 50,
        vegitationCount: 0.4,
        animalAnimation: false,
        waterAnimated: false,
        directionalLights: 1,
        maxDrawCalls: 80
      };
    case QUALITY_TIERS.HIGH:
      return {
        tier: QUALITY_TIERS.HIGH,
        maxPixelRatio: 2,
        shadowsEnabled: true,
        shadowMapSize: 1024,
        maxParticles: 300,
        vegitationCount: 1,
        animalAnimation: true,
        waterAnimated: true,
        directionalLights: 2,
        maxDrawCalls: 180
      };
    case QUALITY_TIERS.MEDIUM:
    default:
      return {
        tier: QUALITY_TIERS.MEDIUM,
        maxPixelRatio: 1.5,
        shadowsEnabled: true,
        shadowMapSize: 512,
        maxParticles: 150,
        vegitationCount: 0.7,
        animalAnimation: true,
        waterAnimated: true,
        directionalLights: 1,
        maxDrawCalls: 130
      };
  }
}

export function createQualityManager(options) {
  var tier = detectQuality(options);
  var config = getQualityConfig(tier);

  return {
    getTier: function () { return tier; },
    getConfig: function () { return config; },
    isShadowsEnabled: function () { return config.shadowsEnabled; },
    isAnimationEnabled: function () { return config.animalAnimation; },
    getMaxPixelRatio: function () { return config.maxPixelRatio; },
    getMaxParticles: function () { return config.maxParticles; },
    getVegetationScale: function () { return config.vegitationCount; },
    getMaxDrawCalls: function () { return config.maxDrawCalls; }
  };
}
