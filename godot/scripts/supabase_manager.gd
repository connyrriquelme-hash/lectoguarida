extends Node
## Autoload: SupabaseManager

## Autoload singleton for Supabase REST API communication.
## Add to Project Settings > Autoload as "SupabaseManager".
##
## Setup: Replace URL and KEY below with your actual Supabase project values:
##   1. Go to https://app.supabase.com → your project → Settings → API
##   2. Copy "Project URL" → paste into SUPABASE_URL
##   3. Copy "anon public" key → paste into SUPABASE_ANON_KEY

const SUPABASE_URL: String = "YOUR_SUPABASE_URL"
const SUPABASE_ANON_KEY: String = "YOUR_SUPABASE_ANON_KEY"

## True when URL/KEY are still placeholders — uses local mock storage
var is_mock: bool = true

## Student session data
var student_id: String = ""
var auth_token: String = ""
var is_logged_in: bool = false

## Local metric counters (used in mock mode + synced to dashboard)
var animals_collected: int = 0
var syllables_read: int = 0
var gems_collected: int = 0
var exploration_start_time: int = 0

# ── Signals ──

signal login_success(user_id: String, token: String)
signal login_failed(error_message: String)
signal metrics_updated(animals: int, syllables: int, gems: int)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	is_mock = _is_placeholder(SUPABASE_URL) or _is_placeholder(SUPABASE_ANON_KEY)

	if is_mock:
		print("SupabaseManager: MOCK MODE active — using local storage")
		_load_mock_session()
		exploration_start_time = Time.get_unix_time_from_system()
	else:
		print("SupabaseManager: LIVE mode — connected to ", SUPABASE_URL)
		exploration_start_time = Time.get_unix_time_from_system()


# ═══════════════════════════════════════════════════════════════
#  AUTHENTICATION
# ═══════════════════════════════════════════════════════════════

func login_student(email: String, password: String) -> void:
	if is_mock:
		_mock_login(email, password)
		return

	var http := _create_http()
	http.request_completed.connect(_on_login_response.bind(http))

	var body: Dictionary = {"email": email, "password": password}
	var body_json: String = JSON.stringify(body)

	var url: String = SUPABASE_URL + "/auth/v1/token?grant_type=password"
	var headers: PackedStringArray = [
		"Content-Type: application/json",
		"apikey: " + SUPABASE_ANON_KEY,
	]
	var err: Error = http.request(url, headers, HTTPClient.METHOD_POST, body_json)
	if err != OK:
		login_failed.emit("Network error: " + str(err))


func _on_login_response(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray, http: HTTPRequest) -> void:
	http.queue_free()

	if result != HTTPRequest.RESULT_SUCCESS or response_code != 200:
		var error_msg: String = body.get_string_from_utf8()
		login_failed.emit("Login failed (code %d): %s" % [response_code, error_msg])
		return

	var json := JSON.new()
	var parse_err: Error = json.parse(body.get_string_from_utf8())
	if parse_err != OK:
		login_failed.emit("Invalid JSON response")
		return

	var data: Variant = json.get_data()
	auth_token = data.get("access_token", "")
	student_id = data.get("user", {}).get("id", "")
	is_logged_in = true

	login_success.emit(student_id, auth_token)
	print("SupabaseManager: login success — user ", student_id)


# ═══════════════════════════════════════════════════════════════
#  METRICS (Table: student_metrics)
#  Columns: student_id (text), metric_name (text), value (int),
#           timestamp (timestamptz, default now())
# ═══════════════════════════════════════════════════════════════

func save_metric(metric_name: String, value: int) -> void:
	if is_mock:
		_mock_save_metric(metric_name, value)
		return

	if not is_logged_in:
		push_warning("SupabaseManager: cannot save metric — not logged in")
		return

	var http := _create_http()
	http.request_completed.connect(_on_metric_saved.bind(http))

	var body: Dictionary = {
		"student_id": student_id,
		"metric_name": metric_name,
		"value": value,
	}
	var body_json: String = JSON.stringify(body)

	var url: String = SUPABASE_URL + "/rest/v1/student_metrics"
	var headers: PackedStringArray = [
		"Content-Type: application/json",
		"apikey: " + SUPABASE_ANON_KEY,
		"Authorization: Bearer " + auth_token,
		"Prefer: return=minimal",
	]
	var err: Error = http.request(url, headers, HTTPClient.METHOD_POST, body_json)
	if err != OK:
		push_error("SupabaseManager: save_metric failed: " + str(err))


func _on_metric_saved(result: int, _response_code: int, _headers: PackedStringArray, _body: PackedByteArray, http: HTTPRequest) -> void:
	http.queue_free()
	if result != HTTPRequest.RESULT_SUCCESS:
		push_error("SupabaseManager: metric save HTTP error")


