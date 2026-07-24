## GroundTexturer — applies high-resolution stylized textures to terrain
## at runtime. Uses 256×256 seamless textures with proper UV scaling.
## Call apply_all() from main_world.gd _ready()
class_name GroundTexturer

# Ground node paths and their corresponding textures + fallback colors
static var _ground_map := {
	"ZoneA_Coastal/PlazaGround/MeshInstance3D": {
		"tex": "res://assets/generated/tex_ground_coastal_v2.png",
		"fallback": Color(0.78, 0.72, 0.62)  # warm beige sand
	},
	"ZoneB_Wetland/Water/MI": {
		"tex": "res://assets/generated/tex_water_clear.png",
		"water": true,
		"fallback": Color(0.22, 0.48, 0.55)
	},
	"ZoneB_Wetland/Island_C/MI": {
		"tex": "res://assets/generated/tex_grass_valley.png",
		"fallback": Color(0.3, 0.44, 0.25)
	},
	"ZoneB_Wetland/Island_NE/MI": {
		"tex": "res://assets/generated/tex_grass_valley.png",
		"fallback": Color(0.3, 0.44, 0.25)
	},
	"ZoneB_Wetland/Island_SW/MI": {
		"tex": "res://assets/generated/tex_grass_valley.png",
		"fallback": Color(0.3, 0.44, 0.25)
	},
	"ZoneC_Foothills/Terrain/MI": {
		"tex": "res://assets/generated/tex_sand_foothills.png",
		"fallback": Color(0.52, 0.45, 0.38)
	},
	"ZoneE_Litoral/Ground/MI": {
		"tex": "res://assets/generated/tex_volcanic_rock.png",
		"fallback": Color(0.47, 0.55, 0.5)
	},
}

## Call from main_world.gd after zones are ready
static func apply_all(world_root: Node3D) -> void:
	for node_path: String in _ground_map:
		var cfg: Dictionary = _ground_map[node_path]
		var tex_path: String = cfg.get("tex", "")
		var node: MeshInstance3D = _find_node(world_root, node_path) as MeshInstance3D
		if node == null or not is_instance_valid(node):
			continue
		var is_water: bool = cfg.get("water", false)
		if is_water:
			_apply_water(node, tex_path, cfg.get("fallback", Color.WHITE))
		else:
			_apply_texture(node, tex_path, cfg.get("fallback", Color.WHITE))

## Apply a stylized texture to a MeshInstance3D with proper tiling
static func _apply_texture(mi: MeshInstance3D, tex_path: String, fallback: Color) -> void:
	var tex: Texture2D = load(tex_path) if ResourceLoader.exists(tex_path) else null
	var mat := StandardMaterial3D.new()

	if tex != null:
		mat.albedo_texture = tex
		mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		var mesh := mi.mesh
		if mesh != null and mesh is BoxMesh:
			var box: BoxMesh = mesh as BoxMesh
			var size: Vector3 = box.size
			# 256×256 texture at 1.5 world units per tile = 13 repeats on a 20-unit plane
			# Balanced: mipmaps filter distant tiles, close tiles show texture detail
			var world_units_per_tile := 1.5
			var repeats_x := size.x / world_units_per_tile
			var repeats_z := size.z / world_units_per_tile
			mat.uv1_scale = Vector3(repeats_x, repeats_z, 1.0)
	else:
		mat.albedo_color = fallback

	mat.roughness = 0.95
	mat.metallic = 0.0
	mi.material_override = mat

## Apply water-like material with transparency
static func _apply_water(mi: MeshInstance3D, tex_path: String, _fallback: Color) -> void:
	var tex: Texture2D = load(tex_path) if ResourceLoader.exists(tex_path) else null
	var mat := StandardMaterial3D.new()

	if tex != null:
		mat.albedo_texture = tex
		mat.albedo_color = Color(0.3, 0.6, 0.7, 0.65)
		mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
		var mesh := mi.mesh
		if mesh != null and mesh is BoxMesh:
			var box: BoxMesh = mesh as BoxMesh
			var size: Vector3 = box.size
			var world_units_per_tile := 1.0
			var repeats_x := size.x / world_units_per_tile
			var repeats_z := size.z / world_units_per_tile
			mat.uv1_scale = Vector3(repeats_x, repeats_z, 1.0)
	else:
		mat.albedo_color = Color(0.3, 0.6, 0.7, 0.65)

	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.metallic = 0.3
	mat.roughness = 0.2
	mi.material_override = mat

## Recursively find a node by relative path from root
static func _find_node(root: Node, path: String) -> Node:
	var parts: PackedStringArray = path.split("/")
	var current: Node = root
	for part: String in parts:
		if not current.has_node(part):
			return null
		current = current.get_node(part)
	return current
