extends Node

## Economy & Narrative Manager — Autoload Singleton.
##
## Tracks coins, unlocked skins, house furniture, and saves/loads
## progress via FileAccess so kids don't lose their coin hoard or
## house between sessions.
##
## Register in Project Settings → Autoload as "ProgressionManager"

signal coins_changed(new_amount: int)
signal skin_unlocked(skin_name: String)
signal furniture_purchased(item_name: String)
signal golden_kitten_rescued

const SAVE_PATH: String = "user://lectoguarida_save.json"
const EXTRA_SAVE_PATH: String = "user://lectoguarida_extra.json"

var coins: int = 50:
	set(value):
		coins = max(value, 0)
		coins_changed.emit(coins)
		save_game()

var unlocked_skins: Array[String] = ["Gafas y Pañuelo"]
var purchased_furniture: Array[String] = []
var golden_kitten_found: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_game()


# ═══════════════════════════════════════════════════════════════
#  COIN ECONOMY
# ═══════════════════════════════════════════════════════════════


## Called by TriviaUI / ChallengeUI / GemChallenge when player answers correctly.
func award_coins(amount: int = 10) -> void:
	coins += amount
	coins_changed.emit(coins)
	print("ProgressionManager: +%d coins → %d" % [amount, coins])


## Called by HouseBuilder to spend coins.
## Returns true if enough coins, false otherwise.
func spend_coins(amount: int) -> bool:
	if coins < amount:
		return false
	coins -= amount
	coins_changed.emit(coins)
	save_game()
	print("ProgressionManager: -%d coins → %d" % [amount, coins])
	return true


func get_coins() -> int:
	return coins


# ═══════════════════════════════════════════════════════════════
#  SKINS
# ═══════════════════════════════════════════════════════════════

func is_skin_unlocked(skin_name: String) -> bool:
	return skin_name in unlocked_skins


## Attempts to buy and unlock a skin. Returns true on success.
func unlock_skin(skin_name: String) -> bool:
	if is_skin_unlocked(skin_name):
		return true  # already owned

	if not spend_coins(50):
		return false  # all skins cost 50 coins

	unlocked_skins.append(skin_name)
	skin_unlocked.emit(skin_name)
	print("ProgressionManager: skin unlocked '%s'" % skin_name)
	save_game()
	return true


func get_unlocked_skins() -> Array[String]:
	return unlocked_skins.duplicate()


# ═══════════════════════════════════════════════════════════════
#  NARRATIVE MILESTONES
# ═══════════════════════════════════════════════════════════════

func is_golden_kitten_rescued() -> bool:
	return golden_kitten_found


func rescue_golden_kitten() -> void:
	if golden_kitten_found:
		return
	golden_kitten_found = true
	golden_kitten_rescued.emit()
	award_coins(100)  # bonus for finding the treasure
	print("ProgressionManager: Golden Kitten rescued!")
	save_game()


func record_furniture_purchased(item_name: String) -> void:
	if item_name not in purchased_furniture:
		purchased_furniture.append(item_name)
	furniture_purchased.emit(item_name)
	save_game()


func get_purchased_furniture() -> Array[String]:
	return purchased_furniture.duplicate()


# ═══════════════════════════════════════════════════════════════
#  SAVE / LOAD (FileAccess)
# ═══════════════════════════════════════════════════════════════

func save_game() -> void:
	var data: Dictionary = {
		"coins": coins,
		"unlocked_skins": unlocked_skins,
		"purchased_furniture": purchased_furniture,
		"golden_kitten_found": golden_kitten_found,
	}

	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()


func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return

	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return

	var raw: String = file.get_as_text()
	file.close()

	var json := JSON.new()
	var err: Error = json.parse(raw)
	if err != OK:
		push_warning("ProgressionManager: save file corrupted, starting fresh")
		return

	var data: Dictionary = json.get_data() as Dictionary
	if data.is_empty():
		return

	coins = data.get("coins", 50)
	var us: Array = data.get("unlocked_skins", ["Gafas y Pañuelo"])
	unlocked_skins.clear()
	for s: Variant in us:
		unlocked_skins.append(str(s))
	var pf: Array = data.get("purchased_furniture", [])
	purchased_furniture.clear()
	for p: Variant in pf:
		purchased_furniture.append(str(p))
	golden_kitten_found = data.get("golden_kitten_found", false)

	print("ProgressionManager: loaded %d coins, %d skins, %d furniture items" % [coins, unlocked_skins.size(), purchased_furniture.size()])


# ═══════════════════════════════════════════════════════════════
#  EXTRA DATA — for ReaderProfileManager & other subsystems
# ═══════════════════════════════════════════════════════════════

## Saves arbitrary extra data under a key (called by ReaderProfileManager).
func _save_extra_data(key: String, data: Dictionary) -> void:
	var all_data: Dictionary = {}
	var file: FileAccess = FileAccess.open(EXTRA_SAVE_PATH, FileAccess.READ)
	if file:
		var raw: String = file.get_as_text()
		file.close()
		var json := JSON.new()
		if json.parse(raw) == OK:
			all_data = json.get_data() as Dictionary
	
	all_data[key] = data
	
	file = FileAccess.open(EXTRA_SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(all_data))
		file.close()


## Loads extra data by key.
func _load_extra_data(key: String) -> Dictionary:
	if not FileAccess.file_exists(EXTRA_SAVE_PATH):
		return {}
	
	var file: FileAccess = FileAccess.open(EXTRA_SAVE_PATH, FileAccess.READ)
	if not file:
		return {}
	
	var raw: String = file.get_as_text()
	file.close()
	
	var json := JSON.new()
	var err: Error = json.parse(raw)
	if err != OK:
		return {}
	
	var all_data: Dictionary = json.get_data() as Dictionary
	return all_data.get(key, {})