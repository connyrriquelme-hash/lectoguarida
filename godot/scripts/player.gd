class_name Player
extends CharacterBody3D

## Feline-perspective player controller — a Calico Cat.
##
## Uses a SpringArm3D + Camera3D for low-to-ground "cat's eye"
## perspective.  Mouse drag orbits the camera around the cat.
## Accessories (skins, sunglasses, bandana) are managed by
## CatCustomizer kept as a child node.

const SPEED: float = 5.0
const JUMP_VELOCITY: float = 6.0
const GRAVITY: float = 15.0
const MOUSE_SENSITIVITY: float = 0.0025
const CAMERA_Y_OFFSET: float = 0.85   # ~cat shoulder height
const CAMERA_LENGTH: float = 3.0      # arm length behind the cat

var _yaw: float = 0.0       # horizontal camera angle
var _pitch: float = -5.0    # vertical camera angle (degrees, slight downward)
var _mouse_dragging: bool = false
var _anim_time: float = 0.0  # animation clock
var _jump_just_pressed: bool = false  # flag para joystick jump

var spring_arm: SpringArm3D
var cat_customizer: Node

# Animation references (filled in _rebuild_cat_body)
var _tail_node: Node3D = null
var _eye_nodes: Array[MeshInstance3D] = []
var _head_yaw: float = 0.0  # for head turning


func _ready() -> void:
	# ── Create SpringArm3D at runtime ──
	spring_arm = get_node_or_null("SpringArm3D") as SpringArm3D
	if not spring_arm:
		spring_arm = SpringArm3D.new()
		spring_arm.name = "SpringArm3D"
		add_child(spring_arm)
	_setup_camera()

	# ── Create CatCustomizer at runtime ──
	cat_customizer = get_node_or_null("CatCustomizer")
	if not cat_customizer:
		cat_customizer = Node.new()
		cat_customizer.name = "CatCustomizer"
		add_child(cat_customizer)
		var script: Script = load("res://scripts/cat_customizer.gd")
		if script:
			cat_customizer.set_script(script)
	_add_accessories()


func _setup_camera() -> void:
	spring_arm.spring_length = CAMERA_LENGTH
	spring_arm.position = Vector3(0.0, CAMERA_Y_OFFSET, 0.0)
	spring_arm.collision_mask = 0              # No collision — keeps camera at full length
	spring_arm.add_excluded_object(get_rid())  # don't collide with self

	# Floor detection configuration
	up_direction = Vector3.UP
	floor_stop_on_slope = true
	floor_snap_length = 0.15
	floor_max_angle = 0.78  # ~45 degrees in radians

	# Camera3D as child of SpringArm3D
	var cam := spring_arm.get_node_or_null("Camera3D") as Camera3D
	if not cam:
		cam = Camera3D.new()
		cam.name = "Camera3D"
		spring_arm.add_child(cam)
	cam.current = true
	cam.far = 500.0

	# Slight downward tilt so we look over the cat's shoulder
	spring_arm.rotation_degrees.x = _pitch


