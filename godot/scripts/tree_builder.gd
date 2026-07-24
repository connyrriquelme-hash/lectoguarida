## TreeBuilder — procedurally generates better-looking trees
## with layered foliage, natural colors, and subtle variation.
## Call rebuild_all() from main_world.gd _ready() to upgrade existing trees.
class_name TreeBuilder

# ── Color palette ──
const TRUNK_COLOR: Color = Color(0.58, 0.38, 0.2)       # warm brown
const TRUNK_DARK: Color = Color(0.4, 0.28, 0.18)         # darker brown
const LEAF_LIGHT: Color = Color(0.35, 0.58, 0.22)        # spring green
const LEAF_MID: Color = Color(0.28, 0.5, 0.22)           # mid green
const LEAF_DARK: Color = Color(0.2, 0.4, 0.18)           # shadow green

## Build a better round-canopy tree (used in coastal, wetland, litoral zones)
static func build_round_tree(parent: Node3D) -> void:
	# Remove old children
	for child: Node in parent.get_children():
		parent.remove_child(child)
		child.queue_free()

	# ── Trunk ──
	var trunk_mat := StandardMaterial3D.new()
	trunk_mat.albedo_color = TRUNK_DARK
	trunk_mat.roughness = 0.9
	var trunk := MeshInstance3D.new()
	trunk.name = "Trunk"
	trunk.mesh = CylinderMesh.new()
	var trunk_mesh: CylinderMesh = trunk.mesh as CylinderMesh
	trunk_mesh.top_radius = 0.06
	trunk_mesh.bottom_radius = 0.1
	trunk_mesh.height = 0.8
	trunk.position = Vector3(0, 0.4, 0)
	trunk.material_override = trunk_mat
	parent.add_child(trunk)

	# ── Canopy layers (3 overlapping spheres with different green tones) ──
	var foliage_data: Array[Dictionary] = [
		{"pos": Vector3(0, 0.9, 0), "radius": 0.55, "color": LEAF_DARK},
		{"pos": Vector3(0, 1.1, 0.1), "radius": 0.45, "color": LEAF_MID},
		{"pos": Vector3(0.05, 1.3, -0.05), "radius": 0.35, "color": LEAF_LIGHT},
	]

	for i: int in foliage_data.size():
		var f: Dictionary = foliage_data[i]
		var leaf_mat := StandardMaterial3D.new()
		leaf_mat.albedo_color = f["color"] as Color
		leaf_mat.roughness = 0.85
		leaf_mat.metallic = 0.0

		var sphere := MeshInstance3D.new()
		sphere.name = "Foliage_" + str(i)
		sphere.mesh = SphereMesh.new()
		var sphere_mesh: SphereMesh = sphere.mesh as SphereMesh
		sphere_mesh.radius = f["radius"] as float
		sphere_mesh.height = (f["radius"] as float) * 2.0
		sphere.position = f["pos"] as Vector3
		sphere.material_override = leaf_mat
		parent.add_child(sphere)

## Build a pine tree (used in litoral zone)
static func build_pine_tree(parent: Node3D) -> void:
	for child: Node in parent.get_children():
		parent.remove_child(child)
		child.queue_free()

	# ── Trunk ──
	var trunk_mat := StandardMaterial3D.new()
	trunk_mat.albedo_color = TRUNK_DARK
	trunk_mat.roughness = 0.9
	var trunk := MeshInstance3D.new()
	trunk.name = "Trunk"
	trunk.mesh = CylinderMesh.new()
	var trunk_mesh: CylinderMesh = trunk.mesh as CylinderMesh
	trunk_mesh.top_radius = 0.04
	trunk_mesh.bottom_radius = 0.07
	trunk_mesh.height = 0.6
	trunk.position = Vector3(0, 0.3, 0)
	trunk.material_override = trunk_mat
	parent.add_child(trunk)

	# ── Pine foliage (3 cone-like cylinders stacked) ──
	var pine_data: Array[Dictionary] = [
		{"pos": Vector3(0, 0.7, 0), "radius": 0.35, "height": 0.4, "color": LEAF_DARK},
		{"pos": Vector3(0, 0.9, 0), "radius": 0.25, "height": 0.4, "color": LEAF_MID},
		{"pos": Vector3(0, 1.1, 0), "radius": 0.15, "height": 0.3, "color": LEAF_LIGHT},
	]

	for i: int in pine_data.size():
		var p: Dictionary = pine_data[i]
		var leaf_mat := StandardMaterial3D.new()
		leaf_mat.albedo_color = p["color"] as Color
		leaf_mat.roughness = 0.85

		var cone := MeshInstance3D.new()
		cone.name = "PineF_" + str(i)
		cone.mesh = CylinderMesh.new()
		var cone_mesh: CylinderMesh = cone.mesh as CylinderMesh
		cone_mesh.top_radius = 0.0
		cone_mesh.bottom_radius = p["radius"] as float
		cone_mesh.height = p["height"] as float
		cone.position = p["pos"] as Vector3
		cone.material_override = leaf_mat
		parent.add_child(cone)

## Replace all round trees in a zone with improved versions.
## Finds nodes whose children include "Trunk" + "CanopyBot".
static func upgrade_round_trees(zone_root: Node3D) -> void:
	for child: Node in zone_root.get_children():
		if not (child is Node3D):
			continue
		if child.name.begins_with("Tree_") or child.name.begins_with("Pine_"):
			# Check if it has the old CSG structure (Trunk + CanopyBot)
			if child.has_node("Trunk") and child.has_node("CanopyBot"):
				build_round_tree(child as Node3D)
			elif child.has_node("Trunk") and child.has_node("Foliage_0"):
				build_pine_tree(child as Node3D)

## Replace all trees in ALL known zones
static func upgrade_all(world_root: Node3D) -> void:
	var zone_names: Array[String] = [
		"ZoneA_Coastal", "ZoneB_Wetland", "ZoneD_Puerto",
		"ZoneE_Litoral"
	]
	for zname: String in zone_names:
		var zone := world_root.get_node_or_null(zname) as Node3D
		if zone != null:
			upgrade_round_trees(zone)
