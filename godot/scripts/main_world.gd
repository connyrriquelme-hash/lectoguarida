class_name MainWorld
extends Node3D

## Runtime setup for the unified open world.
## Removes duplicate Player/Camera/Lights from zones B and C,
## boosts lighting for the large world, and configures portal warps.

const ZONE_B_X: float = 55.0
const ZONE_C_X: float = -55.0
const ZONE_D_Z: float = 100.0
const ZONE_E_Z: float = -100.0
const ZONE_F_X: float = 100.0
const ZONE_G_X: float = -100.0
const ZONE_H_Z: float = 200.0
const ZONE_I_Z: float = -200.0

# Remove-list for all non-A zones
const DUPLICATE_NAMES: Array[String] = ["Player", "Camera3D", "DirectionalLight3D", "WorldEnvironment"]
const DUPLICATE_OLD: Array[String] = ["Player", "GameCamera", "Sun", "AmbientFill", "FogLight"]

func _ready() -> void:
	# ═══════════════════════════════════════════════════════════════
	#  WORLD ENVIRONMENT — MUST be first: background + ambient light
	# ═══════════════════════════════════════════════════════════════
	var world_env := WorldEnvironment.new()
	world_env.name = "WorldEnvironment"
	add_child(world_env)

	var env := Environment.new()
	# Background — solid light sky blue (more reliable than ProceduralSky in GL Compat)
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#4A90D9")   # Cerulean blue — solid and visible

	# Ambient light — subtle fill only
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#B0C8E0")
	env.ambient_light_energy = 0.35

	# Tonemapping — FILMIC for natural highlights rolloff (no burned whites)
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.6

	# Fog disabled — causes overexposure on GL Compatibility
	env.fog_enabled = false

	world_env.environment = env

	# ── Load all zones ──
	var zb: Node3D = _zone("ZoneB_Wetland")
	var zc: Node3D = _zone("ZoneC_Foothills")
	var zd: Node3D = _zone("ZoneD_Puerto")
	var ze: Node3D = _zone("ZoneE_Litoral")
	var zf: Node = _load_zone("res://scenes/zone_f_vina.tscn", "ZoneF_Vina", Vector3(ZONE_F_X, 0, 0))
	var zg: Node = _load_zone("res://scenes/zone_g_valparaiso.tscn", "ZoneG_Valparaiso", Vector3(ZONE_G_X, 0, 0))
	var zh: Node = _load_zone("res://scenes/zone_h_isla_negra.tscn", "ZoneH_IslaNegra", Vector3(0, 0, ZONE_H_Z))
	var zi: Node = _load_zone("res://scenes/zone_i_el_tabo.tscn", "ZoneI_ElTabo", Vector3(0, 0, ZONE_I_Z))
	print("Zones: F=", "ok" if zf else "FAIL", " G=", "ok" if zg else "FAIL", " H=", "ok" if zh else "FAIL", " I=", "ok" if zi else "FAIL")

	# ── Add collision grounds to zones that lack them (F-I use CSG only) ──

	# ── Remove duplicate singletons from all non-A zones ──
	_remove_all(zb, DUPLICATE_OLD)
	_remove_all(zc, DUPLICATE_OLD)
	_remove_all(zd, DUPLICATE_OLD)
	_remove_all(ze, DUPLICATE_OLD)
	_remove_all(zf as Node3D, DUPLICATE_NAMES)
	_remove_all(zg as Node3D, DUPLICATE_NAMES)
	_remove_all(zh as Node3D, DUPLICATE_NAMES)
	_remove_all(zi as Node3D, DUPLICATE_NAMES)

	# ── GLOBAL LIGHTING — sun + ambient covering ALL zones ──
	# Zone A's Sun is local. We add a global DirectionalLight3D for the entire world.
	var global_sun := DirectionalLight3D.new()
	global_sun.name = "GlobalSun"
	global_sun.light_energy = 0.8
	global_sun.light_indirect_energy = 0.4
	global_sun.light_specular = 0.3
	global_sun.shadow_enabled = true
	global_sun.shadow_blur = 2
	global_sun.shadow_bias = 0.005
	global_sun.shadow_normal_bias = 0.01
	global_sun.directional_shadow_max_distance = 150.0
	global_sun.rotation_degrees = Vector3(-45, 135, 0)  # ~mid-morning angle
	global_sun.light_color = Color(1.0, 0.98, 0.92)     # warm white
	add_child(global_sun)
	move_child(global_sun, 0)  # keep it early in the tree

	var global_ambient := DirectionalLight3D.new()
	global_ambient.name = "GlobalAmbient"
	global_ambient.light_energy = 0.25
	global_ambient.light_color = Color(0.75, 0.8, 0.9)  # subtle cool blue fill
	global_ambient.rotation_degrees = Vector3(30, -45, 0)
	add_child(global_ambient)

	# ── Camera setup ──
	var camera: Camera3D = $ZoneA_Coastal.get_node_or_null("GameCamera") as Camera3D
	if camera:
		camera.current = false
		camera.far = 500.0
		var player: Node3D = $ZoneA_Coastal.get_node_or_null("Player")
		if player and player.has_method("activate_camera"):
			player.activate_camera()

	# ── Convert CSG to MeshInstance3D in ALL pre-instanced zones ──
	_convert_csg_to_mesh($ZoneA_Coastal)
	if zb: _convert_csg_to_mesh(zb)
	if zc: _convert_csg_to_mesh(zc)
	if zd: _convert_csg_to_mesh(zd)
	if ze: _convert_csg_to_mesh(ze)
	if zf: _convert_csg_to_mesh(zf as Node3D)
	if zg: _convert_csg_to_mesh(zg as Node3D)
	if zh: _convert_csg_to_mesh(zh as Node3D)
	if zi: _convert_csg_to_mesh(zi as Node3D)

	# ── Apply pixel-art textures to terrain planes ──
	GroundTexturer.apply_all(self)

	# ── Upgrade trees with multi-layer foliage ──
	TreeBuilder.upgrade_all(self)

	# ── Apply building materials (walls, roofs, bridges) ──
	BuildingMaterials.apply_all(self)

	# ── Portal warp targets ──
	# Zone A → B, C, D, E, F, G
	_set_warp($ZoneA_Coastal, "Portal_wetland",   Vector3(ZONE_B_X, 0, 0))
	_set_warp($ZoneA_Coastal, "Portal_foothills", Vector3(ZONE_C_X, 0, 0))
	_add_portal($ZoneA_Coastal, "Portal_puerto",   Color(0.85, 0.45, 0.15), Vector3(6, 0, 8),   "Puerto",       Vector3(0, 0, ZONE_D_Z))
	_add_portal($ZoneA_Coastal, "Portal_litoral",  Color(0.35, 0.55, 0.85), Vector3(-6, 0, -8),  "Litoral",      Vector3(0, 0, ZONE_E_Z))
	_add_portal($ZoneA_Coastal, "Portal_vina",     Color(0.3, 0.9, 0.4),    Vector3(9, 0, 0),    "Vina del Mar", Vector3(ZONE_F_X, 0, 0))
	_add_portal($ZoneA_Coastal, "Portal_valpo",    Color(0.2, 0.5, 1.0),    Vector3(-9, 0, 0),   "Valparaiso",   Vector3(ZONE_G_X, 0, 0))

	# Zone B ↔ A, C
	if zb:
		_set_warp(zb, "Portal_coastal",   Vector3(0, 0, 0))
		_set_warp(zb, "Portal_foothills", Vector3(ZONE_C_X, 0, 0))
		_add_portal(zb, "portal_vina",    Color(0.3, 0.9, 0.4), Vector3(9, 0, 0), "Vina del Mar", Vector3(ZONE_F_X, 0, 0))

	# Zone C ↔ A, B, G
	if zc:
		_set_warp(zc, "Portal_coastal", Vector3(0, 0, 0))
		_set_warp(zc, "Portal_wetland", Vector3(ZONE_B_X, 0, 0))
		_add_portal(zc, "portal_valpo",  Color(0.2, 0.5, 1.0), Vector3(-9, 0, 0), "Valparaiso", Vector3(ZONE_G_X, 0, 0))

	# Zone D → A, B, E, H
	if zd:
		_set_warp(zd, "portal_coastal", Vector3(0, 0, 0))
		_set_warp(zd, "portal_wetland", Vector3(ZONE_B_X, 0, 0))
		_set_warp(zd, "portal_litoral", Vector3(0, 0, ZONE_E_Z))
		_add_portal(zd, "portal_islanegra", Color(0.2, 0.5, 0.8), Vector3(0, 0, 9), "Isla Negra", Vector3(0, 0, ZONE_H_Z))

	# Zone E → A, D, I
	if ze:
		_set_warp(ze, "portal_coastal", Vector3(0, 0, 0))
		_set_warp(ze, "portal_puerto",  Vector3(0, 0, ZONE_D_Z))
		_add_portal(ze, "portal_eltabo", Color(1.0, 0.8, 0.3), Vector3(0, 0, -9), "El Tabo", Vector3(0, 0, ZONE_I_Z))

	# Zone F (Viña) → A, G, H
	if zf:
		_set_warp(zf as Node3D, "Plaza Costera", Vector3(0, 0, 0))
		_add_portal(zf as Node3D, "portal_valpo", Color(0.2, 0.5, 1.0), Vector3(-9, 0, 0), "Valparaiso", Vector3(ZONE_G_X, 0, 0))
		_add_portal(zf as Node3D, "portal_islanegra", Color(0.2, 0.5, 0.8), Vector3(0, 0, -9), "Isla Negra", Vector3(0, 0, ZONE_H_Z))

	# Zone G (Valpo) → A, F
	if zg:
		_set_warp(zg as Node3D, "Plaza Costera", Vector3(0, 0, 0))
		_add_portal(zg as Node3D, "portal_vina", Color(0.3, 0.9, 0.4), Vector3(9, 0, 0), "Vina del Mar", Vector3(ZONE_F_X, 0, 0))

	# Zone H (Isla Negra) → F, D, I
	if zh:
		_add_portal(zh as Node3D, "portal_vina",  Color(0.3, 0.9, 0.4), Vector3(9, 0, -4), "Vina del Mar", Vector3(ZONE_F_X, 0, 0))
		_add_portal(zh as Node3D, "portal_puerto", Color(1.0, 0.6, 0.4), Vector3(-9, 0, -4), "Puerto",       Vector3(0, 0, ZONE_D_Z))
		_add_portal(zh as Node3D, "portal_eltabo", Color(1.0, 0.8, 0.3), Vector3(0, 0, -9),  "El Tabo",      Vector3(0, 0, ZONE_I_Z))

	# Zone I (El Tabo) → E, H
	if zi:
		_add_portal(zi as Node3D, "portal_litoral",   Color(0.3, 0.8, 0.3), Vector3(0, 0, 9),  "Litoral",    Vector3(0, 0, ZONE_E_Z))
		_add_portal(zi as Node3D, "portal_islanegra", Color(0.2, 0.5, 0.8), Vector3(0, 0, -9), "Isla Negra", Vector3(0, 0, ZONE_H_Z))

	# ── Wisdom Totems Spawner ──
	var totem_spawner := Node3D.new()
	totem_spawner.name = "TotemSpawner"
	totem_spawner.script = load("res://scripts/totem_spawner.gd")
	add_child(totem_spawner)

	# ── Challenge Gems Spawner ──
	var gem_spawner := Node3D.new()
	gem_spawner.name = "GemSpawner"
	gem_spawner.script = load("res://scripts/gem_spawner.gd")
	add_child(gem_spawner)

	# ── Unified Game HUD (coins, stats, XP, health) ──
	var hud_layer := CanvasLayer.new()
	hud_layer.name = "HUDLayer"
	hud_layer.layer = 2
	add_child(hud_layer)

	var hud := GameHUD.new()
	hud.name = "GameHUD"
	hud_layer.add_child(hud)

	# ═══════════════════════════════════════════════════════════════
	#  EL SANTUARIO — home of the Golden Kitten + house building
	# ═══════════════════════════════════════════════════════════════
	var sanctuary := Node3D.new()
	sanctuary.name = "Sanctuary"
	sanctuary.position = Vector3(20, 0, 0)
	add_child(sanctuary)

	# ── Decorative ground platform (MeshInstance3D — GL Compat safe) ──
	var ground_mat := StandardMaterial3D.new()
	ground_mat.albedo_color = Color(0.6, 0.5, 0.3)
	ground_mat.roughness = 0.8
	var floor_mesh := MeshInstance3D.new()
	floor_mesh.name = "SanctuaryFloor"
	var floor_box := BoxMesh.new()
	floor_box.size = Vector3(20, 0.2, 20)
	floor_mesh.mesh = floor_box
	floor_mesh.material_override = ground_mat
	floor_mesh.position = Vector3(0, -0.1, 0)
	sanctuary.add_child(floor_mesh)

	# ── Collision floor so the player doesn't fall through ──
	var floor_body := StaticBody3D.new()
	floor_body.name = "SanctuaryFloorCollision"
	var floor_shape := CollisionShape3D.new()
	var floor_box_shape := BoxShape3D.new()
	floor_box_shape.size = Vector3(20, 0.2, 20)
	floor_shape.shape = floor_box_shape
	floor_body.add_child(floor_shape)
	floor_body.position = Vector3(0, -0.1, 0)
	sanctuary.add_child(floor_body)

	# ── Furniture root (HouseBuilder places items here) ──
	var furniture_root := Node3D.new()
	furniture_root.name = "FurnitureRoot"
	sanctuary.add_child(furniture_root)

	var house_builder := HouseBuilder.new()
	house_builder.name = "HouseBuilder"
	house_builder.sanctuary_root = furniture_root
	sanctuary.add_child(house_builder)

	# ── Golden Kitten treasure ──
	var golden_kitten_ps: PackedScene = preload("res://scenes/golden_kitten.tscn")
	var golden_kitten: Area3D = golden_kitten_ps.instantiate()
	golden_kitten.name = "GoldenKitten"
	golden_kitten.position = Vector3(0, 0.2, 8)
	sanctuary.add_child(golden_kitten)

	# ── Shop trigger zone — when player walks here, catalog UI opens ──
	var shop_zone := Area3D.new()
	shop_zone.name = "ShopTrigger"
	shop_zone.position = Vector3(0, 0.5, -6)
	shop_zone.collision_layer = 4
	shop_zone.collision_mask = 1
	sanctuary.add_child(shop_zone)

	var shop_shape := CollisionShape3D.new()
	var shop_box := BoxShape3D.new()
	shop_box.size = Vector3(6, 3, 6)
	shop_shape.shape = shop_box
	shop_zone.add_child(shop_shape)

	# Label above the shop zone
	var shop_label := Label3D.new()
	shop_label.text = "🏪 Tienda de Muebles\n🪙 Gasta tus monedas aquí"
	shop_label.position = Vector3(0, 2.5, 0)
	shop_label.font_size = 22
	shop_label.outline_size = 3
	shop_label.outline_modulate = Color.BLACK
	shop_label.modulate = Color("#FFD166")
	shop_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	shop_label.pixel_size = 0.005
	shop_label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	shop_zone.add_child(shop_label)

	# Portal ring visual for the shop (MeshInstance3D — GL Compat safe)
	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = Color("#FFD166")
	ring_mat.metallic = 0.5
	ring_mat.roughness = 0.3
	ring_mat.emission_enabled = true
	ring_mat.emission = Color("#FFD166")
	ring_mat.emission_energy_multiplier = 1.0
	# A torus approximated as a tall thin CylinderMesh (ring shape)
	var ring_mesh := MeshInstance3D.new()
	ring_mesh.name = "ShopRing"
	var ring_cyl := CylinderMesh.new()
	ring_cyl.top_radius = 0.12
	ring_cyl.bottom_radius = 0.12
	ring_cyl.height = 5.0
	ring_mesh.mesh = ring_cyl
	ring_mesh.material_override = ring_mat
	ring_mesh.position = Vector3(0, 0.2, 0)
	ring_mesh.rotation_degrees = Vector3(0, 0, 90)
	shop_zone.add_child(ring_mesh)

	# Connect shop zone to open the catalog
	shop_zone.body_entered.connect(_on_shop_zone_entered.bind(house_builder))

	# ═══════════════════════════════════════════════════════════════
	#  ZONE CONNECTIONS — bridges + edge barriers + anticaídas
	# ═══════════════════════════════════════════════════════════════
	_build_zone_connections()

	# ═══════════════════════════════════════════════════════════════
	#  INITIAL SPAWN — set the Player's safe spawn point
	# ═══════════════════════════════════════════════════════════════
	var player_node: Node3D = $ZoneA_Coastal.get_node_or_null("Player") as Node3D
	if player_node:
		set_spawn(player_node.global_position)

	# ═══════════════════════════════════════════════════════════════
	#  WORLD REPAIR — continuous ground collision, bridges, barriers
	# ═══════════════════════════════════════════════════════════════
	var world_repair_script = load("res://scripts/world_repair.gd")
	world_repair_script.apply_all(self)

	# ═══════════════════════════════════════════════════════════════
	#  SAFETY SYSTEM — per-zone anti-fall with checkpoints
	# ═══════════════════════════════════════════════════════════════
	_player_ref = $ZoneA_Coastal.get_node_or_null("Player") as Node3D
	if _player_ref:
		print("Player ref set at ", _player_ref.global_position)

	var safety_script = load("res://scripts/safety_system.gd")
	var safety = safety_script.new()
	safety.name = "SafetySystem"
	add_child(safety)
	var spawn_pos: Vector3 = _player_ref.global_position if _player_ref else Vector3(0, 0.5, 0)
	safety.setup(_player_ref as CharacterBody3D, spawn_pos)
	_safety_system = safety

	# ── Conectar KillZones ──
	call_deferred("_connect_kill_zones")

	# ── Registrar SafeGrounds ──
	call_deferred("_register_safe_grounds")

	# ═══════════════════════════════════════════════════════════════
	#  EDUCATIONAL WORLDS — 5 nuevos mundos pedagógicos
	# ═══════════════════════════════════════════════════════════════
	var edu_loader := Node3D.new()
	edu_loader.name = "EduWorldLoader"
	edu_loader.set_script(load("res://scripts/edu_world_loader.gd"))
	add_child(edu_loader)

	# ═══════════════════════════════════════════════════════════════
	#  TEACHER DASHBOARD — key T opens progress panel
	# ═══════════════════════════════════════════════════════════════
	set_process_input(true)

	# ═══════════════════════════════════════════════════════════════
	#  MOBILE CONTROLS — joystick + touch buttons
	# ═══════════════════════════════════════════════════════════════
	call_deferred("_setup_mobile_controls")

	print("MainWorld: open world ready | 9 zones + 5 edu worlds | HUD + Sanctuary + EduSystem | ", get_child_count(), " children")