func _rebuild_cat_body() -> void:
	"""Replace primitive cat body with procedural 3D model from CatBuilder."""
	# Remove ALL old CatBody nodes completely (CSG or otherwise)
	while true:
		var old_body: Node3D = get_node_or_null("CatBody") as Node3D
		if not old_body:
			break
		remove_child(old_body)
		old_body.queue_free()
	# Also remove any CatBody_CSG remnants
	while true:
		var old_csg: Node3D = get_node_or_null("CatBody_CSG") as Node3D
		if not old_csg:
			break
		remove_child(old_csg)
		old_csg.queue_free()

	var builder := CatBuilder.new()
	var cat_body := Node3D.new()
	cat_body.name = "CatBody"
	add_child(cat_body)

	# ── Body ──
	var body_mi := MeshInstance3D.new()
	body_mi.name = "Torso"
	body_mi.mesh = builder.build_body()
	body_mi.material_override = _make_mat(CatBuilder.COLOR_BODY, 0.6, 0.15)
	body_mi.position = Vector3(0, 0.3, -0.02)
	cat_body.add_child(body_mi)

	# ── Belly ──
	var belly_mi := MeshInstance3D.new()
	belly_mi.name = "Belly"
	belly_mi.mesh = builder.build_belly()
	belly_mi.material_override = _make_mat(CatBuilder.COLOR_BELLY, 0.7, 0.1)
	belly_mi.position = Vector3(0, 0.15, -0.02)
	cat_body.add_child(belly_mi)

	# ── Head ──
	var head_mi := MeshInstance3D.new()
	head_mi.name = "Head"
	head_mi.mesh = builder.build_head()
	head_mi.material_override = _make_mat(CatBuilder.COLOR_BODY, 0.55, 0.12)
	head_mi.position = Vector3(0, 0.52, -0.52)
	cat_body.add_child(head_mi)

	# ── Ears — BIG triangles visible from behind ──
	# Build ear as a simple triangle mesh for visibility
	var ear_mat := _make_mat(CatBuilder.COLOR_BODY, 0.5, 0.1)
	for side in [-1, 1]:
		var ear_mi := MeshInstance3D.new()
		ear_mi.name = "EarL" if side < 0 else "EarR"
		ear_mi.mesh = builder.build_ear()
		ear_mi.material_override = ear_mat
		ear_mi.position = Vector3(side * 0.20, 0.68, -0.44)
		ear_mi.scale = Vector3(side, 2.0, 1.5)
		cat_body.add_child(ear_mi)

	# ── Eyes — use vertex colors ──
	var eye_mat := StandardMaterial3D.new()
	eye_mat.vertex_color_use_as_albedo = true
	eye_mat.roughness = 0.3
	eye_mat.metallic = 0.0
	for side in [-1, 1]:
		var eye_mi := MeshInstance3D.new()
		eye_mi.name = "EyeL" if side < 0 else "EyeR"
		eye_mi.mesh = builder.build_eye(1.3)
		eye_mi.material_override = eye_mat
		eye_mi.position = Vector3(side * 0.12, 0.56, -0.76)
		cat_body.add_child(eye_mi)
		_eye_nodes.append(eye_mi)

	# ── Nose ──
	var nose_mi := MeshInstance3D.new()
	nose_mi.name = "Nose"
	nose_mi.mesh = builder.build_nose()
	nose_mi.position = Vector3(0, 0.49, -0.84)
	cat_body.add_child(nose_mi)

	# ── Mouth ──
	var mouth_mi := MeshInstance3D.new()
	mouth_mi.name = "Mouth"
	mouth_mi.mesh = builder.build_mouth()
	mouth_mi.position = Vector3(0, 0.47, -0.82)
	cat_body.add_child(mouth_mi)

	# ── Whiskers (3 per side) ──
	var whisker_mat := _make_mat(CatBuilder.COLOR_WHISKER, 0.9, 0.0)
	for side in [-1, 1]:
		var side_name: String = "L" if side < 0 else "R"
		for level in range(3):
			var w := MeshInstance3D.new()
			w.name = "Whisker_" + side_name + "_" + str(level)
			w.mesh = builder.build_whisker(0.10, side)
			w.material_override = whisker_mat
			var y_off: float = 0.48 + level * 0.02
			w.position = Vector3(side * 0.07, y_off, -0.78)
			w.rotation_degrees = Vector3(0, side * (15 + level * 10), level * 5)
			cat_body.add_child(w)

	# ── Legs (4x) ──
	var leg_mat := _make_mat(CatBuilder.COLOR_LEGS, 0.65, 0.1)
	for leg_data in [{"n":"LegFL","x":-0.14,"z":-0.25}, {"n":"LegFR","x":0.14,"z":-0.25}, {"n":"LegBL","x":-0.14,"z":0.22}, {"n":"LegBR","x":0.14,"z":0.22}]:
		var leg_mi := MeshInstance3D.new()
		leg_mi.name = leg_data["n"]
		leg_mi.mesh = builder.build_leg()
		leg_mi.material_override = leg_mat
		leg_mi.position = Vector3(leg_data["x"], 0.03, leg_data["z"])
		cat_body.add_child(leg_mi)

	# ── Tail (prominent from behind) ──
	_tail_node = MeshInstance3D.new()
	_tail_node.name = "Tail"
	_tail_node.mesh = builder.build_tail()
	_tail_node.material_override = _make_mat(CatBuilder.COLOR_BODY, 0.6, 0.1)
	_tail_node.position = Vector3(0, 0.35, 0.55)
	_tail_node.rotation_degrees = Vector3(60, 10, 0)
	cat_body.add_child(_tail_node)

	# Move CatBody before CollisionShape3D
	var coll: Node = get_node_or_null("CollisionShape3D")
	if coll:
		move_child(cat_body, coll.get_index())


