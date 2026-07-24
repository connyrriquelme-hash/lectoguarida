class_name NarrativeDialog
extends CanvasLayer

## Diálogo narrativo estilo aventura. Muestra texto + retrato + audio.
## Usado para la introducción de Lechuza Lila y otros eventos.

signal dialog_completed
signal closed

var _lines: Array[Dictionary] = []
var _index: int = 0

@onready var overlay: ColorRect = $Overlay
@onready var panel: PanelContainer = $PanelContainer
@onready var portrait_rect: TextureRect = $PanelContainer/HBoxContainer/PortraitRect
@onready var text_label: Label = $PanelContainer/HBoxContainer/VBoxContainer/TextLabel
@onready var speaker_label: Label = $PanelContainer/HBoxContainer/VBoxContainer/SpeakerLabel
@onready var audio_btn: Button = $PanelContainer/HBoxContainer/VBoxContainer/AudioButton
@onready var continue_btn: Button = $PanelContainer/HBoxContainer/VBoxContainer/HBoxContainer2/ContinueButton
@onready var skip_btn: Button = $PanelContainer/HBoxContainer/VBoxContainer/HBoxContainer2/SkipButton


func _ready() -> void:
	process_mode = PROCESS_MODE_WHEN_PAUSED
	continue_btn.pressed.connect(_next)
	skip_btn.pressed.connect(_skip_all)
	audio_btn.pressed.connect(_play_current_audio)


func start_dialog(lines: Array[Dictionary]) -> void:
	"""lines: [{speaker, text, audio_path?, portrait_texture?}, ...]"""
	_lines = lines
	_index = 0
	_show_line()


const COLOR_TEXT_DARK: Color = Color("#2B2D42")
const COLOR_PURPLE: Color = Color("#8E69C1")
const COLOR_PURPLE_LIGHT: Color = Color("#B392D9")

func _show_line() -> void:
	if _index >= _lines.size():
		_skip_all()
		return

	var line: Dictionary = _lines[_index]
	speaker_label.text = line.get("speaker", "???")
	speaker_label.add_theme_color_override("font_color", COLOR_PURPLE)
	text_label.text = line.get("text", "")
	text_label.add_theme_color_override("font_color", COLOR_TEXT_DARK)
	skip_btn.add_theme_color_override("font_color", COLOR_PURPLE)
	
	# Retrato (opcional — se muestra emoji del speaker si no hay textura)
	var tex: Variant = line.get("portrait_texture")
	if tex != null and tex is Texture2D:
		portrait_rect.texture = tex
		portrait_rect.show()
	else:
		portrait_rect.hide()

	continue_btn.text = "Siguiente →" if _index < _lines.size() - 1 else "Comenzar ✨"
	continue_btn.disabled = false


func _next() -> void:
	continue_btn.disabled = true
	_index += 1
	_show_line()


func _skip_all() -> void:
	dialog_completed.emit()
	closed.emit()
	queue_free()


func _play_current_audio() -> void:
	var line: Dictionary = _lines[_index]
	var text: String = line.get("text", "")
	
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("speak"):
		am.speak(text)
	elif Engine.has_singleton("GodotTTS"):
		Engine.get_singleton("GodotTTS").speak(text)
	else:
		print("Emulación TTS (editor): ", text.to_upper())
