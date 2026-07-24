class_name EduWorldLoader
extends Node3D

## Carga los mundos educativos (Bosque, Valle, Villa, Biblioteca, Isla)
## y los conecta al mundo principal. También gestiona el diagnóstico inicial
## y el panel docente.
##
## ═══════════════════════════════════════════════════════════════
##  MÁQUINA DE ESTADOS EXPLÍCITA
## ═══════════════════════════════════════════════════════════════
##
## BOOT → INTRO_NARRATIVA → DIAGNÓSTICO → ASIGNACIÓN_RUTA → EXPLORACIÓN
## EXPLORACIÓN → DESAFÍO → RETROALIMENTACIÓN → EXPLORACIÓN
##
## Prohibido: RETROALIMENTACIÓN → INTRO_NARRATIVA o DIAGNÓSTICO
##            cuando ya fueron completados.

enum AppState {
	BOOT,             # Inicio, sin acciones pedagógicas
	INTRO_NARRATIVE,  # Diálogo de Lechuza Lila (una vez)
	DIAGNOSTIC,       # 7 preguntas diagnósticas (una vez)
	ROUTE_ASSIGNMENT, # Asignación de ruta y cierre
	EXPLORATION,      # Mundo abierto, jugador libre
	CHALLENGE,        # Desafío pedagógico activo
	FEEDBACK,         # Retroalimentación post-desafío
}

var _state: int = AppState.BOOT
var _player_ref: Node3D = null
var _diagnostic_questions: Array[Dictionary] = []
var _diagnostic_index: int = 0
var _reading_challenge_ui_scene: PackedScene = null
var _active_modal: Node = null

# ── Guards de estado (flags persistentes) ──
var _intro_started: bool = false
var _intro_completed: bool = false
var _diagnostic_started: bool = false
var _diagnostic_completed: bool = false
var _route_assigned: bool = false
var _modal_open: bool = false

const EDU_WORLDS: Array[Dictionary] = [
	{
		"name": "BosqueSonidos",
		"display": "Bosque de los Sonidos",
		"position": Vector3(-30, 0, -40),
		"size": Vector3(20, 0.2, 20),
		"color": Color(0.2, 0.5, 0.2),
		"world_key": "bosque",
		"gem_type": "red",
		"entry_label": "🌲 Bosque de los Sonidos",
	},
	{
		"name": "ValleSilabas",
		"display": "Valle de las Sílabas",
		"position": Vector3(30, 0, -40),
		"size": Vector3(20, 0.2, 20),
		"color": Color(0.6, 0.5, 0.2),
		"world_key": "valle",
		"gem_type": "yellow",
		"entry_label": "🏔️ Valle de las Sílabas",
	},
	{
		"name": "VillaPalabras",
		"display": "Villa de las Palabras",
		"position": Vector3(-30, 0, 40),
		"size": Vector3(20, 0.2, 20),
		"color": Color(0.3, 0.7, 0.3),
		"world_key": "villa",
		"gem_type": "green",
		"entry_label": "🏘️ Villa de las Palabras",
	},
	{
		"name": "BibliotecaCuentos",
		"display": "Biblioteca de los Cuentos",
		"position": Vector3(30, 0, 40),
		"size": Vector3(20, 0.2, 20),
		"color": Color(0.2, 0.3, 0.7),
		"world_key": "biblioteca",
		"gem_type": "blue",
		"entry_label": "📚 Biblioteca de los Cuentos",
	},
	{
		"name": "IslaInferencias",
		"display": "Isla de las Inferencias",
		"position": Vector3(0, 0, 60),
		"size": Vector3(20, 0.2, 20),
		"color": Color(0.6, 0.2, 0.6),
		"world_key": "isla",
		"gem_type": "purple",
		"entry_label": "🏝️ Isla de las Inferencias",
	},
]


func _ready() -> void:
	if Engine.is_editor_hint():
		return
	_reading_challenge_ui_scene = load("res://scenes/reading_challenge_ui.tscn")

	# Construir mundos después de un breve delay
	call_deferred("_build_edu_worlds")

	# Iniciar máquina de estados
	call_deferred("_bootstrap")


# ═══════════════════════════════════════════════════════════════
#  MÁQUINA DE ESTADOS — Núcleo del flujo
# ═══════════════════════════════════════════════════════════════

