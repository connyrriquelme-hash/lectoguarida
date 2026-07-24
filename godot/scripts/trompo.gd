class_name TrompoChileno
extends Area3D

@onready var label_3d: Label3D = $Label3D
@onready var mesh: MeshInstance3D = $MeshInstance3D

var palabras_bisilabas: Array[String] = ["MO - TE", "GA - TO", "LO - RO", "SA - PO", "LU - NA"]

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	label_3d.hide()

func _on_body_entered(body: Node3D) -> void:
	if body is Player:
		var palabra_elegida = palabras_bisilabas.pick_random()

		label_3d.text = palabra_elegida
		label_3d.show()

		var palabra_limpia = palabra_elegida.replace(" - ", "")
		_hablar_palabra(palabra_limpia)

		# Report metric
		var sm: Node = get_node_or_null("/root/SupabaseManager")
		if sm and sm.has_method("report_syllable_read"):
			sm.report_syllable_read(palabra_limpia)

		var tween = create_tween()
		tween.tween_property(mesh, "rotation:y", mesh.rotation.y + deg_to_rad(720), 0.8)

func _hablar_palabra(palabra: String) -> void:
	if OS.has_feature("web"):
		var js_code = """
			var msg = new SpeechSynthesisUtterance('%s');
			msg.lang = 'es-CL';
			msg.rate = 0.7;
			window.speechSynthesis.speak(msg);
		""" % palabra

		JavaScriptBridge.eval(js_code)
	else:
		print("Emulación de TTS (Estás en el Editor). El navegador diría: ", palabra)
