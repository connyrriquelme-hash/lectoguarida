## Autoload singleton that manages zone transitions.
## Add this to Project Settings > Autoload as "ZoneManager".
extends Node

## Available zone scene paths
const ZONE_A: String = "res://scenes/zone_a_coastal.tscn"
const ZONE_B: String = "res://scenes/zone_b_humedal.tscn"
const ZONE_C: String = "res://scenes/zone_c_estribaciones.tscn"

## Maps zone name to its scene path
const ZONES: Dictionary = {
	"coastal": ZONE_A,
	"wetland": ZONE_B,
	"foothills": ZONE_C,
}

## Friendly names for UI / debug
const ZONE_NAMES: Dictionary = {
	"coastal": "La Plaza Costera",
	"wetland": "El Humedal del Río",
	"foothills": "Las Estribaciones Andinas",
}

var _current_zone: String = "coastal"


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


## Switch to a different zone by its key ("coastal", "wetland", "foothills")
func travel_to(zone_key: String) -> void:
	if not ZONES.has(zone_key):
		push_error("ZoneManager: unknown zone key '%s'" % zone_key)
		return

	var path: String = ZONES[zone_key]

	# Fade out / loading screen would go here in production
	# For now, instant swap
	var result: Error = get_tree().change_scene_to_file(path)
	if result != OK:
		push_error("ZoneManager: failed to load '%s' (error %d)" % [path, result])
		return

	_current_zone = zone_key
	print("ZoneManager: arrived at %s" % ZONE_NAMES[zone_key])


## Returns the current zone key
func current_zone() -> String:
	return _current_zone