func _bootstrap() -> void:
	"""Determina el estado inicial basado en progreso guardado."""
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if not rpm:
		push_error("EduWorldLoader: ReaderProfileManager no encontrado")
		_transition(AppState.EXPLORATION)
		return

	# Recuperar flags persistentes
	if rpm.has_method("is_intro_completed"):
		_intro_completed = rpm.is_intro_completed()
	if rpm.has_method("is_diagnostic_completed") and rpm.is_diagnostic_completed():
		_diagnostic_completed = true
		_diagnostic_started = true

	if _diagnostic_completed:
		# Ya pasó todo el onboarding
		_transition(AppState.EXPLORATION)
	elif _intro_completed:
		# Intro ya vista, pasar al diagnóstico
		_transition(AppState.DIAGNOSTIC)
	else:
		# Primera vez — mostrar narrativa
		_transition(AppState.INTRO_NARRATIVE)


func _transition(new_state: int) -> void:
	"""Transición segura entre estados con validación."""
	if not _can_transition(new_state):
		push_warning("EduWorldLoader: transición %s → %s bloqueada" % [_state_name(_state), _state_name(new_state)])
		return

	var old_state: int = _state
	_state = new_state
	print("EduWorldLoader: estado %s → %s" % [_state_name(old_state), _state_name(new_state)])

	match new_state:
		AppState.INTRO_NARRATIVE:
			_show_narrative_intro()
		AppState.DIAGNOSTIC:
			_begin_diagnostic()
		AppState.ROUTE_ASSIGNMENT:
			_assign_route_and_exit()
		AppState.EXPLORATION:
			_on_exploration_start()
		AppState.CHALLENGE:
			# Se activa desde _on_edu_world_entered
			pass
		AppState.FEEDBACK:
			# Vuelve a EXPLORATION automáticamente
			_transition(AppState.EXPLORATION)


func _can_transition(to_state: int) -> bool:
	match to_state:
		AppState.INTRO_NARRATIVE:
			return not _intro_completed and not _diagnostic_completed and _state in [AppState.BOOT]
		AppState.DIAGNOSTIC:
			return not _diagnostic_started and _state in [AppState.BOOT, AppState.INTRO_NARRATIVE]
		AppState.ROUTE_ASSIGNMENT:
			return _diagnostic_started and _state == AppState.DIAGNOSTIC
		AppState.EXPLORATION:
			return _state in [AppState.BOOT, AppState.ROUTE_ASSIGNMENT, AppState.CHALLENGE, AppState.FEEDBACK]
		AppState.CHALLENGE:
			return _state == AppState.EXPLORATION
		AppState.FEEDBACK:
			return _state == AppState.CHALLENGE
	return false


func _state_name(s: int) -> String:
	match s:
		AppState.BOOT: return "BOOT"
		AppState.INTRO_NARRATIVE: return "INTRO_NARRATIVE"
		AppState.DIAGNOSTIC: return "DIAGNOSTIC"
		AppState.ROUTE_ASSIGNMENT: return "ROUTE_ASSIGNMENT"
		AppState.EXPLORATION: return "EXPLORATION"
		AppState.CHALLENGE: return "CHALLENGE"
		AppState.FEEDBACK: return "FEEDBACK"
	return "UNKNOWN"


# ═══════════════════════════════════════════════════════════════
#  MODAL — Apertura/cierre centralizados
# ═══════════════════════════════════════════════════════════════

func _open_modal(modal: Node) -> void:
	"""Abre un modal pedagógico: pausa el juego, bloquea al jugador."""
	if _active_modal != null and is_instance_valid(_active_modal):
		_active_modal.queue_free()
		_active_modal = null

	_active_modal = modal
	add_child(modal)
	_modal_open = true
	get_tree().paused = true
	_block_player(true)
	print("EduWorldLoader: modal abierto (%s)" % modal.name)


func _close_modal() -> void:
	"""Cierra el modal activo y restaura el estado de juego."""
	if _active_modal != null and is_instance_valid(_active_modal):
		var old: Node = _active_modal
		_active_modal = null
		old.queue_free()
	_modal_open = false
	get_tree().paused = false
	_block_player(false)
	_restore_hud()
	print("EduWorldLoader: modal cerrado — juego reanudado")


