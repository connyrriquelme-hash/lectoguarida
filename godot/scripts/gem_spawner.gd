class_name GemSpawner
extends Node3D

## Spawns 40 challenge gems across the open world.
## Each gem has a location-themed name and a kid-friendly question.

## 40 pedagogical gems — each with a type and ability description
const GEMS_DB: Array[Dictionary] = [
	{"gem_name": "Gema Llolleo",         "question": "¿Dónde está la plaza costera del juego?",                   "answer": "llolleo",          "gem_type": 0, "skill": "phonological",   "ability": "Sonidos del entorno"},
	{"gem_name": "Gema Barrancas",        "question": "¿Cómo se llama la flor nacional de Chile?",                  "answer": "copihue",          "gem_type": 1, "skill": "letters",        "ability": "Letras de la naturaleza"},
	{"gem_name": "Gema San Antonio",      "question": "¿Qué animal marino tiene pinzas y camina de lado?",          "answer": "jaiba",            "gem_type": 1, "skill": "letters",        "ability": "Letras del mar"},
	{"gem_name": "Gema Cartagena",        "question": "¿Qué árbol da las paltas?",                                  "answer": "palto",            "gem_type": 2, "skill": "syllables",      "ability": "Sílabas frutales"},
	{"gem_name": "Gema Las Cruces",       "question": "¿Dónde vive el coipo?",                                      "answer": "humedal",          "gem_type": 2, "skill": "syllables",      "ability": "Sílabas del humedal"},
	{"gem_name": "Gema El Tabo",          "question": "¿Qué pájaro canta en la mañana?",                            "answer": "chincol",          "gem_type": 0, "skill": "phonological",   "ability": "Sonidos de aves"},
	{"gem_name": "Gema Isla Negra",       "question": "¿De qué material es el trompo chileno?",                     "answer": "madera",           "gem_type": 2, "skill": "syllables",      "ability": "Sílabas del juego"},
	{"gem_name": "Gema El Quisco",        "question": "¿Qué cactus crece en la zona central de Chile?",             "answer": "quisco",           "gem_type": 1, "skill": "letters",        "ability": "Letras del desierto"},
	{"gem_name": "Gema Algarrobo",        "question": "¿En qué árbol crecen las algarrobas?",                       "answer": "algarrobo",        "gem_type": 2, "skill": "words",          "ability": "Palabras del bosque"},
	{"gem_name": "Gema Santo Domingo",    "question": "¿Cómo se llama el ave que pesca en la orilla del mar?",      "answer": "gaviota",          "gem_type": 0, "skill": "phonological",   "ability": "Sonidos marinos"},
	{"gem_name": "Gema Lo Abarca",        "question": "¿Qué insecto hace miel?",                                    "answer": "abeja",            "gem_type": 0, "skill": "phonological",   "ability": "Sonidos del campo"},
	{"gem_name": "Gema Cuncumén",         "question": "¿Cómo se llama el zorro chileno?",                           "answer": "culpeo",           "gem_type": 1, "skill": "letters",        "ability": "Letras animales"},
	{"gem_name": "Gema Leyda",            "question": "¿Qué se hace con la uva en Leyda?",                          "answer": "vino",             "gem_type": 2, "skill": "syllables",      "ability": "Sílabas del valle"},
	{"gem_name": "Gema Lo Gallardo",      "question": "¿Qué animal salta y dice croac?",                            "answer": "sapo",             "gem_type": 0, "skill": "phonological",   "ability": "Sonidos saltarines"},
	{"gem_name": "Gema San Juan",         "question": "¿Qué flor azul crece en los cerros chilenos?",               "answer": "azulillo",         "gem_type": 1, "skill": "letters",        "ability": "Letras florales"},
	{"gem_name": "Gema Tejas Verdes",     "question": "¿De qué color es el loro tricahue?",                         "answer": "verde",            "gem_type": 1, "skill": "letters",        "ability": "Letras coloridas"},
	{"gem_name": "Gema Valparaíso",       "question": "¿Cómo se llaman los ascensores de Valparaíso?",              "answer": "ascensores",       "gem_type": 2, "skill": "words",          "ability": "Palabras porteñas"},
	{"gem_name": "Gema Viña del Mar",     "question": "¿Qué flor grande adorna Viña del Mar?",                      "answer": "reloj de flores",  "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión floral"},
	{"gem_name": "Gema Quilpué",          "question": "¿Qué animal tiene caparazón y vive muchos años?",            "answer": "tortuga",          "gem_type": 2, "skill": "words",          "ability": "Palabras lentas"},
	{"gem_name": "Gema Villa Alemana",    "question": "¿Qué insecto de colores visita las flores?",                 "answer": "mariposa",         "gem_type": 0, "skill": "phonological",   "ability": "Sonidos alados"},
	{"gem_name": "Gema Limache",          "question": "¿Qué fruta roja se cosecha en Limache?",                     "answer": "tomate",           "gem_type": 1, "skill": "letters",        "ability": "Letras rojas"},
	{"gem_name": "Gema Olmué",            "question": "¿Cómo se llama el parque nacional cerca de Olmué?",          "answer": "la campana",       "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión natural"},
	{"gem_name": "Gema Quillota",         "question": "¿Qué fruta es dulce y crece en las palmeras?",               "answer": "palta",            "gem_type": 1, "skill": "letters",        "ability": "Letras frutales"},
	{"gem_name": "Gema Casablanca",       "question": "¿De qué color son las casas típicas del litoral?",           "answer": "colores",          "gem_type": 1, "skill": "letters",        "ability": "Letras de colores"},
	{"gem_name": "Gema La Ligua",         "question": "¿Qué prenda chilena se teje con lana?",                      "answer": "poncho",           "gem_type": 2, "skill": "words",          "ability": "Palabras tejidas"},
	{"gem_name": "Gema Papudo",           "question": "¿Qué animal marino es amigo de los pescadores?",             "answer": "lobo marino",      "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión marina"},
	{"gem_name": "Gema Zapallar",         "question": "¿Qué verdura gigante da nombre a este lugar?",               "answer": "zapallo",          "gem_type": 2, "skill": "syllables",      "ability": "Sílabas gigantes"},
	{"gem_name": "Gema Maitencillo",      "question": "¿Cómo se llama la mariposa del Maitén?",                     "answer": "mariposa del maiten","gem_type": 4, "skill": "inference",     "ability": "Inferencias aladas"},
	{"gem_name": "Gema Quintero",         "question": "¿Qué combustible viene del mar?",                            "answer": "petroleo",         "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión energética"},
	{"gem_name": "Gema Puchuncaví",       "question": "¿Qué ave vuela alto en los acantilados?",                    "answer": "pelicano",         "gem_type": 0, "skill": "phonological",   "ability": "Sonidos acantilados"},
	{"gem_name": "Gema Horcón",           "question": "¿Qué pueblo es famoso por sus artesanos y hippies?",         "answer": "horcon",           "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión artesanal"},
	{"gem_name": "Gema Ventanas",         "question": "¿Qué gran ave come carroña en Chile?",                       "answer": "condor",           "gem_type": 4, "skill": "inference",     "ability": "Inferencias del cielo"},
	{"gem_name": "Gema Concón",           "question": "¿Qué comida típica se come en Concón?",                      "answer": "empanada",         "gem_type": 2, "skill": "syllables",      "ability": "Sílabas sabrosas"},
	{"gem_name": "Gema Placilla",         "question": "¿Cómo se llama la cueva de los murciélagos chilenos?",       "answer": "piuchén",          "gem_type": 4, "skill": "inference",     "ability": "Inferencias misteriosas"},
	{"gem_name": "Gema Curauma",          "question": "¿Qué animal vive en el lago Peñuelas?",                      "answer": "cisne",            "gem_type": 1, "skill": "letters",        "ability": "Letras del lago"},
	{"gem_name": "Gema Peñuelas",         "question": "¿Cómo se llama la reserva nacional cerca del puerto?",       "answer": "lago peñuelas",    "gem_type": 3, "skill": "comprehension",  "ability": "Comprensión reservada"},
	{"gem_name": "Gema Laguna Verde",     "question": "¿De qué color se ve la laguna entre los cerros?",            "answer": "verde",            "gem_type": 1, "skill": "letters",        "ability": "Letras verdes"},
	{"gem_name": "Gema El Totoral",       "question": "¿Qué planta crece en los humedales costeros?",               "answer": "totora",           "gem_type": 2, "skill": "syllables",      "ability": "Sílabas del juncal"},
	{"gem_name": "Gema Bucalemu",         "question": "¿Cómo se llama la mariposa más grande de Chile?",            "answer": "mariposa de la col","gem_type": 4, "skill": "inference",     "ability": "Inferencias mariposa"},
	{"gem_name": "Gema San Sebastián",    "question": "¿Qué animal chileno está en peligro de extinción?",          "answer": "huemul",           "gem_type": 4, "skill": "inference",     "ability": "Inferencias del bosque"},
]

