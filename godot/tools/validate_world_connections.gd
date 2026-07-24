extends Node

## World Connection Validator
## Run from Godot editor: Scene > Run Custom Scene > select this file
## Or via CLI: godot --headless --script tools/validate_world_connections.gd

func _init() -> void:
	print("=" * 55)
	print("  WORLD CONNECTION VALIDATOR")
	print("=" * 55)
	
	var total_errors: int = 0
	
	# ── 1. Check WORLD_REGISTRY exists ──
	var zm := get_node_or_null("/root/ZoneManager")
	if not zm:
		push_error("FAIL: ZoneManager autoload not found")
		total_errors += 1
		return
	
	if not zm.has_method("validate_connections"):
		push_error("FAIL: ZoneManager missing validate_connections()")
		total_errors += 1
		return
	
	# ── 2. Run automatic validation ──
	var result: Dictionary = zm.validate_connections()
	print("  Worlds checked: ", result["worlds_checked"])
	print("  Portals checked: ", result["portals_checked"])
	
	if result["safe"]:
		print("  ✅ All connections valid")
	else:
		for ref: String in result["broken_refs"]:
			push_error("  ❌ " + ref)
			total_errors += 1
	
	# ── 3. Verify all zone scenes exist ──
	var scenes_to_check := [
		"res://scenes/main_world.tscn",
		"res://scenes/zone_a_coastal.tscn",
		"res://scenes/zone_b_humedal.tscn",
		"res://scenes/zone_c_estribaciones.tscn",
		"res://scenes/zone_d_puerto.tscn",
		"res://scenes/zone_e_litoral.tscn",
		"res://scenes/zone_f_vina.tscn",
		"res://scenes/zone_g_valparaiso.tscn",
		"res://scenes/zone_h_isla_negra.tscn",
		"res://scenes/zone_i_el_tabo.tscn",
	]
	
	for path: String in scenes_to_check:
		if ResourceLoader.exists(path):
			print("  ✅ Scene exists: ", path)
		else:
			push_error("  ❌ MISSING: ", path)
			total_errors += 1
	
	# ── 4. Check portal scripts on zone scenes ──
	var zone_scenes_with_portals := [
		"res://scenes/zone_a_coastal.tscn",
		"res://scenes/zone_b_humedal.tscn",
		"res://scenes/zone_c_estribaciones.tscn",
		"res://scenes/zone_d_puerto.tscn",
		"res://scenes/zone_e_litoral.tscn",
	]
	
	for zpath: String in zone_scenes_with_portals:
		var ps: PackedScene = load(zpath) as PackedScene
		if not ps:
			continue
		var inst: Node = ps.instantiate()
		var portal_count: int = 0
		for child: Node in inst.get_children():
			if child is ZonePortal:
				portal_count += 1
		print("  ", zpath, ": ", portal_count, " portal(s)")
		inst.queue_free()
		if portal_count == 0:
			push_warning("  ⚠️ No portals found in ", zpath)
	
	# ── 5. Check main_world scene ──
	var mw_ps: PackedScene = load("res://scenes/main_world.tscn") as PackedScene
	if mw_ps:
		print("  ✅ main_world.tscn loads successfully")
	else:
		push_error("  ❌ main_world.tscn failed to load")
		total_errors += 1
	
	# ── 6. Check player script ──
	var player_script: Script = load("res://scripts/player.gd")
	if player_script:
		print("  ✅ player.gd loads successfully")
	else:
		push_error("  ❌ player.gd failed to load")
		total_errors += 1
	
	# ── 7. Check safety system ──
	var safety_script: Script = load("res://scripts/safety_system.gd")
	if safety_script:
		print("  ✅ safety_system.gd loads successfully")
	else:
		push_error("  ❌ safety_system.gd failed to load")
		total_errors += 1
	
	# ── Summary ──
	print("")
	print("=" * 55)
	if total_errors == 0:
		print("  ✅ VALIDATION PASSED — 0 errors")
	else:
		print("  ❌ VALIDATION FAILED — ", total_errors, " error(s)")
	print("=" * 55)
	
	# Exit with status code for CLI
	if total_errors > 0:
		OS.exit_code = 1
	else:
		OS.exit_code = 0