func _make_mat(col: Color, roughness: float, metallic: float) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = roughness
	mat.metallic = metallic
	return mat


# ── _add_parts_to_body removed (replaced by CatBuilder in _rebuild_cat_body) ──
func _old_add_parts_to_body_body_not_used(body: Node3D) -> void:
	var ORANGE := StandardMaterial3D.new()
	ORANGE.albedo_color = Color(1, 0.6, 0.15)
	ORANGE.roughness = 0.6
	var CREAM := StandardMaterial3D.new()
	CREAM.albedo_color = Color(1, 0.95, 0.85)
	CREAM.roughness = 0.6
	var BROWN := StandardMaterial3D.new()
	BROWN.albedo_color = Color(1, 0.8, 0.5)
	BROWN.roughness = 0.6

	# Torso: tall orange cylinder, rotated 90° on Z
	var torso := MeshInstance3D.new()
	torso.name = "Torso"
	var tmesh := CylinderMesh.new()
	tmesh.top_radius = 0.22; tmesh.bottom_radius = 0.22; tmesh.height = 0.85
	torso.mesh = tmesh
	torso.material_override = ORANGE
	torso.position = Vector3(0, 0.48, 0)
	torso.rotation_degrees = Vector3(0, 0, 90)
	body.add_child(torso)

	# Head: orange sphere
	var head := MeshInstance3D.new()
	head.name = "Head"
	var hmesh := SphereMesh.new()
	hmesh.radius = 0.2; hmesh.height = 0.2
	head.mesh = hmesh
	head.material_override = ORANGE
	head.position = Vector3(0, 0.44, -0.52)
	body.add_child(head)

	# Belly: cream sphere
	var belly := MeshInstance3D.new()
	belly.name = "Belly"
	var bmesh := SphereMesh.new()
	bmesh.radius = 0.16; bmesh.height = 0.16
	belly.mesh = bmesh
	belly.material_override = CREAM
	belly.position = Vector3(0, 0.35, 0.05)
	body.add_child(belly)

	# Four legs: brown cylinders
	for data in [{"n":"LegFL","p":Vector3(-0.12,0.16,-0.22)}, {"n":"LegFR","p":Vector3(0.12,0.16,-0.22)}, {"n":"LegBL","p":Vector3(-0.12,0.16,0.22)}, {"n":"LegBR","p":Vector3(0.12,0.16,0.22)}]:
		var leg := MeshInstance3D.new()
		leg.name = data["n"]
		var lmesh := CylinderMesh.new()
		lmesh.top_radius = 0.07; lmesh.bottom_radius = 0.07; lmesh.height = 0.32
		leg.mesh = lmesh
		leg.material_override = BROWN
		leg.position = data["p"]
		body.add_child(leg)

	# Tail: orange angled cylinder
	var tail := MeshInstance3D.new()
	tail.name = "Tail"
	var tmesh2 := CylinderMesh.new()
	tmesh2.top_radius = 0.05; tmesh2.bottom_radius = 0.05; tmesh2.height = 0.45
	tail.mesh = tmesh2
	tail.material_override = ORANGE
	tail.position = Vector3(-0.08, 0.55, 0.38)
	tail.rotation_degrees = Vector3(30, 15, 0)
	body.add_child(tail)

	# Ears: two small orange cylinders (PROTECTED)
	for side in [-1, 1]:
		var ear := MeshInstance3D.new()
		ear.name = "EarL" if side < 0 else "EarR"
		var emesh := CylinderMesh.new()
		emesh.top_radius = 0.03; emesh.bottom_radius = 0.03; emesh.height = 0.18
		ear.mesh = emesh
		ear.material_override = ORANGE
		ear.position = Vector3(side * 0.1, 0.58, -0.55)
		body.add_child(ear)


