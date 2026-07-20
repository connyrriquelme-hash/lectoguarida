/**
 * learning-feature-flag.js
 * Determina si el modo de aprendizaje V1 está habilitado.
 * Solo activable con ?engineV2=1&learningV1=1 en la URL.
 * No persiste en localStorage, sessionStorage ni cookies.
 */

export function isLearningV1Enabled(searchParams) {
  if (!searchParams) return false;
  var engineV2 = searchParams.get('engineV2');
  var learningV1 = searchParams.get('learningV1');
  return engineV2 === '1' && learningV1 === '1';
}

export function isDebugLearningEnabled(searchParams) {
  if (!searchParams) return false;
  var debug = searchParams.get('debugLearning');
  return debug === '1';
}
