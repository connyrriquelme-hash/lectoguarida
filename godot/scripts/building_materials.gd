## BuildingMaterials — applies high-resolution stylized textures to houses
## and bridges at runtime. Uses 256×256 seamless textures.
## Call apply_all() from main_world.gd _ready()
class_name BuildingMaterials

# Texture paths (256×256 stylized textures)
const TEX_ADOBE: String = "res://assets/generated/tex_wall_adobe.png"
const TEX_ROOF: String = "res://assets/generated/tex_roof_terracotta.png"
const TEX_WOOD_WALL: String = "res://assets/generated/tex_wall_wood_plank.png"
const TEX_BRIDGE: String = "res://assets/generated/tex_bridge_wood.png"

## Apply all building material upgrades
static func apply_all(world_root: Node3D) -> void:
	# Upgraded bridge material function
	_upgrade_bridges(world_root)

	# Upgrade AdobeHouse in Zone C
	var zone_c := world_root.get_node_or_null("ZoneC_Foothills") as Node3D
	if zone_c != null:
		_upgrade_adobe_house(zone_c)

	# Upgrade CasaPoeta in Zone E
	var zone_e := world_root.get_node_or_null("ZoneE_Litoral") as Node3D
	if zone_e != null:
		_upgrade_casa_poeta(zone_e)

## Replace flat bridge materials with wood texture
static func _upgrade_bridges(root: Node3D) -> void:
	var tex: Texture2D = _load_tex(TEX_BRIDGE)
	if tex == null:
		return

	# Find all ConnectionBridge MeshInstance3D nodes
	for child: Node in root.get_children():
		var mi: MeshInstance3D = child as MeshInstance3D
		if mi != null and child.name == "ConnectionBridge":
			var mat := StandardMaterial3D.new()
			mat.albedo_texture = tex
			mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
			mat.roughness = 0.8
			# Scale UV based on bridge size (256×256 texture, gentle repetition)
			var mesh: Mesh = mi.mesh
			if mesh != null and mesh is BoxMesh:
				var box: BoxMesh = mesh as BoxMesh
				var size: Vector3 = box.size
				var world_units_per_tile := 0.5
				mat.uv1_scale = Vector3(size.x / world_units_per_tile, size.z / world_units_per_tile, 1.0)
			child.material_override = mat

	# Also find bridges by name check
	for child: Node in root.get_children():
		var mi: MeshInstance3D = child as MeshInstance3D
		if mi != null and "Bridge" in child.name and child.name != "ConnectionBridge":
			var mat := StandardMaterial3D.new()
			mat.albedo_texture = tex
			mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
			mat.roughness = 0.8
			mi.material_override = mat

## Apply adobe texture to AdobeHouse children
static func _upgrade_adobe_house(zone_c: Node3D) -> void:
	var house := zone_c.get_node_or_null("AdobeHouse") as Node3D
	if house == null:
		return

	var wall_tex: Texture2D = _load_tex(TEX_ADOBE)
	var roof_tex: Texture2D = _load_tex(TEX_ROOF)
	if wall_tex == null and roof_tex == null:
		return

	for child: Node in house.get_children():
		if not (child is CSGBox3D):
			continue
		var csg := child as CSGBox3D
		var name_lower: String = child.name.to_lower()

		if "wall" in name_lower:
			if wall_tex != null:
				var mat := StandardMaterial3D.new()
				mat.albedo_texture = wall_tex
				mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
				mat.roughness = 0.9
				csg.material = mat

		elif "roof" in name_lower or "ridge" in name_lower:
			if roof_tex != null:
				var mat := StandardMaterial3D.new()
				mat.albedo_texture = roof_tex
				mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
				mat.roughness = 0.85
				csg.material = mat

		elif "door" in name_lower:
			var mat := StandardMaterial3D.new()
			mat.albedo_color = Color(0.4, 0.25, 0.15)  # dark wood
			mat.roughness = 0.7
			csg.material = mat

## Apply painted wood texture to CasaPoeta children
static func _upgrade_casa_poeta(zone_e: Node3D) -> void:
	var house := zone_e.get_node_or_null("CasaPoeta") as Node3D
	if house == null:
		return

	var wall_tex: Texture2D = _load_tex(TEX_WOOD_WALL)
	var roof_tex: Texture2D = _load_tex(TEX_ROOF)
	if wall_tex == null and roof_tex == null:
		return

	for child: Node in house.get_children():
		var name_lower: String = child.name.to_lower()

		if child is CSGBox3D:
			var csg := child as CSGBox3D

			if "wall" in name_lower:
				if wall_tex != null:
					var mat := StandardMaterial3D.new()
					mat.albedo_texture = wall_tex
					mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
					mat.roughness = 0.85
					csg.material = mat

			elif "roof" in name_lower or "ridge" in name_lower:
				if roof_tex != null:
					var mat := StandardMaterial3D.new()
					mat.albedo_texture = roof_tex
					mat.texture_filter = StandardMaterial3D.TEXTURE_FILTER_LINEAR
					mat.roughness = 0.85
					csg.material = mat

			elif "win" in name_lower:
				var mat := StandardMaterial3D.new()
				mat.albedo_color = Color(0.6, 0.75, 0.85, 0.5)
				mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
				mat.metallic = 0.1
				mat.roughness = 0.0
				csg.material = mat

			elif "door" in name_lower:
				var mat := StandardMaterial3D.new()
				mat.albedo_color = Color(0.35, 0.2, 0.1)
				mat.roughness = 0.7
				csg.material = mat

		elif child is CSGCylinder3D:
			var cyl := child as CSGCylinder3D
			if "chimney" in name_lower:
				var mat := StandardMaterial3D.new()
				mat.albedo_color = Color(0.6, 0.35, 0.2)  # brick red-brown
				mat.roughness = 0.9
				cyl.material = mat

## Helper to load texture safely
static func _load_tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null
