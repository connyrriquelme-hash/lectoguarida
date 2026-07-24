extends CanvasLayer

## House Builder Catalog Shop — UI for buying furniture inside the Sanctuary.
##
## Shows a paginated catalog of house furniture items.  Purchases deduct
## coins via ProgressionManager and place the item via HouseBuilder.
##
## Opens when the player walks into the shop trigger zone.

signal shop_closed

const ITEMS_PER_PAGE: int = 6

var _house_builder: Node = null
var _current_page: int = 0
var _total_pages: int = 1

var _coins_label: Label
var _items_container: VBoxContainer
var _prev_button: Button
var _next_button: Button
var _page_label: Label


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_ui()


func setup(house_builder: Node) -> void:
	_house_builder = house_builder
	if _house_builder and _house_builder.has_method("get_item_count"):
		var count: int = _house_builder.get_item_count()
		_total_pages = max(1, int(ceil(float(count) / ITEMS_PER_PAGE)))
	_refresh_ui()


func _build_ui() -> void:
	# ── Semi-transparent overlay ──
	var overlay := ColorRect.new()
	overlay.name = "Overlay"
	overlay.anchor_left = 0.0
	overlay.anchor_top = 0.0
	overlay.anchor_right = 1.0
	overlay.anchor_bottom = 1.0
	overlay.color = Color(0, 0, 0, 0.5)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(overlay)

	# ── Panel principal ──
	var panel := PanelContainer.new()
	panel.name = "Panel"
	panel.anchor_left = 0.2
	panel.anchor_top = 0.1
	panel.anchor_right = 0.8
	panel.anchor_bottom = 0.9
	add_child(panel)

	var theme := Theme.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#F4F1DE")
	style.set_border_width_all(4)
	style.set_border_width(SIDE_BOTTOM, 8)
	style.border_color = Color("#2B2D42")
	style.set_corner_radius_all(16)
	style.shadow_size = 10
	style.shadow_color = Color(0, 0, 0, 0.3)
	theme.set_stylebox("panel", "PanelContainer", style)
	panel.theme = theme

	# VBox principal
	var vbox := VBoxContainer.new()
	vbox.name = "VBox"
	vbox.anchor_left = 0.0
	vbox.anchor_top = 0.0
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.offset_left = 16
	vbox.offset_top = 12
	vbox.offset_right = -16
	vbox.offset_bottom = -12
	panel.add_child(vbox)

	# Título
	var title := HBoxContainer.new()
	title.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(title)

	var icon := Label.new()
	icon.text = "🏪"
	icon.add_theme_font_size_override("font_size", 28)
	title.add_child(icon)

	var title_label := Label.new()
	title_label.text = "  Tienda del Santuario"
	title_label.add_theme_font_size_override("font_size", 22)
	title_label.add_theme_color_override("font_color", Color("#2B2D42"))
	title.add_child(title_label)

	# Monedas
	_coins_label = Label.new()
	_coins_label.name = "CoinsLabel"
	_coins_label.text = "🪙 ???"
	_coins_label.add_theme_font_size_override("font_size", 18)
	_coins_label.add_theme_color_override("font_color", Color("#E9C46A"))
	_coins_label.add_theme_constant_override("outline_size", 2)
	_coins_label.add_theme_color_override("font_outline_color", Color("#2B2D42"))
	vbox.add_child(_coins_label)

	# Scroll de items
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(scroll)

	_items_container = VBoxContainer.new()
	_items_container.name = "ItemsList"
	_items_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(_items_container)

	# Paginación
	var pagination := HBoxContainer.new()
	pagination.alignment = BoxContainer.ALIGNMENT_CENTER
	pagination.custom_minimum_size = Vector2(0, 40)
	vbox.add_child(pagination)

	_prev_button = Button.new()
	_prev_button.text = "◀ Anterior"
	_prev_button.pressed.connect(_prev_page)
	pagination.add_child(_prev_button)

	_page_label = Label.new()
	_page_label.text = "Página 1/1"
	_page_label.add_theme_font_size_override("font_size", 16)
	_page_label.add_theme_color_override("font_color", Color("#2B2D42"))
	_page_label.custom_minimum_size = Vector2(120, 0)
	_page_label.horizontal_alignment = HorizontalAlignment.HORIZONTAL_ALIGNMENT_CENTER
	pagination.add_child(_page_label)

	_next_button = Button.new()
	_next_button.text = "Siguiente ▶"
	_next_button.pressed.connect(_next_page)
	pagination.add_child(_next_button)

	# Botón cerrar
	var close_btn := Button.new()
	close_btn.text = "   ✕ Cerrar   "
	close_btn.pressed.connect(_close)
	vbox.add_child(close_btn)


