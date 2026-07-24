class_name HouseBuilder
extends Node
## Massive furniture catalog for the Golden Kitten's sanctuary.
##
## Contains 50 absurd yet functional furniture items based on Chilean
## native flora, fauna, and culture. Items are purchased with coins
## from the ProgressionManager singleton and spawned as CSG placeholder
## meshes inside the 3D sanctuary space.
##
## Usage:
##   var hb := HouseBuilder.new()
##   hb.sanctuary_root = $Sanctuary/FurnitureRoot
##   add_child(hb)
##   hb.buy_and_place("Cama Hoja de Nalca", Vector3(2, 0, 0))

signal furniture_placed(item_name: String, cost: int, position: Vector3)
signal purchase_failed(item_name: String, reason: String)

## The Node3D under which spawned furniture CSG nodes are added.
var sanctuary_root: Node3D = null

## Grid spacing for auto-arranged furniture (used by arrange_catalog_grid).
var grid_step: float = 2.5

## ──────────────────────────────────────────────────────────────────
## The colossal 50‑item furniture database — Chilean nature & culture
## ──────────────────────────────────────────────────────────────────
const FURNITURE_DB: Array[Dictionary] = [
	# ── Fauna (1‑15) ──
	{"name": "Puerta Pico de Pelícano", "cost": 40, "desc": "Un pico gigante que se abre hacia arriba para entrar.", "color": Color(0.9, 0.8, 0.1)},
	{"name": "Ventanas Ojos de Sapo", "cost": 30, "desc": "Ojos saltones de Sapo de Darwin que parpadean.", "color": Color(0.2, 0.8, 0.2)},
	{"name": "Sillón Coipo Regordete", "cost": 45, "desc": "Un sofá blando con forma de coipo durmiendo.", "color": Color(0.5, 0.3, 0.1)},
	{"name": "Mesa Caparazón de Jaiba", "cost": 35, "desc": "Mesa de comedor hecha de una jaiba gigante.", "color": Color(0.8, 0.1, 0.1)},
	{"name": "Alfombra Lenguado", "cost": 20, "desc": "Un pez plano con ojos saltones mirando al techo.", "color": Color(0.7, 0.6, 0.4)},
	{"name": "Silla Pingüino", "cost": 25, "desc": "Te abraza con sus aletas al sentarte.", "color": Color(0.1, 0.1, 0.1)},
	{"name": "Perchero Cuernos de Huemul", "cost": 30, "desc": "Astas gigantes para colgar tus cosas.", "color": Color(0.6, 0.4, 0.2)},
	{"name": "Lámpara Cóndor Planeando", "cost": 50, "desc": "Un cóndor en el techo que ilumina con sus ojos.", "color": Color(0.2, 0.2, 0.2)},
	{"name": "Cama Nido de Queltehue", "cost": 55, "desc": "Un nido gigante en el suelo con huevos cojines.", "color": Color(0.4, 0.4, 0.3)},
	{"name": "Estufa Zorro Culpeo", "cost": 60, "desc": "Un zorro enroscado que irradia calor y fuego.", "color": Color(0.8, 0.4, 0.1)},
	{"name": "Reloj Pájaro Carpintero", "cost": 25, "desc": "Pica la madera cada vez que marca la hora.", "color": Color(0.9, 0.1, 0.1)},
	{"name": "Basurero Boca de Chungungo", "cost": 15, "desc": "Una nutria hambrienta que se traga la basura.", "color": Color(0.4, 0.3, 0.3)},
	{"name": "Sofá Pudú Tímido", "cost": 45, "desc": "Un sillón pequeño con patitas muy cortas.", "color": Color(0.6, 0.3, 0.1)},
	{"name": "Ducha Chorro de Ballena", "cost": 70, "desc": "Una ballena azul en el techo que te baña al respirar.", "color": Color(0.1, 0.4, 0.8)},
	{"name": "Inodoro Pico de Loro", "cost": 40, "desc": "Hace ruido de loro tricahue al tirar la cadena.", "color": Color(0.1, 0.7, 0.3)},

	# ── Flora (16‑30) ──
	{"name": "Cama Hoja de Nalca", "cost": 50, "desc": "Hoja verde gigante y curva para dormir como taco.", "color": Color(0.1, 0.6, 0.1)},
	{"name": "Rascador Tronco de Araucaria", "cost": 60, "desc": "Un pino gigante con ramas pinchudas de tela.", "color": Color(0.2, 0.4, 0.1)},
	{"name": "Lámpara Flor de Añañuca", "cost": 25, "desc": "Tallo largo con una flor roja brillante al final.", "color": Color(0.9, 0.1, 0.2)},
	{"name": "Sillón Copihue", "cost": 40, "desc": "Te sientas dentro de la campana roja de la flor.", "color": Color(0.8, 0.1, 0.2)},
	{"name": "Mesa Tronco de Alerce", "cost": 45, "desc": "Un corte de madera con anillos de miles de años.", "color": Color(0.5, 0.2, 0.1)},
	{"name": "Silla Cactus Copiapoa", "cost": 30, "desc": "Parece que pincha, pero es puro peluche suave.", "color": Color(0.4, 0.7, 0.3)},
	{"name": "Toldo Palma Chilena", "cost": 55, "desc": "Una gran palmera que da sombra a la casa.", "color": Color(0.6, 0.8, 0.2)},
	{"name": "Cortinas Enredadera", "cost": 20, "desc": "Hojas de llantén cayendo por las ventanas.", "color": Color(0.2, 0.5, 0.2)},
	{"name": "Alfombra Musgo Valdiviano", "cost": 25, "desc": "Súper acolchada, parece pasto húmedo brillante.", "color": Color(0.1, 0.5, 0.1)},
	{"name": "Cuna Cáscara de Piñón", "cost": 35, "desc": "Medio piñón gigante que se balancea.", "color": Color(0.7, 0.3, 0.1)},
	{"name": "Lámpara Fruto del Maqui", "cost": 20, "desc": "Bolitas moradas que flotan y dan luz oscura.", "color": Color(0.3, 0.1, 0.4)},
	{"name": "Taburete Hongo Digüeñe", "cost": 15, "desc": "Un hongo naranja y blanco rebotador.", "color": Color(0.9, 0.6, 0.2)},
	{"name": "Cama Elástica Cochayuyo", "cost": 50, "desc": "Algas marinas entrelazadas que te hacen saltar.", "color": Color(0.3, 0.4, 0.2)},
	{"name": "Repisa Ramas de Boldo", "cost": 20, "desc": "Ramas aromáticas pegadas a la pared.", "color": Color(0.4, 0.5, 0.2)},
	{"name": "Mesa de luz Calafate", "cost": 15, "desc": "Un arbusto pequeño morado y mágico.", "color": Color(0.2, 0.1, 0.3)},

	# ── Comida Típica (31‑40) ──
	{"name": "Sofá Marraqueta", "cost": 45, "desc": "Dividido en 4 partes ultra crujientes y cómodas.", "color": Color(0.9, 0.7, 0.4)},
	{"name": "Cama Empanada de Pino", "cost": 50, "desc": "Entras y te tapas con la masa horneada gigante.", "color": Color(0.8, 0.6, 0.2)},
	{"name": "Tina Vaso de Mote con Huesillo", "cost": 65, "desc": "Nadas en jugo dulce con un huesillo gigante.", "color": Color(0.8, 0.5, 0.1)},
	{"name": "Cojín Sopaipilla Pasá", "cost": 15, "desc": "Calientito y de color naranja chancaca.", "color": Color(0.9, 0.5, 0.1)},
	{"name": "Piscina Paila Marina", "cost": 80, "desc": "Llena de choros y almejas de felpa flotantes.", "color": Color(0.4, 0.4, 0.4)},
	{"name": "Sillón Humita en Chala", "cost": 40, "desc": "Amarrado al medio, te hundes en el maíz.", "color": Color(0.8, 0.9, 0.3)},
	{"name": "Mesa Completo Italiano", "cost": 35, "desc": "Mesa alargada de palta, tomate y mayonesa.", "color": Color(0.2, 0.8, 0.2)},
	{"name": "Lámpara Helado de Centella", "cost": 20, "desc": "Alumbra de verde, amarillo y rojo en el techo.", "color": Color(0.1, 0.9, 0.1)},
	{"name": "Baúl Lata de Manjar", "cost": 30, "desc": "Para guardar cosas dulces y pegajosas.", "color": Color(0.6, 0.3, 0.1)},
	{"name": "Cama Chumbeque", "cost": 45, "desc": "Bloques dulces apilados súper suaves.", "color": Color(0.9, 0.8, 0.2)},

	# ── Objetos y Cultura Chilena (41‑50) ──
	{"name": "Silla Trompo", "cost": 30, "desc": "Una silla inestable que gira de verdad al sentarse.", "color": Color(0.7, 0.1, 0.1)},
	{"name": "Lámpara Volantín Elevado", "cost": 25, "desc": "Un volantín atascado en el techo que da luz.", "color": Color(0.9, 0.9, 0.9)},
	{"name": "Mesa Moai Acostado", "cost": 50, "desc": "Estatua de piedra gigante acostada de espaldas.", "color": Color(0.5, 0.5, 0.5)},
	{"name": "Macetero Greda de Pomaire", "cost": 15, "desc": "Un chanchito de greda gigante para plantas.", "color": Color(0.6, 0.3, 0.2)},
	{"name": "Cuna Chupalla Huasa", "cost": 35, "desc": "Un sombrero de paja gigante dado vuelta.", "color": Color(0.8, 0.8, 0.5)},
	{"name": "Tambor Kultrún", "cost": 40, "desc": "Una mesa redonda ceremonial que hace eco.", "color": Color(0.5, 0.3, 0.1)},
	{"name": "Silla Indio Pícaro", "cost": 55, "desc": "Te eleva por los aires con una sonrisa pícara.", "color": Color(0.7, 0.4, 0.2)},
	{"name": "Espejo Trarilonco", "cost": 30, "desc": "Espejo redondo adornado con monedas de plata.", "color": Color(0.8, 0.8, 0.8)},
	{"name": "Hamaca Cinta de Cueca", "cost": 25, "desc": "Una cinta tricolor colgando de dos pilares.", "color": Color(0.9, 0.1, 0.1)},
	{"name": "Clóset Ascensor de Valparaíso", "cost": 75, "desc": "Abre sus puertas coloridas crujiendo como fierro.", "color": Color(0.8, 0.2, 0.2)}
]


