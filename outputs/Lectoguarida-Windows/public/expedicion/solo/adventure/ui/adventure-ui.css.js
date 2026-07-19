/**
 * adventure-ui.css.js
 * Estilos del HUD, mapa mundial, minimapa y mochila de la aventura.
 */

export var ADVENTURE_UI_CSS = `
.adv-action-bar { position:absolute; right:14px; bottom:18px; display:flex; gap:10px; pointer-events:auto; }
.adv-action-btn {
  width:56px; height:56px; border-radius:50%; border:none; cursor:pointer; background:var(--accent,#4fd1c5); color:#fff;
  display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.25); position:relative;
}
.adv-action-btn svg { width:26px; height:26px; }
.adv-action-btn .adv-label { position:absolute; bottom:-18px; left:50%; transform:translateX(-50%); font-size:0.7rem; color:#2d6a4f; white-space:nowrap; }
.adv-labels-on .adv-action-btn .adv-label { display:block; }
.adv-labels-off .adv-action-btn .adv-label { display:none; }
.adv-minimap {
  position:absolute; right:14px; bottom:90px; width:140px; height:140px; background:rgba(245,235,210,0.95);
  border:4px solid #8d6e63; border-radius:14px; box-shadow:0 3px 10px rgba(0,0,0,0.2); overflow:hidden; pointer-events:auto;
}
.adv-minimap.minimized { width:44px; height:44px; border-radius:50%; }
.adv-minimap svg { width:100%; height:100%; }
.adv-backpack {
  position:absolute; right:14px; top:64px; display:grid; grid-template-columns:repeat(3,40px); gap:6px; background:rgba(255,255,255,0.92);
  border-radius:12px; padding:8px; box-shadow:0 3px 10px rgba(0,0,0,0.2); pointer-events:auto;
}
.adv-backpack-slot { width:40px; height:40px; border-radius:8px; background:#eef6f2; display:flex; align-items:center; justify-content:center; font-size:1.3rem; border:2px solid #cfe9e1; }
.adv-backpack-slot.filled { border-color:var(--accent,#4fd1c5); }
.adv-panel {
  position:absolute; inset:0; background:rgba(255,255,255,0.97); z-index:70; overflow:auto; padding:24px; pointer-events:auto;
}
.adv-panel h2 { color:#2d6a4f; }
.adv-world-map { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; max-width:900px; margin:0 auto; }
.adv-region { position:relative; min-height:120px; background:#cfe3d8; border-radius:16px; padding:14px; border:3px solid #a9c9bb; overflow:hidden; cursor:pointer; }
.adv-region.active { border-color:#4fd1c5; background:#d7f3ec; }
.adv-region.discovered { border-color:#9ad0f0; }
.adv-region.locked { filter:grayscale(0.6); cursor:not-allowed; }
.adv-region-name-hidden { font-weight:700; color:#2d6a4f; }
.adv-fog { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 40%, rgba(220,230,240,0.9), rgba(180,195,210,0.95)); }
.adv-fog-cloud { position:absolute; width:60px; height:40px; background:#fff; border-radius:50%; opacity:0.8; filter:blur(4px); }
.adv-fog-cloud-2 { left:40px; top:20px; }
.adv-fog-symbols { position:absolute; font-size:1.4rem; color:#5b6b7a; letter-spacing:2px; }
@keyframes adv-fog-swirl { 0%,100%{transform:translateX(-6px) rotate(-3deg);} 50%{transform:translateX(6px) rotate(3deg);} }
.adv-region-tag { display:inline-block; margin-left:8px; font-size:0.65rem; padding:2px 6px; border-radius:6px; background:#2d6a4f; color:#fff; }
.adv-reward-panel { text-align:center; }
.adv-character-card .motif { font-size:0.75rem; color:#666; }
@keyframes adv-bell-fly { from{transform:translateY(0);opacity:1;} to{transform:translateY(-120px);opacity:0;} }
.adv-bell-fly { animation:adv-bell-fly 0.8s ease-in forwards; }
`;