func _zone(zone_name: String) -> Node3D:
	return get_node_or_null(zone_name) as Node3D


## Loads a packed scene at a given position and adds it as a child
func _load_zone(path: String, node_name: String, pos: Vector3) -> Node:
	var ps: PackedScene = load(path)
	if not ps:
		push_error("MainWorld: could not load " + path)
		return null
	var zone: Node3D = ps.instantiate() as Node3D
	if not zone:
		return null
	zone.name = node_name
	zone.position = pos
	add_child(zone)
	return zone


func _remove_all(parent: Node3D, names: Array[String]) -> void:
	if not parent:
		return
	for nm in names:
		var child: Node = parent.get_node_or_null(nm)
		if child:
			parent.remove_child(child)
			child.queue_free()


func _set_warp(zone: Node3D, portal_name: String, target: Vector3) -> void:
	if not zone:
		return
	var portal: Node = zone.get_node_or_null(portal_name)
	if portal:
		portal.set("warp_target", target)


## Creates a runtime portal (Area3D with zone_portal.gd logic) at given position
# ── Zone ground safety ──


	"""Add an invisible collision barrier at zone edges to prevent falls.
	The barrier extends past the ground edge to prevent any gap."""
	var barrier := StaticBody3D.new()
	barrier.name = "EdgeBarrier_" + zone_name
	barrier.collision_layer = 1
	barrier.collision_mask = 0
	barrier.collision_priority = 1.0
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	# Thicken the barrier past the ground (the thinnest dimension gets +0.5)
	var adj := size
	if size.x < size.z and size.x < 1.0:
		adj.x = size.x + 0.5
	elif size.z < 1.0:
		adj.z = size.z + 0.5
	box.size = adj
	shape.shape = box
	barrier.add_child(shape)
	barrier.position = pos
	add_child(barrier)


	"""Add a visual + physics bridge between two zones."""
	var bridge := StaticBody3D.new()
	bridge.name = "ConnectionBridge"
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = size
	shape.shape = box
	bridge.add_child(shape)
	bridge.position = middle
	add_child(bridge)

	var mesh := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.8
	box_mesh.surface_set_material(0, mat)
	mesh.mesh = box_mesh
	mesh.position = middle
	add_child(mesh)


	"""Add a visible fence/barrier (visual hint, no collision)."""
	var mesh := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.7
	mat.metallic = 0.2
	box_mesh.surface_set_material(0, mat)
	mesh.mesh = box_mesh
	mesh.position = pos
	add_child(mesh)


