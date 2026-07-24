## ReaderProfileManager — Sistema de Perfiles Lectores Adaptativos
## Autoload singleton que gestiona las tres rutas pedagógicas sin etiquetas
## deficitarias visibles para el estudiante.
##
## Rutas internas: "explorador" (Ruta 1), "constructor" (Ruta 2), "aventurero" (Ruta 3)
##
## Register in Project Settings > Autoload as "ReaderProfileManager"
extends Node

## Emitido cuando el perfil o nivel de apoyo cambia
signal profile_changed(route: String, support_level: int)
signal diagnostic_completed(route: String)

## Rutas pedagógicas internas
const ROUTE_EXPLORADOR: String = "explorador"    # Ruta 1 — No lee / sonidos
const ROUTE_CONSTRUCTOR: String = "constructor"   # Ruta 2 — Silábico / palabras
const ROUTE_AVENTURERO: String = "aventurero"     # Ruta 3 — Fluido / comprensión

const ROUTES: Dictionary = {
	ROUTE_EXPLORADOR: {"name": "Explorador de Sonidos", "min_support": 3, "max_support": 5},
	ROUTE_CONSTRUCTOR: {"name": "Constructor de Palabras", "min_support": 1, "max_support": 3},
	ROUTE_AVENTURERO: {"name": "Lector Aventurero", "min_support": 0, "max_support": 2},
}

## Perfil activo (ruta interna)
var current_route: String = ROUTE_EXPLORADOR:
	set(value):
		if value in ROUTES:
			current_route = value
			adjust_support_to_route()

## Nivel de apoyo (0 = mínimo, 5 = máximo)
## 0-1: Lector Aventurero, 2-3: Constructor, 4-5: Explorador
var support_level: int = 3:
	set(value):
		support_level = clampi(value, 0, 5)
		save_profile()

## Historial de rendimiento para ajuste dinámico
var performance_history: Array[Dictionary] = []
var recent_correct: int = 0
var recent_attempts: int = 0
var hints_used: int = 0
var sequential_errors: int = 0
var audio_requests: int = 0
var total_errors: int = 0
var consecutive_errors: int = 0
var diagnostic_done: bool = false
var intro_completed: bool = false

## Diario de actividades completadas
var completed_activities: Array[String] = []

## Contadores por habilidad
var skill_scores: Dictionary = {
	"phonological": {"correct": 0, "total": 0},
	"letters": {"correct": 0, "total": 0},
	"syllables": {"correct": 0, "total": 0},
	"words": {"correct": 0, "total": 0},
	"comprehension": {"correct": 0, "total": 0},
	"inference": {"correct": 0, "total": 0},
}

const SAVE_KEY: String = "reader_profile"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_profile()
	if not diagnostic_done:
		current_route = ROUTE_EXPLORADOR
		support_level = 4

# ═══════════════════════════════════════════════════════════════
#  DIAGNÓSTICO INICIAL — Aventura amigable, no prueba
# ═══════════════════════════════════════════════════════════════

