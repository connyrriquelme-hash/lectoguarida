extends Node

## FASE 2 — Sistema Anticaída por Checkpoint.
##
## Vigila la posición del jugador y detecta caídas usando:
## - SafeGrounds: nodos en el grupo "safe_ground" (suelo real)
## - Checkpoints: nodos en el grupo "checkpoint"
## - KillZones: Area3D que disparan rescate al entrar
## - Última posición segura
##
## NO depende de Y < -2, porque cada mundo tiene altura diferente.
## Usa KillZones debajo de cada zona + detección de caída libre.

signal player_rescued(checkpoint_pos: Vector3)

const FALL_SPEED_THRESHOLD: float = 20.0   # Velocidad vertical de caída libre
const FALL_TIME_THRESHOLD: float = 2.0     # Segundos cayendo antes de rescate

var _player_ref: CharacterBody3D = null
var _last_safe_pos: Vector3 = Vector3.ZERO
var _fall_time: float = 0.0
var _is_falling: bool = false
var _is_rescuing: bool = false
var _enabled: bool = true
var _checkpoints: Array[Vector3] = []
var _current_checkpoint: int = -1


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


func setup(player: CharacterBody3D, spawn_pos: Vector3) -> void:
	_player_ref = player
	_last_safe_pos = spawn_pos
	_is_falling = false
	_is_rescuing = false
	_fall_time = 0.0
	print("SafetySystem: configurado con spawn ", spawn_pos)


func register_checkpoint(pos: Vector3) -> void:
	_checkpoints.append(pos)
	_current_checkpoint = _checkpoints.size() - 1
	_last_safe_pos = pos
	print("SafetySystem: checkpoint registrado #", _checkpoints.size(), " en ", pos)


func get_last_safe_pos() -> Vector3:
	return _last_safe_pos


func force_rescue() -> void:
	"""Rescate forzado (llamado por KillZone)."""
	if _is_rescuing or not _player_ref:
		return
	_is_rescuing = true
	_do_rescue()


func _process(delta: float) -> void:
	if not _enabled or not _player_ref or _is_rescuing:
		return

	var player: CharacterBody3D = _player_ref

	# Track posición segura (player on floor O sobre safe_ground)
	if player.is_on_floor():
		_last_safe_pos = player.global_position
		_fall_time = 0.0
		_is_falling = false
		return

	# Detección de caída: velocidad vertical muy negativa O tiempo cayendo
	if player.velocity.y < -FALL_SPEED_THRESHOLD:
		_fall_time += delta
	else:
		# No cae rápido, pero no está en el suelo — esperar
		if player.global_position.y < -5.0:
			_fall_time += delta * 2.0  # acelerar detección si está muy abajo
		else:
			_fall_time = max(0, _fall_time - delta * 2.0)

	# Rescatar si cayó por mucho tiempo O está muy por debajo
	if _fall_time >= FALL_TIME_THRESHOLD or player.global_position.y < -15.0:
		_is_falling = true
		_is_rescuing = true
		_do_rescue()


func _do_rescue() -> void:
	"""Ejecuta rescate: reposiciona, resetea velocidad, fundido breve."""
	if not _player_ref:
		_is_rescuing = false
		return

	# Elegir checkpoint si existe, sino última posición segura
	var target: Vector3 = _last_safe_pos
	if _checkpoints.size() > 0 and _current_checkpoint >= 0:
		target = _checkpoints[mini(_current_checkpoint, _checkpoints.size() - 1)]

	# Reposicionar
	_player_ref.global_position = target + Vector3(0, 0.5, 0)
	_player_ref.velocity = Vector3.ZERO

	_fall_time = 0.0
	_is_falling = false
	_is_rescuing = false

	player_rescued.emit(target)
	print("SafetySystem: rescate en ", target)


func is_on_safe_ground() -> bool:
	"""Verifica raycast hacia abajo buscando safe_ground."""
	if not _player_ref:
		return false
	var space_state: PhysicsDirectSpaceState3D = _player_ref.get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(
		_player_ref.global_position,
		_player_ref.global_position + Vector3(0, -2.0, 0),
		1,  # capa 1
		[]
	)
	var result: Dictionary = space_state.intersect_ray(query)
	if result.is_empty():
		return false
	var collider: Node = result.get("collider") as Node
	return collider != null and collider.is_in_group("safe_ground")