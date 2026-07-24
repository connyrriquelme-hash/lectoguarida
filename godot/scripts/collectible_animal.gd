class_name CollectibleAnimal
extends Area3D

## Silabic name shown to the child (e.g. "CO - I - PO")
@export var nombre_silabas: String = "CO - I - PO"

## Species description shown below the name (e.g. "Especie: Roedor nativo")
@export var especie_dialogo: String = "Especie: Animal nativo"

@onready var label_3d: Label3D = $Label3D
@onready var collision_shape: CollisionShape3D = $CollisionShape3D
@onready var mesh: MeshInstance3D = $MeshInstance3D


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	label_3d.hide()


func _on_body_entered(body: Node3D) -> void:
	if not body is Player:
		return

	# Mark as collected — prevent re-triggering
	collision_shape.set_deferred("disabled", true)

	# Show the combined text
	var full_text: String = nombre_silabas + "\n" + especie_dialogo
	label_3d.text = full_text
	label_3d.show()

	# Speak only the animal name (clean, no hyphens)
	var palabra_limpia: String = nombre_silabas.replace(" - ", "").replace("-", "")
	_hablar_palabra(palabra_limpia)

	# Report metric to backend
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if sm and sm.has_method("report_animal_collected"):
		sm.report_animal_collected(name)

	# Collect animation: spin + shrink over 1.5 seconds, then disappear
	var tween: Tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(mesh, "rotation:y", mesh.rotation.y + deg_to_rad(720), 1.5)
	tween.tween_property(mesh, "rotation:x", mesh.rotation.x + deg_to_rad(360), 1.5)
	tween.tween_property(mesh, "scale", Vector3.ZERO, 1.5)
	tween.tween_property(label_3d, "modulate:a", 0.0, 1.5)

	tween.chain().tween_callback(queue_free)


func _hablar_palabra(palabra: String) -> void:
	if OS.has_feature("web"):
		var js_code: String = """
			var msg = new SpeechSynthesisUtterance('%s');
			msg.lang = 'es-CL';
			msg.rate = 0.7;
			window.speechSynthesis.speak(msg);
		""" % palabra

		JavaScriptBridge.eval(js_code)
	else:
		print("Emulación de TTS (Estás en el Editor). El navegador diría: ", palabra)
