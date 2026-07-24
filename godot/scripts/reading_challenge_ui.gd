class_name ReadingChallengeUI
extends CanvasLayer

## Interfaz de desafío de lectura adaptativa.
## Modal pedagógico con overlay, tarjetas de alternativa [🔊][Texto],
## selección visual, y confirmación.

signal challenge_completed(activity_id: String, correct: bool, hints: int)
signal closed
signal request_hud_collapse(collapsed: bool)

var activity_data: Dictionary = {}
var correct: bool = false
var hints_used: int = 0
var attempts: int = 0
var max_attempts: int = 3
var selection: int = -1
var answered: bool = false
var start_time: float = 0.0

const COLOR_CORRECT: Color = Color("#2A9D8F")
const COLOR_WRONG: Color = Color("#E76F51")
const COLOR_TEXT: Color = Color("#2B2D42")
const COLOR_BG: Color = Color("#F4F1DE")
const COLOR_SELECTED_BG: Color = Color("#E8D5B7")
const COLOR_SELECTED_BORDER: Color = Color("#F4A261")
const COLOR_CARD_BG: Color = Color(1, 1, 1, 0.15)
const COLOR_CARD_HOVER: Color = Color(1, 1, 1, 0.25)

@onready var overlay: ColorRect = $Overlay
@onready var panel: PanelContainer = $PanelContainer
@onready var ability_label: Label = $PanelContainer/HBoxContainer/VBoxContainer/AbilityLabel
@onready var instr_label: Label = $PanelContainer/HBoxContainer/VBoxContainer/InstrLabel
@onready var stimulus_label: RichTextLabel = $PanelContainer/HBoxContainer/VBoxContainer/StimulusLabel
@onready var options_container: VBoxContainer = $PanelContainer/HBoxContainer/VBoxContainer/OptionsContainer
@onready var feedback_label: Label = $PanelContainer/HBoxContainer/VBoxContainer/FeedbackLabel
@onready var confirm_button: Button = $PanelContainer/HBoxContainer/VBoxContainer/ConfirmButton
@onready var hint_button: Button = $PanelContainer/HBoxContainer/VBoxContainer/HintButton
@onready var audio_button: Button = $PanelContainer/HBoxContainer/VBoxContainer/AudioButton
@onready var hint_text: Label = $PanelContainer/HBoxContainer/VBoxContainer/HintText
@onready var cat_portrait_margin: MarginContainer = $PanelContainer/HBoxContainer/CatPortraitMargin


func _ready() -> void:
	process_mode = CanvasItem.PROCESS_MODE_WHEN_PAUSED
	confirm_button.pressed.connect(_on_confirm)
	hint_button.pressed.connect(_on_hint)
	audio_button.pressed.connect(_on_play_audio)
	feedback_label.hide()
	hint_text.hide()
	confirm_button.disabled = true


func setup(data: Dictionary) -> void:
	activity_data = data
	start_time = Time.get_unix_time_from_system()

	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	var support: int = 3
	if rpm:
		support = rpm.support_level

	# ── Habilidad y nivel ──
	var skill_name: String = data.get("skill", "lectura")
	var ability_names: Dictionary = {
		"conciencia_fonologica": "Conciencia fonológica",
		"decodificacion": "Decodificación",
		"vocabulario": "Vocabulario",
		"comprension": "Comprensión",
		"inferencias": "Inferencias",
		"lectura": "Lectura"
	}
	var diff: int = data.get("difficulty", 1)
	var diff_names: Array[String] = ["Básico", "Intermedio", "Avanzado", "Desafío", "Maestro"]
	var diff_name: String = diff_names[diff - 1] if diff >= 1 and diff <= 5 else "Intermedio"
	var display_name: String = ability_names.get(skill_name, "Lectura")
	ability_label.text = str("📚 ", display_name, " — Nivel ", diff_name)

	# ── Instrucción ──
	instr_label.text = data.get("instruction", "Responde:")

	# Auto-reproducir instrucción si soporte alto
	if support >= 4 or data.get("min_route", "explorador") == "explorador":
		call_deferred("_on_play_audio")

	# ── Estímulo ──
	var stimulus: String = data.get("stimulus", "")
	if stimulus != "":
		stimulus_label.text = "[center]" + stimulus + "[/center]"
		if support >= 3:
			stimulus_label.add_theme_font_size_override("normal_font_size", 32)
		else:
			stimulus_label.add_theme_font_size_override("normal_font_size", 24)
	else:
		stimulus_label.hide()

	# Imagen/emoji
	var img: String = data.get("image_hint", "")
	if img != "" and support >= 2:
		var img_label := Label.new()
		img_label.text = img
		img_label.add_theme_font_size_override("font_size", 64)
		img_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		stimulus_label.add_child(img_label)

	# ── Gato retrato ──
	_add_cat_portrait()

	# ── Colapsar Bitácora ──
	request_hud_collapse.emit(true)

	# ── Opciones ──
	_build_options(data, support)


