extends CanvasLayer

## Gestiona los controles táctiles móviles: joystick + botones.
##
## Se muestra automáticamente en dispositivos táctiles.
## Se oculta en escritorio (a menos que emulación táctil esté activa).
## Soporta multitouch: caminar + rotar cámara + saltar simultáneamente.
##
## Señales de control: emite acciones de Input análogas a WASD + espacio + E.
## El jugador en _physics_process usa Input.get_vector("move_left", "move_right", etc.)

signal jump_pressed()
signal jump_released()
signal interact_pressed()

const BTN_SIZE: float = 72.0
const BTN_MARGIN: float = 16.0
const BTN_OPACITY: float = 0.3

var virtual_joystick: VirtualJoystick = null
var jump_button: Button = null
var interact_button: Button = null
var pause_button: Button = null
var _is_visible: bool = false
var _camera_drag_start: Vector2 = Vector2.ZERO
var _camera_dragging: bool = false
var _camera_sensitivity: float = 0.005
var _camera_inverted: bool = false
var _player_ref: Node = null

# Delegación de cámara
var _camera_yaw: float = 0.0
var _camera_pitch: float = -5.0


func _ready() -> void:
	layer = 5
	process_mode = Node.PROCESS_MODE_WHEN_PAUSED

	# Auto-detectar si mostrar controles táctiles
	var is_touch := OS.has_feature("mobile") or OS.has_feature("android") or OS.has_feature("ios")
	var emulate_touch: bool = ProjectSettings.get_setting("input_devices/pointing/emulate_touch", false)
	if not is_touch and not emulate_touch:
		# En escritorio — esperar a que se active manualmente (modo prueba)
		hide_controls()
		return

	_build_controls()
	show_controls()


func _build_controls() -> void:
	"""Construir joystick + botones en runtime."""
	var viewport_size: Vector2 = get_viewport().get_visible_rect().size

	# ── Joystick ──
	virtual_joystick = VirtualJoystick.new()
	virtual_joystick.name = "Joystick"
	add_child(virtual_joystick)
	virtual_joystick.joystick_moved.connect(_on_joystick_moved)
	virtual_joystick.joystick_released.connect(_on_joystick_released)

	# ── Botón Saltar (esquina inferior derecha) ──
	jump_button = _make_touch_button(
		"⬆",
		viewport_size.x - BTN_MARGIN - BTN_SIZE,
		viewport_size.y - BTN_MARGIN - BTN_SIZE,
		BTN_SIZE, BTN_SIZE
	)
	jump_button.pressed.connect(_on_jump_pressed)
	jump_button.button_down.connect(_on_jump_down)
	jump_button.button_up.connect(_on_jump_up)

	# ── Botón Interactuar (junto a Saltar) ──
	interact_button = _make_touch_button(
		"✋",
		viewport_size.x - BTN_MARGIN * 2 - BTN_SIZE * 2 - 8,
		viewport_size.y - BTN_MARGIN - BTN_SIZE,
		BTN_SIZE, BTN_SIZE
	)
	interact_button.pressed.connect(_on_interact_pressed)

	# ── Botón Pausa (esquina superior derecha) ──
	pause_button = _make_touch_button(
		"⏸",
		viewport_size.x - BTN_MARGIN - 36,
		BTN_MARGIN,
		36, 36
	)
	pause_button.pressed.connect(_on_pause_pressed)

	# Área de rotación de cámara (mitad derecha, sin botones)
	# Se maneja por _input directo


func _make_touch_button(text: String, x: float, y: float, w: float, h: float) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.add_theme_font_size_override("font_size", int(min(w, h) * 0.4))
	btn.position = Vector2(x, y)
	btn.size = Vector2(w, h)
	btn.mouse_filter = Control.MOUSE_FILTER_STOP
	btn.focus_mode = Control.FOCUS_NONE
	btn.add_theme_color_override("font_color", Color(0.9, 0.95, 1.0, 0.85))
	btn.add_theme_color_override("font_hover_color", Color(1, 1, 1, 1))
	btn.add_theme_stylebox_override("normal", _make_style(BTN_OPACITY))
	btn.add_theme_stylebox_override("hover", _make_style(BTN_OPACITY * 1.5))
	btn.add_theme_stylebox_override("pressed", _make_style(BTN_OPACITY * 2.0))
	add_child(btn)
	return btn