func get_student_metrics(callback: Callable) -> void:
	if is_mock:
		_mock_get_metrics(callback)
		return

	if not is_logged_in:
		callback.call({"animals_collected": 0, "syllables_read": 0})
		return

	var http := _create_http()
	http.request_completed.connect(_on_metrics_received.bind(http, callback))

	var url: String = SUPABASE_URL + "/rest/v1/student_metrics?student_id=eq." + student_id
	var headers: PackedStringArray = [
		"apikey: " + SUPABASE_ANON_KEY,
		"Authorization: Bearer " + auth_token,
	]
	http.request(url, headers)


func _on_metrics_received(result: int, _response_code: int, _headers: PackedStringArray, body: PackedByteArray, http: HTTPRequest, callback: Callable) -> void:
	http.queue_free()

	if result != HTTPRequest.RESULT_SUCCESS:
		callback.call({"animals_collected": 0, "syllables_read": 0})
		return

	var json := JSON.new()
	json.parse(body.get_string_from_utf8())
	var rows: Array = json.get_data()
	if not rows is Array:
		callback.call({"animals_collected": 0, "syllables_read": 0})
		return

	var animals: int = 0
	var syllables: int = 0
	for row: Dictionary in rows:
		var mn: String = row.get("metric_name", "")
		var val: int = row.get("value", 0)
		if mn == "animal_collected":  animals += 1
		elif mn == "syllable_read":   syllables += val

	callback.call({"animals_collected": animals, "syllables_read": syllables})


# ═══════════════════════════════════════════════════════════════
#  PUBLIC CONVENIENCE
# ═══════════════════════════════════════════════════════════════

## Called by CollectibleAnimal when a collectible is collected
func report_animal_collected(animal_name: String) -> void:
	animals_collected += 1
	save_metric("animal_collected", 1)
	metrics_updated.emit(animals_collected, syllables_read, gems_collected)
	print("SupabaseManager: +1 animal '", animal_name, "' | total: ", animals_collected)


## Called by educational triggers when a syllable word is spoken
func report_syllable_read(word: String) -> void:
	syllables_read += 1
	save_metric("syllable_read", 1)
	metrics_updated.emit(animals_collected, syllables_read, gems_collected)
	print("SupabaseManager: +1 syllable '", word, "' | total: ", syllables_read)


## Called by GemChallenge when a gem question is answered correctly
func report_gem_collected(gem_name: String) -> void:
	gems_collected += 1
	save_metric("gem_collected", 1)
	metrics_updated.emit(animals_collected, syllables_read, gems_collected)
	print("SupabaseManager: +1 gem '", gem_name, "' | total: ", gems_collected, "/40")


## Called by TriviaUI when both questions are answered correctly
func report_trivia_completed(trivia_title: String) -> void:
	save_metric("trivia_completed", 1)
	metrics_updated.emit(animals_collected, syllables_read, gems_collected)
	print("SupabaseManager: trivia completed '", trivia_title, "'")


func get_exploration_seconds() -> int:
	return Time.get_unix_time_from_system() - exploration_start_time


# ═══════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════

func _create_http() -> HTTPRequest:
	var http := HTTPRequest.new()
	add_child(http)
	return http


func _is_placeholder(value: String) -> bool:
	return value == "" or value.begins_with("YOUR_")


# ═══════════════════════════════════════════════════════════════
#  MOCK MODE (local, no network)
# ═══════════════════════════════════════════════════════════════

func _mock_login(email: String, _password: String) -> void:
	await get_tree().create_timer(0.5).timeout  # simulate network
	student_id = "mock_" + email.replace("@", "_").replace(".", "_")
	auth_token = "mock_token_" + str(randi())
	is_logged_in = true
	_save_mock_session()
	login_success.emit(student_id, auth_token)
	print("SupabaseManager [MOCK]: logged in as ", student_id)


func _mock_save_metric(metric_name: String, value: int) -> void:
	# Intentionally fire-and-forget — metrics stored in memory
	print("SupabaseManager [MOCK]: saved metric [", metric_name, "] = ", value)


func _mock_get_metrics(callback: Callable) -> void:
	callback.call({
		"animals_collected": animals_collected,
		"syllables_read": syllables_read,
	})


func _save_mock_session() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("session", "student_id", student_id)
	cfg.set_value("session", "token", auth_token)
	cfg.save("user://mock_session.cfg")


func _load_mock_session() -> void:
	var cfg := ConfigFile.new()
	if cfg.load("user://mock_session.cfg") == OK:
		student_id = cfg.get_value("session", "student_id", "")
		auth_token = cfg.get_value("session", "token", "")
		if student_id != "":
			is_logged_in = true
			print("SupabaseManager [MOCK]: restored session for ", student_id)