func _add_cat_portrait() -> void:
	"""Add a static cat icon to the challenge UI instead of SubViewport (avoids overflow)."""
	if cat_portrait_margin == null:
		return
	for child in cat_portrait_margin.get_children():
		child.queue_free()
	
	var cat_icon := Label.new()
	cat_icon.text = "🐱"
	cat_icon.add_theme_font_size_override("font_size", 48)
	cat_icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cat_icon.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cat_icon.custom_minimum_size = Vector2(80, 80)
	cat_portrait_margin.add_child(cat_icon)


func _build_options(data: Dictionary, support: int) -> void:
	var act_type: String = data.get("type", "multiple_choice")
	var opts: Array = data.get("options", [])

	for child in options_container.get_children():
		child.queue_free()

	match act_type:
		"build_syllable", "build_word":
			_build_syllable_ui(opts, data.get("correct_answer", ""), data.get("stimulus", ""), support)
		"order_sentence":
			_build_order_ui(opts, data.get("correct_answer", ""), support)
		"short_answer":
			_build_short_answer_ui(data, support)
		_:
			_build_choice_ui(opts, data, support)


func _build_choice_ui(opts: Array, _data: Dictionary, _support: int) -> void:
	selection = -1
	confirm_button.disabled = true

	for i: int in range(opts.size()):
		var row := HBoxContainer.new()
		row.name = "OptionRow_" + str(i)
		row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.alignment = BoxContainer.ALIGNMENT_CENTER

		# ── Tarjeta de alternativa: [🔊][Texto] ──
		var card := PanelContainer.new()
		card.name = "Card_" + str(i)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.custom_minimum_size = Vector2(200, 56)
		card.mouse_filter = Control.MOUSE_FILTER_PASS

		var card_theme := Theme.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = COLOR_CARD_BG
		card_style.set_border_width_all(2)
		card_style.border_color = Color(0, 0, 0, 0)
		card_style.set_corner_radius_all(8)
		card_style.content_margin_left = 8
		card_style.content_margin_right = 8
		card_theme.set_stylebox("panel", "PanelContainer", card_style)
		card.theme = card_theme

		var card_hbox := HBoxContainer.new()
		card_hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card_hbox.alignment = BoxContainer.ALIGNMENT_CENTER

		# Botón 🔊 solo audio
		var speak_btn := Button.new()
		speak_btn.text = "🔊"
		speak_btn.name = "Speak_" + str(i)
		speak_btn.custom_minimum_size = Vector2(44, 44)
		speak_btn.add_theme_font_size_override("font_size", 20)
		speak_btn.pressed.connect(_play_option_audio.bind(opts[i]))
		speak_btn.mouse_filter = Control.MOUSE_FILTER_PASS
		card_hbox.add_child(speak_btn)

		# Botón de opción (texto)
		var opt_btn := Button.new()
		opt_btn.text = opts[i] as String
		opt_btn.name = "Option_" + str(i)
		opt_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		opt_btn.custom_minimum_size = Vector2(120, 44)
		opt_btn.add_theme_font_size_override("font_size", 22)
		opt_btn.flat = true
		opt_btn.add_theme_color_override("font_color", COLOR_TEXT)
		opt_btn.pressed.connect(_on_card_selected.bind(i, card, card_style))
		card_hbox.add_child(opt_btn)

		card.add_child(card_hbox)
		row.add_child(card)
		options_container.add_child(row)


func _on_card_selected(index: int, _card: PanelContainer, style: StyleBoxFlat) -> void:
	# Desseleccionar todas las cards
	for child in options_container.get_children():
		if child is HBoxContainer:
			for grandchild in child.get_children():
				if grandchild is PanelContainer:
					var gs: StyleBoxFlat = _get_card_style(grandchild)
					if gs:
						gs.bg_color = COLOR_CARD_BG
						gs.border_color = Color(0, 0, 0, 0)

	# Seleccionar esta
	selection = index
	style.bg_color = COLOR_SELECTED_BG
	style.border_color = COLOR_SELECTED_BORDER
	confirm_button.disabled = false


func _get_card_style(card: PanelContainer) -> StyleBoxFlat:
	if card.theme == null:
		return null
	return card.theme.get_stylebox("panel", "PanelContainer") as StyleBoxFlat


func _on_confirm() -> void:
	if answered:
		return

	var data: Dictionary = activity_data
	var correct_idx: int = data.get("correct", -1)

	if selection == correct_idx:
		_on_correct()
	else:
		_on_wrong(data)


func _on_correct() -> void:
	answered = true
	correct = true
	feedback_label.text = "✅ ¡Excelente! " + activity_data.get("explanation", "")
	feedback_label.modulate = COLOR_CORRECT
	feedback_label.show()
	confirm_button.text = "Continuar →"
	confirm_button.disabled = false
	confirm_button.pressed.disconnect(_on_confirm)
	confirm_button.pressed.connect(_on_continue)


