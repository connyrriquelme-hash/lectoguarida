class_name GoldenKitten
extends Area3D

## The Golden Kitten — final treasure of Lectoguarida.
## Now with a visible 3D golden kitten statuette!
##
## When the player approaches it for the first time, displays a
## congratulatory narrative message and records the milestone
## in ProgressionManager.

signal golden_kitten_approached

var _already_triggered: bool = false
var _idle_phase: float = 0.0
var _visual_root: Node3D = null


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	_build_visual()
	_setup_collision()


func _build_visual() -> void:
	"""Create a visible golden kitten statuette using composite primitives."""
	_visual_root = Node3D.new()
	_visual_root.name = "VisualRoot"
	add_child(_visual_root)
	
	# Build the kitten statuette
	GoldenToyBuilder.build_kitten(_visual_root)
	
	# Glow aura (semi-transparent sphere)
	var glow_mat := StandardMaterial3D.new()
	glow_mat.albedo_color = Color(1.0, 0.85, 0.3, 0.12)
	glow_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glow_mat.emission_enabled = true
	glow_mat.emission = Color(1.0, 0.85, 0.2)
	glow_mat.emission_energy_multiplier = 1.5
	
	var glow_mesh := MeshInstance3D.new()
	glow_mesh.name = "GlowAura"
	var glow_sphere := SphereMesh.new()
	glow_sphere.radius = 0.6
	glow_sphere.height = 1.2
	glow_mesh.mesh = glow_sphere
	glow_mesh.material_override = glow_mat
	glow_mesh.position = Vector3(0, 0.2, 0)
	_visual_root.add_child(glow_mesh)


func _setup_collision() -> void:
	"""Add collision shape if missing from scene."""
	if get_node_or_null("CollisionShape3D") == null:
		var shape := CollisionShape3D.new()
		shape.name = "CollisionShape3D"
		var sphere := SphereShape3D.new()
		sphere.radius = 1.5
		shape.shape = sphere
		add_child(shape)


func _process(delta: float) -> void:
	_idle_phase += delta
	if _visual_root:
		# Slow rotation
		_visual_root.rotation.y += delta * 0.3
		# Gentle float
		_visual_root.position.y = sin(_idle_phase * 1.2) * 0.15


func _on_body_entered(body: Node3D) -> void:
	if _already_triggered:
		return
	if not body is Player:
		return

	_already_triggered = true

	# Record in ProgressionManager
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm and pm.has_method("rescue_golden_kitten"):
		pm.rescue_golden_kitten()

	# Show narrative message
	_show_narrative()

	golden_kitten_approached.emit()


func _show_narrative() -> void:
	# Create a floating label that appears above the treasure
	var label := Label3D.new()
	label.name = "GoldenKittenMessage"
	label.text = "🌟 ¡Has encontrado al\nGatito Dorado! 🌟\n\nGracias a tu valentía y\nsabiduría, el guardián\nmágico ha vuelto a casa.\n\n+100 🪙 Monedas"
	label.font_size = 32
	label.outline_size = 4
	label.outline_modulate = Color.BLACK
	label.modulate = Color("#FFD166")  # gold
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.004
	label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	label.position = Vector3(0, 3.0, 0)
	add_child(label)

	# Auto-remove after a while
	var timer := Timer.new()
	timer.name = "MessageTimer"
	timer.one_shot = true
	timer.wait_time = 6.0
	timer.timeout.connect(label.queue_free)
	add_child(timer)
	timer.start()

	# Also show via HUD
	var hud_layer: CanvasLayer = get_node_or_null("/root/OpenWorld/HUDLayer")
	if hud_layer:
		var hud: Node = hud_layer.get_node_or_null("GameHUD")
		if hud and hud.has_method("show_narrative_message"):
			hud.show_narrative_message("🌟 ¡El Gatito Dorado ha sido rescatado! 🌟\nGracias por explorar toda la región.")

	# Play narrator
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("play_narration"):
		am.play_narration("Gatito Dorado")