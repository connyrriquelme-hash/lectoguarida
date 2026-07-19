/**
 * adventure.css.js
 * Exporta un string CSS para el HUD de la aventura 3D (inyectado en runtime).
 */

export var ADVENTURE_CSS = `
.adv-root {
  position: fixed; inset: 0; width: 100%; height: 100%;
  font-family: 'Baloo 2', system-ui, sans-serif; z-index: 50;
  background: linear-gradient(180deg, #bfe8ff 0%, #d9f3e6 100%);
  overflow: hidden;
}
.adv-root.hud-active { pointer-events: none; }
.adv-root.hud-active > * { pointer-events: auto; }
.adv-root.hud-active .adv-hud-header,
.adv-root.hud-active .adv-minimap,
.adv-root.hud-active .adv-mission-panel,
.adv-root.hud-active .adv-dialogue,
.adv-root.hud-active .adv-btn { pointer-events: auto; }
.adv-world-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0;
  pointer-events: auto;
}
.adv-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.adv-recenter-btn {
  position: absolute; top: 14px; right: 14px; z-index: 15;
  min-width: 44px; min-height: 44px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.85); color: #2d6a4f; font-size: 1.2rem;
  cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
}
.adv-recenter-btn:hover { background: #fff; }
.adv-camera-a11y {
  position: absolute; bottom: 80px; right: 14px; z-index: 15;
  display: flex; flex-direction: column; gap: 6px; pointer-events: auto;
}
.adv-camera-a11y button {
  min-width: 44px; min-height: 44px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.85); color: #2d6a4f; font-size: 1rem;
  cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.adv-camera-a11y button:hover { background: #fff; }
.adv-hud-header {
  position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between;
  align-items: center; padding: 10px 14px; gap: 10px; pointer-events: none;
  z-index: 10;
  background: linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0));
}
.adv-hud-header > * { pointer-events: auto; }
.adv-logo { font-weight: 800; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.4); font-size: 1.1rem; }
.adv-stars { background: rgba(255,255,255,0.85); border-radius: 999px; padding: 4px 12px; font-weight: 700; color: #2d6a4f; }
.adv-btn {
  min-width: 44px; min-height: 44px; border-radius: 12px; border: none; cursor: pointer;
  background: #4fd1c5; color: #fff; font-weight: 700; font-size: 0.95rem; padding: 8px 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.adv-btn.secondary { background: #ffd166; color: #5a4a00; }
.adv-mission-panel {
  position: absolute; left: 14px; top: 64px; max-width: 280px; background: rgba(255,255,255,0.92);
  border-radius: 16px; padding: 12px 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  z-index: 10;
}
.adv-mission-panel h3 { margin: 0 0 4px; font-size: 1rem; color: #2d6a4f; }
.adv-mission-panel p { margin: 0; font-size: 0.9rem; color: #444; line-height: 1.4; }
.adv-progress { margin-top: 8px; height: 8px; border-radius: 6px; background: #e0e0e0; overflow: hidden; }
.adv-progress > div { height: 100%; background: #4fd1c5; transition: width 0.3s ease; }
.adv-dialogue {
  position: absolute; left: 50%; bottom: 90px; transform: translateX(-50%);
  width: min(92vw, 540px); background: rgba(255,255,255,0.96); border-radius: 18px;
  padding: 16px 18px; box-shadow: 0 6px 20px rgba(0,0,0,0.25); text-align: center;
  z-index: 20;
}
.adv-dialogue .speaker { font-weight: 800; color: #2d6a4f; margin-bottom: 4px; }
.adv-dialogue .line { font-size: 1.05rem; color: #222; line-height: 1.4; }
.adv-dialogue .actions { margin-top: 12px; display: flex; gap: 10px; justify-content: center; }
.adv-minimap {
  position: absolute; right: 14px; bottom: 90px; width: 120px; height: 120px;
  background: rgba(255,255,255,0.9); border-radius: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  z-index: 12;
}
.adv-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.adv-character-select {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: flex-start; overflow-y: auto; overflow-x: hidden;
  background: linear-gradient(180deg, #cdeeff, #e6f9ee); gap: 18px;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  min-height: 100dvh; z-index: 40;
}
.adv-character-select h2 { color: #2d6a4f; margin: 0; font-size: 1.6rem; flex-shrink: 0; }
.adv-character-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  max-width: 640px; width: 100%;
}
.adv-character-card {
  background: #fff; border-radius: 18px; padding: 18px; cursor: pointer; text-align: center;
  border: 3px solid transparent; box-shadow: 0 3px 10px rgba(0,0,0,0.12); min-height: 120px;
}
.adv-character-card.selected { border-color: #4fd1c5; background: #e6fff5; }
.adv-character-card .name { font-weight: 800; color: #2d6a4f; margin-top: 8px; }
.adv-mobile-btn { box-shadow: 0 3px 8px rgba(0,0,0,0.25); }
.adv-reduced-motion * { animation: none !important; transition: none !important; }
@media (max-width: 600px) {
  .adv-character-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .adv-mission-panel { max-width: 60vw; font-size: 0.85rem; }
  .adv-minimap { width: 84px; height: 84px; }
  .adv-character-select { padding: 16px 12px; }
}
`;