func _block_player(blocked: bool) -> void:
	"""Bloquea o desbloquea el movimiento del jugador y la cámara."""
	if _player_ref == null or not is_instance_valid(_player_ref):
		return
	_player_ref.set_process(not blocked)
	_player_ref.set_physics_process(not blocked)
	if blocked:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _restore_hud() -> void:
	var hud: Node = get_node_or_null("/root/GameHUD")
	if hud and hud.has_method("set_collapsed"):
		hud.set_collapsed(false)


func _on_hud_collapse_request(collapsed: bool) -> void:
	var hud: Node = get_node_or_null("/root/GameHUD")
	if hud and hud.has_method("set_collapsed"):
		hud.set_collapsed(collapsed)


# ═══════════════════════════════════════════════════════════════
#  INTRO NARRATIVA — Lechuza Lila (una vez)
# ═══════════════════════════════════════════════════════════════

func _show_narrative_intro() -> void:
	"""Muestra el diálogo de Lechuza Lila. Solo se ejecuta una vez."""
	if _intro_started:
		return
	_intro_started = true

	var dialog_ps: PackedScene = load("res://scenes/narrative_dialog.tscn")
	if not dialog_ps:
		_speak_text("¡Bienvenido a Lectoguarida! Vamos a conocernos.")
		_intro_completed = true
		_transition(AppState.DIAGNOSTIC)
		return

	var dialog: NarrativeDialog = dialog_ps.instantiate()
	var lines: Array[Dictionary] = [
		{
			"speaker": "🦉 Lechuza Lila",
			"text": "¡Hola! Soy Lila, la guardiana de Lectoguarida. He estado esperando a un nuevo guardián como tú.",
		},
		{
			"speaker": "🦉 Lechuza Lila",
			"text": "Este es un lugar mágico donde las letras cobran vida. Hay cinco mundos por descubrir, cada uno con sus propios desafíos.",
		},
		{
			"speaker": "🦉 Lechuza Lila",
			"text": "Antes de comenzar, necesito conocerte un poco. Voy a hacerte algunas preguntas para saber cómo guiarte mejor. ¡Responde con confianza!",
		},
	]

	_open_modal(dialog)
	dialog.start_dialog(lines)

	var on_done := func():
		if not _intro_completed:
			_intro_completed = true
			_save_intro_flag()
			_close_modal()
			_transition(AppState.DIAGNOSTIC)
	dialog.dialog_completed.connect(on_done, CONNECT_ONE_SHOT)


func _save_intro_flag() -> void:
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if rpm and rpm.has_method("set_intro_completed"):
		rpm.set_intro_completed()


# ═══════════════════════════════════════════════════════════════
#  DIAGNÓSTICO — 7 preguntas, una vez
# ═══════════════════════════════════════════════════════════════

func _begin_diagnostic() -> void:
	"""Inicia el diagnóstico. Solo se ejecuta una vez por partida."""
	if _diagnostic_started:
		return
	_diagnostic_started = true

	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if not rpm:
		push_error("EduWorldLoader: RPM no disponible para diagnóstico")
		_transition(AppState.EXPLORATION)
		return

	_diagnostic_questions = rpm.start_diagnostic()
	_diagnostic_index = 0
	_speak_text("¡Bienvenido a Lectoguarida! Vamos a conocernos. Responde las preguntas con confianza.")
	_show_diagnostic_question()


func _show_diagnostic_question() -> void:
	"""Muestra la pregunta diagnóstica actual o finaliza."""
	if _diagnostic_index >= _diagnostic_questions.size():
		_finish_diagnostic()
		return

	var ui: ReadingChallengeUI = _reading_challenge_ui_scene.instantiate()
	_open_modal(ui)
	ui.setup(_diagnostic_questions[_diagnostic_index])

	# ⚠️ Solo conectar challenge_completed — NUNCA conectar closed
	# closed → _on_diagnostic_skip → fin prematuro del diagnóstico
	ui.challenge_completed.connect(_on_diagnostic_answer.bind(ui), CONNECT_ONE_SHOT)


func _on_diagnostic_answer(_activity_id: String, correct: bool, hints: int, _ui: ReadingChallengeUI) -> void:
	"""Procesa respuesta y avanza al siguiente índice o finaliza."""
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if rpm:
		var qid: String = _diagnostic_questions[_diagnostic_index].get("id", "") if _diagnostic_index < _diagnostic_questions.size() else ""
		rpm.process_diagnostic_answer(qid, correct, hints)

	_close_modal()
	_diagnostic_index += 1

	await get_tree().create_timer(0.3).timeout
	_show_diagnostic_question()


