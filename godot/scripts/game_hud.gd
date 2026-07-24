class_name GameHUD
extends Control
## Bitácora del Guardián — panel narrativo único y legible.
##
## Unifica monedas, animales, sílabas, gemas, tiempo, progreso y
## energía en una sola bitácora con estilo escolar amigable y
## colores de alto contraste para máxima legibilidad.
## Fondo crema, textos gris pizarra, barras con borde blanco.

# ── Paleta Escolar Alto Contraste ──
const BG_CREAM: Color = Color("#F4F1DE")          # Fondo arena/crema — cálido, amigable
const SLATE_DARK: Color = Color("#2B2D42")        # Gris pizarra para texto + bordes
const GOLD_COIN: Color = Color("#F4A261")         # Dorado miel intenso para monedas
const GREEN_FOREST: Color = Color("#2A9D8F")      # Verde Araucaria vibrante para progreso
const CORAL_ENERGY: Color = Color("#E76F51")       # Coral terracota para energía
const ACCENT_PURPLE: Color = Color("#7B5EA7")     # Púrpura más intenso para sub-títulos
const DIVIDER_LINE: Color = Color("#D1C4A5")      # Línea divisoria dorada tenue

var coin_label: Label
var xp_progress: ProgressBar
var health_progress: ProgressBar
var animals_label: Label
var syllables_label: Label
var gems_label: Label
var time_label: Label
var world_label: Label
var route_label: Label
var gem_red: Label
var gem_yellow: Label
var gem_green: Label
var gem_blue: Label
var gem_purple: Label
var _collapsed: bool = false
var _logbook_panel: PanelContainer = null
var _collapse_tab: Button = null


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_ui()
	_build_collapse_tab()

	# ── Metrics (SupabaseManager) ──
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if sm and sm.has_signal("metrics_updated"):
		sm.metrics_updated.connect(_on_metrics_changed)
	_refresh_metrics()
	_update_time()

	var time_timer := Timer.new()
	time_timer.name = "TimeUpdater"
	time_timer.wait_time = 1.0
	time_timer.timeout.connect(_update_time)
	add_child(time_timer)
	time_timer.start()

	# ── Coins (ProgressionManager) ──
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

	var coin_timer := Timer.new()
	coin_timer.name = "CoinRefreshTimer"
	coin_timer.wait_time = 1.0
	coin_timer.timeout.connect(_refresh_coins)
	add_child(coin_timer)
	coin_timer.start()