func _add_portal(zone: Node3D, portal_name: String, clr: Color, pos: Vector3, label_text: String, warp_dest: Vector3) -> void:
	var portal := Area3D.new()
	portal.name = portal_name
	portal.position = pos
	portal.collision_layer = 4
	portal.collision_mask = 1

	# Attach ZonePortal script logic
	var script: Script = load("res://scripts/zone_portal.gd")
	portal.script = script
	portal.set("warp_target", warp_dest)
	portal.set("glow_color", clr)

	# Collision cylinder
	var shape := CylinderShape3D.new()
	shape.radius = 1.5
	shape.height = 3.0
	var col := CollisionShape3D.new()
	col.shape = shape
	portal.add_child(col)

	# Ring visual
	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = clr
	ring_mat.roughness = 0.25
	ring_mat.metallic = 0.5
	var ring := CSGCylinder3D.new()
	ring.radius = 1.3
	ring.height = 0.15
	ring.material = ring_mat
	ring.position = Vector3(0, 1.5, 0)
	portal.add_child(ring)

	# Label
	var lbl := Label3D.new()
	lbl.position = Vector3(0, 2.5, 0)
	lbl.text = label_text
	lbl.font_size = 26
	lbl.outline_size = 4
	lbl.outline_modulate = Color.BLACK
	lbl.modulate = clr
	lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lbl.pixel_size = 0.004
	lbl.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	portal.add_child(lbl)

	zone.add_child(portal)


