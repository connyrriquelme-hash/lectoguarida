@tool
## Static helper library for building scenes via EditorScript.
## Provides factory methods for common 3D constructions so every
## zone EditorScript shares the same building blocks.
class_name SceneBuilder
extends RefCounted


# ═══════════════════════════════════════════════════════════
# Material presets — call these once and reuse
# ═══════════════════════════════════════════════════════════

static func mat_fur(shader_path: String = "res://catscene.gdshader") -> ShaderMaterial:
	var m: ShaderMaterial = ShaderMaterial.new()
	m.shader = load(shader_path)
	return m


static func mat_solid(color: Color, roughness: float = 0.8, metallic: float = 0.0) -> StandardMaterial3D:
	var m: StandardMaterial3D = StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = roughness
	m.metallic = metallic
	return m


static func mat_wood_dark() -> StandardMaterial3D:
	return mat_solid(Color(0.36, 0.22, 0.13), 0.85, 0.0)


static func mat_stone_paving() -> StandardMaterial3D:
	return mat_solid(Color(0.78, 0.70, 0.60), 0.8, 0.0)


static func mat_stone_dark() -> StandardMaterial3D:
	return mat_solid(Color(0.52, 0.45, 0.38), 0.75, 0.0)


static func mat_fountain_water() -> StandardMaterial3D:
	return mat_solid(Color(0.45, 0.72, 0.82), 0.3, 0.1)


static func mat_metal_dark() -> StandardMaterial3D:
	return mat_solid(Color(0.22, 0.22, 0.24), 0.3, 0.85)


static func mat_bronze_weathered() -> StandardMaterial3D:
	return mat_solid(Color(0.47, 0.55, 0.50), 0.45, 0.6)


static func mat_foliage_pine() -> StandardMaterial3D:
	return mat_solid(Color(0.22, 0.42, 0.18), 0.9, 0.0)


static func mat_foliage_palm() -> StandardMaterial3D:
	return mat_solid(Color(0.28, 0.50, 0.22), 0.85, 0.0)


static func mat_glow_warm() -> StandardMaterial3D:
	return mat_solid(Color(1.0, 0.88, 0.5), 0.4, 0.0)


static func mat_tree_trunk() -> StandardMaterial3D:
	return mat_solid(Color(0.40, 0.28, 0.18), 0.9, 0.0)


static func mat_concrete_wall() -> StandardMaterial3D:
	return mat_solid(Color(0.72, 0.68, 0.62), 0.85, 0.0)


static func mat_wood_trompo() -> StandardMaterial3D:
	return mat_solid(Color(0.58, 0.38, 0.20), 0.85, 0.0)


static func mat_metal_trompo_tip() -> StandardMaterial3D:
	return mat_solid(Color(0.70, 0.70, 0.72), 0.25, 0.9)


# ═══════════════════════════════════════════════════════════
# Node factory — creates node, adds to parent, sets owner
# ═══════════════════════════════════════════════════════════

static func make(scene_root: Node, type: GDScript, name_str: String, parent: Node) -> Node:
	var n: Node = type.new()
	n.name = name_str
	parent.add_child(n)
	n.owner = scene_root
	return n


# ═══════════════════════════════════════════════════════════
# High-level prefabs
# ═══════════════════════════════════════════════════════════

## Creates a flat ground plane (StaticBody3D)
static func make_ground(scene_root: Node, parent: Node, name_str: String,
		size: Vector3, material: StandardMaterial3D, position: Vector3 = Vector3.ZERO) -> StaticBody3D:
	var sb: StaticBody3D = make(scene_root, StaticBody3D, name_str, parent) as StaticBody3D
	sb.transform.origin = position

	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = size

	var col: CollisionShape3D = make(scene_root, CollisionShape3D, "CollisionShape3D", sb)
	col.shape = shape

	var mi: MeshInstance3D = make(scene_root, MeshInstance3D, "MeshInstance3D", sb)
	var box: BoxMesh = BoxMesh.new()
	box.size = size
	mi.mesh = box
	mi.set_surface_override_material(0, material)

	return sb