## Preguntas del diagnóstico amigable
## Cada una evalúa una habilidad diferente sin que el niño lo sepa
const DIAGNOSTIC_QUESTIONS: Array[Dictionary] = [
	# 1. Reconocimiento de letras
	{"id": "diag_letter_a", "type": "letter", "skill": "letters",
	 "instruction": "¿Cuál es la letra A?",
	 "image_hint": "🔤", "audio": "Encuentra la letra A",
	 "options": ["O", "A", "E"], "correct": 1, "difficulty": 1},
	# 2. Sonido inicial
	{"id": "diag_sound_m", "type": "initial_sound", "skill": "phonological",
	 "instruction": "¿Qué letra suena al empezar 'MAMÁ'?",
	 "image_hint": "👩", "audio": "Escucha: MAMÁ. ¿Qué letra escuchas al principio?",
	 "options": ["P", "M", "S"], "correct": 1, "difficulty": 1},
	# 3. Lectura de sílaba
	{"id": "diag_syllable_ma", "type": "syllable", "skill": "syllables",
	 "instruction": "¿Qué dice aquí?",
	 "image_hint": "📖", "audio": "Lee esta sílaba",
	 "options": ["MA", "ME", "MO"], "correct": 0, "difficulty": 2},
	# 4. Lectura de palabra
	{"id": "diag_word_sol", "type": "word", "skill": "words",
	 "instruction": "¿Qué palabra dice aquí?",
	 "image_hint": "☀️", "audio": "Lee esta palabra",
	 "options": ["SOL", "SAL", "SIL"], "correct": 0, "difficulty": 2},
	# 5. Comprensión oral
	{"id": "diag_listen", "type": "listening", "skill": "comprehension",
	 "instruction": "El gato bebe leche. ¿Qué bebe el gato?",
	 "image_hint": "🐱", "audio": "El gato bebe leche. ¿Qué bebe el gato?",
	 "options": ["Agua", "Leche", "Jugo"], "correct": 1, "difficulty": 2},
	# 6. Comprensión de oración
	{"id": "diag_sentence", "type": "sentence", "skill": "comprehension",
	 "instruction": "María tiene un perro café. ¿De qué color es el perro?",
	 "image_hint": "🐕", "audio": "María tiene un perro café. ¿De qué color es el perro?",
	 "options": ["Negro", "Blanco", "Café"], "correct": 2, "difficulty": 3},
	# 7. Texto breve
	{"id": "diag_text", "type": "text", "skill": "comprehension",
	 "instruction": "El sol brilla fuerte. Los niños juegan en la plaza. ¿Dónde juegan los niños?",
	 "image_hint": "🌳", "audio": "El sol brilla fuerte. Los niños juegan en la plaza. ¿Dónde juegan los niños?",
	 "options": ["En la escuela", "En la plaza", "En la casa"], "correct": 1, "difficulty": 3},
]

## Inicia la aventura diagnóstica. Retorna las preguntas a mostrar.
func start_diagnostic() -> Array[Dictionary]:
	performance_history = []
	recent_correct = 0
	recent_attempts = 0
	hints_used = 0
	sequential_errors = 0  # reset will be handled
	return DIAGNOSTIC_QUESTIONS.duplicate()

## Procesa cada respuesta del diagnóstico
func process_diagnostic_answer(question_id: String, correct: bool, hints: int) -> void:
	performance_history.append({
		"id": question_id,
		"correct": correct,
		"hints": hints,
	})
	if correct:
		recent_correct += 1
	recent_attempts += 1
	if not correct:
		consecutive_errors += 1
	else:
		consecutive_errors = 0

## Finaliza el diagnóstico y asigna ruta + nivel de apoyo
func finish_diagnostic() -> void:
	# Puntaje total (0-7)
	var score: int = 0
	for entry: Dictionary in performance_history:
		if entry.get("correct", false):
			score += 1

	# Asignar ruta basada en puntaje
	if score <= 2:
		current_route = ROUTE_EXPLORADOR
		support_level = 5
	elif score <= 4:
		current_route = ROUTE_CONSTRUCTOR
		support_level = 3
	else:
		current_route = ROUTE_AVENTURERO
		support_level = 1

	diagnostic_done = true
	save_profile()
	diagnostic_completed.emit(current_route)
	print("ReaderProfile: diagnóstico completado → ruta '%s', apoyo %d" % [current_route, support_level])

# ═══════════════════════════════════════════════════════════════
#  AJUSTE DINÁMICO — basado en desempeño reciente
# ═══════════════════════════════════════════════════════════════