func _build_ui() -> void:
	# ══ Panel burbuja: fondo crema, borde pizarra, esquina 16px, sombra ──
	var panel := PanelContainer.new()
	panel.name = "LogbookPanel"
	panel.position = Vector2(14, 14)
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.custom_minimum_size = Vector2(296, 0)
	add_child(panel)
	_logbook_panel = panel

	var t := Theme.new()
	var s := StyleBoxFlat.new()
	s.bg_color = BG_CREAM
	s.set_border_width_all(4)
	s.set_border_width(SIDE_BOTTOM, 8)          # Borde inferior doble → efecto flotante 3D
	s.border_color = SLATE_DARK
	s.set_corner_radius_all(16)
	s.shadow_size = 8
	s.shadow_color = Color(0, 0, 0, 0.25)
	t.set_stylebox("panel", "PanelContainer", s)
	panel.theme = t

	# ── Margen interior ──
	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 14)
	panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.name = "VBoxContainer"
	vbox.custom_minimum_size = Vector2(246, 0)
	vbox.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	margin.add_child(vbox)

	# ════════════════════════════════════════
	#  ENCABEZADO — Bitácora del Guardián
	# ════════════════════════════════════════

	var header := HBoxContainer.new()
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(header)

	var book_icon := Label.new()
	book_icon.text = "📖"
	book_icon.add_theme_font_size_override("font_size", 26)
	header.add_child(book_icon)

	var title := Label.new()
	title.text = " Bitácora del Guardián"
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", SLATE_DARK)
	title.add_theme_constant_override("outline_size", 2)
	title.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.5))
	header.add_child(title)

	vbox.add_child(_ornament())

	# ════════════════════════════════════════
	#  MUNDO ACTUAL Y RUTA
	# ════════════════════════════════════════

	var world_hbox := _stat_line("🌍", "Mundo actual")
	vbox.add_child(world_hbox)
	world_label = world_hbox.get_child(1) as Label

	var route_hbox := _stat_line("📚", "Ruta")
	vbox.add_child(route_hbox)
	route_label = route_hbox.get_child(1) as Label

	vbox.add_child(_ornament())

	# ════════════════════════════════════════
	#  SECCIÓN 1 — Tesoro (🪙 monedas)
	# ════════════════════════════════════════

	var coin_header := HBoxContainer.new()
	coin_header.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(coin_header)

	var chest_icon := Label.new()
	chest_icon.text = "🏆"
	chest_icon.add_theme_font_size_override("font_size", 22)
	coin_header.add_child(chest_icon)

	var coin_title := Label.new()
	coin_title.text = " Tesoro acumulado"
	coin_title.add_theme_font_size_override("font_size", 15)
	coin_title.add_theme_color_override("font_color", ACCENT_PURPLE)
	coin_title.add_theme_constant_override("outline_size", 1)
	coin_title.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.2))
	coin_header.add_child(coin_title)

	var coin_value_hbox := HBoxContainer.new()
	coin_value_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(coin_value_hbox)

	coin_label = Label.new()
	coin_label.name = "CoinLabel"
	coin_label.text = "999 🪙"
	coin_label.add_theme_font_size_override("font_size", 38)
	coin_label.add_theme_color_override("font_color", GOLD_COIN)
	coin_label.add_theme_constant_override("outline_size", 3)
	coin_label.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.5))
	coin_value_hbox.add_child(coin_label)

	vbox.add_child(_ornament())

	# ════════════════════════════════════════
	#  SECCIÓN 2 — Bestiario (estadísticas)
	# ════════════════════════════════════════

	var entry_animals := _entry_line("🐾", "Animales liberados")
	vbox.add_child(entry_animals)
	animals_label = entry_animals.get_child(1) as Label

	var entry_syllables := _entry_line("📖", "Sílabas descifradas")
	vbox.add_child(entry_syllables)
	syllables_label = entry_syllables.get_child(1) as Label

	var entry_gems := _entry_line("💎", "Gemas del saber")
	vbox.add_child(entry_gems)
	gems_label = entry_gems.get_child(1) as Label

	# Gemas por tipo pedagógico
	var gem_red_entry := _entry_line("🔴", "Sonidos")
	vbox.add_child(gem_red_entry)
	gem_red = gem_red_entry.get_child(1) as Label

	var gem_yellow_entry := _entry_line("🟡", "Letras")
	vbox.add_child(gem_yellow_entry)
	gem_yellow = gem_yellow_entry.get_child(1) as Label

	var gem_green_entry := _entry_line("🟢", "Palabras")
	vbox.add_child(gem_green_entry)
	gem_green = gem_green_entry.get_child(1) as Label

	var gem_blue_entry := _entry_line("🔵", "Comprensión")
	vbox.add_child(gem_blue_entry)
	gem_blue = gem_blue_entry.get_child(1) as Label

	var gem_purple_entry := _entry_line("🟣", "Inferencias")
	vbox.add_child(gem_purple_entry)
	gem_purple = gem_purple_entry.get_child(1) as Label

	var entry_time := _entry_line("⏱", "Tiempo en la misión")
	vbox.add_child(entry_time)
	time_label = entry_time.get_child(1) as Label

	vbox.add_child(_ornament())

	# ════════════════════════════════════════
	#  SECCIÓN 3 — Estado del Guardián (barras)
	# ════════════════════════════════════════

	var status_hbox := HBoxContainer.new()
	status_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(status_hbox)

	var compass_icon := Label.new()
	compass_icon.text = "🧭"
	compass_icon.add_theme_font_size_override("font_size", 20)
	status_hbox.add_child(compass_icon)

	var status_title := Label.new()
	status_title.text = "  Estado del Guardián"
	status_title.add_theme_font_size_override("font_size", 15)
	status_title.add_theme_color_override("font_color", ACCENT_PURPLE)
	status_title.add_theme_constant_override("outline_size", 1)
	status_title.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.2))
	status_hbox.add_child(status_title)

	var xp_label := Label.new()
	xp_label.text = "  🌟  Progreso de la misión"
	xp_label.add_theme_font_size_override("font_size", 16)
	xp_label.add_theme_color_override("font_color", SLATE_DARK)
	vbox.add_child(xp_label)

	xp_progress = _make_bar(GREEN_FOREST, 0.0)
	vbox.add_child(xp_progress)

	var hp_label := Label.new()
	hp_label.text = "  ❤️  Energía del guardián"
	hp_label.add_theme_font_size_override("font_size", 16)
	hp_label.add_theme_color_override("font_color", SLATE_DARK)
	vbox.add_child(hp_label)

	health_progress = _make_bar(CORAL_ENERGY, 100.0)
	vbox.add_child(health_progress)