## Creates a wall segment (StaticBody3D box)
static func make_wall(scene_root: Node, parent: Node, name_str: String,
		size: Vector3, material: StandardMaterial3D, position: Vector3) -> StaticBody3D:
	return make_ground(scene_root, parent, name_str, size, material, position)


## Creates a cylinder pillar (StaticBody3D)
static func make_pillar(scene_root: Node, parent: Node, name_str: String,
		radius: float, height: float, material: StandardMaterial3D, position: Vector3) -> StaticBody3D:
	var sb: StaticBody3D = make(scene_root, StaticBody3D, name_str, parent) as StaticBody3D
	sb.transform.origin = position

	var shape: CylinderShape3D = CylinderShape3D.new()
	shape.radius = radius
	shape.height = height

	var col: CollisionShape3D = make(scene_root, CollisionShape3D, "CollisionShape3D", sb)
	col.shape = shape

	var mi: MeshInstance3D = make(scene_root, MeshInstance3D, "MeshInstance3D", sb)
	var cyl: CylinderMesh = CylinderMesh.new()
	cyl.top_radius = radius
	cyl.bottom_radius = radius
	cyl.height = height
	mi.mesh = cyl
	mi.set_surface_override_material(0, material)

	return sb


## Creates a decorative CSG cylinder (no physics)
static func make_csg_cylinder(scene_root: Node, parent: Node, name_str: String,
		radius: float, height: float, material: Material,
		position: Vector3 = Vector3.ZERO, top_radius: float = -1.0) -> CSGCylinder3D:
	var c: CSGCylinder3D = make(scene_root, CSGCylinder3D, name_str, parent) as CSGCylinder3D
	c.radius = radius
	c.height = height
	c.top_radius = top_radius if top_radius >= 0.0 else radius
	c.material = material
	c.position = position
	return c


## Creates a decorative CSG sphere (no physics)
static func make_csg_sphere(scene_root: Node, parent: Node, name_str: String,
		radius: float, material: Material, position: Vector3 = Vector3.ZERO) -> CSGSphere3D:
	var s: CSGSphere3D = make(scene_root, CSGSphere3D, name_str, parent) as CSGSphere3D
	s.radius = radius
	s.material = material
	s.position = position
	return s


## Creates a decorative CSG box (no physics)
static func make_csg_box(scene_root: Node, parent: Node, name_str: String,
		size: Vector3, material: Material, position: Vector3 = Vector3.ZERO) -> CSGBox3D:
	var b: CSGBox3D = make(scene_root, CSGBox3D, name_str, parent) as CSGBox3D
	b.size = size
	b.material = material
	b.position = position
	return b


# ═══════════════════════════════════════════════════════════
# Player builder (calico cat CharacterBody3D)
# ═══════════════════════════════════════════════════════════

static func build_player(scene_root: Node, parent: Node, spawn_pos: Vector3,
		player_script: Script, fur_mat: ShaderMaterial) -> CharacterBody3D:
	var player: CharacterBody3D = make(scene_root, CharacterBody3D, "Player", parent) as CharacterBody3D
	player.script = player_script
	player.transform.origin = spawn_pos
	player.collision_layer = 1
	player.collision_mask = 1

	var col_shape: CapsuleShape3D = CapsuleShape3D.new()
	col_shape.radius = 0.35
	col_shape.height = 1.0

	var col: CollisionShape3D = make(scene_root, CollisionShape3D, "CollisionShape3D", player)
	col.shape = col_shape
	col.position = Vector3(0.0, 0.5, 0.0)

	var cat_body: Node3D = make(scene_root, Node3D, "CatBody", player)
	_build_cat_mesh(scene_root, cat_body, fur_mat)

	return player


