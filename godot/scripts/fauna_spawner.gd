class_name FaunaSpawner
extends Node3D

## Data-driven spawner that creates 50 native Chilean collectible animals
## across the three zones of the open world at runtime.

const FAUNA_DB: Dictionary = {
	"ZoneA_Costa": [
		{"name":"Gaviota",  "syllables":"GA - VIO - TA",    "desc":"Ave marina costera"},
		{"name":"Pelícano", "syllables":"PE - LÍ - CA - NO", "desc":"Ave de gran pico"},
		{"name":"Jaiba",    "syllables":"JAI - BA",          "desc":"Crustáceo con tenazas"},
		{"name":"Chungungo","syllables":"CHUN - GUN - GO",   "desc":"Nutria de mar nativa"},
		{"name":"Pilpilén", "syllables":"PIL - PI - LÉN",    "desc":"Ave de pico rojo"},
		{"name":"Zarapito", "syllables":"ZA - RA - PI - TO", "desc":"Ave migratoria"},
		{"name":"Erizo",    "syllables":"E - RI - ZO",       "desc":"Equinodermo espinoso"},
		{"name":"Estrella", "syllables":"ES - TRE - LLA",    "desc":"Invertebrado de mar"},
		{"name":"Yeco",     "syllables":"YE - CO",           "desc":"Pato negro buceador"},
		{"name":"Pingüino", "syllables":"PIN - GÜI - NO",    "desc":"Ave marina nadadora"},
		{"name":"LoboMar",  "syllables":"LO - BO",           "desc":"Mamífero marino"},
		{"name":"Choro",    "syllables":"CHO - RO",          "desc":"Molusco bivalvo"},
		{"name":"Albatros", "syllables":"AL - BA - TROS",    "desc":"Ave oceánica gigante"},
		{"name":"Rayador",  "syllables":"RA - YA - DOR",     "desc":"Ave que roza el agua"},
		{"name":"Churrete", "syllables":"CHUR - RE - TE",    "desc":"Ave de rocas costeras"},
		{"name":"Piure",    "syllables":"PIU - RE",          "desc":"Filtrador de rocas"},
	],
	"ZoneB_Humedal": [
		{"name":"Coipo",          "syllables":"COI - PO",           "desc":"Gran roedor acuático"},
		{"name":"Sapo",           "syllables":"SA - PO",            "desc":"Anfibio terrestre"},
		{"name":"Rana",           "syllables":"RA - NA",            "desc":"Anfibio acuático chileno"},
		{"name":"Garza",          "syllables":"GAR - ZA",           "desc":"Ave zancuda blanca"},
		{"name":"Pato",           "syllables":"PA - TO",            "desc":"Ave nadadora"},
		{"name":"Cisne",          "syllables":"CIS - NE",           "desc":"Ave acuática de cuello negro"},
		{"name":"Tagua",          "syllables":"TA - GUA",           "desc":"Ave negra de laguna"},
		{"name":"Pidén",          "syllables":"PI - DÉN",           "desc":"Ave de totorales"},
		{"name":"Trile",          "syllables":"TRI - LE",           "desc":"Pájaro negro con amarillo"},
		{"name":"SieteColores",   "syllables":"SIE - TE",           "desc":"Pequeña ave multicolor"},
		{"name":"Trabajador",     "syllables":"TRA - BA - JA - DOR","desc":"Ave constructora"},
		{"name":"Libélula",       "syllables":"LI - BÉ - LU - LA",  "desc":"Insecto volador"},
		{"name":"Pejerrey",       "syllables":"PE - JE - RREY",     "desc":"Pez de agua dulce"},
		{"name":"Queltehue",      "syllables":"QUEL - TE - HUE",    "desc":"Ave guardiana del prado"},
		{"name":"Huairavo",       "syllables":"HUAI - RA - VO",     "desc":"Garza nocturna"},
		{"name":"MartinPescador", "syllables":"MAR - TÍN",          "desc":"Ave cazadora de peces"},
		{"name":"Bagre",          "syllables":"BA - GRE",           "desc":"Pez de fondo"},
	],
	"ZoneC_Estribaciones": [
		{"name":"Puma",      "syllables":"PU - MA",          "desc":"Gran felino andino"},
		{"name":"Zorro",     "syllables":"ZO - RRO",         "desc":"Cánido de los valles"},
		{"name":"Quique",    "syllables":"QUI - QUE",        "desc":"Mustélido cazador"},
		{"name":"Chingue",   "syllables":"CHIN - GUE",       "desc":"Mamífero rayado"},
		{"name":"Cururo",    "syllables":"CU - RU - RO",     "desc":"Roedor subterráneo"},
		{"name":"Degú",      "syllables":"DE - GÚ",          "desc":"Roedor endémico"},
		{"name":"Loica",     "syllables":"LOI - CA",         "desc":"Ave de pecho rojo"},
		{"name":"Diuca",     "syllables":"DIU - CA",         "desc":"Pajarito gris cantor"},
		{"name":"Tenca",     "syllables":"TEN - CA",         "desc":"Ave imitadora de cantos"},
		{"name":"Chercán",   "syllables":"CHER - CÁN",       "desc":"Ave pequeña y ruidosa"},
		{"name":"Turca",     "syllables":"TUR - CA",         "desc":"Ave corredora endémica"},
		{"name":"Cóndor",    "syllables":"CÓN - DOR",        "desc":"Ave voladora más grande"},
		{"name":"Águila",    "syllables":"Á - GUI - LA",     "desc":"Ave rapaz chilena"},
		{"name":"Peuco",     "syllables":"PEU - CO",         "desc":"Cazador de los bosques"},
		{"name":"Tiuque",    "syllables":"TIU - QUE",        "desc":"Ave rapaz común"},
		{"name":"Lagartija", "syllables":"LA - GAR - TI - JA","desc":"Reptil esbelto"},
		{"name":"Culebra",   "syllables":"CU - LE - BRA",    "desc":"Reptil de cola larga"},
	],
}