## Colors for gems — 5 pedagogical gem types
const GEM_COLORS: Array[Color] = [
	Color(1.0, 0.3, 0.3),   # RED — Conciencia Fonológica
	Color(1.0, 0.85, 0.2),  # YELLOW — Letras y Sílabas
	Color(0.2, 0.85, 0.3),  # GREEN — Palabras
	Color(0.3, 0.5, 1.0),   # BLUE — Comprensión
	Color(0.7, 0.3, 1.0),   # PURPLE — Inferencias
]

## Gem type names for narration
const GEM_TYPE_NAMES: Array[String] = [
	"Gema Roja de los Sonidos",
	"Gema Amarilla de las Letras",
	"Gema Verde de las Palabras",
	"Gema Azul de la Comprensión",
	"Gema Púrpura de las Inferencias",
]

## World bounds for scattering gems (9-zone world)
const WORLD_MIN_X: float = -100.0
const WORLD_MAX_X: float = 100.0
const WORLD_MIN_Z: float = -200.0
const WORLD_MAX_Z: float = 200.0

const GEM_SCENE_PATH: String = "res://scenes/gem_challenge.tscn"


func _ready() -> void:
	if Engine.is_editor_hint():
		return

	var gem_ps: PackedScene = load(GEM_SCENE_PATH)
	if not gem_ps:
		push_error("GemSpawner: could not load gem_challenge.tscn")
		return

	var rng := RandomNumberGenerator.new()
	rng.seed = hash("LECTOGUARIDA_GEMS_2026")

	var total_spawned: int = 0

	for i: int in range(GEMS_DB.size()):
		var data: Dictionary = GEMS_DB[i]
		var gem: GemChallenge = gem_ps.instantiate() as GemChallenge
		if not gem:
			continue

		# Configure gem
		gem.gem_name = data["gem_name"]
		gem.question = data["question"]
		gem.answer = data["answer"]
		var gem_type_idx: int = data.get("gem_type", i % GEM_COLORS.size())
		gem.glow_color = GEM_COLORS[gem_type_idx]
		gem.set("gem_type", gem_type_idx)
		gem.set("ability_desc", data.get("ability", ""))

		# Random position within world bounds
		var x: float = rng.randf_range(WORLD_MIN_X, WORLD_MAX_X)
		var z: float = rng.randf_range(WORLD_MIN_Z, WORLD_MAX_Z)
		gem.position = Vector3(x, _get_ground_y(x, z), z)

		# Slight random rotation
		gem.rotation.y = rng.randf_range(0.0, TAU)

		# Update the floating label
		var lbl: Label3D = gem.get_node_or_null("NameLabel") as Label3D
		if lbl:
			lbl.text = data["gem_name"].replace("Gema ", "")
			lbl.modulate = gem.glow_color

		# Set material on gem visual children and convert CSG→MeshInstance3D
		var mat := StandardMaterial3D.new()
		mat.albedo_color = gem.glow_color
		mat.emission_enabled = true
		mat.emission = gem.glow_color
		mat.emission_energy_multiplier = 2.0
		mat.roughness = 0.2
		mat.metallic = 0.6

		# Convert CSG children to MeshInstance3D (GL Compatibility fix)
		var to_convert: Array[Node] = []
		for child: Node in gem.get_children():
			if child is CSGShape3D:
				to_convert.append(child)
		for csg: Node in to_convert:
			_gem_replace_csg(gem, csg as CSGShape3D, mat)

		add_child(gem)
		total_spawned += 1

	print("GemSpawner: spawned ", total_spawned, " challenge gems across the world")


## Rough ground height based on zone
func _get_ground_y(_x: float, _z: float) -> float:
	# All zones share the same ground plane (y=0).
	# Slight random float height so gems hover above ground.
	return 2.5


## Replaces a CSGShape3D child of a gem with an equivalent MeshInstance3D
func _gem_replace_csg(gem: Node, csg: CSGShape3D, mat: Material) -> void:
	"""Convert a CSG cylinder/cone to a MeshInstance3D."""
	var mi := MeshInstance3D.new()
	mi.name = csg.name + "_Mesh"
	mi.transform = csg.transform
	mi.position = csg.position
	mi.rotation = csg.rotation
	mi.scale = csg.scale
	mi.material_override = mat

	if csg is CSGCylinder3D:
		var cyl := CylinderMesh.new()
		cyl.top_radius = csg.radius
		cyl.bottom_radius = csg.radius
		cyl.height = csg.height
		mi.mesh = cyl

	# Replace: add MeshInstance3D, remove CSG
	gem.add_child(mi)
	gem.remove_child(csg)
	csg.queue_free()
