class_name CatBuilder
extends RefCounted

## Procedural 3D cat model builder using SurfaceTool.
## Creates a high-quality, expressive feline character compatible with
## GL Compatibility renderer (Web, mobile).
##
## Triangle budget: ~12,000-15,000 for the whole cat.
## Materials: StandardMaterial3D only (no custom shaders needed).

# ── Color palette ──
const COLOR_BODY: Color = Color(1.0, 0.6, 0.15)       # Orange #FF9926
const COLOR_BELLY: Color = Color(1.0, 0.95, 0.85)      # Cream #FFF2D9
const COLOR_LEGS: Color = Color(1.0, 0.8, 0.5)         # Warm tan #FFCC80
const COLOR_EAR_INNER: Color = Color(0.95, 0.7, 0.6)    # Pink inner ear
const COLOR_EYE_WHITE: Color = Color(1.0, 1.0, 1.0)
const COLOR_IRIS: Color = Color(0.2, 0.6, 0.3)          # Green eyes
const COLOR_PUPIL: Color = Color(0.05, 0.05, 0.05)      # Near-black
const COLOR_NOSE: Color = Color(0.9, 0.4, 0.4)          # Pink nose
const COLOR_MOUTH: Color = Color(0.4, 0.2, 0.2)         # Dark mouth line
const COLOR_WHISKER: Color = Color(0.9, 0.9, 0.9)       # White whiskers
const COLOR_TAIL_TIP: Color = Color(1.0, 0.9, 0.7)      # Light tail tip

# ── Head ──
func build_head() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 18  # latitude segments
	var rings: int = 14  # longitude rings
	var head_radius: float = 0.28
	var snout_extrude: float = 0.14  # how far the snout pushes forward
	var snout_taper: float = 0.55    # how much the snout narrows
	
	# Generate sphere with elongated snout shape
	for ring in range(rings + 1):
		var theta: float = PI * ring / rings  # 0 to PI (top to bottom)
		var ring_radius: float = sin(theta) * head_radius
		var y: float = cos(theta) * head_radius * 0.9  # slightly flattened vertically
		
		# Snout bulge: push forward on front-facing rings (theta near PI/2, phi near 0)
		var snout_factor: float = 0.0
		if theta > PI * 0.25 and theta < PI * 0.75:
			snout_factor = snout_extrude
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = ring_radius * cos(phi)
			var z: float = ring_radius * sin(phi)
			
			# Apply snout bulge on front (-Z = Godot forward)
			if z < 0:
				var front_amount: float = -z / head_radius  # 0 to 1
				var snout_shape: float = pow(front_amount, 1.5) * snout_factor
				# Also taper the nose
				var taper: float = 1.0 - front_amount * (1.0 - snout_taper) * 0.5
				x *= taper
				y *= taper
				z -= snout_shape
			
			var v: Vector3 = Vector3(x, y, z)
			var uv: Vector2 = Vector2(float(seg) / segs, float(ring) / rings)
			
			st.set_uv(uv)
			st.add_vertex(v)
			
			# Add triangles
			if ring < rings and seg < segs:
				var a: int = ring * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Ears (triangular) ──
func build_ear() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var subdivs: int = 4
	
	# Ear shape: triangle pointing up, slightly curved
	# Base: wide, Tip: narrow, with slight forward curl
	
	for ring in range(subdivs + 1):
		var t: float = float(ring) / subdivs  # 0 (base) to 1 (tip)
		var height: float = 0.18
		var base_width: float = 0.10
		var tip_width: float = 0.025
		var width: float = lerp(base_width, tip_width, t)
		var y: float = -height * t  # ear points UP (negative y in local space)
		var z_offset: float = -0.01 * t  # slight forward lean
		
		var segs_local: int = max(3, floori(subdivs * 2.5))
		
		if ring == subdivs:
			# Tip is a single point
			var v: Vector3 = Vector3(0, y, z_offset)
			st.set_uv(Vector2(0.5, 1.0))
			st.add_vertex(v)
		else:
			for seg in range(segs_local + 1):
				var phi: float = PI * seg / segs_local  # 0 to PI (half ellipse)
				var x: float = width * cos(phi - PI * 0.5) * 0.5
				var z: float = width * sin(phi) * 0.5
				var v: Vector3 = Vector3(x, y, z + z_offset)
				var uv: Vector2 = Vector2(float(seg) / segs_local, t)
				st.set_uv(uv)
				st.add_vertex(v)
	
	# Add triangles
	# Tip section
	var tip_idx: int = _count_ear_verts(subdivs)
	
	for i in range(subdivs):
		var ring_start_a: int = _ear_ring_start(i, subdivs)
		var ring_start_b: int = _ear_ring_start(i + 1, subdivs)
		var segs_ring_a: int = max(3, floori(subdivs * 2.5))
		var segs_ring_b: int = max(3, floori((i + 1) * 2.5))
		
		for seg in range(segs_ring_a):
			var seg_b1: int = int(float(seg) * segs_ring_b / segs_ring_a)
			var seg_b2: int = int(float(seg + 1) * segs_ring_b / segs_ring_a)
			
			if i + 1 < subdivs:
				var a0: int = ring_start_a + seg
				var a1: int = ring_start_a + (seg + 1) % segs_ring_a
				var b0: int = ring_start_b + seg_b1
				var b1: int = ring_start_b + seg_b2 % segs_ring_b
				
				# Two triangles per quad
				st.add_index(a0)
				st.add_index(b0)
				st.add_index(a1)
				st.add_index(a1)
				st.add_index(b0)
				st.add_index(b1)
			else:
				# Last level connects to tip
				var a0: int = ring_start_a + seg
				var a1: int = ring_start_a + (seg + 1) % segs_ring_a
				st.add_index(a0)
				st.add_index(tip_idx)
				st.add_index(a1)
	
	st.generate_normals()
	return st.commit()