func _finish_diagnostic() -> void:
	"""Finaliza el diagnóstico, asigna ruta y cierra todo."""
	if _diagnostic_completed:
		return
	_diagnostic_completed = true

	if _modal_open:
		_close_modal()

	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if rpm:
		rpm.finish_diagnostic()
		var _route_name: String = rpm.get_route_name()
		_speak_text("¡Listo! Ahora sé cómo ayudarte mejor. ¡A explorar se ha dicho!")

	var main: Node3D = get_tree().current_scene as Node3D
	if main and main.has_method("show_narrative_message"):
		main.show_narrative_message("🌟 ¡Aventura lista! Explora los mundos y completa los desafíos.")

	_transition(AppState.ROUTE_ASSIGNMENT)


# ═══════════════════════════════════════════════════════════════
#  ASIGNACIÓN DE RUTA + EXPLORACIÓN
# ═══════════════════════════════════════════════════════════════

func _assign_route_and_exit() -> void:
	"""Asigna la ruta y transiciona a exploración."""
	if _route_assigned:
		return
	_route_assigned = true

	if get_tree().paused:
		get_tree().paused = false

	_block_player(false)
	_transition(AppState.EXPLORATION)


func _on_exploration_start() -> void:
	"""Preparación al entrar en exploración."""
	if get_tree().paused:
		get_tree().paused = false
	_block_player(false)
	_restore_hud()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	print("EduWorldLoader: EXPLORACIÓN iniciada — jugador libre")


# ═══════════════════════════════════════════════════════════════
#  DESAFÍOS DESDE PORTALES EDUCATIVOS
# ═══════════════════════════════════════════════════════════════

func _build_edu_worlds() -> void:
	for world_data: Dictionary in EDU_WORLDS:
		_build_single_world(world_data)


func _build_single_world(data: Dictionary) -> void:
	var ground_mat := StandardMaterial3D.new()
	ground_mat.albedo_color = data["color"]
	ground_mat.roughness = 0.8
	var ground := MeshInstance3D.new()
	ground.name = data["name"] + "_Ground"
	var box := BoxMesh.new()
	box.size = data["size"]
	ground.mesh = box
	ground.material_override = ground_mat
	ground.position = data["position"] + Vector3(0, -0.1, 0)
	add_child(ground)

	var body := StaticBody3D.new()
	body.name = data["name"] + "_Collision"
	var shape := CollisionShape3D.new()
	var shape_box := BoxShape3D.new()
	shape_box.size = data["size"]
	shape.shape = shape_box
	body.add_child(shape)
	body.position = data["position"] + Vector3(0, -0.1, 0)
	add_child(body)

	_add_edu_portal(data)

	var sign_mat := StandardMaterial3D.new()
	sign_mat.albedo_color = Color(0.4, 0.25, 0.15)
	var sign_mesh := MeshInstance3D.new()
	sign_mesh.name = data["name"] + "_Sign"
	var sign_box := BoxMesh.new()
	sign_box.size = Vector3(0.1, 0.8, 1.0)
	sign_mesh.mesh = sign_box
	sign_mesh.material_override = sign_mat
	sign_mesh.position = data["position"] + Vector3(0, 0.4, -data["size"].z / 2 - 1.5)
	add_child(sign_mesh)

	var label := Label3D.new()
	label.name = data["name"] + "_Label"
	label.text = data["entry_label"]
	label.font_size = 28
	label.outline_size = 4
	label.outline_modulate = Color.BLACK
	label.modulate = _gem_color(data["gem_type"])
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.005
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.position = data["position"] + Vector3(0, 2.0, 0.5)
	add_child(label)


func _add_edu_portal(data: Dictionary) -> void:
	var portal_pos: Vector3 = data["position"] + Vector3(0, 0, -data["size"].z / 2 - 1.0)
	var portal := Area3D.new()
	portal.name = data["name"] + "_Portal"
	portal.position = portal_pos
	portal.collision_layer = 4
	portal.collision_mask = 1

	var col_shape := CylinderShape3D.new()
	col_shape.radius = 1.5
	col_shape.height = 3.0
	var col := CollisionShape3D.new()
	col.shape = col_shape
	portal.add_child(col)

	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = _gem_color(data["gem_type"])
	ring_mat.roughness = 0.25
	ring_mat.metallic = 0.5
	var ring := MeshInstance3D.new()
	ring.name = "Ring"
	var ring_cyl := CylinderMesh.new()
	ring_cyl.top_radius = 0.08
	ring_cyl.bottom_radius = 0.08
	ring_cyl.height = 2.6
	ring.mesh = ring_cyl
	ring.material_override = ring_mat
	ring.rotation_degrees = Vector3(0, 0, 90)
	ring.position = Vector3(0, 1.5, 0)
	portal.add_child(ring)

	portal.body_entered.connect(_on_edu_world_entered.bind(data))
	add_child(portal)