## Reportar resultado de actividad para ajuste dinámico
func report_activity(activity_id: String, skill: String, correct: bool,
		hints: int, audio_requested: bool, time_seconds: float) -> void:
	# Actualizar historial (mantener últimos 20)
	performance_history.append({
		"id": activity_id,
		"skill": skill,
		"correct": correct,
		"hints": hints,
		"audio": audio_requested,
		"time": time_seconds,
	})
	if performance_history.size() > 20:
		performance_history.pop_front()

	# Actualizar contadores de habilidad
	if skill in skill_scores:
		skill_scores[skill]["total"] += 1
		if correct:
			skill_scores[skill]["correct"] += 1

	# Actualizar ventana reciente
	if correct:
		recent_correct += 1
		consecutive_errors = 0
	else:
		total_errors += 1
		consecutive_errors += 1
	recent_attempts += 1
	hints_used += hints
	if audio_requested:
		audio_requests += 1

	# Evaluar ajuste cada 5 respuestas
	if recent_attempts >= 5:
		_evaluate_adjustment()
		recent_attempts = 0
		recent_correct = 0

	completed_activities.append(activity_id)
	save_profile()

## Evalúa si debe ajustar el nivel de apoyo
func _evaluate_adjustment() -> void:
	var accuracy: float = float(recent_correct) / max(recent_attempts, 1)
	var _hint_ratio: float = float(hints_used) / max(recent_attempts, 1)  # reserved for future hint analytics
	var audio_ratio: float = float(audio_requests) / max(recent_attempts, 1)

	# Reglas de ajuste
	if accuracy >= 0.8 and consecutive_errors == 0:
		# Buena racha — podría reducir apoyo
		if support_level > ROUTES[current_route]["min_support"]:
			support_level -= 1
			print("ReaderProfile: ↓ apoyo → %d (precisión %.0f%%)" % [support_level, accuracy * 100])
	elif accuracy <= 0.3 or consecutive_errors >= 3:
		# Dificultad alta — aumentar apoyo
		if support_level < ROUTES[current_route]["max_support"]:
			support_level += 1
			print("ReaderProfile: ↑ apoyo → %d (precisión %.0f%%, errores seguidos %d)" % [support_level, accuracy * 100, consecutive_errors])
		elif current_route != ROUTE_EXPLORADOR:
			# Bajar de ruta si es necesario
			_lower_route()

	# Pista: muchos errores + audio → más apoyo
	if accuracy < 0.5 and audio_ratio > 0.6:
		if support_level < ROUTES[current_route]["max_support"]:
			support_level += 1

## Bajar de ruta (sin mostrar etiqueta al niño)
func _lower_route() -> void:
	match current_route:
		ROUTE_AVENTURERO:
			current_route = ROUTE_CONSTRUCTOR
			support_level = ROUTES[ROUTE_CONSTRUCTOR]["max_support"]
			print("ReaderProfile: ruta → CONSTRUCTOR (ajuste por dificultad)")
		ROUTE_CONSTRUCTOR:
			current_route = ROUTE_EXPLORADOR
			support_level = ROUTES[ROUTE_EXPLORADOR]["max_support"]
			print("ReaderProfile: ruta → EXPLORADOR (ajuste por dificultad)")

## Subir de ruta (cuando el desempeño lo permite)
func _raise_route() -> void:
	match current_route:
		ROUTE_EXPLORADOR:
			current_route = ROUTE_CONSTRUCTOR
			support_level = ROUTES[ROUTE_CONSTRUCTOR]["min_support"]
			print("ReaderProfile: ruta → CONSTRUCTOR (progreso!)")
		ROUTE_CONSTRUCTOR:
			current_route = ROUTE_AVENTURERO
			support_level = ROUTES[ROUTE_AVENTURERO]["min_support"]
			print("ReaderProfile: ruta → AVENTURERO (progreso!)")
	adjust_support_to_route()

func adjust_support_to_route() -> void:
	support_level = clampi(support_level, ROUTES[current_route]["min_support"], ROUTES[current_route]["max_support"])
	profile_changed.emit(current_route, support_level)

