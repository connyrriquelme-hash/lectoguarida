class_name LoginScreen
extends Control

## Kid-friendly login screen for LECTOGUARIDA.
## Uses SupabaseManager for auth.

@onready var email_input: LineEdit = %EmailInput
@onready var password_input: LineEdit = %PasswordInput
@onready var login_button: Button = %LoginButton
@onready var loading_label: Label = %LoadingLabel
@onready var error_label: Label = %ErrorLabel


func _ready() -> void:
	login_button.pressed.connect(_on_login_pressed)
	SupabaseManager.login_success.connect(_on_login_success)
	SupabaseManager.login_failed.connect(_on_login_failed)

	# If already logged in (mock session restored), skip to game
	if SupabaseManager.is_logged_in:
		_go_to_game()
		return

	loading_label.hide()
	error_label.hide()


func _on_login_pressed() -> void:
	var email: String = email_input.text.strip_edges()
	var password: String = password_input.text

	if email == "" or password == "":
		error_label.text = "¡Escribe tu nombre y clave!"
		error_label.show()
		return

	# Kid mode: if no @, treat as username and build mock email
	if "@" not in email:
		email = email + "@lectoguarida.cl"

	login_button.disabled = true
	loading_label.show()
	error_label.hide()
	SupabaseManager.login_student(email, password)


func _on_login_success(_user_id: String, _token: String) -> void:
	_go_to_game()


func _on_login_failed(error: String) -> void:
	login_button.disabled = false
	loading_label.hide()
	error_label.text = "¡Ups! " + error
	error_label.show()


func _go_to_game() -> void:
	get_tree().change_scene_to_file("res://scenes/main_world.tscn")
