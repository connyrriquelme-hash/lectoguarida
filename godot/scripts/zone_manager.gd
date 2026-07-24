## Autoload singleton that manages zone transitions in the unified open world.
## Add this to Project Settings > Autoload as "ZoneManager".
extends Node

## Available zone scene paths
const ZONE_A: String = "res://scenes/zone_a_coastal.tscn"
const ZONE_B: String = "res://scenes/zone_b_humedal.tscn"
const ZONE_C: String = "res://scenes/zone_c_estribaciones.tscn"
const ZONE_D: String = "res://scenes/zone_d_puerto.tscn"
const ZONE_E: String = "res://scenes/zone_e_litoral.tscn"
const ZONE_F: String = "res://scenes/zone_f_vina.tscn"
const ZONE_G: String = "res://scenes/zone_g_valparaiso.tscn"
const ZONE_H: String = "res://scenes/zone_h_isla_negra.tscn"
const ZONE_I: String = "res://scenes/zone_i_el_tabo.tscn"

## Maps zone ID → display name and scene path
const ZONES: Dictionary = {
	"plaza_coastal": { "scene": ZONE_A, "name": "La Plaza Costera" },
	"humedal":       { "scene": ZONE_B, "name": "El Humedal del Río" },
	"estribaciones": { "scene": ZONE_C, "name": "Las Estribaciones Andinas" },
	"puerto":        { "scene": ZONE_D, "name": "Puerto de los Gigantes" },
	"litoral":       { "scene": ZONE_E, "name": "El Litoral del Viento" },
	"vina":          { "scene": ZONE_F, "name": "Viña del Mar" },
	"valparaiso":    { "scene": ZONE_G, "name": "Valparaíso" },
	"isla_negra":    { "scene": ZONE_H, "name": "Isla Negra" },
	"el_tabo":       { "scene": ZONE_I, "name": "El Tabo" },
}

## Canonical world registry — the single source of truth for all zone data
const WORLD_REGISTRY: Dictionary = {
	"plaza_coastal": {
		"scene": ZONE_A,
		"default_spawn": "spawn_from_menu",
		"return_spawn_from": {
			"humedal": Vector3(21, 0.5, 0),
			"estribaciones": Vector3(-21, 0.5, 0),
			"puerto": Vector3(0, 0.5, 42),
			"litoral": Vector3(0, 0.5, -42),
			"vina": Vector3(21, 0.5, 0),
			"valparaiso": Vector3(-21, 0.5, 0),
			"isla_negra": Vector3(0, 0.5, 42),
			"el_tabo": Vector3(0, 0.5, -42),
		},
	},
	"humedal": {
		"scene": ZONE_B,
		"default_spawn": "spawn_from_plaza",
		"return_spawn_from": {
			"plaza_coastal": Vector3(55, 0.5, 0),
			"estribaciones": Vector3(55, 0.5, 0),
			"vina": Vector3(55, 0.5, 0),
		},
	},
	"estribaciones": {
		"scene": ZONE_C,
		"default_spawn": "spawn_from_plaza",
		"return_spawn_from": {
			"plaza_coastal": Vector3(-55, 0.5, 0),
			"humedal": Vector3(-55, 0.5, 0),
			"valparaiso": Vector3(-55, 0.5, 0),
		},
	},
	"puerto": {
		"scene": ZONE_D,
		"default_spawn": "spawn_from_plaza",
		"return_spawn_from": {
			"plaza_coastal": Vector3(0, 0.5, 100),
		},
	},
	"litoral": {
		"scene": ZONE_E,
		"default_spawn": "spawn_from_plaza",
		"return_spawn_from": {
			"plaza_coastal": Vector3(0, 0.5, -100),
		},
	},
	"vina": {
		"scene": ZONE_F,
		"default_spawn": "spawn_from_humedal",
		"return_spawn_from": {
			"plaza_coastal": Vector3(100, 0.5, 0),
		},
	},
	"valparaiso": {
		"scene": ZONE_G,
		"default_spawn": "spawn_from_estribaciones",
		"return_spawn_from": {
			"plaza_coastal": Vector3(-100, 0.5, 0),
		},
	},
	"isla_negra": {
		"scene": ZONE_H,
		"default_spawn": "spawn_from",
		"return_spawn_from": {
			"vina": Vector3(0, 0.5, 200),
			"puerto": Vector3(0, 0.5, 200),
			"el_tabo": Vector3(0, 0.5, 200),
		},
	},
	"el_tabo": {
		"scene": ZONE_I,
		"default_spawn": "spawn_from",
		"return_spawn_from": {
			"litoral": Vector3(0, 0.5, -200),
			"isla_negra": Vector3(0, 0.5, -200),
		},
	},
}

## Display names for UI / debug
const ZONE_NAMES: Dictionary = {
	"plaza_coastal": "La Plaza Costera",
	"humedal":       "El Humedal del Río",
	"estribaciones": "Las Estribaciones Andinas",
	"puerto":        "Puerto de los Gigantes",
	"litoral":       "El Litoral del Viento",
	"vina":          "Viña del Mar",
	"valparaiso":    "Valparaíso",
	"isla_negra":    "Isla Negra",
	"el_tabo":       "El Tabo",
}

var _current_zone: String = "plaza_coastal"


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


## Warp the player to a specific world position (single-world mode).
## Called by ZonePortal when using open-world warp.
func travel_to(zone_key: String) -> void:
	if not ZONES.has(zone_key):
		push_error("ZoneManager: unknown zone key '%s'" % zone_key)
		return
	
	# In open-world mode, zones are always loaded — just update tracking
	_current_zone = zone_key
	print("ZoneManager: arrived at %s" % ZONE_NAMES[zone_key])


## Returns the current zone key
func current_zone() -> String:
	return _current_zone


## Returns the spawn position for entering a zone from a given source
func get_spawn_for(target_zone: String, source_zone: String) -> Vector3:
	if not WORLD_REGISTRY.has(target_zone):
		push_error("ZoneManager: unknown target zone '%s'" % target_zone)
		return Vector3(0, 0.5, 0)
	
	var zone_data: Dictionary = WORLD_REGISTRY[target_zone]
	if zone_data.has("return_spawn_from") and zone_data["return_spawn_from"].has(source_zone):
		return zone_data["return_spawn_from"][source_zone]
	
	return Vector3(0, 0.5, 0)


## Validate all world connections
func validate_connections() -> Dictionary:
	var result := {
		"worlds_checked": 0,
		"portals_checked": 0,
		"broken_refs": [],
		"missing_spawns": [],
		"safe": true,
	}
	
	for world_id: String in WORLD_REGISTRY:
		result["worlds_checked"] += 1
		var data: Dictionary = WORLD_REGISTRY[world_id]
		
		# Check scene file exists
		if not ResourceLoader.exists(data["scene"]):
			result["broken_refs"].append("Scene not found: " + data["scene"])
			result["safe"] = false
		
		# Check all return spawn destinations
		if data.has("return_spawn_from"):
			for dest: String in data["return_spawn_from"]:
				result["portals_checked"] += 1
				if not WORLD_REGISTRY.has(dest):
					result["broken_refs"].append("Portal to unknown world '%s' from '%s'" % [dest, world_id])
					result["safe"] = false
	
	return result
