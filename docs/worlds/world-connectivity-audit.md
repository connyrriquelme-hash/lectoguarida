# World Connectivity Audit — Lectoguarida: El Archipiélago de las Palabras

## Current Status (Post-Fix)

| World | ID | Scene | Spawn | Connected To | Status |
|-------|----|-------|-------|-------------|--------|
| Plaza Costera | `plaza_coastal` | `zone_a_coastal.tscn` | (0, 0.5, 0) | B, C, D, E, F, G, Sanctuary | ✅ |
| Humedal del Río | `humedal` | `zone_b_humedal.tscn` | (55, 0.5, 0) | A, C, F | ✅ |
| Estribaciones Andinas | `estribaciones` | `zone_c_estribaciones.tscn` | (-55, 0.5, 0) | A, B, G | ✅ |
| Puerto de los Gigantes | `puerto` | `zone_d_puerto.tscn` | (0, 0.5, 100) | A, B, E, H | ✅ |
| Litoral del Viento | `litoral` | `zone_e_litoral.tscn` | (0, 0.5, -100) | A, D, I | ✅ |
| Viña del Mar | `vina` | `zone_f_vina.tscn` | (100, 0.5, 0) | A, B, G, H | ✅ |
| Valparaíso | `valparaiso` | `zone_g_valparaiso.tscn` | (-100, 0.5, 0) | A, C, F | ✅ |
| Isla Negra | `isla_negra` | `zone_h_isla_negra.tscn` | (0, 0.5, 200) | F, D, I | ✅ |
| El Tabo | `el_tabo` | `zone_i_el_tabo.tscn` | (0, 0.5, -200) | E, H | ✅ |
| Santuario | `sanctuary` | `main_world.tscn` (inline) | (20, 0.5, 0) | A | ✅ |

## Portal Inventory

| Source | Portal Name | Target | Type | Bidirectional |
|--------|------------|--------|------|---------------|
| A | `Portal_wetland`→B | Humedal | Hardcoded | ✅ (Portal_coastal→A) |
| A | `Portal_foothills`→C | Estribaciones | Hardcoded | ✅ (Portal_coastal→A) |
| A | `Portal_puerto`→D | Puerto | Runtime | ✅ (portal_coastal→A) |
| A | `Portal_litoral`→E | Litoral | Runtime | ✅ (portal_coastal→A) |
| A | `Portal_vina`→F | Viña | Runtime | ✅ (Plaza Costera→A) |
| A | `Portal_valpo`→G | Valparaíso | Runtime | ✅ (Plaza Costera→A) |
| B | `portal_vina`→F | Viña | Runtime | ✅ (portal_vina→B in F) |
| C | `portal_valpo`→G | Valparaíso | Runtime | ✅ (portal_vina→C in G) |
| D | `portal_islanegra`→H | Isla Negra | Runtime | ✅ (portal_puerto→D in H) |
| E | `portal_eltabo`→I | El Tabo | Runtime | ✅ (portal_litoral→E in I) |
| F | `portal_valpo`→G | Valparaíso | Runtime | ✅ (portal_vina→F in G) |
| F | `portal_islanegra`→H | Isla Negra | Runtime | ✅ (portal_vina→F in H) |
| G | `portal_vina`→F | Viña | Runtime | ✅ (portal_valpo→G in F) |
| H | `portal_vina`→F | Viña | Runtime | ✅ (portal_islanegra→H in F) |
| H | `portal_puerto`→D | Puerto | Runtime | ✅ (portal_islanegra→H in D) |
| H | `portal_eltabo`→I | El Tabo | Runtime | ✅ (portal_islanegra→H in I) |
| I | `portal_litoral`→E | Litoral | Runtime | ✅ (portal_eltabo→I in E) |
| I | `portal_islanegra`→H | Isla Negra | Runtime | ✅ (portal_eltabo→I in H) |

## Safety Systems

| System | Status | Details |
|--------|--------|---------|
| SafetySystem (node) | ✅ | Register checkpoints, force_rescue(), fall detection |
| KillZones | ✅ | Under each zone at Y=-20, 1.5x area |
| LastSafeTransform | ✅ | Updated when is_on_floor() |
| Anti-stuck detection | ✅ | 3s threshold, 10-frame position tracking |
| F8 recovery key | ✅ | Returns to SafetySystem last safe position |
| Portal cooldown | ✅ | 1.0s, disables Area3D monitoring during cooldown |
| Bridge collision | ✅ | world_repair.gd single source of truth |

## Progress Preservation

| Element | Persists Across Warps? | Mechanism |
|---------|----------------------|-----------|
| Player profile | ✅ | Autoload singleton |
| Reader path | ✅ | ProgressionManager |
| Treasure (coins) | ✅ | ProgressionManager |
| Released animals | ✅ | ProgressionManager |
| Syllables | ✅ | ProgressionManager |
| Gems | ✅ | GemSpawner + ProgressionManager |
| Active mission | ✅ | ProgressionManager |
| Unlocked worlds | ✅ | ProgressionManager |
| Golden kitten | ✅ | rescue_golden_kitten() preserved |
| House furniture | ✅ | HouseBuilder saves to ProgressionManager |