func _on_wrong(data: Dictionary) -> void:
	attempts += 1
	if attempts >= max_attempts:
		answered = true
		correct = false
		var correct_text: String = ""
		var opts: Array = data.get("options", [])
		var ci: int = data.get("correct", -1)
		if ci >= 0 and ci < opts.size():
			correct_text = opts[ci] as String
		feedback_label.text = "❌ La respuesta era: " + correct_text
		feedback_label.modulate = COLOR_WRONG
		feedback_label.show()
		confirm_button.text = "Continuar →"
		confirm_button.disabled = false
		confirm_button.pressed.disconnect(_on_confirm)
		confirm_button.pressed.connect(_on_continue)
	else:
		feedback_label.text = "❌ Intenta de nuevo. Te quedan " + str(max_attempts - attempts) + " intentos."
		feedback_label.modulate = COLOR_WRONG
		feedback_label.show()


func _on_continue() -> void:
	# One-shot: deshabilitar inmediatamente para evitar doble clic
	confirm_button.disabled = true
	request_hud_collapse.emit(false)
	challenge_completed.emit(
		activity_data.get("id", ""),
		correct,
		hints_used
	)
	closed.emit()
	queue_free()


func _on_hint() -> void:
	hints_used += 1
	var hint: String = activity_data.get("hint", "")
	if hint != "":
		hint_text.text = "💡 " + hint
		hint_text.show()


func _on_play_audio() -> void:
	_speak_text(instr_label.text)


func _play_option_audio(text: String) -> void:
	_speak_text(text)


func _speak_text(text: String) -> void:
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("speak"):
		am.speak(text)
		return
	if Engine.has_singleton("GodotTTS"):
		Engine.get_singleton("GodotTTS").speak(text)
	else:
		print("Emulación de TTS (Estás en el Editor). El navegador diría: ", text.to_upper())


func _build_syllable_ui(opts: Array, correct_answer: String, stimulus: String, _support: int) -> void:
	var syllable_opts: Array[String] = []
	for o in opts:
		syllable_opts.append(o as String)
	syllable_opts.shuffle()

	var order_label := Label.new()
	order_label.text = "Ordena las partes para formar: " + stimulus
	order_label.add_theme_font_size_override("font_size", 20)
	order_label.add_theme_color_override("font_color", COLOR_TEXT)
	options_container.add_child(order_label)

	var word_buttons: Array[Button] = []
	for i: int in range(syllable_opts.size()):
		var btn := Button.new()
		btn.text = syllable_opts[i]
		btn.name = "Syllable_" + str(i)
		btn.custom_minimum_size = Vector2(120, 50)
		btn.add_theme_font_size_override("font_size", 28)

		btn.pressed.connect(_on_syllable_clicked.bind(btn, word_buttons, correct_answer))
		options_container.add_child(btn)
		word_buttons.append(btn)


func _build_order_ui(opts: Array, correct_answer: String, _support: int) -> void:
	var shuffled: Array = opts.duplicate()
	shuffled.shuffle()

	var order_label := Label.new()
	order_label.text = "Toca las palabras en orden:"
	order_label.add_theme_font_size_override("font_size", 20)
	options_container.add_child(order_label)

	var word_btns: Array[Button] = []
	for i: int in range(shuffled.size()):
		var btn := Button.new()
		btn.text = shuffled[i] as String
		btn.name = "Word_" + str(i)
		btn.custom_minimum_size = Vector2(150, 50)
		btn.add_theme_font_size_override("font_size", 24)
		btn.pressed.connect(_on_order_clicked.bind(btn, word_btns, correct_answer))
		options_container.add_child(btn)
		word_btns.append(btn)


func _build_short_answer_ui(_data: Dictionary, _support: int) -> void:
	var input_label := Label.new()
	input_label.text = "Escribe tu respuesta:"
	input_label.add_theme_font_size_override("font_size", 18)
	options_container.add_child(input_label)

	var input := LineEdit.new()
	input.name = "ShortAnswerInput"
	input.custom_minimum_size = Vector2(400, 50)
	input.add_theme_font_size_override("font_size", 24)
	input.placeholder_text = "Escribe aquí..."
	input.text_submitted.connect(_on_short_answer_submitted)
	options_container.add_child(input)

	confirm_button.text = "Enviar respuesta"
	confirm_button.pressed.disconnect(_on_confirm)
	confirm_button.pressed.connect(_on_short_answer_submitted.bind(input))


func _on_option_selected(index: int) -> void:
	selection = index
	confirm_button.disabled = false


func _on_syllable_clicked(btn: Button, _all_btns: Array[Button], _correct: String) -> void:
	btn.modulate = Color("#F4A261")
	selection = 0
	confirm_button.disabled = false


func _on_order_clicked(btn: Button, _all_btns: Array[Button], _correct: String) -> void:
	btn.modulate = Color("#F4A261")
	selection = 0
	confirm_button.disabled = false


func _on_short_answer_submitted(_input: LineEdit) -> void:
	selection = 0
	_on_confirm()