## Evaluación periódica para subir de ruta (llamado externamente)
func try_route_advancement() -> void:
	var total_skill_score: int = 0
	var total_skill_max: int = 0
	for skill: String in skill_scores:
		total_skill_score += skill_scores[skill]["correct"]
		total_skill_max += skill_scores[skill]["total"]

	if total_skill_max < 10:
		return  # no hay suficientes datos

	var overall_accuracy: float = float(total_skill_score) / float(total_skill_max)

	if current_route == ROUTE_EXPLORADOR and overall_accuracy >= 0.75:
		_raise_route()
	elif current_route == ROUTE_CONSTRUCTOR and overall_accuracy >= 0.8:
		_raise_route()

# ═══════════════════════════════════════════════════════════════
#  CONSULTAS DE PERFIL
# ═══════════════════════════════════════════════════════════════

func needs_audio() -> bool:
	return support_level >= 4

func needs_large_text() -> bool:
	return support_level >= 3

func needs_image_support() -> bool:
	return support_level >= 2

func allows_free_text() -> bool:
	return current_route == ROUTE_AVENTURERO and support_level <= 1

func get_route_name() -> String:
	return ROUTES[current_route]["name"]

func get_route_index() -> int:
	match current_route:
		ROUTE_EXPLORADOR: return 0
		ROUTE_CONSTRUCTOR: return 1
		ROUTE_AVENTURERO: return 2
	return 0

func get_skill_accuracy(skill: String) -> float:
	var data: Dictionary = skill_scores.get(skill, {"correct": 0, "total": 1})
	return float(data["correct"]) / max(data["total"], 1)

func get_total_activities() -> int:
	return completed_activities.size()

# ═══════════════════════════════════════════════════════════════
#  GUARDADO
# ═══════════════════════════════════════════════════════════════

func save_profile() -> void:
	var data: Dictionary = {
		"current_route": current_route,
		"support_level": support_level,
		"diagnostic_done": diagnostic_done,
		"intro_completed": intro_completed,
		"completed_activities": completed_activities,
		"skill_scores": skill_scores,
		"total_errors": total_errors,
		"hints_used": hints_used,
		"audio_requests": audio_requests,
	}

	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm and pm.has_method("_save_extra_data"):
		pm._save_extra_data(SAVE_KEY, data)

func load_profile() -> void:
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm and pm.has_method("_load_extra_data"):
		var data: Dictionary = pm._load_extra_data(SAVE_KEY)
		if data.is_empty():
			return
		current_route = data.get("current_route", ROUTE_EXPLORADOR)
		support_level = data.get("support_level", 4)
		diagnostic_done = data.get("diagnostic_done", false)
		intro_completed = data.get("intro_completed", false)
		var ca: Array = data.get("completed_activities", [])
		completed_activities.clear()
		for c: Variant in ca:
			completed_activities.append(str(c))
		skill_scores = data.get("skill_scores", skill_scores)
		total_errors = data.get("total_errors", 0)
		hints_used = data.get("hints_used", 0)
		audio_requests = data.get("audio_requests", 0)

## Para cambio manual desde panel docente
func set_route_manually(route: String) -> void:
	if route in ROUTES:
		current_route = route
		diagnostic_done = true
		save_profile()
		profile_changed.emit(current_route, support_level)

func set_support_manually(level: int) -> void:
	support_level = clampi(level, 0, 5)
	save_profile()
	profile_changed.emit(current_route, support_level)

func set_intro_completed() -> void:
	intro_completed = true
	save_profile()

func is_intro_completed() -> bool:
	return intro_completed

func is_diagnostic_completed() -> bool:
	return diagnostic_done

func is_route_assigned() -> bool:
	return diagnostic_done

func reset_profile() -> void:
	current_route = ROUTE_EXPLORADOR
	support_level = 4
	diagnostic_done = false
	intro_completed = false
	performance_history = []
	recent_correct = 0
	recent_attempts = 0
	hints_used = 0
	audio_requests = 0
	total_errors = 0
	consecutive_errors = 0
	completed_activities = []
	for skill: String in skill_scores:
		skill_scores[skill] = {"correct": 0, "total": 0}
	save_profile()
