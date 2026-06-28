const params = new URLSearchParams(location.search);
const fallback = params.get('mode') === 'fallback';
const ctx = {
  score: 0,
  hits: 0,
  errors: 0,
  startedAt: Date.now()
};
const el = (id) => document.getElementById(id);
const token = params.get('token') || '';
const payload = params.get('payload') || '';
el('context').textContent = fallback ? 'Fallback activo. El juego principal sigue disponible.' : 'Toca las burbujas correctas y luego termina la prueba.';

document.querySelectorAll('.bubble').forEach((button) => {
  button.addEventListener('click', () => {
    const delta = Number(button.dataset.score || 0);
    ctx.score = Math.max(0, ctx.score + delta);
    if (button.classList.contains('correct')) ctx.hits += 1;
    else ctx.errors += 1;
    el('score').textContent = ctx.score;
    el('hits').textContent = ctx.hits;
    el('errors').textContent = ctx.errors;
  });
});

document.getElementById('finish').addEventListener('click', () => {
  const result = {
    type: 'construct3-result',
    token,
    payload,
    studentId: params.get('studentId'),
    levelId: params.get('levelId'),
    skill: params.get('skill'),
    score: ctx.score,
    aciertos: ctx.hits,
    errores: ctx.errors,
    timeMs: Date.now() - ctx.startedAt,
    completed: ctx.hits >= 2
  };
  if (window.parent && window.parent !== window) window.parent.postMessage(result, '*');
  el('context').textContent = 'Resultado enviado a la app principal.';
});

document.getElementById('fallback').addEventListener('click', () => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'construct3-fallback', message: 'El minijuego externo no cargó.' }, '*');
  }
  el('context').textContent = 'Fallback enviado al contenedor principal.';
});