## ──────────────────────────────────────────────────────────────────
#  Public helpers
## ──────────────────────────────────────────────────────────────────

## Returns the number of furniture items in the database.
func get_item_count() -> int:
	return FURNITURE_DB.size()


## Returns a Dictionary from the FURNITURE_DB by exact name, or null.
func find_item(item_name: String) -> Dictionary:
	for entry: Dictionary in FURNITURE_DB:
		if entry["name"] == item_name:
			return entry
	return {}


## Returns an array of all item names.
func get_all_item_names() -> PackedStringArray:
	var names: PackedStringArray = []
	for entry: Dictionary in FURNITURE_DB:
		names.append(entry["name"])
	return names


## Returns an array of items whose name contains |query| (case-insensitive).
func search_items(query: String) -> Array[Dictionary]:
	var q: String = query.to_lower()
	var results: Array[Dictionary] = []
	for entry: Dictionary in FURNITURE_DB:
		if q in entry["name"].to_lower():
			results.append(entry)
	return results


## ──────────────────────────────────────────────────────────────────
#  Purchase & placement
## ──────────────────────────────────────────────────────────────────

## Attempts to buy the item named |item_name| and place it at |position|.
##
## Returns true on success, false if the item doesn't exist or coins are
## insufficient.  Emits furniture_placed or purchase_failed.
func buy_and_place(item_name: String, position: Vector3) -> bool:
	var entry: Dictionary = find_item(item_name)
	if entry.is_empty():
		var msg: String = "Item desconocido: " + item_name
		push_warning("HouseBuilder: ", msg)
		purchase_failed.emit(item_name, msg)
		return false

	if not _deduct_coins(entry["cost"]):
		var msg: String = "Monedas insuficientes para " + item_name + " ($" + str(entry["cost"]) + ")"
		push_warning("HouseBuilder: ", msg)
		purchase_failed.emit(item_name, msg)
		return false

	_place_item(entry, position)
	furniture_placed.emit(item_name, entry["cost"], position)
	return true


