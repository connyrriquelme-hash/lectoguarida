class_name CatCustomizer
extends Node

## Cat Skin & Accessory System.
##
## Attached as child of Player.  Manages costumes while PROTECTING
## the cat's ears (EarL, EarR) and whiskers — these are independent
## meshes that NEVER get hidden.
##
## Ears are protected by NEVER toggling them off.  Whiskers are
## assumed to be on the Head mesh.  Outfits are MeshInstance3D
## children grouped under an "Outfits" node attached to CatBody.

const SKIN_COST: int = 50  # coins per skin unlock (matching PM cost)

# ── Available skins ──
const SKINS: Array[Dictionary] = [
	{
		"name": "Gafas y Pañuelo",
		"desc": "El look clásico de gato aventurero.",
		"parts": {}  # built-in in Player._add_accessories
	},
	{
		"name": "Traje Huaso",
		"desc": "Un poncho chilote con chamanto tradicional.",
		"parts": {
			"body": {"type": "torus", "color": Color(0.5, 0.1, 0.1), "pos": Vector3(0, 0.3, 0), "radii": [0.25, 0.4]}
		}
	},
	{
		"name": "Traje Astronauta",
		"desc": "Pequeño traje espacial plateado con visor.",
		"parts": {
			"body": {"type": "sphere", "color": Color(0.8, 0.8, 0.9), "pos": Vector3(0, 0.3, 0), "radius": 0.35},
			"visor": {"type": "sphere", "color": Color(0.2, 0.6, 1.0, 0.3), "pos": Vector3(0, 0.4, -0.3), "radius": 0.12}
		}
	}
]

const PROTECTED_NODES: Array[String] = [
	"EarL", "EarR",
	# Cat body parts (procedural model — never remove)
	"Torso", "Head", "Belly",
	"LegFL", "LegFR", "LegBL", "LegBR",
	"Tail",
	# Facial features
	"EyeL", "EyeR", "Nose", "Mouth",
	# Whiskers (multiple instances)
	"Whisker",
]

var _outfits_node: Node3D = null
var _current_skin: String = "Gafas y Pañuelo"


func _ready() -> void:
	# Find CatBody from parent Player
	var player: Player = get_parent() as Player
	if not player:
		return

	var cat_body: Node3D = player.get_node_or_null("CatBody") as Node3D
	if not cat_body:
		return

	# Create outfits container
	_outfits_node = cat_body.get_node_or_null("Outfits")
	if not _outfits_node:
		_outfits_node = Node3D.new()
		_outfits_node.name = "Outfits"
		cat_body.add_child(_outfits_node)


## Applies the starting outfit (sunglasses + bandana) — the default
## look that comes with the cat.  This substitutes for Player._add_accessories()
func apply_starting_outfit() -> void:
	_current_skin = "Gafas y Pañuelo"
	_clear_outfits()

	var player: Player = get_parent() as Player
	if not player:
		return
	var cat_body: Node3D = player.get_node_or_null("CatBody") as Node3D
	if not cat_body:
		return

	# Sunglasses (MeshInstance3D — GL Compat safe)
	var sg_mat := StandardMaterial3D.new()
	sg_mat.albedo_color = Color(0.05, 0.05, 0.08)
	sg_mat.roughness = 0.1
	sg_mat.metallic = 0.3

	var lens_size := Vector3(0.08, 0.06, 0.02)
	for side: String in ["L", "R"]:
		var lens := MeshInstance3D.new()
		lens.name = "Sunglass_" + side
		var lens_box := BoxMesh.new()
		lens_box.size = lens_size
		lens.mesh = lens_box
		lens.material_override = sg_mat
		lens.position = Vector3(-0.08 if side == "L" else 0.08, 0.55, -0.74)
		cat_body.add_child(lens)

	var bridge_mi := MeshInstance3D.new()
	bridge_mi.name = "Sunglass_Bridge"
	var bridge_box := BoxMesh.new()
	bridge_box.size = Vector3(0.08, 0.02, 0.02)
	bridge_mi.mesh = bridge_box
	bridge_mi.material_override = sg_mat
	bridge_mi.position = Vector3(0, 0.55, -0.74)
	cat_body.add_child(bridge_mi)

	# Bandana
	var band_mat := StandardMaterial3D.new()
	band_mat.albedo_color = Color(0.85, 0.12, 0.12)
	band_mat.roughness = 0.55

	# Small bandana ring at neck
	var band_ring := MeshInstance3D.new()
	band_ring.name = "Bandana_Ring"
	var band_cyl := CylinderMesh.new()
	band_cyl.top_radius = 0.18
	band_cyl.bottom_radius = 0.18
	band_cyl.height = 0.04
	band_ring.mesh = band_cyl
	band_ring.material_override = band_mat
	band_ring.position = Vector3(0, 0.32, -0.30)
	cat_body.add_child(band_ring)

	# Bandana tails
	for dir_idx: int in [-1, 1]:
		var tail := MeshInstance3D.new()
		tail.name = "Bandana_Tail" + ("1" if dir_idx < 0 else "2")
		var tail_box := BoxMesh.new()
		tail_box.size = Vector3(0.03, 0.10, 0.02)
		tail.mesh = tail_box
		tail.material_override = band_mat
		tail.position = Vector3(dir_idx * 0.06, 0.18, -0.30)
		tail.rotation_degrees = Vector3(0, 0, dir_idx * 20)
		cat_body.add_child(tail)