func _refresh_ui() -> void:
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	var coin_str: String = "🪙 %d" % pm.get_coins() if pm and pm.has_method("get_coins") else "🪙 ??"
	_coins_label.text = "Tesoro: " + coin_str

	_page_label.text = "Página %d / %d" % [_current_page + 1, _total_pages]
	_prev_button.disabled = _current_page <= 0
	_next_button.disabled = _current_page >= _total_pages - 1

	# Clear old items
	for child: Node in _items_container.get_children():
		_items_container.remove_child(child)
		child.queue_free()

	# Populate current page
	if not _house_builder or not _house_builder.has_method("get_all_item_names"):
		return

	var all_names: PackedStringArray = _house_builder.get_all_item_names()
	var start_idx: int = _current_page * ITEMS_PER_PAGE
	var end_idx: int = min(start_idx + ITEMS_PER_PAGE, all_names.size())

	for i in range(start_idx, end_idx):
		var item_name: String = all_names[i]
		var entry: Dictionary = _house_builder.find_item(item_name) if _house_builder.has_method("find_item") else {}
		var cost: int = entry.get("cost", 0)
		var purchased: bool = false

		if pm and pm.has_method("get_purchased_furniture"):
			purchased = item_name in pm.get_purchased_furniture()

		var row := HBoxContainer.new()
		row.custom_minimum_size = Vector2(0, 44)

		var name_label := Label.new()
		name_label.text = item_name
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_label.add_theme_font_size_override("font_size", 15)
		name_label.add_theme_color_override("font_color", Color("#2B2D42"))
		row.add_child(name_label)

		var cost_label := Label.new()
		cost_label.text = "🪙 %d" % cost
		cost_label.custom_minimum_size = Vector2(60, 0)
		cost_label.add_theme_font_size_override("font_size", 15)
		cost_label.add_theme_color_override("font_color", Color("#E9C46A"))
		row.add_child(cost_label)

		var buy_btn := Button.new()
		if purchased:
			buy_btn.text = "✅"
			buy_btn.disabled = true
		else:
			buy_btn.text = "Comprar"
			buy_btn.pressed.connect(_buy_item.bind(item_name, cost))
		buy_btn.custom_minimum_size = Vector2(100, 0)
		row.add_child(buy_btn)

		_items_container.add_child(row)


func _buy_item(item_name: String, cost: int) -> void:
	var pm: Node = get_node_or_null("/root/ProgressionManager")
	if not pm or not pm.has_method("spend_coins"):
		return

	if not pm.spend_coins(cost):
		_coins_label.text = "¡No tienes suficientes monedas!"
		return

	# Place the item via HouseBuilder
	if _house_builder and _house_builder.has_method("buy_and_place"):
		var placed_items: int = pm.get_purchased_furniture().size() if pm.has_method("get_purchased_furniture") else 0
		var col: int = placed_items % 5
		var row_n: int = int(placed_items / 5)
		var pos: Vector3 = Vector3(col * 2.5, 0.0, row_n * 2.5)
		_house_builder.buy_and_place(item_name, pos)
		if pm.has_method("record_furniture_purchased"):
			pm.record_furniture_purchased(item_name)

	_refresh_ui()


func _prev_page() -> void:
	_current_page = max(0, _current_page - 1)
	_refresh_ui()


func _next_page() -> void:
	_current_page = min(_total_pages - 1, _current_page + 1)
	_refresh_ui()


func _close() -> void:
	get_tree().paused = false
	shop_closed.emit()
	queue_free()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_close()