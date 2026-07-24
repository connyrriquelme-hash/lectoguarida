extends Control

## Joystick virtual táctil para móviles.
##
## Soportes:
## - Fijo (anclado en esquina inferior izquierda) o flotante (aparece donde tocas)
## - Deadzone configurable
## - Movimiento proporcional a distancia del dedo
## - Retorno suave al centro
## - Tamaño y opacidad configurables
## - Multitouch: joystick + cámara + botones simultáneos

signal joystick_moved(vector: Vector2)       # Vector normalizado (-1 a 1)
signal joystick_released()

const MIN_TOUCH_SIZE: float = 56.0   # px mínimo táctil

# ── Configuración ──
var fixed_mode: bool = true          # true = fijo, false = flotante
var joystick_size: float = 120.0     # diámetro exterior en px
var knob_size: float = 48.0          # diámetro del knob en px
var deadzone: float = 0.15           # zona muerta (0.0-1.0)
var opacity: float = 0.35            # opacidad base
var edge_margin: float = 24.0        # margen desde borde de pantalla

# ── Interno ──
var _touch_index: int = -1
var _touch_pos: Vector2 = Vector2.ZERO
var _knob_pos: Vector2 = Vector2.ZERO
var _output: Vector2 = Vector2.ZERO
var _is_active: bool = false
var _bg_rect: Rect2 = Rect2()        # Área táctil del joystick
var _knob_rect: Rect2 = Rect2()
var _start_pos: Vector2 = Vector2.ZERO

# ── Visual ──
var _bg_draw: ColorRect = null
var _knob_draw: ColorRect = null


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_initialize_position()
	_build_visual()
	_update_opacity()


func _initialize_position() -> void:
	"""Posicionar el joystick en la esquina inferior izquierda."""
	var viewport_size: Vector2 = get_viewport_rect().size
	var margin: float = edge_margin
	var pos_x: float = margin + joystick_size * 0.5
	var pos_y: float = viewport_size.y - margin - joystick_size * 0.5
	_start_pos = Vector2(pos_x, pos_y)
	# Offset por si hay notch/isla dinámica
	if DisplayServer.get_name() == "Android":
		var safe: Rect2i = DisplayServer.get_display_safe_area()
		_start_pos.x = max(_start_pos.x, safe.position.x + margin + joystick_size * 0.5)
		_start_pos.y = min(_start_pos.y, safe.position.y + safe.size.y - margin - joystick_size * 0.5)

	_bg_rect = Rect2(_start_pos - Vector2(joystick_size, joystick_size) * 0.5,
		Vector2(joystick_size, joystick_size))
	_knob_pos = _start_pos


func _build_visual() -> void:
	"""Create visual elements for the joystick."""
	if _bg_draw != null:
		_bg_draw.queue_free()
	if _knob_draw != null:
		_knob_draw.queue_free()

	_bg_draw = ColorRect.new()
	_bg_draw.name = "JoystickBG"
	_bg_draw.color = Color(0.3, 0.3, 0.4, 0.25)
	_bg_draw.size = Vector2(joystick_size, joystick_size)
	_bg_draw.position = _bg_rect.position
	add_child(_bg_draw)

	# Borde del joystick
	var border := ColorRect.new()
	border.name = "JoystickBorder"
	border.color = Color(0.5, 0.5, 0.6, 0.3)
	border.size = Vector2(joystick_size + 4, joystick_size + 4)
	border.position = _bg_rect.position - Vector2(2, 2)
	add_child(border)

	_knob_draw = ColorRect.new()
	_knob_draw.name = "JoystickKnob"
	_knob_draw.color = Color(0.7, 0.7, 0.8, 0.5)
	_knob_draw.size = Vector2(knob_size, knob_size)
	_knob_draw.position = _knob_pos - Vector2(knob_size, knob_size) * 0.5
	add_child(_knob_draw)


func _update_opacity() -> void:
	if _bg_draw:
		_bg_draw.color.a = opacity * 0.7
	if _knob_draw:
		_knob_draw.color.a = opacity


func _input(event: InputEvent) -> void:
	if not OS.has_feature("mobile") and not ProjectSettings.get_setting("input_devices/pointing/emulate_touch", false):
		return

	if event is InputEventScreenTouch:
		if event.pressed and not _is_active:
			# Detectar si el toque está en el área del joystick (mitad izquierda de la pantalla)
			if event.position.x < get_viewport_rect().size.x * 0.45:
				_start_touch(event)
		elif not event.pressed and _touch_index == event.index:
			_end_touch()

	elif event is InputEventScreenDrag:
		if _is_active and _touch_index == event.index:
			_drag_touch(event.position)


func _start_touch(event: InputEventScreenTouch) -> void:
	_touch_index = event.index
	_is_active = true
	_touch_pos = event.position

	if fixed_mode:
		# Joystick fijo: mantener posición, calcular offset
		pass
	else:
		# Joystick flotante: mover centro al punto de toque
		_start_pos = event.position
		_bg_rect = Rect2(_start_pos - Vector2(joystick_size, joystick_size) * 0.5,
			Vector2(joystick_size, joystick_size))
		_knob_pos = _start_pos
		_update_visual_position()

	_drag_touch(event.position)


func _drag_touch(pos: Vector2) -> void:
	var delta_v: Vector2 = pos - _start_pos
	var max_dist: float = joystick_size * 0.4  # recorrido máximo del knob

	var distance: float = delta_v.length()
	if distance > max_dist:
		delta_v = delta_v.normalized() * max_dist
		distance = max_dist

	# Normalizar output
	if distance > deadzone * max_dist:
		_output = delta_v / max_dist
	else:
		_output = Vector2.ZERO

	# Posición visual del knob
	_knob_pos = _start_pos + delta_v
	_update_visual_position()
	joystick_moved.emit(_output)


func _end_touch() -> void:
	_touch_index = -1
	_is_active = false
	_output = Vector2.ZERO
	_knob_pos = _start_pos
	_update_visual_position()

	# En modo flotante, restaurar posición fija
	if not fixed_mode:
		_initialize_position()
		_update_visual_position()

	joystick_released.emit()


func _update_visual_position() -> void:
	if _bg_draw:
		_bg_draw.position = _start_pos - Vector2(joystick_size, joystick_size) * 0.5
	if _knob_draw:
		_knob_draw.position = _knob_pos - Vector2(knob_size, knob_size) * 0.5


func get_output() -> Vector2:
	return _output


func is_active() -> bool:
	return _is_active


# ── Configuración dinámica ──

func set_fixed_mode(mode: bool) -> void:
	fixed_mode = mode
	if not mode:
		_initialize_position()
		_update_visual_position()


func set_joystick_size(size: float) -> void:
	joystick_size = max(MIN_TOUCH_SIZE, size)
	_initialize_position()
	_build_visual()


func set_opacity(val: float) -> void:
	opacity = clampf(val, 0.1, 1.0)
	_update_opacity()


func set_deadzone(val: float) -> void:
	deadzone = clampf(val, 0.0, 0.5)


func hide_joystick() -> void:
	visible = false
	set_process_input(false)
	_end_touch()


func show_joystick() -> void:
	visible = true
	set_process_input(true)