## Cultural items database — inanimate Chilean heritage objects
const CULTURAL_DB: Array[Dictionary] = [
	{"name":"Empanada",  "syllables":"EM - PA - NA - DA",    "desc":"Masa horneada con pino"},
	{"name":"Volantín",  "syllables":"VO - LAN - TÍN",        "desc":"Cometa de papel tradicional"},
	{"name":"Trompo",    "syllables":"TROM - PO",             "desc":"Juguete de madera que gira"},
	{"name":"Copihue",   "syllables":"CO - PI - HUE",         "desc":"Flor nacional de Chile"},
	{"name":"Kultrún",   "syllables":"KUL - TRÚN",            "desc":"Tambor ceremonial Mapuche"},
	{"name":"Chupalla",  "syllables":"CHU - PA - LLA",        "desc":"Sombrero de paja huaso"},
	{"name":"Mote",      "syllables":"MO - TE",               "desc":"Grano de trigo cocido"},
	{"name":"Espuelas",  "syllables":"ES - PUE - LAS",        "desc":"Ruedas metálicas para botas"},
	{"name":"Moai",      "syllables":"MO - AI",               "desc":"Estatua de piedra Rapa Nui"},
	{"name":"Greda",     "syllables":"GRE - DA",              "desc":"Vasija de arcilla de Pomaire"},
	{"name":"Trarilonco","syllables":"TRA - RI - LON - CO",   "desc":"Cinta plateada para la cabeza"},
	{"name":"Chompa",    "syllables":"CHOM - PA",             "desc":"Chaleco de lana chilote"},
	{"name":"Marrqueta", "syllables":"MA - RRA - QUE - TA",   "desc":"Pan tradicional batido"},
	{"name":"Chicha",    "syllables":"CHI - CHA",             "desc":"Bebida dulce de uva o manzana"},
	{"name":"Rayuela",   "syllables":"RA - YUE - LA",         "desc":"Juego de puntería con tejos"},
]

## Combined world bounds (all 9 zones)
const ALL_WORLD_BOUNDS: Dictionary = {
	"x_min":-100, "x_max":100, "z_min":-200, "z_max":200,
}

## Spawn bounding boxes in world coordinates
const ZONE_BOUNDS: Dictionary = {
	"ZoneA_Costa":        {"x_min":-22, "x_max":22,  "z_min":-20, "z_max":20},
	"ZoneB_Humedal":      {"x_min":33,  "x_max":77,  "z_min":-20, "z_max":20},
	"ZoneC_Estribaciones": {"x_min":-77, "x_max":-33, "z_min":-20, "z_max":20},
}

## Color palette by animal category
const COLOR_BIRD:   Color = Color(0.60, 0.35, 0.25)    # warm brown
const COLOR_AQUATIC:Color = Color(0.25, 0.45, 0.55)    # teal blue
const COLOR_MAMMAL:  Color = Color(0.50, 0.35, 0.20)   # earth brown
const COLOR_REPTILE: Color = Color(0.35, 0.50, 0.30)   # olive green
const COLOR_INSECT:  Color = Color(0.70, 0.55, 0.15)   # golden amber
const COLOR_OTHER:   Color = Color(0.65, 0.30, 0.40)   # maroon purple
const COLOR_CULTURAL: Color = Color(0.75, 0.45, 0.15) # warm terracotta


func _ready() -> void:
	var total_spawned: int = 0

	# Spawn animals per zone
	for zone_key: String in FAUNA_DB:
		var animals: Array = FAUNA_DB[zone_key]
		var bounds: Dictionary = ZONE_BOUNDS[zone_key]
		for data: Dictionary in animals:
			_spawn_animal(data, bounds)
			total_spawned += 1

	# Spawn cultural items randomly across the whole world
	var world_bounds: Dictionary = ALL_WORLD_BOUNDS
	for data: Dictionary in CULTURAL_DB:
		_spawn_cultural(data, world_bounds)
		total_spawned += 1

	print("FaunaSpawner: spawned ", total_spawned, " collectibles (animals + cultural)")


