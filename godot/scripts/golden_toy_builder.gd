class_name GoldenToyBuilder
extends RefCounted

## Creates visible golden toy models using composite primitives.
## Each toy is built as a Node3D with MeshInstance3D children.
## Triangle budget: 100-800 per toy. Web/mobile compatible.

const GOLD: Color = Color(1.0, 0.78, 0.22)
const GOLD_DARK: Color = Color(0.75, 0.55, 0.12)
const GOLD_LIGHT: Color = Color(1.0, 0.9, 0.5)
const GOLD_SHINY: Color = Color(1.0, 0.85, 0.3)

## Makes a gold StandardMaterial3D
static func make_gold_mat(base: Color = GOLD, emissive: bool = true) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = base
	mat.roughness = 0.25
	mat.metallic = 0.8
	if emissive:
		mat.emission_enabled = true
		mat.emission = GOLD_LIGHT
		mat.emission_energy_multiplier = 0.3
	return mat

## Build golden kitten statuette (Santuario)
static func build_kitten(parent: Node3D) -> void:
	var body := MeshInstance3D.new()
	body.name = "Body"
	var bm := SphereMesh.new()
	bm.radius = 0.35
	bm.height = 0.7
	body.mesh = bm
	body.material_override = make_gold_mat()
	body.position = Vector3(0, 0.2, 0)
	parent.add_child(body)
	
	var head := MeshInstance3D.new()
	head.name = "Head"
	var hm := SphereMesh.new()
	hm.radius = 0.2
	hm.height = 0.4
	head.mesh = hm
	head.material_override = make_gold_mat(GOLD_LIGHT)
	head.position = Vector3(0, 0.5, -0.28)
	parent.add_child(head)
	
	# Ears (small cones via cylinders with differing radii)
	for side in [-1, 1]:
		var ear := MeshInstance3D.new()
		ear.name = "Ear" + ("L" if side < 0 else "R")
		var em := CylinderMesh.new()
		em.top_radius = 0.01
		em.bottom_radius = 0.05
		em.height = 0.1
		ear.mesh = em
		ear.material_override = make_gold_mat(GOLD_DARK)
		ear.position = Vector3(side * 0.12, 0.62, -0.32)
		ear.rotation.x = 0.3
		parent.add_child(ear)
	
	# Tail
	var tail := MeshInstance3D.new()
	tail.name = "Tail"
	var tm := CylinderMesh.new()
	tm.top_radius = 0.02
	tm.bottom_radius = 0.04
	tm.height = 0.35
	tail.mesh = tm
	tail.material_override = make_gold_mat()
	tail.position = Vector3(0.0, 0.15, 0.3)
	tail.rotation.x = 0.5
	parent.add_child(tail)

## Build golden mouse (Bosque de Sonidos)
static func build_mouse(parent: Node3D) -> void:
	var body := MeshInstance3D.new()
	body.name = "Body"
	var bm := SphereMesh.new()
	bm.radius = 0.22
	bm.height = 0.44
	body.mesh = bm
	body.material_override = make_gold_mat()
	body.position = Vector3(0, 0.12, 0)
	parent.add_child(body)
	
	var head := MeshInstance3D.new()
	head.name = "Head"
	var hm := SphereMesh.new()
	hm.radius = 0.12
	hm.height = 0.24
	head.mesh = hm
	head.material_override = make_gold_mat(GOLD_LIGHT)
	head.position = Vector3(0, 0.15, -0.25)
	parent.add_child(head)
	
	# Big ears
	for side in [-1, 1]:
		var ear := MeshInstance3D.new()
		ear.name = "Ear" + ("L" if side < 0 else "R")
		var em := CylinderMesh.new()
		em.top_radius = 0.06
		em.bottom_radius = 0.07
		em.height = 0.02
		ear.mesh = em
		ear.material_override = make_gold_mat(GOLD_LIGHT)
		ear.position = Vector3(side * 0.1, 0.25, -0.28)
		parent.add_child(ear)
	
	# Tail
	var tail := MeshInstance3D.new()
	tail.name = "Tail"
	var tm := CylinderMesh.new()
	tm.top_radius = 0.01
	tm.bottom_radius = 0.02
	tm.height = 0.3
	tail.mesh = tm
	tail.material_override = make_gold_mat()
	tail.position = Vector3(0, 0.1, 0.25)
	tail.rotation.x = 0.8
	parent.add_child(tail)

