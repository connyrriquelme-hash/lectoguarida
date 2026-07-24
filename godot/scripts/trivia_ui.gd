class_name TriviaUI
extends CanvasLayer

## Multi-step trivia interface for the Wisdom Totems system.
## Operates while the game is paused.

const UI_SCENE_PATH: String = "res://scenes/trivia_ui.tscn"

signal trivia_completed(trivia_title: String)

var trivia_data: Dictionary = {}

## 0 = showing text + Q1, 1 = showing Q2, 2 = completed
var state: int = 0

@onready var title_label: Label = $PanelContainer/VBoxContainer/TitleLabel
@onready var text_label: RichTextLabel = $PanelContainer/VBoxContainer/TextLabel
@onready var question_label: Label = $PanelContainer/VBoxContainer/QuestionLabel
@onready var play_narration_button: Button = $PanelContainer/VBoxContainer/PlayNarration
@onready var option1_button: Button = $PanelContainer/VBoxContainer/Option1Button
@onready var option2_button: Button = $PanelContainer/VBoxContainer/Option2Button
@onready var feedback_label: Label = $PanelContainer/VBoxContainer/FeedbackLabel
@onready var panel_container: PanelContainer = $PanelContainer


func _ready() -> void:
	process_mode = CanvasItem.PROCESS_MODE_ALWAYS
	option1_button.pressed.connect(_on_option_pressed.bind(0))
	option2_button.pressed.connect(_on_option_pressed.bind(1))
	play_narration_button.pressed.connect(_on_play_narration)
	feedback_label.hide()
	option1_button.grab_focus()


func setup(data: Dictionary) -> void:
	trivia_data = data
	title_label.text = data.get("title", "Tótem de Sabiduría")
	text_label.text = data.get("text", "")
	_show_question(1)

	# Auto-play the full narration when the popup appears so the
	# narrator naturally greets the player and reads the challenge.
	_on_play_narration()


func _show_question(question_num: int) -> void:
	var q_text: String = trivia_data.get("q" + str(question_num), "")
	var opts: Array = trivia_data.get("options" + str(question_num), [])

	question_label.text = q_text
	if opts.size() >= 2:
		option1_button.text = opts[0]
		option2_button.text = opts[1]

	option1_button.disabled = false
	option2_button.disabled = false
	option1_button.modulate = Color.WHITE
	option2_button.modulate = Color.WHITE

	feedback_label.hide()


func _on_option_pressed(option_index: int) -> void:
	var current_state: int = state
	var correct_index: int = trivia_data.get("ans" + str(current_state + 1), 0)

	if option_index == correct_index:
		_on_correct_answer()
	else:
		_on_wrong_answer(option_index)


func _on_correct_answer() -> void:
	state += 1

	if state >= 2:
		# Both questions answered correctly!
		feedback_label.text = "¡Excelente! \u2b50 Sabidur\u00eda adquirida."
		feedback_label.modulate = Color(0.4, 1.0, 0.4)
		feedback_label.show()

		option1_button.disabled = true
		option2_button.disabled = true

		# Record metric
		var sm: Node = get_node_or_null("/root/SupabaseManager")
		if sm and sm.has_method("report_trivia_completed"):
			sm.report_trivia_completed(trivia_data.get("title", ""))

		# Award coins via ProgressionManager
		var pm: Node = get_node_or_null("/root/ProgressionManager")
		if pm and pm.has_method("award_coins"):
			pm.award_coins(10)

		# Brief delay before closing
		var tween: Tween = create_tween()
		tween.tween_interval(0.8)
		tween.tween_callback(_finish)
	else:
		# Show question 2
		feedback_label.text = "¡Correcto! Ahora la segunda pregunta."
		feedback_label.modulate = Color(0.4, 1.0, 0.4)
		feedback_label.show()
		_show_question(2)

		var tween: Tween = create_tween()
		tween.tween_interval(0.6)
		tween.tween_callback(func():
			feedback_label.hide()
		)


func _on_wrong_answer(option_index: int) -> void:
	# Flash the wrong button red + shake panel
	var wrong_button: Button = option1_button if option_index == 0 else option2_button
	wrong_button.modulate = Color(1.0, 0.2, 0.2)

	feedback_label.text = "¡Intenta otra vez! Piensa bien."
	feedback_label.modulate = Color(1.0, 0.5, 0.3)
	feedback_label.show()

	# Shake animation
	var original_pos: Vector2 = panel_container.position
	var shake_tween: Tween = create_tween()
	shake_tween.tween_method(
		func(xoff: float):
			panel_container.position = original_pos + Vector2(xoff, 0),
			-10.0, 0.0, 0.15
	).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BOUNCE)

	# Reset after delay
	var reset_tween: Tween = create_tween()
	reset_tween.tween_interval(1.0)
	reset_tween.tween_callback(func():
		wrong_button.modulate = Color.WHITE
		feedback_label.hide()
	)


## Calls AudioManager.play_narration with the trivia entry title,
## which loads and plays the pre-recorded narrator audio file whose
## slugified filename matches the title. The BGM ducks automatically.
func _on_play_narration() -> void:
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("play_narration"):
		am.play_narration(trivia_data.get("title", "Tótem de Sabiduría"))


func _finish() -> void:
	get_tree().paused = false
	process_mode = Node.PROCESS_MODE_DISABLED
	trivia_completed.emit(trivia_data.get("title", ""))
	queue_free()


func _input(event: InputEvent) -> void:
	# Allow Escape to cancel
	if event.is_action_pressed("ui_cancel"):
		get_tree().paused = false
		queue_free()