func _add_accessories() -> void:
	# First, rebuild cat body as procedural 3D model
	_rebuild_cat_body()

	# Delegate to CatCustomizer if present
	if cat_customizer and cat_customizer.has_method("apply_starting_outfit"):
		cat_customizer.apply_starting_outfit()
		return

	# Fallback: classic bandana + sunglasses (from original player.gd)
	var cat_body: Node3D = get_node_or_null("CatBody") as Node3D
	if not cat_body:
		return

	# ── Cool dark sunglasses ──
	var sg_mat := _make_mat(Color(0.1, 0.1, 0.15), 0.15, 0.5)
	sg_mat.emission_enabled = true
	sg_mat.emission = Color(0.05, 0.05, 0.1)
	sg_mat.emission_energy_multiplier = 0.3

	var lens_size := Vector3(0.08, 0.06, 0.02)
	for side_info in [{"n":"Sunglass_L","x":-0.08}, {"n":"Sunglass_R","x":0.08}]:
		var lens_mi := MeshInstance3D.new()
		lens_mi.name = side_info["n"]
		var lens_box := BoxMesh.new()
		lens_box.size = lens_size
		lens_mi.mesh = lens_box
		lens_mi.material_override = sg_mat
		lens_mi.position = Vector3(side_info["x"], 0.55, -0.74)
		cat_body.add_child(lens_mi)

	var bridge_mi := MeshInstance3D.new()
	bridge_mi.name = "Sunglass_Bridge"
	var bridge_box := BoxMesh.new()
	bridge_box.size = Vector3(0.08, 0.02, 0.02)
	bridge_mi.mesh = bridge_box
	bridge_mi.material_override = sg_mat
	bridge_mi.position = Vector3(0, 0.55, -0.74)
	cat_body.add_child(bridge_mi)

	# ── Small bandana / pañuelo at neck (not covering body) ──
	var band_mat := _make_mat(Color(0.85, 0.12, 0.12), 0.55, 0.0)

	var band_ring_mi := MeshInstance3D.new()
	band_ring_mi.name = "Bandana_Ring"
	var band_cyl := CylinderMesh.new()
	band_cyl.top_radius = 0.18
	band_cyl.bottom_radius = 0.18
	band_cyl.height = 0.04
	band_ring_mi.mesh = band_cyl
	band_ring_mi.material_override = band_mat
	# Neck area (thin ring, not covering body)
	band_ring_mi.position = Vector3(0, 0.32, -0.30)
	cat_body.add_child(band_ring_mi)

	for tail_info in [{"n":"Bandana_Tail","x":-0.06,"r":20}, {"n":"Bandana_Tail2","x":0.06,"r":-20}]:
		var tail_mi := MeshInstance3D.new()
		tail_mi.name = tail_info["n"]
		var tail_box := BoxMesh.new()
		tail_box.size = Vector3(0.03, 0.10, 0.02)
		tail_mi.mesh = tail_box
		tail_mi.material_override = band_mat
		tail_mi.position = Vector3(tail_info["x"], 0.18, -0.30)
		tail_mi.rotation_degrees = Vector3(0, 0, tail_info["r"])
		cat_body.add_child(tail_mi)


func _physics_process(delta: float) -> void:
	# ── Jump ──
	if is_on_floor():
		_jump_just_pressed = false  # reset flag when grounded
		if Input.is_action_just_pressed("jump"):
			velocity.y = JUMP_VELOCITY

	# Gravity — pull down when not on floor
	if not is_on_floor():
		velocity.y -= GRAVITY * delta

	# ── Movement input ──
	# Try game-specific actions first, fall back to UI actions
	var input_dir: Vector2
	if InputMap.has_action("move_left"):
		input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	else:
		input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

	# Movement relative to camera yaw so forward follows where the camera looks
	var forward: Vector3 = Vector3(-sin(deg_to_rad(_yaw)), 0, -cos(deg_to_rad(_yaw))).normalized()
	var right: Vector3 = Vector3(cos(deg_to_rad(_yaw)), 0, -sin(deg_to_rad(_yaw))).normalized()

	var direction: Vector3 = (forward * input_dir.y + right * input_dir.x).normalized()

	if direction.length() > 0.01:
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
		# Face movement direction
		look_at(position + direction, Vector3.UP)
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.z = move_toward(velocity.z, 0, SPEED)

	move_and_slide()

	# ── Interact ──
	if InputMap.has_action("interact") and Input.is_action_just_pressed("interact"):
		_on_interact()
	elif InputMap.has_action("ui_interact") and Input.is_action_just_pressed("ui_interact"):
		_on_interact()