## Purchases every item in FURNITURE_DB sequentially in a grid layout
## under |sanctuary_root|.  Useful for testing or for showing the full
## catalog inside a showroom.
func arrange_catalog_grid(grid_columns: int = 10) -> void:
	if sanctuary_root == null:
		push_error("HouseBuilder: sanctuary_root is null — cannot arrange catalog")
		return

	var spacing: float = grid_step
	var idx: int = 0

	for entry: Dictionary in FURNITURE_DB:
		var col: int = idx % grid_columns
		var row: int = int(float(idx) / float(grid_columns))
		var pos: Vector3 = Vector3(col * spacing, 0.0, row * spacing)

		if not _deduct_coins(entry["cost"]):
			push_warning("HouseBuilder: ran out of coins at item %d (%s)" % [idx, entry["name"]])
			break

		_place_item(entry, pos)
		furniture_placed.emit(entry["name"], entry["cost"], pos)
		idx += 1


## ──────────────────────────────────────────────────────────────────
#  Internal helpers
## ──────────────────────────────────────────────────────────────────

## Tries to deduct coins via the ProgressionManager singleton.
## Returns true if the deduction succeeded or if no ProgressionManager
## exists (for testing/development without the autoload).
func _deduct_coins(amount: int) -> bool:
	var pm: Node = _get_progression_manager()
	if pm == null:
		# No ProgressionManager — allow free placement in dev mode
		return true

	if pm.has_method("spend_coins"):
		return pm.spend_coins(amount)

	if pm.has_method("deduct_coins"):
		return pm.deduct_coins(amount)

	if pm.has_method("remove_coins"):
		return pm.remove_coins(amount)

	# Try direct property
	if "coins" in pm:
		if pm.coins >= amount:
			pm.coins -= amount
			return true
		return false

	push_warning("HouseBuilder: ProgressionManager has no spend/deduct method")
	return true


