class_name GemChallenge
extends Area3D

## Floating collectible gem in the open world.
## When touched by the Player, pauses the game and opens ChallengeUI.

@export var gem_name: String = "Gema Desconocida"
@export var question: String = "¿Pregunta?"
@export var answer: String = "respuesta"
@export var glow_color: Color = Color(0.3, 0.9, 1.0)
@export var gem_type: int = 0
@export var ability_desc: String = ""

var _idle_phase: float = 0.0
var _base_position: Vector3 = Vector3.ZERO

const CHALLENGE_UI_PATH: String = "res://scenes/challenge_ui.tscn"


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	_apply_material()
	_base_position = position


func _process(delta: float) -> void:
	_idle_phase += delta
	# Slow idle rotation to attract attention
	rotation.y += delta * 0.5
	# Gentle floating bob (0.3 units peak-to-peak, 1.5s period)
	position.y = _base_position.y + sin(_idle_phase * 1.5) * 0.25


func _apply_material() -> void:
	# Set gem material on all CSG children
	var mat := StandardMaterial3D.new()
	mat.albedo_color = glow_color
	mat.emission_enabled = true
	mat.emission = glow_color
	mat.emission_energy_multiplier = 2.0
	mat.roughness = 0.2
	mat.metallic = 0.6

	for child: Node in get_children():
		if child is CSGPolygon3D or child is CSGShape3D:
			child.material = mat


func _on_body_entered(body: Node3D) -> void:
	if not body is Player:
		return

	# Narration: announce gem type ability
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("play_narration"):
		am.play_narration(gem_name)
	
	# Also speak the ability type for pedagogical context
	var type_names: Array[String] = [
		"Gema Roja de los Sonidos",
		"Gema Amarilla de las Letras",
		"Gema Verde de las Palabras",
		"Gema Azul de la Comprensión",
		"Gema Púrpura de las Inferencias",
	]
	if gem_type >= 0 and gem_type < type_names.size() and ability_desc != "":
		_speak_text(type_names[gem_type] + ": " + ability_desc)

	# Pause the world
	get_tree().paused = true

	# Load and show challenge UI
	var challenge_ps: PackedScene = load(CHALLENGE_UI_PATH)
	var ui: ChallengeUI = challenge_ps.instantiate()
	add_child(ui)

	ui.setup(question, answer, gem_name, self)
	ui.challenge_completed.connect(_on_challenge_done)
	ui.challenge_cancelled.connect(_on_cancelled)


func _on_challenge_done(gem_name_str: String) -> void:
	# Report metric
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if sm and sm.has_method("report_gem_collected"):
		sm.report_gem_collected(gem_name_str)

	# Spin + shrink + disappear
	var tween: Tween = create_tween().set_parallel(true)

	# Spin around Y axis
	tween.tween_method(
		func(angle: float): rotation.y = angle,
		0.0, TAU, 0.6
	)

	# Shrink to nothing
	tween.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.6)

	tween.set_parallel(false)
	tween.tween_callback(queue_free)


func _on_cancelled() -> void:
	# Player hit Escape — just clean up
	# (game already unpaused by ChallengeUI)
	pass


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