## Equip a skin by name.  Clears previous outfit then builds the new one.
## Ears and whiskers are NEVER cleared (PROTECTED_NODES).
func equip_skin(skin_name: String) -> bool:
	if not _is_available(skin_name):
		push_warning("CatCustomizer: unknown skin '%s'" % skin_name)
		return false

	_current_skin = skin_name
	_clear_outfits()

	if skin_name == "Gafas y Pañuelo":
		apply_starting_outfit()
		return true

	# Build skin from SKINS data
	var skin_data: Dictionary = _find_skin(skin_name)
	var parts: Dictionary = skin_data.get("parts", {})
	var cat_body: Node3D = _get_cat_body()
	if not cat_body:
		return true  # silent fallback

	var mat: StandardMaterial3D

	for part_name: String in parts:
		var part_data: Dictionary = parts[part_name]
		mat = StandardMaterial3D.new()
		var col: Color = part_data.get("color", Color.WHITE)
		mat.albedo_color = col
		mat.roughness = 0.5
		mat.metallic = 0.2

		match part_data.get("type", ""):
			"torus":
				var radii: Array = part_data.get("radii", [0.2, 0.3])
				var t_mi := MeshInstance3D.new()
				t_mi.name = part_name
				var t_cyl := CylinderMesh.new()
				var avg_r: float = (radii[0] + radii[1]) / 2.0
				t_cyl.top_radius = 0.08
				t_cyl.bottom_radius = 0.08
				t_cyl.height = avg_r * 2.0
				t_mi.mesh = t_cyl
				t_mi.material_override = mat
				t_mi.position = part_data.get("pos", Vector3.ZERO)
				t_mi.rotation_degrees = Vector3(90, 0, 0)
				_outfits_node.add_child(t_mi)

			"sphere":
				var r: float = part_data.get("radius", 0.3)
				var s_mi := MeshInstance3D.new()
				s_mi.name = part_name
				var s_sphere := SphereMesh.new()
				s_sphere.radius = r
				s_sphere.height = r * 2.0
				s_mi.mesh = s_sphere
				s_mi.material_override = mat
				s_mi.position = part_data.get("pos", Vector3.ZERO)
				if col.a < 1.0:
					pass  # transparency handled by material
				_outfits_node.add_child(s_mi)

			"box":
				var sz: Vector3 = part_data.get("size", Vector3(0.5, 0.1, 0.3))
				var b_mi := MeshInstance3D.new()
				b_mi.name = part_name
				var b_box := BoxMesh.new()
				b_box.size = sz
				b_mi.mesh = b_box
				b_mi.material_override = mat
				b_mi.position = part_data.get("pos", Vector3.ZERO)
				_outfits_node.add_child(b_mi)

			"cylinder":
				var cyl_r: float = part_data.get("radius", 0.1)
				var cyl_h: float = part_data.get("height", 0.5)
				var c_mi := MeshInstance3D.new()
				c_mi.name = part_name
				var c_cyl := CylinderMesh.new()
				c_cyl.top_radius = cyl_r
				c_cyl.bottom_radius = cyl_r
				c_cyl.height = cyl_h
				c_mi.mesh = c_cyl
				c_mi.material_override = mat
				c_mi.position = part_data.get("pos", Vector3.ZERO)
				_outfits_node.add_child(c_mi)
	print("CatCustomizer: equipped '%s'" % skin_name)
	return true


## Returns true if the skin name exists in our database.
func _is_available(skin_name: String) -> bool:
	for s: Dictionary in SKINS:
		if s["name"] == skin_name:
			return true
	return false


## Returns the skin dictionary by name.
func _find_skin(skin_name: String) -> Dictionary:
	for s: Dictionary in SKINS:
		if s["name"] == skin_name:
			return s
	return {}


## Clears all outfit nodes EXCEPT protected ones (ears, whiskers).
func _clear_outfits() -> void:
	var player: Player = get_parent() as Player
	if not player:
		return
	var cat_body: Node3D = player.get_node_or_null("CatBody") as Node3D
	if not cat_body:
		return

	# Remove temporary accessories from CatBody (sunglasses, bandana, etc.)
	var to_remove: Array[Node] = []
	for child: Node in cat_body.get_children():
		if child.name in PROTECTED_NODES:
			continue
		# Also check prefix protection for whisker and other named patterns
		var protected_by_prefix: bool = false
		for pn: String in PROTECTED_NODES:
			if child.name.begins_with(pn):
				protected_by_prefix = true
				break
		if protected_by_prefix:
			continue
		if child is CSGShape3D or child is MeshInstance3D:
			to_remove.append(child)

	for n: Node in to_remove:
		cat_body.remove_child(n)
		n.queue_free()

	# Clear Outfits node
	if _outfits_node:
		for child: Node in _outfits_node.get_children():
			_outfits_node.remove_child(child)
			child.queue_free()


func _get_cat_body() -> Node3D:
	var player: Player = get_parent() as Player
	if not player:
		return null
	return player.get_node_or_null("CatBody") as Node3D


func get_current_skin() -> String:
	return _current_skin


func get_available_skins() -> Array[String]:
	var names: Array[String] = []
	for s: Dictionary in SKINS:
		names.append(s["name"])
	return names