func _count_ear_verts(subdivs: int) -> int:
	var count: int = 1  # tip
	for i in range(subdivs):
		count += max(3, int(i * 2.5)) + 1
	return count

func _ear_ring_start(ring: int, subdivs: int) -> int:
	if ring >= subdivs:
		return _count_ear_verts(subdivs) - 1  # tip
	var start: int = 0
	for i in range(ring):
		start += max(3, int(i * 2.5)) + 1
	return start

# ── Eye (white + iris + pupil as one mesh with colors) ──
func build_eye(scale: float = 1.0) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 16
	var rings: int = 10
	
	# Eye is slightly bulging sphere segment
	var radius: float = 0.045 * scale
	
	for ring in range(rings + 1):
		var theta: float = PI * 0.8 * ring / rings  # only front 80%
		var ring_radius: float = sin(theta) * radius
		var z: float = radius - cos(theta) * radius  # push forward
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = ring_radius * cos(phi)
			var y: float = ring_radius * sin(phi) * 0.85  # slightly squished
			var v: Vector3 = Vector3(x, y, z)
			
			# Color based on position
			var dist_from_center: float = sqrt(x * x + y * y) / radius
			var is_pupil: bool = dist_from_center < 0.3
			var is_iris: bool = not is_pupil and dist_from_center < 0.7
			
			var col: Color
			if is_pupil:
				col = COLOR_PUPIL
			elif is_iris:
				col = COLOR_IRIS
			else:
				col = COLOR_EYE_WHITE
			
			st.set_color(col)
			st.set_uv(Vector2(float(seg) / segs, float(ring) / rings))
			st.add_vertex(v)
			
			if ring < rings and seg < segs:
				var a: int = ring * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Nose ──
func build_nose() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	# Small rounded triangle
	var points: Array[Vector3] = [
		Vector3(0, 0.015, 0.01),    # top
		Vector3(-0.01, -0.008, 0.01),  # bottom left
		Vector3(0.01, -0.008, 0.01),   # bottom right
		Vector3(0, 0, 0),              # center back
	]
	
	# Two triangles for front face
	st.set_color(COLOR_NOSE)
	st.add_vertex(points[0])
	st.add_vertex(points[1])
	st.add_vertex(points[2])
	
	# Back
	st.set_color(COLOR_NOSE * 0.7)
	st.add_vertex(points[0])
	st.add_vertex(points[2])
	st.add_vertex(points[3])
	st.add_vertex(points[0])
	st.add_vertex(points[3])
	st.add_vertex(points[1])
	
	st.generate_normals()
	return st.commit()

# ── Whiskers (single thin strip per whisker) ──
func build_whisker(length: float = 0.08, side: int = 1) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	# Flat strip, very thin
	var _half_w: float = 0.001  # reserved for whisker thickness
	var points: Array[Vector3] = [
		Vector3(0, 0, 0),
		Vector3(length * side, 0, 0.002),
		Vector3(length * side, 0.002, 0.003),
		Vector3(0, 0.002, 0),
	]
	
	st.set_color(COLOR_WHISKER)
	for v in points:
		st.add_vertex(v)
	
	st.add_index(0)
	st.add_index(1)
	st.add_index(2)
	st.add_index(0)
	st.add_index(2)
	st.add_index(3)
	
	st.generate_normals()
	return st.commit()