# ═══════════════════════════════════════════════════════════════
#  ZONE CONNECTIONS — bridges, edge barriers & anticaídas
# ═══════════════════════════════════════════════════════════════

func _build_zone_connections() -> void:
	"""Zone connections handled entirely by world_repair.gd. This keeps only the log."""
	print("Zone connections: bridges, barriers, and anticaidas handled by world_repair.gd"
	"""Remove edge barrier at a position (converted to barrier name) so bridge can pass through."""
	# Find and remove the barrier child by position check
	for child in get_children():
		if child.name.begins_with("EdgeBarrier_") and child.position.distance_to(pos) < 0.5:
			child.queue_free()


# ═══════════════════════════════════════════════════════════════
#  SAFETY SYSTEM — per-world anti-fall with checkpoints
# ═══════════════════════════════════════════════════════════════

var _player_ref: Node3D = null
var _safety_system = null


func _convert_csg_to_mesh(parent: Node) -> void:
	"""Recursively replace CSGShape3D children with MeshInstance3D (GL Compat fix).
	Skips Player nodes to preserve their runtime-built cat body."""
	for child: Node in parent.get_children():
		# Skip Player nodes — their cat body is built at runtime as MeshInstance3D
		if child is Player or (child.has_method("is_in_group") and child.is_in_group("player")):
			continue
		if child is CSGShape3D:
			var mat: Material = child.material as Material
			if not mat:
				mat = StandardMaterial3D.new()
				(mat as StandardMaterial3D).albedo_color = Color(0.7, 0.7, 0.7)

			var mesh_instance := MeshInstance3D.new()
			mesh_instance.name = child.name
			mesh_instance.transform = child.transform
			mesh_instance.position = child.position
			mesh_instance.rotation = child.rotation
			mesh_instance.scale = child.scale

			# Convert CSG primitive to Mesh primitive
			if child is CSGBox3D:
				var box_mesh := BoxMesh.new()
				box_mesh.size = child.size
				mesh_instance.mesh = box_mesh
			elif child is CSGSphere3D:
				var sphere_mesh := SphereMesh.new()
				sphere_mesh.radius = child.radius
				sphere_mesh.height = child.radius * 2.0
				mesh_instance.mesh = sphere_mesh
			elif child is CSGCylinder3D:
				var cyl_mesh := CylinderMesh.new()
				cyl_mesh.top_radius = child.radius
				cyl_mesh.bottom_radius = child.radius
				cyl_mesh.height = child.height
				mesh_instance.mesh = cyl_mesh
			elif child is CSGTorus3D:
				# Torus approximado con CylinderMesh rotado (anillo visual)
				var ring_mesh := CylinderMesh.new()
				ring_mesh.top_radius = 0.05
				ring_mesh.bottom_radius = 0.05
				ring_mesh.height = child.outer_radius * 2
				mesh_instance.mesh = ring_mesh
			else:
				# Fallback: caja genérica
				var box_mesh := BoxMesh.new()
				box_mesh.size = Vector3(0.5, 0.5, 0.5)
				mesh_instance.mesh = box_mesh

			mesh_instance.material_override = mat

			# Add children from CSG
			for gc in child.get_children():
				child.remove_child(gc)
				mesh_instance.add_child(gc)

			parent.add_child(mesh_instance)
			parent.remove_child(child)
			child.queue_free()
		else:
			# Recurse into non-CSG children
			_convert_csg_to_mesh(child)


func set_spawn(pos: Vector3) -> void:
	"""Set the initial safe spawn point."""
	if _safety_system:
		_safety_system.setup(_player_ref as CharacterBody3D, pos)


func _connect_kill_zones() -> void:
	"""Conectar todas las KillZone al SafetySystem."""
	for child: Node in get_children():
		if child.name.begins_with("KillZone_") and child is Area3D:
			child.body_entered.connect(_on_kill_zone_entered.bind(child))
			print("KillZone conectada: ", child.name)


func _register_safe_grounds() -> void:
	"""Asegurar que todo nodo safe_ground tenga colisión correcta."""
	for child: Node in get_children():
		if child.is_in_group("safe_ground") or child.name.begins_with("GroundCollision_") or child.name.begins_with("BridgeRepair_"):
			if not child.is_in_group("safe_ground"):
				child.add_to_group("safe_ground")


func _on_kill_zone_entered(body: Node3D, _kill_zone: Area3D) -> void:
	if not body is Player:
		return
	if _safety_system:
		_safety_system.force_rescue()


# ── Mobile Controls ──

func _setup_mobile_controls() -> void:
	"""Crear controles táctiles si es necesario."""
	if not _player_ref:
		return
	var mobile_script = load("res://scripts/mobile_controls_manager.gd")
	var mobile = mobile_script.new()
	mobile.name = "MobileControls"
	add_child(mobile)
	mobile.set_player_ref(_player_ref)
	# Conectar al SafetySystem para pausar/resumir durante modales
	var edu: Node = get_node_or_null("EduWorldLoader")
	if edu and edu.has_signal("modal_opened"):
		edu.modal_opened.connect(mobile.hide_controls)
	if edu and edu.has_signal("modal_closed"):
		edu.modal_closed.connect(mobile.show_controls)


# ── Shop zone handler ──

func _on_shop_zone_entered(body: Node3D, house_builder: Node) -> void:
	if not body is Player:
		return

	# Prevent re-opening if already open
	if get_node_or_null("SanctuaryShopUI"):
		return

	get_tree().paused = true

	var shop_ui := CanvasLayer.new()
	shop_ui.name = "SanctuaryShopUI"
	shop_ui.layer = 3
	var shop_script: Script = load("res://scripts/sanctuary_shop_ui.gd")
	shop_ui.set_script(shop_script)
	add_child(shop_ui)
	shop_ui.setup(house_builder)
	shop_ui.shop_closed.connect(func(): pass)