func _on_edu_world_entered(body: Node3D, world_data: Dictionary) -> void:
	if not body is Player:
		return
	if _state != AppState.EXPLORATION:
		return

	_player_ref = body

	var db: Node = get_node_or_null("/root/LecturaContentDB")
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if not db or not rpm:
		return

	var activities: Array[Dictionary] = db.get_activities_for(
		world_data["world_key"],
		"",
		rpm.current_route,
		0, 5
	)

	if activities.is_empty():
		return

	activities.shuffle()
	var selected: Array[Dictionary] = activities.slice(0, min(5, activities.size()))
	_start_challenge(selected, 0)


func _start_challenge(challenges: Array[Dictionary], index: int) -> void:
	if index >= challenges.size():
		_speak_text("¡Completaste todos los desafíos de este mundo!")
		return

	_transition(AppState.CHALLENGE)

	var ui: ReadingChallengeUI = _reading_challenge_ui_scene.instantiate()
	_open_modal(ui)
	ui.setup(challenges[index])
	ui.challenge_completed.connect(_on_challenge_done.bind(challenges, index), CONNECT_ONE_SHOT)
	ui.closed.connect(_on_challenge_closed, CONNECT_ONE_SHOT)
	ui.request_hud_collapse.connect(_on_hud_collapse_request)


func _on_challenge_closed() -> void:
	_close_modal()
	_transition(AppState.EXPLORATION)


func _on_challenge_done(_activity_id: String, _was_correct: bool, _hints: int,
		challenges: Array[Dictionary], current_index: int) -> void:
	_close_modal()
	_start_challenge(challenges, current_index + 1)


# ═══════════════════════════════════════════════════════════════
#  PANEL DOCENTE
# ═══════════════════════════════════════════════════════════════

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept") and Input.is_key_pressed(KEY_T):
		_open_teacher_dashboard()

	if event.is_action_pressed("ui_accept") and Input.is_key_pressed(KEY_D):
		var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
		if rpm:
			rpm.reset_profile()
			_intro_completed = false
			_intro_started = false
			_diagnostic_completed = false
			_diagnostic_started = false
			_route_assigned = false
			_speak_text("Perfil reiniciado. Diagnóstico disponible al reiniciar.")

	if event.is_action_pressed("ui_accept") and Input.is_key_pressed(KEY_R):
		var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
		if rpm:
			rpm.try_route_advancement()
			_speak_text("Evaluando progreso...")


func _open_teacher_dashboard() -> void:
	var dash_ps: PackedScene = load("res://scenes/teacher_dashboard.tscn")
	if not dash_ps:
		return

	var dash: Node = dash_ps.instantiate()
	_open_modal(dash)
	if dash.has_method("open"):
		dash.open()
	dash.closed.connect(_on_teacher_dashboard_closed, CONNECT_ONE_SHOT)


func _on_teacher_dashboard_closed() -> void:
	_close_modal()


# ═══════════════════════════════════════════════════════════════
#  UTILIDADES
# ═══════════════════════════════════════════════════════════════

func _speak_text(text: String) -> void:
	if text.is_empty():
		return
	if OS.has_feature("web"):
		var escaped: String = text.replace("'", "\\'")
		var js: String = """
			var msg = new SpeechSynthesisUtterance('%s');
			msg.lang = 'es-CL';
			msg.rate = 0.7;
			window.speechSynthesis.speak(msg);
		""" % escaped
		JavaScriptBridge.eval(js)
	else:
		print("[Narración]: ", text)


func _gem_color(gem_type: String) -> Color:
	match gem_type:
		"red": return Color(1.0, 0.3, 0.3)
		"yellow": return Color(1.0, 0.85, 0.2)
		"green": return Color(0.2, 0.85, 0.3)
		"blue": return Color(0.3, 0.5, 1.0)
		"purple": return Color(0.7, 0.3, 1.0)
	return Color.WHITE