## Returns the ProgressionManager autoload singleton, or null.
func _get_progression_manager():
	return get_node_or_null("/root/ProgressionManager")


## Builds a CSG‑based placeholder mesh for the given furniture entry
## and adds it as a child of sanctuary_root at the target position.
func _place_item(entry: Dictionary, position: Vector3) -> void:
	if sanctuary_root == null:
		push_error("HouseBuilder: sanctuary_root is null — cannot place item")
		return

	var name_str: String = entry["name"]
	var col: Color = entry["color"]
	var desc: String = entry.get("desc", "")
	var cost: int = entry.get("cost", 0)

	# Create a container Node3D to hold the CSG shapes
	var container := Node3D.new()
	container.name = name_str
	container.position = position

	# Build distinguishable CSG shapes per item category based on the name.
	# Each branch produces a unique shape combination so furniture looks
	# visually distinct in the sanctuary.
	var mat: StandardMaterial3D = _make_mat(col)
	var accent_mat: StandardMaterial3D = _make_mat(Color(col.r * 0.6, col.g * 0.6, col.b * 0.6))

	if "Cama" in name_str or "Cuna" in name_str or "Sofá" in name_str or "Sillón" in name_str:
		# ——— Seating / bedding ———
		# Seat / bed base (box)
		_build_csg_box(container, "Base", Vector3(2.0, 0.3, 1.5), mat, Vector3.ZERO)
		# Backrest / headboard
		_build_csg_box(container, "Backrest", Vector3(2.0, 1.0, 0.2), accent_mat, Vector3(0.0, 0.5, -0.65))

	elif "Mesa" in name_str and "Acostado" not in name_str and "luz" not in name_str:
		# ——— Table ———
		# Top
		_build_csg_box(container, "Top", Vector3(2.5, 0.15, 1.5), mat, Vector3(0.0, 0.9, 0.0))
		# Legs
		_build_csg_cylinder(container, "LegFL", 0.08, 0.9, accent_mat, Vector3(-1.1, 0.45, -0.6))
		_build_csg_cylinder(container, "LegFR", 0.08, 0.9, accent_mat, Vector3(1.1, 0.45, -0.6))
		_build_csg_cylinder(container, "LegBL", 0.08, 0.9, accent_mat, Vector3(-1.1, 0.45, 0.6))
		_build_csg_cylinder(container, "LegBR", 0.08, 0.9, accent_mat, Vector3(1.1, 0.45, 0.6))

	elif "Silla" in name_str or "Sillón" in name_str or "Taburete" in name_str:
		# ——— Chair / stool ———
		_build_csg_box(container, "Seat", Vector3(0.8, 0.15, 0.8), mat, Vector3(0.0, 0.65, 0.0))
		_build_csg_cylinder(container, "Leg1", 0.06, 0.55, accent_mat, Vector3(-0.3, 0.3, -0.3))
		_build_csg_cylinder(container, "Leg2", 0.06, 0.55, accent_mat, Vector3(0.3, 0.3, -0.3))
		_build_csg_cylinder(container, "Leg3", 0.06, 0.55, accent_mat, Vector3(-0.3, 0.3, 0.3))
		_build_csg_cylinder(container, "Leg4", 0.06, 0.55, accent_mat, Vector3(0.3, 0.3, 0.3))

	elif "Lámpara" in name_str or "Luz" in name_str or "Helado" in name_str:
		# ——— Lamp / light ———
		_build_csg_cylinder(container, "Pole", 0.05, 2.2, accent_mat, Vector3(0.0, 1.1, 0.0))
		_build_csg_sphere(container, "Glow", 0.35, mat, Vector3(0.0, 2.4, 0.0))
		# Emissive glow
		var glow: StandardMaterial3D = StandardMaterial3D.new()
		glow.albedo_color = col
		glow.emission_enabled = true
		glow.emission = col
		glow.emission_energy_multiplier = 1.5
		_build_csg_sphere(container, "Light", 0.25, glow, Vector3(0.0, 2.4, 0.0))

	elif "Alfombra" in name_str:
		# ——— Rug / carpet ———
		_build_csg_box(container, "Rug", Vector3(3.0, 0.05, 2.0), mat, Vector3(0.0, 0.025, 0.0))

	elif "Puerta" in name_str:
		# ——— Door ———
		_build_csg_box(container, "Frame", Vector3(2.5, 0.1, 3.0), accent_mat, Vector3(0.0, 1.5, 0.0))
		_build_csg_box(container, "Leaf", Vector3(2.2, 2.6, 0.08), mat, Vector3(0.0, 1.4, 0.5))

	elif "Ventana" in name_str:
		# ——— Window ———
		_build_csg_box(container, "Frame", Vector3(2.0, 0.08, 1.8), accent_mat, Vector3(0.0, 1.2, 0.0))
		_build_csg_box(container, "Glass", Vector3(1.8, 1.6, 0.04), mat, Vector3(0.0, 1.2, 0.0))

	elif "Perchero" in name_str:
		# ——— Coat rack ———
		_build_csg_cylinder(container, "Pole", 0.06, 2.0, accent_mat, Vector3(0.0, 1.0, 0.0))
		_build_csg_box(container, "ArmL", Vector3(0.4, 0.04, 0.04), mat, Vector3(-0.25, 1.5, 0.0))
		_build_csg_box(container, "ArmR", Vector3(0.4, 0.04, 0.04), mat, Vector3(0.25, 1.5, 0.0))

	elif "Estufa" in name_str or "Ducha" in name_str or "Chorro" in name_str:
		# ——— Appliance (stove/shower) ———
		_build_csg_cylinder(container, "Body", 0.7, 1.8, mat, Vector3(0.0, 0.9, 0.0))
		_build_csg_sphere(container, "Top", 0.5, accent_mat, Vector3(0.0, 1.9, 0.0))

	elif "Basurero" in name_str or "Baúl" in name_str:
		# ——— Container / bin ———
		_build_csg_cylinder(container, "Body", 0.6, 0.9, mat, Vector3(0.0, 0.45, 0.0))
		_build_csg_cylinder(container, "Lid", 0.55, 0.1, accent_mat, Vector3(0.0, 0.95, 0.0))

	elif "Reloj" in name_str:
		# ——— Clock ———
		_build_csg_sphere(container, "Face", 0.4, mat, Vector3(0.0, 1.2, 0.0))
		# Hour markers (small spheres)
		for i in 12:
			var angle: float = deg_to_rad(i * 30.0)
			_build_csg_sphere(container, "Marker" + str(i), 0.04, accent_mat,
				Vector3(sin(angle) * 0.32, 1.2 + cos(angle) * 0.32, 0.0))

	elif "Inodoro" in name_str:
		# ——— Toilet ———
		_build_csg_box(container, "Bowl", Vector3(0.7, 0.25, 0.5), mat, Vector3(0.0, 0.125, 0.0))
		_build_csg_cylinder(container, "Tank", 0.3, 0.7, accent_mat, Vector3(0.0, 0.6, -0.45))

	elif "Toldo" in name_str or "Palma" in name_str:
		# ——— Canopy / palm ———
		_build_csg_cylinder(container, "Trunk", 0.1, 2.5, accent_mat, Vector3(0.0, 1.25, 0.0))
		_build_csg_sphere(container, "Fronds", 1.0, mat, Vector3(0.0, 2.8, 0.0))

	elif "Cortinas" in name_str or "Enredadera" in name_str:
		# ——— Curtains ———
		_build_csg_box(container, "Left", Vector3(0.05, 1.8, 1.5), mat, Vector3(-0.6, 0.9, 0.0))
		_build_csg_box(container, "Right", Vector3(0.05, 1.8, 1.5), mat, Vector3(0.6, 0.9, 0.0))
		_build_csg_box(container, "Rod", Vector3(1.5, 0.04, 0.04), accent_mat, Vector3(0.0, 1.8, 0.0))

	elif "Rascador" in name_str or "Araucaria" in name_str:
		# ——— Cat scratcher / tree ———
		_build_csg_cylinder(container, "Trunk", 0.15, 2.0, accent_mat, Vector3(0.0, 1.0, 0.0))
		_build_csg_sphere(container, "Spike1", 0.3, mat, Vector3(-0.3, 1.0, 0.0))
		_build_csg_sphere(container, "Spike2", 0.3, mat, Vector3(0.3, 1.0, 0.0))
		_build_csg_sphere(container, "Spike3", 0.3, mat, Vector3(0.0, 1.0, -0.3))
		_build_csg_sphere(container, "Spike4", 0.3, mat, Vector3(0.0, 1.0, 0.3))

	elif "Cactus" in name_str:
		# ——— Cactus ———
		_build_csg_cylinder(container, "Body", 0.25, 1.3, mat, Vector3(0.0, 0.65, 0.0))

	elif "Hongo" in name_str:
		# ——— Mushroom ———
		_build_csg_cylinder(container, "Stem", 0.08, 0.5, _make_mat(Color.WHITE), Vector3(0.0, 0.25, 0.0))
		_build_csg_sphere(container, "Cap", 0.3, mat, Vector3(0.0, 0.65, 0.0))
		# Dots
		var white_mat: StandardMaterial3D = _make_mat(Color.WHITE)
		_build_csg_sphere(container, "Dot1", 0.04, white_mat, Vector3(-0.1, 0.7, 0.1))
		_build_csg_sphere(container, "Dot2", 0.04, white_mat, Vector3(0.1, 0.75, -0.08))

	elif "Repisa" in name_str:
		# ——— Shelf ———
		_build_csg_box(container, "Shelf", Vector3(1.8, 0.08, 0.35), mat, Vector3(0.0, 0.8, 0.0))

	elif "Macetero" in name_str or "Greda" in name_str:
		# ——— Flower pot ———
		_build_csg_cylinder(container, "Pot", 0.5, 0.6, mat, Vector3(0.0, 0.3, 0.0), 0.35)
		_build_csg_cylinder(container, "Soil", 0.45, 0.08, accent_mat, Vector3(0.0, 0.64, 0.0))
		var leaf_mat: StandardMaterial3D = _make_mat(Color(0.2, 0.7, 0.3))
		_build_csg_sphere(container, "Leaf1", 0.12, leaf_mat, Vector3(-0.1, 0.7, 0.0))
		_build_csg_sphere(container, "Leaf2", 0.12, leaf_mat, Vector3(0.1, 0.7, 0.0))

	elif "Moai" in name_str:
		# ——— Moai ———
		_build_csg_box(container, "Body", Vector3(1.0, 1.6, 0.8), mat, Vector3(0.0, 0.8, 0.0))
		_build_csg_box(container, "Head", Vector3(0.7, 0.6, 0.6), accent_mat, Vector3(0.0, 1.8, 0.0))

	elif "Chupalla" in name_str:
		# ——— Straw hat ———
		_build_csg_cylinder(container, "Brim", 1.2, 0.08, mat, Vector3(0.0, 0.04, 0.0))
		_build_csg_cylinder(container, "Crown", 0.45, 0.35, accent_mat, Vector3(0.0, 0.25, 0.0))

	elif "Tambor" in name_str or "Kultrún" in name_str:
		# ——— Drum ———
		_build_csg_cylinder(container, "Drum", 0.7, 0.35, mat, Vector3(0.0, 0.175, 0.0))

	elif "Espejo" in name_str or "Trarilonco" in name_str:
		# ——— Mirror ———
		_build_csg_box(container, "Frame", Vector3(0.8, 0.06, 0.8), accent_mat, Vector3(0.0, 1.0, 0.0))
		_build_csg_box(container, "Mirror", Vector3(0.72, 0.04, 0.72), mat, Vector3(0.0, 1.0, 0.01))

	elif "Hamaca" in name_str:
		# ——— Hammock ———
		_build_csg_cylinder(container, "PostL", 0.06, 2.5, accent_mat, Vector3(-1.5, 1.25, 0.0))
		_build_csg_cylinder(container, "PostR", 0.06, 2.5, accent_mat, Vector3(1.5, 1.25, 0.0))
		_build_csg_box(container, "Cloth", Vector3(2.8, 0.02, 0.8), mat, Vector3(0.0, 1.0, 0.0))

	elif "Clóset" in name_str or "Ascensor" in name_str:
		# ——— Closet ———
		_build_csg_box(container, "Body", Vector3(2.0, 2.5, 0.8), mat, Vector3(0.0, 1.25, 0.0))
		_build_csg_box(container, "DoorL", Vector3(0.95, 2.3, 0.04), accent_mat, Vector3(-0.48, 1.25, 0.38))
		_build_csg_box(container, "DoorR", Vector3(0.95, 2.3, 0.04), accent_mat, Vector3(0.48, 1.25, 0.38))

	elif "Tina" in name_str or "Vaso" in name_str or "Piscina" in name_str:
		# ——— Tub / pool ———
		_build_csg_cylinder(container, "Tub", 1.2, 0.6, mat, Vector3(0.0, 0.3, 0.0))
		# Water surface
		var water: StandardMaterial3D = StandardMaterial3D.new()
		water.albedo_color = Color(0.3, 0.6, 0.9, 0.7)
		water.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_build_csg_cylinder(container, "Water", 1.1, 0.05, water, Vector3(0.0, 0.6, 0.0))

	elif "Trompo" in name_str:
		# ——— Trompo (spinning top) ———
		_build_csg_cylinder(container, "Body", 0.4, 0.9, mat, Vector3(0.0, 0.45, 0.0), 0.05)
		_build_csg_sphere(container, "Knob", 0.08, accent_mat, Vector3(0.0, 0.9, 0.0))

	elif "Volantín" in name_str:
		# ——— Kite ———
		_build_csg_box(container, "Kite", Vector3(0.8, 0.02, 0.7), mat, Vector3(0.0, 1.2, 0.0))
		var tail_mat: StandardMaterial3D = _make_mat(Color(0.9, 0.1, 0.1))
		_build_csg_cylinder(container, "Tail", 0.01, 0.8, tail_mat, Vector3(0.0, 0.7, 0.0))

	elif "Indio" in name_str:
		# ——— "Indio Pícaro" magical lift ———
		_build_csg_cylinder(container, "Base", 0.6, 0.15, accent_mat, Vector3(0.0, 0.075, 0.0))
		_build_csg_sphere(container, "Seat", 0.5, mat, Vector3(0.0, 0.6, 0.0))

	else:
		# ——— Fallback: simple colored box + label ———
		_build_csg_box(container, "Box", Vector3(1.0, 0.5, 1.0), mat, Vector3(0.0, 0.25, 0.0))

	# Label hovering above the item
	var label := Label3D.new()
	label.name = "ItemLabel"
	label.text = name_str + "\n$" + str(cost)
	label.position = Vector3(0.0, 2.5, 0.0)
	label.font_size = 18
	label.outline_size = 3
	label.outline_modulate = Color.BLACK
	label.modulate = Color.WHITE
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.005
	label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	container.add_child(label)

	# Tooltip data
	container.set_meta("description", desc)
	container.set_meta("cost", cost)
	container.set_meta("color", col)

	sanctuary_root.add_child(container)


