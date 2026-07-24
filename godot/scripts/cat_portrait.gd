class_name CatPortrait
extends Node

## Renders a 3/4 view portrait of the cat into a Texture2D
## using a SubViewport. To be displayed in challenge UI.

const PORTRAIT_SIZE: Vector2i = Vector2i(160, 160)

var _viewport: SubViewport = null
var _viewport_container: SubViewportContainer = null
var _texture: ViewportTexture = null
var _cat_root: Node3D = null


func create_portrait() -> Texture2D:
	"""Build the cat model in a SubViewport and return its texture."""
	if _texture != null:
		return _texture

	_viewport_container = SubViewportContainer.new()
	_viewport_container.name = "CatPortraitContainer"
	_viewport_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_viewport_container.stretch = true
	_viewport_container.size = Vector2(PORTRAIT_SIZE)

	_viewport = SubViewport.new()
	_viewport.name = "CatPortraitViewport"
	_viewport.size = PORTRAIT_SIZE
	_viewport.transparent_bg = true
	_viewport.handle_input_locally = false
	_viewport.disable_3d = false
	_viewport_container.add_child(_viewport)
	add_child(_viewport_container)

	# ── Lighting ──
	var light := DirectionalLight3D.new()
	light.light_energy = 1.5
	light.light_indirect_energy = 0.3
	_viewport.add_child(light)
	light.look_at_from_position(Vector3(2, 3, 2), Vector3.ZERO)

	var fill := DirectionalLight3D.new()
	fill.light_energy = 0.4
	fill.light_indirect_energy = 0.2
	_viewport.add_child(fill)
	fill.look_at_from_position(Vector3(-1, 0.5, -1), Vector3.ZERO)

	# ── Build cat ──
	_cat_root = Node3D.new()
	_cat_root.name = "CatPortraitNode"
	_viewport.add_child(_cat_root)

	var builder := CatBuilder.new()

	# Helper lambda for materials
	var _make_mat := func(col: Color, rough: float = 0.6, metal: float = 0.0) -> StandardMaterial3D:
		var m := StandardMaterial3D.new()
		m.albedo_color = col
		m.roughness = rough
		m.metallic = metal
		return m

	# Body
	var body_mi := MeshInstance3D.new()
	body_mi.mesh = builder.build_body()
	body_mi.material_override = _make_mat.call(CatBuilder.COLOR_BODY, 0.6, 0.15)
	body_mi.position = Vector3(0, 0.3, -0.02)
	_cat_root.add_child(body_mi)

	# Belly
	var belly_mi := MeshInstance3D.new()
	belly_mi.mesh = builder.build_belly()
	belly_mi.material_override = _make_mat.call(CatBuilder.COLOR_BELLY, 0.7, 0.1)
	belly_mi.position = Vector3(0, 0.15, -0.02)
	_cat_root.add_child(belly_mi)

	# Head
	var head_mi := MeshInstance3D.new()
	head_mi.mesh = builder.build_head()
	head_mi.material_override = _make_mat.call(CatBuilder.COLOR_BODY, 0.55, 0.12)
	head_mi.position = Vector3(0, 0.52, -0.52)
	_cat_root.add_child(head_mi)

	# Ears
	var ear_mat: StandardMaterial3D = _make_mat.call(CatBuilder.COLOR_BODY, 0.5, 0.1)
	for side in [-1, 1]:
		var ear_mi := MeshInstance3D.new()
		ear_mi.mesh = builder.build_ear()
		ear_mi.material_override = ear_mat
		ear_mi.position = Vector3(side * 0.20, 0.68, -0.44)
		ear_mi.scale = Vector3(side, 2.0, 1.5)
		_cat_root.add_child(ear_mi)

	# Eyes
	var eye_mat := StandardMaterial3D.new()
	eye_mat.vertex_color_use_as_albedo = true
	eye_mat.roughness = 0.3
	for side in [-1, 1]:
		var eye_mi := MeshInstance3D.new()
		eye_mi.mesh = builder.build_eye(1.3)
		eye_mi.material_override = eye_mat
		eye_mi.position = Vector3(side * 0.12, 0.56, -0.76)
		_cat_root.add_child(eye_mi)

	# Nose
	var nose_mi := MeshInstance3D.new()
	nose_mi.mesh = builder.build_nose()
	nose_mi.position = Vector3(0, 0.49, -0.84)
	_cat_root.add_child(nose_mi)

	# Mouth
	var mouth_mi := MeshInstance3D.new()
	mouth_mi.mesh = builder.build_mouth()
	mouth_mi.position = Vector3(0, 0.47, -0.82)
	_cat_root.add_child(mouth_mi)

	# Whiskers
	var whisker_mat: StandardMaterial3D = _make_mat.call(CatBuilder.COLOR_WHISKER, 0.9, 0.0)
	for side in [-1, 1]:
		for level in range(3):
			var w := MeshInstance3D.new()
			w.mesh = builder.build_whisker(0.08 * (1.0 + level * 0.3), side)
			w.material_override = whisker_mat
			w.position = Vector3(side * 0.10, 0.46 - level * 0.015, -0.78)
			_cat_root.add_child(w)

	# Tail
	var tail_mi := MeshInstance3D.new()
	tail_mi.mesh = builder.build_tail()
	tail_mi.material_override = _make_mat.call(CatBuilder.COLOR_BODY, 0.6, 0.15)
	tail_mi.position = Vector3(0, 0.25, 0.42)
	_cat_root.add_child(tail_mi)

	# ── Camera ──
	var cam := Camera3D.new()
	cam.name = "PortraitCam"
	cam.current = true
	cam.near = 0.01
	cam.far = 10.0
	_viewport.add_child(cam)
	cam.position = Vector3(0.25, 0.65, 0.4)
	cam.look_at_from_position(cam.position, Vector3(0, 0.35, -0.3))

	# Restore original cat orientation: face -Z
	_cat_root.rotation_degrees = Vector3(0, 15, 0)

	# Allow rendering
	_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS

	# Force one frame render
	_texture = _viewport.get_texture()
	return _texture


func get_texture_rect() -> TextureRect:
	"""Return a TextureRect displaying the cat portrait."""
	var tex_rect := TextureRect.new()
	tex_rect.name = "CatPortraitTexture"
	tex_rect.texture = create_portrait()
	tex_rect.custom_minimum_size = Vector2(PORTRAIT_SIZE)
	tex_rect.expand_mode = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
	tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	return tex_rect


func get_container() -> SubViewportContainer:
	"""Return the SubViewportContainer for manual placement."""
	if _viewport_container == null:
		create_portrait()
	return _viewport_container