func _spawn_animal(data: Dictionary, bounds: Dictionary) -> void:
	var animal := CollectibleAnimal.new()
	animal.name = data.name
	animal.nombre_silabas = data.syllables
	animal.especie_dialogo = data.desc
	animal.collision_layer = 2
	animal.collision_mask = 1

	# --- Random position within zone bounds ---
	var x: float = randf_range(bounds.x_min, bounds.x_max)
	var z: float = randf_range(bounds.z_min, bounds.z_max)
	animal.position = Vector3(x, 0.1, z)

	# --- MeshInstance3D container ---
	var mesh: MeshInstance3D = MeshInstance3D.new()
	mesh.name = "MeshInstance3D"
	mesh.position = Vector3(0, 0.35, 0)
	animal.add_child(mesh)

	# --- CSG body with category-appropriate color ---
	var mat: StandardMaterial3D = _pick_material(data.name)
	var body: CSGSphere3D = CSGSphere3D.new()
	body.name = "Body"
	body.radius = 0.28
	body.position = Vector3(0, 0.2, 0)
	body.material = mat
	mesh.add_child(body)

	# --- CollisionShape3D ---
	var shape := SphereShape3D.new()
	shape.radius = 3.5
	var col := CollisionShape3D.new()
	col.name = "CollisionShape3D"
	col.shape = shape
	col.position = Vector3(0, 0.5, 0)
	animal.add_child(col)

	# --- Label3D (hidden until collected) ---
	var label := Label3D.new()
	label.name = "Label3D"
	label.position = Vector3(0, 2.5, 0)
	label.font_size = 34
	label.outline_size = 6
	label.outline_modulate = Color.BLACK
	label.modulate = Color(0.4, 1.0, 0.5)
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.005
	label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	label.visible = false
	animal.add_child(label)

	add_child(animal)


func _spawn_cultural(data: Dictionary, bounds: Dictionary) -> void:
	var animal := CollectibleAnimal.new()
	animal.name = data.name
	animal.nombre_silabas = data.syllables
	animal.especie_dialogo = data.desc
	animal.collision_layer = 2
	animal.collision_mask = 1

	# Random position across the whole world
	var x: float = randf_range(bounds.x_min, bounds.x_max)
	var z: float = randf_range(bounds.z_min, bounds.z_max)
	animal.position = Vector3(x, 0.1, z)

	# MeshInstance3D container
	var mesh: MeshInstance3D = MeshInstance3D.new()
	mesh.name = "MeshInstance3D"
	mesh.position = Vector3(0, 0.35, 0)
	animal.add_child(mesh)

	# CSG body — terracotta colored
	var mat := StandardMaterial3D.new()
	mat.albedo_color = COLOR_CULTURAL
	mat.roughness = 0.6
	mat.metallic = 0.1

	var body: CSGSphere3D = CSGSphere3D.new()
	body.name = "Body"
	body.radius = 0.25
	body.position = Vector3(0, 0.2, 0)
	body.material = mat
	mesh.add_child(body)

	# CollisionShape3D
	var shape := SphereShape3D.new()
	shape.radius = 3.5
	var col := CollisionShape3D.new()
	col.name = "CollisionShape3D"
	col.shape = shape
	col.position = Vector3(0, 0.5, 0)
	animal.add_child(col)

	# Label3D
	var label := Label3D.new()
	label.name = "Label3D"
	label.position = Vector3(0, 2.5, 0)
	label.font_size = 34
	label.outline_size = 6
	label.outline_modulate = Color.BLACK
	label.modulate = Color(1.0, 0.85, 0.3)  # gold for cultural items
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.005
	label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	label.visible = false
	animal.add_child(label)

	add_child(animal)


func _pick_material(animal_name: String) -> StandardMaterial3D:
	var bird_names: Array[String] = [
		"Gaviota","Pelícano","Pilpilén","Zarapito","Yeco","Pingüino",
		"Albatros","Rayador","Churrete","Garza","Pato","Cisne","Tagua",
		"Pidén","Trile","SieteColores","Trabajador","Queltehue","Huairavo",
		"MartinPescador","Loica","Diuca","Tenca","Chercán","Turca",
		"Cóndor","Águila","Peuco","Tiuque",
	]
	var aquatic_names: Array[String] = [
		"Jaiba","Erizo","Estrella","Choro","Piure","Pejerrey","Bagre",
	]
	var mammal_names: Array[String] = [
		"Chungungo","LoboMar","Coipo","Puma","Zorro","Quique",
		"Chingue","Cururo","Degú",
	]
	var reptile_names: Array[String] = ["Lagartija","Culebra"]
	var insect_names: Array[String] = ["Libélula"]

	var c: Color = COLOR_OTHER
	if animal_name in bird_names:     c = COLOR_BIRD
	if animal_name in aquatic_names:   c = COLOR_AQUATIC
	if animal_name in mammal_names:    c = COLOR_MAMMAL
	if animal_name in reptile_names:   c = COLOR_REPTILE
	if animal_name in insect_names:    c = COLOR_INSECT

	var mat := StandardMaterial3D.new()
	mat.albedo_color = c
	mat.roughness = 0.7
	mat.metallic = 0.05
	return mat