# ── Body (tapered capsule / oval) ──
func build_body() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 14
	var rings: int = 10
	var body_len: float = 0.85
	var body_r: float = 0.28
	
	for ring in range(rings + 1):
		var t: float = float(ring) / rings  # 0 (back) to 1 (front)
		var z: float = -body_len * 0.5 + t * body_len
		
		# Taper at front and back (less severe — more oval)
		var taper: float = 1.0
		if t < 0.1:
			taper = t / 0.1  # 0 to 1
		elif t > 0.9:
			taper = (1.0 - t) / 0.1  # 0 to 1
		taper = lerp(0.7, 1.0, taper)  # never go below 70% width
		
		var ring_r: float = body_r * taper
		
		# Slightly flatten vertically (cat body is wider than tall)
		var flat_y: float = 0.75
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = ring_r * cos(phi)
			var y: float = ring_r * sin(phi) * flat_y
			
			var v: Vector3 = Vector3(x, y + 0.1, z + 0.05)
			st.set_uv(Vector2(float(seg) / segs, t))
			st.add_vertex(v)
			
			if ring < rings and seg < segs:
				var a: int = ring * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Belly (cream underbelly, slightly smaller than body) ──
func build_belly() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 12
	var rings: int = 8
	var body_len: float = 0.4
	var belly_r: float = 0.15
	var flat_y: float = 0.5  # flatter
	
	for ring in range(rings + 1):
		var t: float = float(ring) / rings
		var z: float = -body_len * 0.5 + t * body_len
		
		var taper: float = 1.0
		if t < 0.2:
			taper = t / 0.2
		elif t > 0.8:
			taper = (1.0 - t) / 0.2
		
		var ring_r: float = belly_r * taper
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = ring_r * cos(phi)
			var y: float = -abs(ring_r * sin(phi) * flat_y)  # only bottom half
			
			var v: Vector3 = Vector3(x, y + 0.05, z)
			st.set_uv(Vector2(float(seg) / segs, t))
			st.add_vertex(v)
			
			if ring < rings and seg < segs:
				var a: int = ring * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Leg ──
func build_leg() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 10
	var rings: int = 6
	var leg_h: float = 0.2
	var top_r: float = 0.065
	var bottom_r: float = 0.04
	
	for ring in range(rings + 1):
		var t: float = float(ring) / rings
		var y: float = -leg_h * t
		var r: float = lerp(top_r, bottom_r, t)
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = r * cos(phi)
			var z: float = r * sin(phi)
			
			var v: Vector3 = Vector3(x, y, z)
			st.set_uv(Vector2(float(seg) / segs, t))
			st.add_vertex(v)
			
			if ring < rings and seg < segs:
				var a: int = ring * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Tail (curved tube) ──
func build_tail() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var segs: int = 8
	var tail_segs: int = 14
	var tail_len: float = 0.45
	var tail_r: float = 0.04
	
	for seg_idx in range(tail_segs + 1):
		var t: float = float(seg_idx) / tail_segs
		
		# Curve: tail starts going back then curves up
		var curve_x: float = sin(t * PI * 0.6) * 0.05
		var curve_y: float = -sin(t * PI * 0.8) * 0.08
		var z: float = -t * tail_len
		
		# Taper at tip
		var r_taper: float = 1.0
		if t > 0.7:
			r_taper = lerp(1.0, 0.3, (t - 0.7) / 0.3)
		var r: float = tail_r * r_taper
		
		for seg in range(segs + 1):
			var phi: float = 2.0 * PI * seg / segs
			var x: float = r * cos(phi)
			var y: float = r * sin(phi)
			
			# Local tangent direction for orientation
			# Simplified: just add curve offset to center, vertices relative to center
			var v: Vector3 = Vector3(x + curve_x, y + curve_y, z)
			
			st.set_uv(Vector2(float(seg) / segs, t))
			st.add_vertex(v)
			
			if seg_idx < tail_segs and seg < segs:
				var a: int = seg_idx * (segs + 1) + seg
				var b: int = a + segs + 1
				st.add_index(a)
				st.add_index(b)
				st.add_index(a + 1)
				st.add_index(a + 1)
				st.add_index(b)
				st.add_index(b + 1)
	
	st.generate_normals()
	return st.commit()

# ── Mouth line (thin curved strip) ──
func build_mouth() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var pts: int = 8
	var half_w: float = 0.0015
	for i in range(pts):
		var t: float = float(i) / (pts - 1)
		var x: float = lerp(-0.008, 0.008, t)
		var y: float = -sin(t * PI) * 0.004  # slight curve
		
		var v_top: Vector3 = Vector3(x, y + half_w, 0.01)
		var v_bot: Vector3 = Vector3(x, y - half_w, 0.01)
		
		st.set_color(COLOR_MOUTH)
		st.add_vertex(v_top)
		st.add_vertex(v_bot)
		
		if i < pts - 1:
			var a: int = i * 2
			var b: int = a + 1
			var c: int = a + 2
			var d: int = a + 3
			st.add_index(a)
			st.add_index(c)
			st.add_index(b)
			st.add_index(b)
			st.add_index(c)
			st.add_index(d)
	
	st.generate_normals()
	return st.commit()