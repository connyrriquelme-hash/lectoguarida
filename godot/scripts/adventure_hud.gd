class_name AdventureHUD
extends Control
## Kid-friendly vibrant HUD overlay for the open world.
##
## Dynamically creates a custom Theme in _ready() using StyleBoxFlat for
## panels and progress bars.  The color palette is warm, high-contrast,
## and extremely child-friendly — sand cream base, dark slate text, and
## Araucaria Green fills.
##
## Connects to /root/ProgressionManager to display live coins.
##
## To use, instantiate or add as a child of the main scene:
##   var cl := CanvasLayer.new()
##   cl.layer = 1
##   add_child(cl)
##   var hud := AdventureHUD.new()
##   hud.name = "AdventureHUD"
##   cl.add_child(hud)
##
## The HUD anchors itself to the top-right of the screen automatically.

# ── Core palette ──
const COLOR_SAND: Color = Color("#F4F1DE")
const COLOR_DARK_SLATE: Color = Color("#2B2D42")
const COLOR_GREEN: Color = Color("#2A9D8F")
const COLOR_WHITE: Color = Color.WHITE

# ── Node references (populated in _ready) ──
var coin_label: Label
var xp_progress: ProgressBar
var health_progress: ProgressBar
var _timer: Timer


func _ready() -> void:
	theme = _build_theme()

	_build_ui()

	# Wire up to ProgressionManager for live coin updates
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if pm:
		if pm.has_signal("coins_changed"):
			pm.coins_changed.connect(_on_coins_changed)
		if pm.has_method("get_coins"):
			coin_label.text = "%d 🪙" % pm.get_coins()
		elif "coins" in pm:
			coin_label.text = "%d 🪙" % pm.coins
	else:
		coin_label.text = "999 🪙"

	# Periodic timer as fallback refresh
	_timer = Timer.new()
	_timer.name = "CoinRefreshTimer"
	_timer.wait_time = 1.0
	_timer.timeout.connect(_refresh_coins)
	add_child(_timer)
	_timer.start()


## ──────────────────────────────────────────────────────────────────
#  Theme builder — all StyleBoxFlat + font overrides
## ──────────────────────────────────────────────────────────────────

func _build_theme() -> Theme:
	var t := Theme.new()

	# ─── Main Panel (Coin & Resources container) ───
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = COLOR_SAND
	panel_style.set_corner_radius_all(16)
	panel_style.set_border_width_all(4)
	panel_style.set_border_width(SIDE_BOTTOM, 8)
	panel_style.border_color = COLOR_DARK_SLATE
	# Slight shadow for depth
	panel_style.shadow_size = 6
	panel_style.shadow_color = Color(0, 0, 0, 0.25)
	t.set_stylebox("panel", "Panel", panel_style)
	# Also apply to PanelContainer (more flexible)
	t.set_stylebox("panel", "PanelContainer", panel_style)

	# ─── Progress Bar Background ───
	var prog_bg := StyleBoxFlat.new()
	prog_bg.bg_color = Color(0.16, 0.17, 0.25, 0.5)
	prog_bg.set_corner_radius_all(12)
	t.set_stylebox("background", "ProgressBar", prog_bg)

	# ─── Progress Bar Fill ───
	var prog_fill := StyleBoxFlat.new()
	prog_fill.bg_color = COLOR_GREEN
	prog_fill.set_corner_radius_all(12)
	prog_fill.set_border_width_all(3)
	prog_fill.border_color = COLOR_WHITE
	t.set_stylebox("fill", "ProgressBar", prog_fill)

	# ─── Typography: Labels inside panels ───
	t.set_color("font_color", "Label", COLOR_DARK_SLATE)
	t.set_constant("font_size", "Label", 22)
	t.set_color("font_outline_color", "Label", COLOR_DARK_SLATE)
	t.set_constant("outline_size", "Label", 0)

	# ─── ProgressBar label: white with dark outline ───
	t.set_color("font_color", "ProgressBar", COLOR_WHITE)
	t.set_color("font_outline_color", "ProgressBar", COLOR_DARK_SLATE)
	t.set_constant("outline_size", "ProgressBar", 3)
	t.set_constant("font_size", "ProgressBar", 18)

	return t


## ──────────────────────────────────────────────────────────────────
#  UI construction
## ──────────────────────────────────────────────────────────────────