func _process(delta: float) -> void:
	_anim_time += delta
	var is_moving: bool = velocity.length() > 0.1
	var cat_body_node: Node3D = get_node_or_null("CatBody")
	
	# ── Walk cycle: body bob ──
	if cat_body_node:
		if is_moving:
			# Walking bounce: vertical bob + subtle side sway
			var walk_freq: float = 8.0  # steps per second
			var bob_offset: float = sin(_anim_time * walk_freq) * 0.015
			var sway_offset: float = sin(_anim_time * walk_freq * 0.5) * 0.008
			cat_body_node.position.y = bob_offset
			cat_body_node.rotation.z = sway_offset
		else:
			# Idle breathing: gentle body rise/fall
			var breath: float = sin(_anim_time * 1.8) * 0.004
			cat_body_node.position.y = breath
			cat_body_node.rotation.z = lerp(cat_body_node.rotation.z, 0.0, 0.1)
	
	# ── Tail wag ──
	if _tail_node:
		if is_moving:
			# Faster, wider wag when walking
			var wag: float = sin(_anim_time * 6.0) * 0.18
			_tail_node.rotation.z = wag
		else:
			# Slower, gentler wag when idle
			var wag: float = sin(_anim_time * 2.5) * 0.10
			_tail_node.rotation.z = wag
	
	# ── Blink ──
	var blink_cycle: float = fmod(_anim_time, 4.0)  # every 4 seconds
	var blink: bool = blink_cycle > 3.8  # 0.2s blink
	for eye in _eye_nodes:
		eye.visible = not blink
	
	# ── Subtle head turn ──
	if is_moving:
		_head_yaw = lerp(_head_yaw, 0.0, 0.1)
	else:
		_head_yaw = lerp(_head_yaw, sin(_anim_time * 0.5) * 0.05, 0.05)


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			_mouse_dragging = event.pressed
			if not _mouse_dragging:
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

	elif event is InputEventMouseMotion and _mouse_dragging:
		_yaw -= event.relative.x * MOUSE_SENSITIVITY
		_pitch = clamp(_pitch - event.relative.y * MOUSE_SENSITIVITY, -30.0, 20.0)

		spring_arm.rotation_degrees.x = _pitch
		spring_arm.rotation_degrees.y = _yaw

	# Toggle mouse capture mode with right-click for precise rotation
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
			else:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


# ── Public API ──

func get_camera() -> Camera3D:
	return spring_arm.get_node_or_null("Camera3D") as Camera3D


func activate_camera() -> void:
	# Force the SpringArm camera to be the active one.
	var cam: Camera3D = spring_arm.get_node_or_null("Camera3D") as Camera3D
	if cam:
		cam.current = true


func get_spring_arm() -> SpringArm3D:
	return spring_arm


func set_camera_rotation(yaw: float, pitch: float) -> void:
	"""Called from MobileControlsManager for touch camera rotation."""
	_yaw = yaw
	_pitch = pitch
	var spring: Node = get_node_or_null("SpringArm3D")
	if spring:
		spring.rotation_degrees.x = _pitch
		spring.rotation_degrees.y = _yaw


func _on_interact() -> void:
	"""Interactuar con objetos cercanos."""
	# Raycast forward to detect interactive objects
	var space_state: PhysicsDirectSpaceState3D = get_world_3d().direct_space_state
	var cam: Camera3D = spring_arm.get_node_or_null("Camera3D") as Camera3D if spring_arm else null
	if not cam:
		return
	var from: Vector3 = cam.global_position
	var to: Vector3 = from - cam.global_transform.basis.z * 5.0
	var query := PhysicsRayQueryParameters3D.create(from, to, 1)
	var result: Dictionary = space_state.intersect_ray(query)
	if not result.is_empty():
		var collider: Node = result.get("collider") as Node
		if collider and collider.has_method("interact"):
			collider.interact()

	# Also check Area3D triggers nearby
	var areas: Array[Area3D] = []
	for child in get_children():
		if child is Area3D:
			areas.append(child)
	for area in areas:
		if area.has_method("interact"):
			area.interact()
