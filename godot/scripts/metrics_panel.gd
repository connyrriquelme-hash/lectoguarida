class_name MetricsPanel
extends Control

## Transparent HUD overlay inside main_world that displays
## student metrics in real-time.

@onready var animals_label: Label = $VBoxContainer/AnimalsLabel
@onready var syllables_label: Label = $VBoxContainer/SyllablesLabel
@onready var gems_label: Label = $VBoxContainer/GemsLabel
@onready var time_label: Label = $VBoxContainer/TimeLabel


func _ready() -> void:
	# Listen for real-time metric updates from SupabaseManager autoload
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if sm:
		sm.metrics_updated.connect(_on_metrics_changed)

	# Initial display
	_refresh_display()
	_update_time()

	# Update exploration time every second
	var timer := Timer.new()
	timer.name = "TimeUpdater"
	timer.wait_time = 1.0
	timer.timeout.connect(_update_time)
	add_child(timer)
	timer.start()


func _refresh_display() -> void:
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if not sm:
		return
	animals_label.text = "Animales: %d" % sm.animals_collected
	syllables_label.text = "Silabas: %d" % sm.syllables_read
	gems_label.text = "Gemas: %d / 40" % sm.gems_collected


func _on_metrics_changed(animals: int, syllables: int, gems: int) -> void:
	animals_label.text = "Animales: %d" % animals
	syllables_label.text = "Silabas: %d" % syllables
	gems_label.text = "Gemas: %d / 40" % gems


func _update_time() -> void:
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if not sm:
		return
	var secs: int = sm.get_exploration_seconds()
	var mins: int = int(float(secs) / 60.0)
	var s: int = secs % 60
	time_label.text = "Tiempo: %02d:%02d" % [mins, s]