static func _build_cat_mesh(scene_root: Node, parent: Node3D, fur_mat: ShaderMaterial) -> void:
	# Torso (horizontal along Z)
	var torso: CSGCylinder3D = make(scene_root, CSGCylinder3D, "Torso", parent) as CSGCylinder3D
	torso.radius = 0.22
	torso.height = 0.85
	torso.material = fur_mat
	torso.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	torso.position = Vector3(0.0, 0.48, 0.0)

	# Head
	var head: CSGSphere3D = make(scene_root, CSGSphere3D, "Head", parent) as CSGSphere3D
	head.radius = 0.20
	head.material = fur_mat
	head.position = Vector3(0.0, 0.44, -0.52)

	# Legs
	_make_cat_leg(scene_root, parent, fur_mat, "LegFL", Vector3(-0.12, 0.16, -0.22))
	_make_cat_leg(scene_root, parent, fur_mat, "LegFR", Vector3(0.12, 0.16, -0.22))
	_make_cat_leg(scene_root, parent, fur_mat, "LegBL", Vector3(-0.12, 0.16, 0.22))
	_make_cat_leg(scene_root, parent, fur_mat, "LegBR", Vector3(0.12, 0.16, 0.22))

	# Tail
	var tail: CSGCylinder3D = make(scene_root, CSGCylinder3D, "Tail", parent) as CSGCylinder3D
	tail.radius = 0.05
	tail.height = 0.45
	tail.material = fur_mat
	tail.rotation_degrees = Vector3(-40.0, 0.0, 15.0)
	tail.position = Vector3(-0.08, 0.55, 0.38)

	# Ears
	_make_cat_ear(scene_root, parent, fur_mat, "EarL", Vector3(-0.10, 0.58, -0.55))
	_make_cat_ear(scene_root, parent, fur_mat, "EarR", Vector3(0.10, 0.58, -0.55))


static func _make_cat_leg(scene_root: Node, parent: Node3D, mat: ShaderMaterial, leg_name: String, pos: Vector3) -> void:
	var leg: CSGCylinder3D = make(scene_root, CSGCylinder3D, leg_name, parent) as CSGCylinder3D
	leg.radius = 0.07
	leg.height = 0.32
	leg.material = mat
	leg.position = pos


static func _make_cat_ear(scene_root: Node, parent: Node3D, mat: ShaderMaterial, ear_name: String, pos: Vector3) -> void:
	var ear: CSGCylinder3D = make(scene_root, CSGCylinder3D, ear_name, parent) as CSGCylinder3D
	ear.radius = 0.03
	ear.height = 0.18
	ear.material = mat
	ear.position = pos


# ═══════════════════════════════════════════════════════════
# Trompo Chileno builder
# ═══════════════════════════════════════════════════════════

static func build_trompo(scene_root: Node, parent: Node, trompo_script: Script,
		position: Vector3, wood_mat: StandardMaterial3D, metal_mat: StandardMaterial3D) -> Area3D:
	var trompo: Area3D = make(scene_root, Area3D, "TrompoChileno", parent) as Area3D
	trompo.script = trompo_script
	trompo.transform.origin = position
	trompo.collision_layer = 2
	trompo.collision_mask = 1

	# Mesh container (named "MeshInstance3D" so @onready var mesh = $MeshInstance3D works)
	var mesh_container: MeshInstance3D = make(scene_root, MeshInstance3D, "MeshInstance3D", trompo) as MeshInstance3D

	# Metal tip
	make_csg_cylinder(scene_root, mesh_container, "MetalTip",
		0.04, 0.25, metal_mat, Vector3(0.0, 0.125, 0.0))

	# Wood body (tapered)
	make_csg_cylinder(scene_root, mesh_container, "WoodBody",
		0.35, 0.85, wood_mat, Vector3(0.0, 0.65, 0.0), 0.08)

	# Crown nub
	make_csg_sphere(scene_root, mesh_container, "CrownNub",
		0.14, wood_mat, Vector3(0.0, 1.08, 0.0))

	# Detection area
	var detect_shape: SphereShape3D = SphereShape3D.new()
	detect_shape.radius = 3.5

	var detect_col: CollisionShape3D = make(scene_root, CollisionShape3D, "DetectionArea", trompo)
	detect_col.shape = detect_shape
	detect_col.position = Vector3(0.0, 0.9, 0.0)

	# Word label (named "Label3D" so @onready var label_3d = $Label3D works)
	var word_label: Label3D = make(scene_root, Label3D, "Label3D", trompo) as Label3D
	word_label.position = Vector3(0.0, 2.0, 0.0)
	word_label.text = ""
	word_label.font_size = 48
	word_label.outline_size = 6
	word_label.outline_modulate = Color(0.0, 0.0, 0.0, 1.0)
	word_label.modulate = Color(1.0, 0.95, 0.3, 1.0)
	word_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	word_label.pixel_size = 0.005
	word_label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	word_label.visible = false

	return trompo


