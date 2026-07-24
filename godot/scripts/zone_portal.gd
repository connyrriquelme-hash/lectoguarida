class_name ZonePortal
extends Area3D

## Zone key to travel to ("coastal", "wetland", "foothills")
@export var destination: String = "wetland"

## Visual label shown above the portal
@export var portal_label: Label3D

## If non-zero, warps the player to this world position instead of changing scenes.
@export var warp_target: Vector3 = Vector3.ZERO

## Color of the portal indicator
@export var glow_color: Color = Color(0.3, 0.7, 1.0, 1.0)

## Scene file paths for each zone
const ZONE_PATHS: Dictionary = {
	"coastal": "res://scenes/zone_a_coastal.tscn",
	"wetland": "res://scenes/zone_b_humedal.tscn",
	"foothills": "res://scenes/zone_c_estribaciones.tscn",
}

var _idle_phase: float = 0.0
var _visual_arch: Node3D = null


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	if is_instance_valid(portal_label):
		portal_label.modulate = glow_color
	
	# Build a proper vertical ring portal instead of flat disc
	call_deferred("_build_visual_portal")


func _build_visual_portal() -> void:
	"""Replace the flat ring disc with a vertical arch portal with glow."""
	_visual_arch = Node3D.new()
	_visual_arch.name = "VisualArch"
	
	# Main ring
	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = glow_color
	ring_mat.emission_enabled = true
	ring_mat.emission = glow_color
	ring_mat.emission_energy_multiplier = 0.4
	ring_mat.roughness = 0.6
	ring_mat.metallic = 0.2
	
	var ring_mi := MeshInstance3D.new()
	ring_mi.name = "Ring"
	# Use a thin cylinder as a ring (rotated to stand vertical)
	var ring_mesh := CylinderMesh.new()
	ring_mesh.top_radius = 1.0
	ring_mesh.bottom_radius = 1.0
	ring_mesh.height = 0.15
	ring_mi.mesh = ring_mesh
	ring_mi.material_override = ring_mat
	ring_mi.position = Vector3(0, 1.5, 0)
	ring_mi.rotation.x = PI / 2.0  # Stand vertical
	_visual_arch.add_child(ring_mi)
	
	# Inner glow disc (semi-transparent)
	var glow_mat := StandardMaterial3D.new()
	glow_mat.albedo_color = Color(glow_color.r, glow_color.g, glow_color.b, 0.15)
	glow_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glow_mat.emission_enabled = true
	glow_mat.emission = glow_color
	glow_mat.emission_energy_multiplier = 0.2
	
	var glow_mi := MeshInstance3D.new()
	glow_mi.name = "InnerGlow"
	var glow_mesh := CylinderMesh.new()
	glow_mesh.top_radius = 0.75
	glow_mesh.bottom_radius = 0.75
	glow_mesh.height = 0.1
	glow_mi.mesh = glow_mesh
	glow_mi.material_override = glow_mat
	glow_mi.position = Vector3(0, 1.5, 0)
	glow_mi.rotation.x = PI / 2.0
	_visual_arch.add_child(glow_mi)
	
	# Base platform
	var base_mat := StandardMaterial3D.new()
	base_mat.albedo_color = Color(0.3, 0.3, 0.35)
	base_mat.roughness = 0.7
	base_mat.metallic = 0.3
	
	var base_mi := MeshInstance3D.new()
	base_mi.name = "Base"
	var base_mesh := CylinderMesh.new()
	base_mesh.top_radius = 1.2
	base_mesh.bottom_radius = 1.4
	base_mesh.height = 0.2
	base_mi.mesh = base_mesh
	base_mi.material_override = base_mat
	base_mi.position = Vector3(0, 0.1, 0)
	_visual_arch.add_child(base_mi)
	
	# Look for old ring and remove it, then add new visuals
	var old_ring: Node = get_node_or_null("Ring")
	if old_ring:
		remove_child(old_ring)
		old_ring.queue_free()
	
	add_child(_visual_arch)


func _process(delta: float) -> void:
	_idle_phase += delta
	if _visual_arch:
		# Slow rotation on the ring
		var ring: Node = _visual_arch.get_node_or_null("Ring")
		if ring:
			ring.rotation.z += delta * 0.5
		# Pulse glow
		var inner: Node = _visual_arch.get_node_or_null("InnerGlow")
		if inner and inner is MeshInstance3D:
			var mat: Material = inner.material_override
			if mat is StandardMaterial3D:
				var pulse: float = 0.2 + sin(_idle_phase * 2.0) * 0.15
				mat.emission_energy_multiplier = pulse


func _on_body_entered(body: Node3D) -> void:
	if not body is Player:
		return

	# Open-world warp mode (priority)
	if warp_target != Vector3.ZERO:
		body.global_position = warp_target
		return

	# Legacy scene-change mode
	var zm: Node = get_node_or_null("/root/ZoneManager")
	if zm and zm.has_method("travel_to"):
		zm.travel_to(destination)
	elif ZONE_PATHS.has(destination):
		get_tree().change_scene_to_file(ZONE_PATHS[destination])