# ── Helpers ──

func _entry_line(icon: String, label_text: String) -> HBoxContainer:
	var hbox := HBoxContainer.new()
	hbox.name = "Entry_" + label_text.replace(" ", "_")

	var icon_label := Label.new()
	icon_label.text = icon + "  "
	icon_label.add_theme_font_size_override("font_size", 18)
	icon_label.add_theme_color_override("font_color", ACCENT_PURPLE)
	icon_label.add_theme_constant_override("outline_size", 1)
	icon_label.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.2))
	icon_label.custom_minimum_size = Vector2(30, 0)
	hbox.add_child(icon_label)

	var desc := Label.new()
	desc.text = label_text + ": 0"
	desc.add_theme_font_size_override("font_size", 17)
	desc.add_theme_color_override("font_color", SLATE_DARK)
	desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(desc)

	return hbox


func _stat_line(icon: String, label_text: String) -> HBoxContainer:
	var hbox := HBoxContainer.new()
	var icon_label := Label.new()
	icon_label.text = icon + "  "
	icon_label.add_theme_font_size_override("font_size", 18)
	icon_label.add_theme_color_override("font_color", ACCENT_PURPLE)
	hbox.add_child(icon_label)
	var desc := Label.new()
	desc.text = label_text
	desc.add_theme_font_size_override("font_size", 16)
	desc.add_theme_color_override("font_color", SLATE_DARK)
	desc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(desc)
	return hbox


func _ornament() -> HSeparator:
	var sep := HSeparator.new()
	sep.add_theme_color_override("color", DIVIDER_LINE)
	sep.custom_minimum_size = Vector2(0, 10)
	return sep


func _make_bar(fill_color: Color, initial_val: float = 0.0) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.min_value = 0.0
	bar.max_value = 100.0
	bar.value = initial_val
	bar.custom_minimum_size = Vector2(248, 32)
	bar.show_percentage = true
	bar.add_theme_font_size_override("font_size", 18)
	bar.add_theme_color_override("font_color", SLATE_DARK)
	# ── Fondo: azul océano profundo semitransparente ──
	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0.08, 0.18, 0.25, 0.75)
	bg_style.set_corner_radius_all(14)
	bg_style.set_border_width_all(1)
	bg_style.border_color = Color(0.3, 0.5, 0.6, 0.5)
	bar.add_theme_stylebox_override("background", bg_style)

	# ── Relleno: color vivo intenso + borde blanco extra grueso ──
	var fill_style := StyleBoxFlat.new()
	fill_style.bg_color = fill_color
	fill_style.set_corner_radius_all(14)
	fill_style.set_border_width_all(4)
	fill_style.border_color = Color.WHITE
	bar.add_theme_stylebox_override("fill", fill_style)

	return bar


# ── Sync ──

func _refresh_metrics() -> void:
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if not sm:
		return
	animals_label.text = "Animales liberados: %d" % sm.animals_collected
	syllables_label.text = "Sílabas descifradas: %d" % sm.syllables_read
	gems_label.text = "Gemas del saber: %d / 40" % sm.gems_collected
	_refresh_route_info()