func _build_ui() -> void:
	# ── Top-right anchor for the HUD panel ──
	var panel := Panel.new()
	panel.name = "MainHUDPanel"
	panel.anchor_left = 0.5
	panel.anchor_top = 0.0
	panel.anchor_right = 1.0
	panel.anchor_bottom = 0.0
	panel.offset_left = 20.0
	panel.offset_top = 12.0
	panel.offset_right = -12.0
	# Let contents drive height — set via VBoxContainer's minimum size
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.name = "VBoxContainer"
	vbox.anchor_left = 0.0
	vbox.anchor_top = 0.0
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.offset_left = 14.0
	vbox.offset_top = 12.0
	vbox.offset_right = -14.0
	vbox.offset_bottom = -12.0
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_child(vbox)

	# ── Row 1: Coins ──
	var coin_hbox := HBoxContainer.new()
	coin_hbox.name = "CoinRow"
	coin_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(coin_hbox)

	var coin_icon := Label.new()
	coin_icon.name = "CoinIcon"
	coin_icon.text = "🪙"
	coin_icon.theme_type_variation = &""
	coin_icon.add_theme_font_size_override("font_size", 28)
	coin_hbox.add_child(coin_icon)

	coin_label = Label.new()
	coin_label.name = "CoinLabel"
	coin_label.text = "0 🪙"
	coin_label.add_theme_font_size_override("font_size", 28)
	coin_label.add_theme_color_override("font_color", COLOR_DARK_SLATE)
	coin_label.add_theme_constant_override("outline_size", 0)
	coin_hbox.add_child(coin_label)

	# ── Spacer ──
	var spacer := Control.new()
	spacer.name = "Spacer"
	spacer.custom_minimum_size = Vector2(0, 8)
	vbox.add_child(spacer)

	# ── Row 2: Experience / Progress ──
	var xp_label := Label.new()
	xp_label.name = "XPLabel"
	xp_label.text = "🌟 Progreso"
	xp_label.add_theme_font_size_override("font_size", 18)
	xp_label.add_theme_color_override("font_color", COLOR_DARK_SLATE)
	vbox.add_child(xp_label)

	xp_progress = ProgressBar.new()
	xp_progress.name = "XPProgress"
	xp_progress.min_value = 0.0
	xp_progress.max_value = 100.0
	xp_progress.value = 0.0
	xp_progress.custom_minimum_size = Vector2(200, 28)
	xp_progress.show_percentage = true
	xp_progress.add_theme_font_size_override("font_size", 18)
	xp_progress.add_theme_color_override("font_color", COLOR_WHITE)
	xp_progress.add_theme_color_override("font_outline_color", COLOR_DARK_SLATE)
	xp_progress.add_theme_constant_override("outline_size", 3)
	vbox.add_child(xp_progress)

	# ── Row 3: Health ──
	var health_label := Label.new()
	health_label.name = "HealthLabel"
	health_label.text = "❤️ Energía"
	health_label.add_theme_font_size_override("font_size", 18)
	health_label.add_theme_color_override("font_color", COLOR_DARK_SLATE)
	vbox.add_child(health_label)

	health_progress = ProgressBar.new()
	health_progress.name = "HealthProgress"
	health_progress.min_value = 0.0
	health_progress.max_value = 100.0
	health_progress.value = 100.0
	health_progress.custom_minimum_size = Vector2(200, 28)
	health_progress.show_percentage = true
	health_progress.add_theme_font_size_override("font_size", 18)
	health_progress.add_theme_color_override("font_color", COLOR_WHITE)
	health_progress.add_theme_color_override("font_outline_color", COLOR_DARK_SLATE)
	health_progress.add_theme_constant_override("outline_size", 3)
	vbox.add_child(health_progress)


## ──────────────────────────────────────────────────────────────────
#  Public API
## ──────────────────────────────────────────────────────────────────

## Sets the XP progress bar to a value between 0 and max_value.
func set_xp(value: float, max_val: float = 100.0) -> void:
	xp_progress.max_value = max_val
	xp_progress.value = value


## Sets the health progress bar to a value between 0 and max_value.
func set_health(value: float, max_val: float = 100.0) -> void:
	health_progress.max_value = max_val
	health_progress.value = value


## Directly update the coin label text.
func set_coins(amount: int) -> void:
	coin_label.text = "%d 🪙" % amount


## ──────────────────────────────────────────────────────────────────
#  Internal callbacks
## ──────────────────────────────────────────────────────────────────

func _on_coins_changed(new_amount: int) -> void:
	coin_label.text = "%d 🪙" % new_amount


func _refresh_coins() -> void:
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if not pm:
		return
	if pm.has_method("get_coins"):
		coin_label.text = "%d 🪙" % pm.get_coins()
	elif "coins" in pm:
		coin_label.text = "%d 🪙" % pm.coins