# ════════════════════════════════════════════════════════════════════
# Low-level CSG helpers
# ════════════════════════════════════════════════════════════════════

static func _build_csg_box(parent: Node, name_str: String, size: Vector3,
		material: Material, position: Vector3) -> CSGBox3D:
	var box := CSGBox3D.new()
	box.name = name_str
	box.size = size
	box.material = material
	box.position = position
	parent.add_child(box)
	return box


static func _build_csg_sphere(parent: Node, name_str: String, radius: float,
		material: Material, position: Vector3) -> CSGSphere3D:
	var sphere := CSGSphere3D.new()
	sphere.name = name_str
	sphere.radius = radius
	sphere.material = material
	sphere.position = position
	parent.add_child(sphere)
	return sphere


static func _build_csg_cylinder(parent: Node, name_str: String, radius: float, height: float,
		material: Material, position: Vector3, top_radius: float = -1.0) -> CSGCylinder3D:
	var cyl := CSGCylinder3D.new()
	cyl.name = name_str
	cyl.radius = radius
	cyl.height = height
	if top_radius >= 0.0:
		cyl.top_radius = top_radius
	cyl.material = material
	cyl.position = position
	parent.add_child(cyl)
	return cyl


static func _make_mat(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.6
	m.metallic = 0.1
	return m
