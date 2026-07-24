extends Object

## FASE 1 — Reparación del mundo base.
##
## Añade colisión continua entre zonas, barreras visuales en bordes,
## y asegura que todo suelo visible tenga colisión física.
## Llámese desde main_world.gd _ready() después de cargar todas las zonas.

const ZONE_GROUND_Y: float = 0.0     # Y del PLAYER (superficie caminable)
const BRIDGE_TOP_Y: float = -0.05     # Y de la superficie del puente

# Datos de cada zona: nombre del nodo, posición, tamaño del suelo
static var _zone_data := {
	"ZoneA_Coastal": {
		"ground_size": Vector3(40, 0.4, 40),
		"ground_pos": Vector3(0, -0.2, 0),
		"origin": Vector3(0, 0, 0),
		"color": Color(0.78, 0.72, 0.62),
	},
	"ZoneB_Wetland": {
		"ground_size": Vector3(50, 0.15, 50),
		"ground_pos": Vector3(0, -0.075, 0),
		"origin": Vector3(55, 0, 0),
		"color": Color(0.22, 0.48, 0.55),
	},
	"ZoneC_Foothills": {
		"ground_size": Vector3(50, 0.4, 50),
		"ground_pos": Vector3(0, -0.2, 0),
		"origin": Vector3(-55, 0, 0),
		"color": Color(0.52, 0.45, 0.38),
	},
	"ZoneD_Puerto": {
		"ground_size": Vector3(30, 0.3, 18),
		"ground_pos": Vector3(0, -0.15, 0),
		"origin": Vector3(0, 0, 100),
		"color": Color(0.45, 0.5, 0.55),
	},
	"ZoneE_Litoral": {
		"ground_size": Vector3(40, 0.3, 30),
		"ground_pos": Vector3(0, -0.15, 0),
		"origin": Vector3(0, 0, -100),
		"color": Color(0.47, 0.55, 0.5),
	},
	"ZoneF_Vina": {
		"ground_size": Vector3(12, 0.2, 12),
		"ground_pos": Vector3(0, -0.1, 0),
		"origin": Vector3(100, 0, 0),
		"color": Color(0.35, 0.55, 0.3),
	},
	"ZoneG_Valparaiso": {
		"ground_size": Vector3(10, 0.2, 10),
		"ground_pos": Vector3(0, -0.1, 0),
		"origin": Vector3(-100, 0, 0),
		"color": Color(0.6, 0.5, 0.4),
	},
	"ZoneH_IslaNegra": {
		"ground_size": Vector3(12, 0.2, 12),
		"ground_pos": Vector3(0, -0.1, 0),
		"origin": Vector3(0, 0, 200),
		"color": Color(0.5, 0.45, 0.35),
	},
	"ZoneI_ElTabo": {
		"ground_size": Vector3(12, 0.15, 12),
		"ground_pos": Vector3(0, -0.075, 0),
		"origin": Vector3(0, 0, -200),
		"color": Color(0.7, 0.65, 0.55),
	},
}


static func apply_all(world: Node3D) -> void:
	"""Paso 1: Asegurar que toda zona tenga suelo con colisión."""
	for zone_name: String in _zone_data:
		var zone: Node3D = world.get_node_or_null(zone_name) as Node3D
		if not zone:
			continue
		_ensure_zone_ground(zone, zone_name)

	# Paso 2: Añadir puentes continuos entre zonas adyacentes
	_add_all_bridges(world)

	# Paso 3: Añadir barreras visuales + físicas en bordes expuestos
	_add_all_edge_barriers(world)

	# Paso 4: Añadir KillZones debajo de cada zona
	_add_kill_zones(world)

	print("WorldRepair: colisiones continuas aplicadas a todas las zonas")