# ═══════════════════════════════════════════════════════════
# Zone Portal builder
# ═══════════════════════════════════════════════════════════

static func build_portal(scene_root: Node, parent: Node,
		destination: String, glow_color: Color, portal_script: Script, position: Vector3) -> Area3D:
	var portal: Area3D = make(scene_root, Area3D, "Portal_" + destination, parent) as Area3D
	portal.script = portal_script
	portal.transform.origin = position
	portal.collision_layer = 4
	portal.collision_mask = 1
	portal.set("destination", destination)
	portal.set("glow_color", glow_color)

	var shape: CylinderShape3D = CylinderShape3D.new()
	shape.radius = 1.5
	shape.height = 3.0

	var col: CollisionShape3D = make(scene_root, CollisionShape3D, "CollisionShape3D", portal)
	col.shape = shape

	# Visual ring
	var ring_outer: CSGCylinder3D = make(scene_root, CSGCylinder3D, "RingOuter", portal) as CSGCylinder3D
	ring_outer.radius = 1.3
	ring_outer.height = 0.15
	ring_outer.material = SceneBuilder.mat_solid(glow_color, 0.25, 0.5)
	ring_outer.position = Vector3(0.0, 1.5, 0.0)

	# Label
	var lbl: Label3D = make(scene_root, Label3D, "PortalLabel", portal) as Label3D
	lbl.position = Vector3(0.0, 2.5, 0.0)
	lbl.text = _portal_label_text(destination)
	lbl.font_size = 28
	lbl.outline_size = 4
	lbl.outline_modulate = Color(0.0, 0.0, 0.0, 1.0)
	lbl.modulate = glow_color
	lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lbl.pixel_size = 0.004
	lbl.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	portal.set("portal_label", lbl)

	return portal


static func _portal_label_text(dest: String) -> String:
	match dest:
		"wetland": return "→  El Humedal  →"
		"foothills": return "→  Las Estribaciones  →"
		"coastal": return "→  La Plaza Costera  →"
		_: return "→  " + dest.capitalize() + "  →"


# ═══════════════════════════════════════════════════════════
# Fountain builder (decorative, no physics)
# ═══════════════════════════════════════════════════════════

static func build_fountain(scene_root: Node, parent: Node,
		stone_mat: StandardMaterial3D, water_mat: StandardMaterial3D, position: Vector3) -> Node3D:
	var fountain: Node3D = make(scene_root, Node3D, "Fountain", parent) as Node3D
	fountain.position = position

	# Base platform
	make_csg_cylinder(scene_root, fountain, "Base", 2.5, 0.4, stone_mat, Vector3(0.0, 0.2, 0.0))

	# Outer basin ring
	make_csg_cylinder(scene_root, fountain, "BasinRing", 2.3, 0.6, stone_mat, Vector3(0.0, 0.7, 0.0))

	# Water surface
	make_csg_cylinder(scene_root, fountain, "Water", 2.1, 0.06, water_mat, Vector3(0.0, 0.98, 0.0))

	# Central pillar
	make_csg_cylinder(scene_root, fountain, "Pillar", 0.3, 1.8, stone_mat, Vector3(0.0, 1.2, 0.0))

	# Ornament on top
	make_csg_sphere(scene_root, fountain, "Ornament", 0.32, stone_mat, Vector3(0.0, 2.15, 0.0))

	return fountain


# ═══════════════════════════════════════════════════════════
# Coastal tree builder (stylized palm / araucaria)
# ═══════════════════════════════════════════════════════════

