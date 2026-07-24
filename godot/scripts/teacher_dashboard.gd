class_name TeacherDashboard
extends CanvasLayer

## Panel docente — muestra progreso por habilidad, nivel de apoyo,
## letras/sílabas con dificultad, comprensión, actividades realizadas,
## uso de pistas, juguetes recuperados.
##
## No muestra diagnósticos clínicos ni etiquetas negativas.
## Abrir con tecla T (docente) durante el juego.

signal closed

@onready var panel: PanelContainer = $PanelContainer
@onready var route_label: Label = $PanelContainer/VBoxContainer/HeaderContainer/RouteLabel
@onready var support_label: Label = $PanelContainer/VBoxContainer/HeaderContainer/SupportLabel
@onready var skills_container: VBoxContainer = $PanelContainer/VBoxContainer/SkillsContainer
@onready var activities_label: Label = $PanelContainer/VBoxContainer/StatsContainer/ActivitiesLabel
@onready var hints_label: Label = $PanelContainer/VBoxContainer/StatsContainer/HintsLabel
@onready var audio_label: Label = $PanelContainer/VBoxContainer/StatsContainer/AudioLabel
@onready var toys_label: Label = $PanelContainer/VBoxContainer/StatsContainer/ToysLabel
@onready var adjust_route_button: Button = $PanelContainer/VBoxContainer/ActionsContainer/AdjustRouteButton
@onready var close_button: Button = $PanelContainer/VBoxContainer/ActionsContainer/CloseButton
@onready var reset_button: Button = $PanelContainer/VBoxContainer/ActionsContainer/ResetButton

const COLOR_SLATE: Color = Color("#2B2D42")
const COLOR_GREEN: Color = Color("#2A9D8F")
const COLOR_CORAL: Color = Color("#E76F51")
const COLOR_GOLD: Color = Color("#F4A261")
const COLOR_PURPLE: Color = Color("#7B5EA7")


func _ready() -> void:
	process_mode = CanvasItem.PROCESS_MODE_ALWAYS
	close_button.pressed.connect(_on_close)
	adjust_route_button.pressed.connect(_on_adjust_route)
	reset_button.pressed.connect(_on_reset)
	_refresh()


func open() -> void:
	_refresh()
	show()


func _refresh() -> void:
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if not rpm:
		return

	# Ruta y soporte
	var route_name: String = rpm.get_route_name()
	var support: int = rpm.support_level
	var route_support: String = "Explorador" if support >= 4 else "Constructor" if support >= 2 else "Aventurero"
	route_label.text = "Ruta: " + route_name
	support_label.text = "Apoyo: Nivel " + str(support) + " (" + route_support + ")"

	# Habilidades
	for child in skills_container.get_children():
		child.queue_free()

	var skill_names: Dictionary = {
		"phonological": "🔊 Conciencia Fonológica",
		"letters": "🔤 Letras y Sonidos",
		"syllables": "📖 Sílabas",
		"words": "📝 Palabras",
		"comprehension": "🧠 Comprensión",
		"inference": "💡 Inferencias",
	}

	for skill: String in skill_names:
		var accuracy: float = rpm.get_skill_accuracy(skill)
		var data: Dictionary = rpm.skill_scores.get(skill, {"correct": 0, "total": 0})

		var hbox := HBoxContainer.new()
		var name_label := Label.new()
		name_label.text = skill_names[skill]
		name_label.custom_minimum_size = Vector2(280, 0)
		name_label.add_theme_color_override("font_color", COLOR_SLATE)
		hbox.add_child(name_label)

		var progress := ProgressBar.new()
		progress.min_value = 0.0
		progress.max_value = 1.0
		progress.value = accuracy
		progress.custom_minimum_size = Vector2(180, 24)
		progress.show_percentage = true
		progress.add_theme_color_override("font_color", Color.WHITE)

		# Color según precisión
		if accuracy >= 0.75:
			var fill := StyleBoxFlat.new()
			fill.bg_color = COLOR_GREEN
			fill.set_corner_radius_all(8)
			progress.add_theme_stylebox_override("fill", fill)
		elif accuracy >= 0.5:
			var fill := StyleBoxFlat.new()
			fill.bg_color = COLOR_GOLD
			fill.set_corner_radius_all(8)
			progress.add_theme_stylebox_override("fill", fill)
		else:
			var fill := StyleBoxFlat.new()
			fill.bg_color = COLOR_CORAL
			fill.set_corner_radius_all(8)
			progress.add_theme_stylebox_override("fill", fill)

		hbox.add_child(progress)

		var count_label := Label.new()
		count_label.text = str(data["correct"]) + "/" + str(data["total"])
		count_label.add_theme_color_override("font_color", COLOR_PURPLE)
		hbox.add_child(count_label)

		skills_container.add_child(hbox)

	# Estadísticas
	activities_label.text = "Actividades: " + str(rpm.get_total_activities())
	hints_label.text = "Pistas usadas: " + str(rpm.hints_used)
	audio_label.text = "Audios solicitados: " + str(rpm.audio_requests)

	# Juguetes
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm and "golden_kitten_found" in pm:
		toys_label.text = "Juguetes Dorados: " + ("1 🏆" if pm.golden_kitten_found else "0")


func _on_adjust_route() -> void:
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if not rpm:
		return

	# Ciclar entre rutas
	var routes: Array[String] = ["explorador", "constructor", "aventurero"]
	var current: int = routes.find(rpm.current_route)
	var next: int = (current + 1) % routes.size()
	rpm.set_route_manually(routes[next])
	_refresh()


func _on_reset() -> void:
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if rpm and rpm.has_method("reset_profile"):
		rpm.reset_profile()
		_refresh()


func _on_close() -> void:
	closed.emit()
	get_tree().paused = false
	queue_free()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_on_close()