static func _ensure_zone_ground(zone: Node3D, zone_name: String) -> void:
	"""Asegura que la zona tenga StaticBody3D con colisión."""
	var data: Dictionary = _zone_data[zone_name]
	var gsize: Vector3 = data["ground_size"]
	var gpos: Vector3 = data["ground_pos"]

	# Buscar si ya existe un StaticBody3D con CollisionShape
	var has_collision := false
	for child: Node in zone.get_children():
		if child is StaticBody3D:
			for gc: Node in child.get_children():
				if gc is CollisionShape3D:
					has_collision = true
					break
			if has_collision:
				break

	if has_collision:
		return  # Ya tiene colisión (zonas A-E)

	# Crear StaticBody3D + CollisionShape3D nuevo
	var body := StaticBody3D.new()
	body.name = "GroundCollision_" + zone_name
	body.add_to_group("safe_ground")
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = gsize
	shape.shape = box
	body.add_child(shape)
	body.position = gpos
	zone.add_child(body)

	# Crear MeshInstance3D visual que coincida
	var mesh := MeshInstance3D.new()
	mesh.name = "GroundVisual_" + zone_name
	var box_mesh := BoxMesh.new()
	box_mesh.size = gsize
	var mat := StandardMaterial3D.new()
	mat.albedo_color = data["color"]
	mat.roughness = 0.9
	box_mesh.surface_set_material(0, mat)
	mesh.mesh = box_mesh
	mesh.position = gpos
	zone.add_child(mesh)

	print("  WorldRepair: colisión añadida a ", zone_name)


static func _add_all_bridges(world: Node3D) -> void:
	"""Puentes continuos entre zonas (Y fijo = 0.0 en superficie)."""
	var bridges := [
		# A↔B: gap X=20 to 30, Z a lo largo de -20 a 20
		{ "mid": Vector3(25, -0.1, 0), "size": Vector3(10, 0.2, 40), "col": Color(0.5, 0.45, 0.35) },
		# A↔C: gap X=-30 to -20
		{ "mid": Vector3(-25, -0.1, 0), "size": Vector3(10, 0.2, 40), "col": Color(0.5, 0.45, 0.35) },
		# B↔F: gap X=80 to 94
		{ "mid": Vector3(87, -0.1, 0), "size": Vector3(14, 0.2, 40), "col": Color(0.5, 0.45, 0.35) },
		# C↔G: gap X=-95 to -80
		{ "mid": Vector3(-87.5, -0.1, 0), "size": Vector3(15, 0.2, 40), "col": Color(0.5, 0.45, 0.35) },
		# A↔Sanctuary: X=20 to 20 (adyacente)
		{ "mid": Vector3(10, -0.1, 0), "size": Vector3(20, 0.2, 40), "col": Color(0.5, 0.45, 0.35) },
		# A↔D: gap Z=40 to 91 (52 units!)
		{ "mid": Vector3(0, -0.1, 65.5), "size": Vector3(30, 0.2, 51), "col": Color(0.5, 0.45, 0.35) },
		# A↔E: gap Z=-85 to -40
		{ "mid": Vector3(0, -0.1, -62.5), "size": Vector3(40, 0.2, 45), "col": Color(0.5, 0.45, 0.35) },
		# D↔B: Z=100 to Z=0, X=27.5 to 30 (gap at corner)
		{ "mid": Vector3(42.5, -0.1, 50), "size": Vector3(25, 0.2, 100), "col": Color(0.5, 0.4, 0.35) },
		# D↔H: gap Z=109 to 194
		{ "mid": Vector3(0, -0.1, 151.5), "size": Vector3(30, 0.2, 85), "col": Color(0.5, 0.45, 0.35) },
		# E↔I: gap Z=-115 to -194
		{ "mid": Vector3(0, -0.1, -154.5), "size": Vector3(40, 0.2, 80), "col": Color(0.5, 0.45, 0.35) },
		# F↔H: gap X=106 to 0, Z=0 to 194
		{ "mid": Vector3(53, -0.1, 97), "size": Vector3(106, 0.2, 194), "col": Color(0.5, 0.4, 0.35) },
		# G↔H: gap X=-106 to 0, Z=0 to 194
		{ "mid": Vector3(-53, -0.1, 97), "size": Vector3(106, 0.2, 194), "col": Color(0.5, 0.4, 0.35) },
	]

	for b: Dictionary in bridges:
		_add_bridge(world, b["mid"], b["size"], b["col"])