func _refresh_route_info() -> void:
	var rpm: Node = get_node_or_null("/root/ReaderProfileManager")
	if rpm:
		route_label.text = "Ruta: " + rpm.get_route_name() + "  (Apoyo " + str(rpm.support_level) + ")"
		# Gem type scores from reader profile
		var skills: Dictionary = rpm.skill_scores
		gem_red.text = "Sonidos: %d" % skills.get("phonological", {}).get("correct", 0)
		gem_yellow.text = "Letras: %d" % (skills.get("letters", {}).get("correct", 0) + skills.get("syllables", {}).get("correct", 0))
		gem_green.text = "Palabras: %d" % skills.get("words", {}).get("correct", 0)
		gem_blue.text = "Comprensión: %d" % skills.get("comprehension", {}).get("correct", 0)
		gem_purple.text = "Inferencias: %d" % skills.get("inference", {}).get("correct", 0)
	
	# World label
	var main: Node = get_node_or_null("/root/MainWorld")
	if main:
		world_label.text = "Mundo actual: Mundo Abierto"
	else:
		world_label.text = "Mundo actual: Aventura"


func _on_metrics_changed(animals: int, syllables: int, gems: int) -> void:
	animals_label.text = "Animales liberados: %d" % animals
	syllables_label.text = "Sílabas descifradas: %d" % syllables
	gems_label.text = "Gemas del saber: %d / 40" % gems
	_refresh_route_info()


func _update_time() -> void:
	var sm: Node = get_node_or_null("/root/SupabaseManager")
	if not sm:
		return
	var secs: int = sm.get_exploration_seconds()
	var mins: int = int(float(secs) / 60.0)
	var s: int = secs % 60
	time_label.text = "Tiempo en la misión: %02d:%02d" % [mins, s]


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


# ── Public API ──

func set_xp(value: float, max_val: float = 100.0) -> void:
	xp_progress.max_value = max_val
	xp_progress.value = value

func set_health(value: float, max_val: float = 100.0) -> void:
	health_progress.max_value = max_val
	health_progress.value = value

func set_coins(amount: int) -> void:
	coin_label.text = "%d 🪙" % amount


## Shows a temporary narrative message overlay on the HUD.
func show_narrative_message(text: String) -> void:
	var msg := Label.new()
	msg.name = "NarrativeMessage"
	msg.text = text
	msg.add_theme_font_size_override("font_size", 18)
	msg.add_theme_color_override("font_color", SLATE_DARK)
	msg.add_theme_color_override("font_outline_color", Color(1, 1, 1, 0.5))
	msg.add_theme_constant_override("outline_size", 2)
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	msg.custom_minimum_size = Vector2(300, 0)
	msg.position = Vector2(120, 200)
	add_child(msg)

	var tween := create_tween()
	tween.tween_interval(5.0)
	tween.tween_callback(msg.queue_free)


func _build_collapse_tab() -> void:
	"""Small toggle tab on the right edge of the Bitácora to collapse/expand."""
	_collapse_tab = Button.new()
	_collapse_tab.name = "CollapseTab"
	_collapse_tab.text = "◀"
	_collapse_tab.custom_minimum_size = Vector2(18, 60)
	_collapse_tab.position = Vector2(14 + 296 + 4, 200)
	_collapse_tab.add_theme_font_size_override("font_size", 12)
	_collapse_tab.add_theme_color_override("font_color", SLATE_DARK)
	_collapse_tab.add_theme_color_override("font_hover_color", GOLD_COIN)
	_collapse_tab.add_theme_stylebox_override("normal", _make_tab_style())
	_collapse_tab.add_theme_stylebox_override("hover", _make_tab_style())
	_collapse_tab.pressed.connect(_toggle_collapse)
	add_child(_collapse_tab)


func _make_tab_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = BG_CREAM
	s.border_color = SLATE_DARK
	s.set_border_width_all(2)
	s.set_corner_radius_all(4)
	s.corner_detail = 4
	return s


func _toggle_collapse() -> void:
	set_collapsed(not _collapsed)


func set_collapsed(collapsed: bool) -> void:
	"""Collapse or expand the Bitácora panel."""
	_collapsed = collapsed
	if _logbook_panel == null:
		return

	if collapsed:
		_logbook_panel.hide()
		if _collapse_tab:
			_collapse_tab.text = "▶"
			_collapse_tab.position = Vector2(14, 14)
	else:
		_logbook_panel.show()
		if _collapse_tab:
			_collapse_tab.text = "◀"
			_collapse_tab.position = Vector2(14 + 296, 14)
