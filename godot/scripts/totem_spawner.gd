class_name TotemSpawner
extends Node3D

## Spawns 50 Wisdom Totems across the 9-zone open world,
## assigning theme zones for each trivia category.

const TOTEM_SCENE_PATH: String = "res://scenes/lore_totem.tscn"

# Zone colors for each theme
const TOTEM_COLORS: Array[Color] = [
	Color(0.3, 0.8, 1.0),    # Ciencias — blue
	Color(0.3, 1.0, 0.5),    # Animales — green
	Color(1.0, 0.7, 0.2),    # Aymara/Quechua — gold
	Color(1.0, 0.4, 0.7),    # Diaguita — pink
	Color(0.7, 0.4, 1.0),    # Mapuche — purple
	Color(1.0, 0.3, 0.3),    # Rapa Nui — red
]

# Per-zone placements (zone_name -> [x,z] positions)
# Each zone gets thematically relevant totems
const ZONE_PLACEMENTS: Dictionary = {
	# Zone A: Coastal Plaza — Ciencias + Animales
	"ZoneA_Coastal": {
		"indices": [0, 1, 2, 10, 11, 19],
		"positions": [
			Vector3(3, 0.5, 3), Vector3(-3, 0.5, -3), Vector3(5, 0.5, -2),
			Vector3(-5, 0.5, 2), Vector3(4, 0.5, -4), Vector3(-4, 0.5, 4)
		],
		"color": TOTEM_COLORS[0]
	},
	# Zone B: Wetland — Animales (water creatures)
	"ZoneB_Wetland": {
		"indices": [12, 13, 14, 15, 16],
		"positions": [
			Vector3(7, 0.5, 5), Vector3(-7, 0.5, 0), Vector3(5, 0.5, -5),
			Vector3(-5, 0.5, 5), Vector3(0, 0.5, -7)
		],
		"color": TOTEM_COLORS[1]
	},
	# Zone C: Foothills — Animales (Andean)
	"ZoneC_Foothills": {
		"indices": [17, 18],
		"positions": [
			Vector3(5, 1.0, 5), Vector3(-5, 1.0, -5)
		],
		"color": TOTEM_COLORS[1]
	},
	# Zone D: Puerto — Ciencias + Rapa Nui
	"ZoneD_Puerto": {
		"indices": [3, 4, 5, 45, 46],
		"positions": [
			Vector3(4, 0.5, 4), Vector3(-4, 0.5, -3), Vector3(0, 0.5, 6),
			Vector3(6, 0.5, -4), Vector3(-6, 0.5, 2)
		],
		"color": TOTEM_COLORS[0]
	},
	# Zone E: Litoral Poetico — Ciencias (viento/agua)
	"ZoneE_Litoral": {
		"indices": [6, 7, 8, 9],
		"positions": [
			Vector3(4, 0.5, -4), Vector3(-4, 0.5, 4), Vector3(0, 0.5, -5),
			Vector3(-3, 0.5, -3)
		],
		"color": TOTEM_COLORS[0]
	},
	# Zone F: Viña — Aymara/Quechua
	"ZoneF_Vina": {
		"indices": [20, 21, 22, 23, 24, 25],
		"positions": [
			Vector3(4, 0.5, 4), Vector3(-4, 0.5, 3), Vector3(6, 0.5, -3),
			Vector3(-5, 0.5, -4), Vector3(0, 0.5, 5), Vector3(-3, 0.5, -5)
		],
		"color": TOTEM_COLORS[2]
	},
	# Zone G: Valparaiso — Aymara/Quechua (continues, on hill)
	"ZoneG_Valparaiso": {
		"indices": [26, 27, 28, 29],
		"positions": [
			Vector3(5, 1.0, 5), Vector3(-5, 1.0, -3), Vector3(6, 1.5, 0),
			Vector3(-6, 1.5, 0)
		],
		"color": TOTEM_COLORS[2]
	},
	# Zone H: Isla Negra — Diaguita + Lickanantay
	"ZoneH_IslaNegra": {
		"indices": [30, 31, 32, 33, 34],
		"positions": [
			Vector3(5, 0.5, 3), Vector3(-5, 0.5, -2), Vector3(0, 0.5, -5),
			Vector3(-4, 0.5, 4), Vector3(4, 0.5, -4)
		],
		"color": TOTEM_COLORS[3]
	},
	# Zone I: El Tabo — Mapuche (extensive)
	"ZoneI_ElTabo": {
		"indices": [35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
		"positions": [
			Vector3(4, 0.5, 3), Vector3(-4, 0.5, 2), Vector3(0, 0.5, 5),
			Vector3(-3, 0.5, -4), Vector3(5, 0.5, -2), Vector3(-5, 0.5, -5),
			Vector3(3, 0.5, -5), Vector3(-2, 0.5, 4), Vector3(6, 0.5, 0),
			Vector3(-6, 0.5, 0)
		],
		"color": TOTEM_COLORS[4]
	},
	# Scatter remainder across open world
	"Scattered": {
		"indices": [47, 48, 49],
		"positions": [Vector3(45, 0.5, 30), Vector3(-45, 0.5, 30), Vector3(0, 0.5, 150)],
		"color": TOTEM_COLORS[5]
	}
}


func _ready() -> void:
	if Engine.is_editor_hint():
		return

	var totem_ps: PackedScene = load(TOTEM_SCENE_PATH)
	if not totem_ps:
		push_error("TotemSpawner: could not load lore_totem.tscn")
		return

	# Try autoload first, fallback to direct const
	var all_data: Array = []
	var trivia_db: Node = get_node_or_null("/root/TriviaDB")
	if trivia_db:
		all_data = trivia_db.get("TRIVIA_LIST")
	else:
		var scr = load("res://scripts/trivia_db.gd")
		if scr:
			all_data = scr.get("TRIVIA_LIST")
	if all_data.is_empty():
		push_error("TotemSpawner: TRIVIA_LIST is empty")
		return

	var total_spawned: int = 0

	for zone_key: String in ZONE_PLACEMENTS.keys():
		var placement: Dictionary = ZONE_PLACEMENTS[zone_key]
		var indices: Array = placement.get("indices", [])
		var positions: Array = placement.get("positions", [])
		var clr: Color = placement.get("color", TOTEM_COLORS[0])
		var zone_node: Node3D = _find_zone(zone_key)

		if not zone_node:
			# Scattered totems — place on self
			zone_node = self

		for i: int in range(min(indices.size(), positions.size())):
			var data_index: int = indices[i] as int
			if data_index >= all_data.size():
				continue

			var data: Dictionary = all_data[data_index]
			var pos: Vector3 = positions[i] as Vector3

			var totem: LoreTotem = totem_ps.instantiate() as LoreTotem
			if not totem:
				continue

			totem.position = pos
			totem.setup(data, clr)
			totem.interact_requested.connect(_on_totem_interacted)

			# Convert CSG children to MeshInstance3D (GL Compatibility fix)
			_convert_totem_csg(totem, clr)

			zone_node.add_child(totem)
			total_spawned += 1

	print("TotemSpawner: spawned ", total_spawned, " wisdom totems")


func _on_totem_interacted(trivia_data: Dictionary) -> void:
	get_tree().paused = true

	var trivia_ps: PackedScene = load("res://scenes/trivia_ui.tscn")
	if not trivia_ps:
		get_tree().paused = false
		return

	var ui: TriviaUI = trivia_ps.instantiate() as TriviaUI
	get_tree().current_scene.add_child(ui)
	ui.setup(trivia_data)
	ui.trivia_completed.connect(_on_trivia_done)


func _on_trivia_done(_trivia_name: String) -> void:
	# UI already unpaused the game
	pass


## Converts CSG visual children of a totem to MeshInstance3D
func _convert_totem_csg(totem: Node, clr: Color) -> void:
	"""Replace CSGShape3D in lore_totem with MeshInstance3D primitives."""
	var mat := StandardMaterial3D.new()
	mat.albedo_color = clr
	mat.emission_enabled = true
	mat.emission = clr
	mat.emission_energy_multiplier = 1.5
	mat.metallic = 0.4
	mat.roughness = 0.3

	var to_convert: Array[Node] = []
	for child: Node in totem.get_children():
		if child is CSGShape3D:
			to_convert.append(child)

	for csg in to_convert:
		var mi := MeshInstance3D.new()
		mi.name = csg.name + "_Mesh"
		mi.transform = csg.transform
		mi.position = csg.position
		mi.rotation = csg.rotation
		mi.scale = csg.scale
		mi.material_override = mat

		if csg is CSGBox3D:
			var bm := BoxMesh.new()
			bm.size = csg.size
			mi.mesh = bm
		elif csg is CSGSphere3D:
			var sm := SphereMesh.new()
			sm.radius = csg.radius
			sm.height = csg.radius * 2.0
			mi.mesh = sm
		elif csg is CSGTorus3D:
			var cm := CylinderMesh.new()
			cm.top_radius = 0.05
			cm.bottom_radius = 0.05
			cm.height = csg.outer_radius * 2.0
			mi.mesh = cm
		elif csg is CSGCylinder3D:
			var cm2 := CylinderMesh.new()
			cm2.top_radius = csg.radius
			cm2.bottom_radius = csg.radius
			cm2.height = csg.height
			mi.mesh = cm2

		totem.add_child(mi)
		totem.remove_child(csg)
		csg.queue_free()


func _find_zone(zone_name: String) -> Node3D:
	# Try current scene first
	var main: Node3D = get_tree().current_scene as Node3D
	if main:
		var zn := main.get_node_or_null(zone_name) as Node3D
		if zn:
			return zn
	
	# Fallback: try self (TotemSpawner is child of OpenWorld/MainWorld)
	# Search our parent for the zone
	var p: Node = get_parent()
	if p:
		return p.get_node_or_null(zone_name) as Node3D
	return null