func _make_style(alpha: float) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.2, 0.25, 0.35, alpha)
	sb.corner_radius = 12
	sb.corner_detail = 6
	return sb


func _input(event: InputEvent) -> void:
	if not _is_visible:
		return

	# Cámara: arrastrar en la mitad derecha de la pantalla (evitando botones)
	if event is InputEventScreenTouch:
		if event.pressed:
			var vsize: Vector2 = get_viewport().get_visible_rect().size
			# Solo en mitad derecha, no sobre botones
			if event.position.x > vsize.x * 0.5:
				if not _is_over_button(event.position):
					_camera_dragging = true
					_camera_drag_start = event.position
		else:
			_camera_dragging = false

	elif event is InputEventScreenDrag and _camera_dragging:
		var delta: Vector2 = event.position - _camera_drag_start
		var sens: float = _camera_sensitivity * (-1.0 if _camera_inverted else 1.0)
		_camera_yaw -= delta.x * sens
		_camera_pitch = clampf(_camera_pitch - delta.y * sens, -30.0, 20.0)
		_camera_drag_start = event.position

		if _player_ref and _player_ref.has_method("set_camera_rotation"):
			_player_ref.set_camera_rotation(_camera_yaw, _camera_pitch)
		elif _player_ref:
			# Fallback: usar SpringArm de player.gd
			var spring: Node = _player_ref.get_node_or_null("SpringArm3D")
			if spring:
				spring.rotation_degrees.x = _camera_pitch
				spring.rotation_degrees.y = _camera_yaw


func _is_over_button(pos: Vector2) -> bool:
	for btn in [jump_button, interact_button, pause_button]:
		if btn and btn.get_global_rect().has_point(pos):
			return true
	return false


# ── Señales del joystick ──

func _on_joystick_moved(vector: Vector2) -> void:
	# Traducir a acciones de Input para que player.gd las use
	if abs(vector.x) > 0.1:
		Input.action_press("move_right" if vector.x > 0 else "move_left", abs(vector.x))
	if abs(vector.y) > 0.1:
		Input.action_press("move_back" if vector.y > 0 else "move_forward", abs(vector.y))


func _on_joystick_released() -> void:
	Input.action_release("move_left")
	Input.action_release("move_right")
	Input.action_release("move_forward")
	Input.action_release("move_back")


# ── Señales de botones ──

func _on_jump_down() -> void:
	Input.action_press("jump")

func _on_jump_up() -> void:
	Input.action_release("jump")
	jump_released.emit()

func _on_jump_pressed() -> void:
	jump_pressed.emit()

func _on_interact_pressed() -> void:
	Input.action_press("interact")
	interact_pressed.emit()
	# Liberar después de un frame
	await get_tree().process_frame
	Input.action_release("interact")


func _on_pause_pressed() -> void:
	Input.action_press("ui_cancel")
	await get_tree().process_frame
	Input.action_release("ui_cancel")


# ── Visibilidad ──

func show_controls() -> void:
	_is_visible = true
	visible = true
	if virtual_joystick:
		virtual_joystick.show_joystick()
	set_process_input(true)


func hide_controls() -> void:
	_is_visible = false
	visible = false
	if virtual_joystick:
		virtual_joystick.hide_joystick()
	set_process_input(false)
	# Liberar acciones retenidas
	if InputMap.has_action("move_left"):
		Input.action_release("move_left")
		Input.action_release("move_right")
		Input.action_release("move_forward")
		Input.action_release("move_back")
	else:
		Input.action_release("ui_left")
		Input.action_release("ui_right")
		Input.action_release("ui_up")
		Input.action_release("ui_down")
	if InputMap.has_action("jump"):
		Input.action_release("jump")


func set_player_ref(player: Node) -> void:
	_player_ref = player
	if player:
		# Obtener ángulos de cámara actuales
		var spring: Node = player.get_node_or_null("SpringArm3D")
		if spring:
			_camera_yaw = spring.rotation_degrees.y
			_camera_pitch = spring.rotation_degrees.x


func set_camera_sensitivity(val: float) -> void:
	_camera_sensitivity = val


func set_camera_inverted(inverted: bool) -> void:
	_camera_inverted = inverted


func is_controls_visible() -> bool:
	return _is_visible
