class_name LoreTotem
extends Area3D

## Wisdom Totem — a glowing stone pillar that quizzes the player.

signal interact_requested(trivia_data: Dictionary)

@export var trivia_data: Dictionary = {}
@export var glow_color: Color = Color(0.8, 0.6, 0.2)

var solved: bool = false
var player_nearby: bool = false


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	_apply_materials()


func setup(data: Dictionary, clr: Color) -> void:
	trivia_data = data
	glow_color = clr
	_apply_materials()


func _apply_materials() -> void:
	# Glow material on the totem body and ring (CSG and MeshInstance3D)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = glow_color
	mat.emission_enabled = true
	mat.emission = glow_color
	mat.emission_energy_multiplier = 1.5
	mat.metallic = 0.4
	mat.roughness = 0.3

	for child: Node in get_children():
		if child is MeshInstance3D:
			child.material_override = mat
		elif child is CSGShape3D:
			child.material = mat


func _on_body_entered(body: Node3D) -> void:
	if solved:
		return
	if body is Player:
		player_nearby = true


func _on_body_exited(body: Node3D) -> void:
	if body is Player:
		player_nearby = false


func _process(_delta: float) -> void:
	if not player_nearby or solved:
		return
	# Wait for interact key (Enter/Space built-in)
	if Input.is_action_just_pressed("ui_accept"):
		_trigger_interaction()


func _trigger_interaction() -> void:
	solved = true

	# Auto-play the trivia title narration so the child hears the
	# narrator greet them and introduce the totem's topic immediately.
	var title: String = trivia_data.get("title", "Tótem de Sabiduría")
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("play_narration"):
		am.play_narration(title)

	# Dim the glow to show it's been solved
	for child: Node in get_children():
		if child is MeshInstance3D:
			var mat: StandardMaterial3D = child.material_override as StandardMaterial3D
			if mat:
				mat.emission_energy_multiplier = 0.2
		elif child is CSGShape3D:
			var mat: StandardMaterial3D = child.material as StandardMaterial3D
			if mat:
				mat.emission_energy_multiplier = 0.2

	# Emit signal for the UI
	interact_requested.emit(trivia_data)