## Build golden bell ball (Valle de Silabas)
static func build_bell_ball(parent: Node3D) -> void:
	var sphere := MeshInstance3D.new()
	sphere.name = "Ball"
	var sm := SphereMesh.new()
	sm.radius = 0.28
	sm.height = 0.56
	sphere.mesh = sm
	sphere.material_override = make_gold_mat()
	sphere.position = Vector3(0, 0.25, 0)
	parent.add_child(sphere)
	
	# Stripe
	var stripe := MeshInstance3D.new()
	stripe.name = "Stripe"
	var stm := CylinderMesh.new()
	stm.top_radius = 0.29
	stm.bottom_radius = 0.29
	stm.height = 0.04
	stripe.mesh = stm
	stripe.material_override = make_gold_mat(GOLD_DARK)
	stripe.position = Vector3(0, 0.25, 0)
	parent.add_child(stripe)
	
	# Ring on top (thin torus using cylinder)
	var ring := MeshInstance3D.new()
	ring.name = "Ring"
	var rm := CylinderMesh.new()
	rm.top_radius = 0.09
	rm.bottom_radius = 0.09
	rm.height = 0.06
	ring.mesh = rm
	ring.material_override = make_gold_mat(GOLD_LIGHT)
	ring.position = Vector3(0, 0.55, 0)
	parent.add_child(ring)

## Build golden fish (Villa de Palabras)
static func build_fish(parent: Node3D) -> void:
	var body := MeshInstance3D.new()
	body.name = "Body"
	var bm := SphereMesh.new()
	bm.radius = 0.2
	bm.height = 0.4
	body.mesh = bm
	body.material_override = make_gold_mat()
	body.position = Vector3(0, 0.15, 0)
	body.scale = Vector3(1, 0.8, 2.0)
	parent.add_child(body)
	
	# Tail fin
	var tail := MeshInstance3D.new()
	tail.name = "Tail"
	var tm := BoxMesh.new()
	tm.size = Vector3(0.25, 0.15, 0.02)
	tail.mesh = tm
	tail.material_override = make_gold_mat(GOLD_LIGHT)
	tail.position = Vector3(0, 0.15, 0.35)
	tail.rotation.y = 0.2
	parent.add_child(tail)
	
	# Eye
	var eye := MeshInstance3D.new()
	eye.name = "Eye"
	var em := SphereMesh.new()
	em.radius = 0.025
	em.height = 0.05
	eye.mesh = em
	eye.material_override = make_gold_mat(GOLD_DARK, false)
	eye.position = Vector3(0, 0.22, -0.32)
	parent.add_child(eye)

## Build golden yarn ball (Biblioteca de Cuentos)
static func build_yarn(parent: Node3D) -> void:
	var ball := MeshInstance3D.new()
	ball.name = "Ball"
	var bm := SphereMesh.new()
	bm.radius = 0.28
	bm.height = 0.56
	ball.mesh = bm
	ball.material_override = make_gold_mat()
	ball.position = Vector3(0, 0.2, 0)
	parent.add_child(ball)
	
	# Crossing strands (thin cylinders)
	for i in range(4):
		var strand := MeshInstance3D.new()
		strand.name = "Strand" + str(i)
		var sm := CylinderMesh.new()
		sm.top_radius = 0.015
		sm.bottom_radius = 0.015
		sm.height = 0.55
		strand.mesh = sm
		strand.material_override = make_gold_mat(GOLD_LIGHT)
		strand.position = Vector3(0, 0.2, 0)
		strand.rotation = Vector3(i * 0.8, i * 0.5, 0)
		parent.add_child(strand)
	
	# Loose thread
	var thread := MeshInstance3D.new()
	thread.name = "Thread"
	var tm := CylinderMesh.new()
	tm.top_radius = 0.008
	tm.bottom_radius = 0.012
	tm.height = 0.2
	thread.mesh = tm
	thread.material_override = make_gold_mat(GOLD_LIGHT)
	thread.position = Vector3(0.2, 0.4, 0.1)
	thread.rotation = Vector3(0.3, 0.5, 0.2)
	parent.add_child(thread)

## Build golden bell (Isla de Inferencias)
static func build_bell(parent: Node3D) -> void:
	# Bell body (upside-down dome)
	var body := MeshInstance3D.new()
	body.name = "Body"
	var bm := SphereMesh.new()
	bm.radius = 0.22
	bm.height = 0.3
	body.mesh = bm
	body.material_override = make_gold_mat()
	body.position = Vector3(0, 0.2, 0)
	body.scale = Vector3(1, 0.7, 1)
	parent.add_child(body)
	
	# Clapper
	var clapper := MeshInstance3D.new()
	clapper.name = "Clapper"
	var cm := SphereMesh.new()
	cm.radius = 0.04
	cm.height = 0.08
	clapper.mesh = cm
	clapper.material_override = make_gold_mat(GOLD_SHINY)
	clapper.position = Vector3(0, 0.02, 0)
	parent.add_child(clapper)
	
	# Handle ring (thin cylinder)
	var ring := MeshInstance3D.new()
	ring.name = "Ring"
	var rm := CylinderMesh.new()
	rm.top_radius = 0.08
	rm.bottom_radius = 0.08
	rm.height = 0.05
	ring.mesh = rm
	ring.material_override = make_gold_mat(GOLD_LIGHT)
	ring.position = Vector3(0, 0.45, 0)
	parent.add_child(ring)
