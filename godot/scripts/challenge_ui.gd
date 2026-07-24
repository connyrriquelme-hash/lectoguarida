class_name ChallengeUI
extends CanvasLayer

## Typing-based challenge popup for gem collection.
## Pauses the game, asks a question, validates the answer.

signal challenge_completed(gem_name: String)
signal challenge_cancelled

var gem_name: String = ""
var correct_answer: String = ""
var gem_node: Node3D = null

@onready var gem_label: Label = $PanelContainer/VBoxContainer/GemLabel
@onready var question_label: Label = $PanelContainer/VBoxContainer/QuestionLabel
@onready var play_narration_button: Button = $PanelContainer/VBoxContainer/PlayNarration
@onready var answer_input: LineEdit = $PanelContainer/VBoxContainer/AnswerInput
@onready var submit_button: Button = $PanelContainer/VBoxContainer/SubmitButton
@onready var feedback_label: Label = $PanelContainer/VBoxContainer/FeedbackLabel


func _ready() -> void:
	submit_button.pressed.connect(_on_answer_submitted)
	answer_input.text_submitted.connect(_on_answer_submitted)
	play_narration_button.pressed.connect(_on_play_narration)
	feedback_label.hide()

	# Grab focus so the player can type immediately
	answer_input.grab_focus()


func setup(question: String, answer: String, gem_name_str: String, _gem_node: Node3D) -> void:
	gem_name = gem_name_str
	correct_answer = answer
	gem_node = _gem_node

	gem_label.text = gem_name
	question_label.text = question

	# Auto-play the full narration when the popup appears so the
	# narrator naturally greets the player and reads the challenge.
	_on_play_narration()


func _on_answer_submitted(_text: String = "") -> void:
	var player_answer: String = answer_input.text.to_lower().strip_edges()
	var expected: String = correct_answer.to_lower().strip_edges()

	if player_answer == expected:
		_on_correct_answer()
	else:
		_on_wrong_answer()


func _on_correct_answer() -> void:
	feedback_label.text = "¡Correcto! ✨"
	feedback_label.modulate = Color(0.4, 1.0, 0.4)
	feedback_label.show()

	# Disable further input
	answer_input.editable = false
	submit_button.disabled = true

	# Brief pause so the kid sees the success message
	var tween: Tween = create_tween()
	tween.tween_interval(0.8)
	tween.tween_callback(_finish_correct)


func _on_wrong_answer() -> void:
	feedback_label.text = "¡Intenta otra vez! 🔄"
	feedback_label.modulate = Color(1.0, 0.5, 0.3)
	feedback_label.show()

	# Flash the input red briefly
	answer_input.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))

	var tween: Tween = create_tween()
	tween.tween_interval(1.0)
	tween.tween_callback(func():
		feedback_label.hide()
		answer_input.clear()
		answer_input.remove_theme_color_override("font_color")
		answer_input.grab_focus()
	)


func _finish_correct() -> void:
	# Award coins via ProgressionManager
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm and pm.has_method("award_coins"):
		pm.award_coins(10)

	# Unpause before emitting signal (so the world resumes)
	get_tree().paused = false
	process_mode = Node.PROCESS_MODE_DISABLED

	challenge_completed.emit(gem_name)
	queue_free()


func _input(event: InputEvent) -> void:
	# Allow Escape to cancel the challenge (unpause, cleanup)
	if event.is_action_pressed("ui_cancel"):
		get_tree().paused = false
		challenge_cancelled.emit()
		queue_free()


## Calls AudioManager.play_narration with the gem name, which loads
## and plays the pre-recorded narrator audio file whose slugified
## filename matches the gem title.
func _on_play_narration() -> void:
	var am: Node = get_node_or_null("/root/AudioManager")
	if am and am.has_method("play_narration"):
		am.play_narration(gem_name)