static func build_coastal_tree(scene_root: Node, parent: Node,
		trunk_mat: StandardMaterial3D, foliage_mat: StandardMaterial3D, position: Vector3) -> Node3D:
	var tree: Node3D = make(scene_root, Node3D, "CoastalTree", parent) as Node3D
	tree.position = position

	# Trunk
	make_csg_cylinder(scene_root, tree, "Trunk",
		0.14, 3.5, trunk_mat, Vector3(0.0, 1.75, 0.0))

	# Canopy layers (3 stacked spheres for a lush look)
	make_csg_sphere(scene_root, tree, "CanopyBottom",
		1.0, foliage_mat, Vector3(0.0, 2.8, 0.0))
	make_csg_sphere(scene_root, tree, "CanopyMid",
		0.85, foliage_mat, Vector3(0.0, 3.4, 0.0))
	make_csg_sphere(scene_root, tree, "CanopyTop",
		0.6, foliage_mat, Vector3(0.0, 3.9, 0.0))

	return tree


# ═══════════════════════════════════════════════════════════
# Lamp post builder
# ═══════════════════════════════════════════════════════════

static func build_lamp_post(scene_root: Node, parent: Node,
		metal_mat: StandardMaterial3D, glow_mat: StandardMaterial3D, position: Vector3) -> Node3D:
	var lamp: Node3D = make(scene_root, Node3D, "LampPost", parent) as Node3D
	lamp.position = position

	# Post
	make_csg_cylinder(scene_root, lamp, "Post",
		0.07, 3.5, metal_mat, Vector3(0.0, 1.75, 0.0))

	# Lamp housing
	make_csg_cylinder(scene_root, lamp, "Housing",
		0.2, 0.35, metal_mat, Vector3(0.0, 3.6, 0.0))

	# Glow
	make_csg_sphere(scene_root, lamp, "Glow",
		0.22, glow_mat, Vector3(0.0, 3.6, 0.0))

	return lamp


# ═══════════════════════════════════════════════════════════
# Simple bench builder
# ═══════════════════════════════════════════════════════════

static func build_bench(scene_root: Node, parent: Node,
		wood_mat: StandardMaterial3D, position: Vector3, facing_angle: float = 0.0) -> Node3D:
	var bench: Node3D = make(scene_root, Node3D, "Bench", parent) as Node3D
	bench.position = position
	bench.rotation_degrees = Vector3(0.0, facing_angle, 0.0)

	# Seat
	make_csg_box(scene_root, bench, "Seat",
		Vector3(2.5, 0.12, 0.6), wood_mat, Vector3(0.0, 0.55, 0.0))

	# Left leg
	make_csg_box(scene_root, bench, "LegL",
		Vector3(0.1, 0.45, 0.5), wood_mat, Vector3(-1.0, 0.25, 0.0))

	# Right leg
	make_csg_box(scene_root, bench, "LegR",
		Vector3(0.1, 0.45, 0.5), wood_mat, Vector3(1.0, 0.25, 0.0))

	# Backrest
	make_csg_box(scene_root, bench, "Backrest",
		Vector3(2.3, 0.45, 0.08), wood_mat, Vector3(0.0, 0.75, -0.25))

	return bench


# ═══════════════════════════════════════════════════════════
# Abstract statue / monument
# ═══════════════════════════════════════════════════════════

static func build_statue(scene_root: Node, parent: Node,
		bronze_mat: StandardMaterial3D, stone_mat: StandardMaterial3D, position: Vector3) -> Node3D:
	var statue: Node3D = make(scene_root, Node3D, "StatueMonument", parent) as Node3D
	statue.position = position

	# Pedestal
	make_csg_box(scene_root, statue, "Pedestal",
		Vector3(1.2, 1.6, 1.2), stone_mat, Vector3(0.0, 0.8, 0.0))

	# Base plinth
	make_csg_box(scene_root, statue, "Plinth",
		Vector3(1.5, 0.3, 1.5), stone_mat, Vector3(0.0, 1.75, 0.0))

	# Figure body (abstract pillar)
	make_csg_cylinder(scene_root, statue, "FigureBody",
		0.22, 1.8, bronze_mat, Vector3(0.0, 2.8, 0.0))

	# Figure head
	make_csg_sphere(scene_root, statue, "FigureHead",
		0.25, bronze_mat, Vector3(0.0, 3.8, 0.0))

	return statue
