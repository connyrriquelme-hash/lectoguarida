/**
 * learning-feature-flag.js
 * Determina si el modo de aprendizaje V1 está habilitado.
 * Solo activable con ?engineV2=1&learningV1=1 en la URL.
 * No persiste en localStorage, sessionStorage ni cookies.
 */

function normalizeSearchParams(input) {
  if (input instanceof URLSearchParams) return input;
  if (input && typeof input === 'object' && input.searchParams instanceof URLSearchParams) return input.searchParams;
  if (typeof input === 'string') return new URLSearchParams(input);
  if (input && typeof input === 'object' && typeof input.search === 'string') return new URLSearchParams(input.search);
  return new URLSearchParams();
}

export function isLearningV1Enabled(searchParams) {
  var params = normalizeSearchParams(searchParams);
  var engineV2 = params.get('engineV2');
  var learningV1 = params.get('learningV1');
  return engineV2 === '1' && learningV1 === '1';
}

export function isDebugLearningEnabled(searchParams) {
  var params = normalizeSearchParams(searchParams);
  var debug = params.get('debugLearning');
  return debug === '1';
}