static func _add_bridge(world: Node3D, mid: Vector3, size: Vector3, col: Color) -> void:
	var body := StaticBody3D.new()
	body.name = "BridgeRepair_" + str(mid.x) + "_" + str(mid.z)
	body.add_to_group("safe_ground")
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = size
	shape.shape = box
	body.add_child(shape)
	body.position = mid
	world.add_child(body)

	var mesh := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = size
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = 0.8
	box_mesh.surface_set_material(0, mat)
	mesh.mesh = box_mesh
	mesh.position = mid
	world.add_child(mesh)

	# Barrera visual decorativa a los lados del puente (opcional)
	var fence_mat := StandardMaterial3D.new()
	fence_mat.albedo_color = Color(0.4, 0.25, 0.15)
	fence_mat.roughness = 0.7
	var fw: float = size.x
	var fd: float = size.z
	var fh: float = 0.4
	for side_z in [-1, 1]:
		var fence_mesh := MeshInstance3D.new()
		var fence_box := BoxMesh.new()
		fence_box.size = Vector3(fw, fh, 0.08)
		fence_mesh.mesh = fence_box
		fence_mesh.material_override = fence_mat
		fence_mesh.position = mid + Vector3(0, fh * 0.5, side_z * fd * 0.45)
		world.add_child(fence_mesh)


static func _add_all_edge_barriers(world: Node3D) -> void:
	"""Barreras visuales + físicas en bordes exteriores del mundo."""
	# Limitar extensión total del mundo a ~230 unidades en X y ~230 en Z
	var barriers := [
		# Borde norte (Z negativo)
		{ "mid": Vector3(0, 0.3, -215), "size": Vector3(250, 1.0, 2), "col": Color(0.25, 0.3, 0.35) },
		# Borde sur (Z positivo)
		{ "mid": Vector3(0, 0.3, 215), "size": Vector3(250, 1.0, 2), "col": Color(0.25, 0.3, 0.35) },
		# Borde oeste (X negativo)
		{ "mid": Vector3(-115, 0.3, 0), "size": Vector3(2, 1.0, 450), "col": Color(0.25, 0.3, 0.35) },
		# Borde este (X positivo)
		{ "mid": Vector3(115, 0.3, 0), "size": Vector3(2, 1.0, 450), "col": Color(0.25, 0.3, 0.35) },
	]

	for b: Dictionary in barriers:
		var body := StaticBody3D.new()
		body.name = "WorldEdgeBarrier"
		body.collision_layer = 1
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = b["size"]
		shape.shape = box
		body.add_child(shape)
		body.position = b["mid"]
		world.add_child(body)

		var mesh := MeshInstance3D.new()
		var box_mesh := BoxMesh.new()
		box_mesh.size = b["size"]
		var mat := StandardMaterial3D.new()
		mat.albedo_color = b["col"]
		mat.roughness = 0.8
		box_mesh.surface_set_material(0, mat)
		mesh.mesh = box_mesh
		mesh.position = b["mid"]
		world.add_child(mesh)


static func _add_kill_zones(world: Node3D) -> void:
	"""KillZones debajo de cada zona para detectar caídas."""
	for zone_name: String in _zone_data:
		var data: Dictionary = _zone_data[zone_name]
		var origin: Vector3 = data["origin"]
		var gsize: Vector3 = data["ground_size"]

		var kill_zone := Area3D.new()
		kill_zone.name = "KillZone_" + zone_name
		kill_zone.collision_layer = 0
		kill_zone.collision_mask = 1  # detecta al jugador

		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		# KillZone ~20 unidades debajo de la zona, cubriendo toda el área
		box.size = Vector3(gsize.x * 1.5, 0.5, gsize.z * 1.5)
		shape.shape = box
		kill_zone.add_child(shape)
		kill_zone.position = origin + Vector3(0, -20, 0)

		world.add_child(kill_zone)
