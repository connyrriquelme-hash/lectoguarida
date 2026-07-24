extends Node
## Autoload singleton for the LECTOGUARIDA immersive audio system.
## Drives background music, procedurally generated sound effects, and
## pre-recorded narration audio files voiced by a natural Chilean
## child narrator. Each narration file is loaded dynamically from
## res://assets/audio/narration/ based on the slugified title or
## gem name, enabling a story-mode experience without robotic TTS.
##
## Audio ducking is built in: background music volume drops smoothly
## while narration plays and rises back once the file finishes.
## Register in Project Settings > Autoload as "AudioManager".

const BUS_MASTER: String = "Master"
const BUS_SFX: String = "Master"
const BUS_VOICE: String = "Master"
const BUS_MUSIC: String = "Master"

## Base folder containing pre-recorded OGG narration files.
const NARRATION_BASE_PATH: String = "res://assets/audio/narration/"

## Default file extension for narration audio files.
const NARRATION_EXTENSION: String = ".ogg"

## The resting volume for background music in dB.
const BGM_RESTING_DB: float = -12.0

## The ducked volume for BGM while narration is active.
const BGM_DUCKED_DB: float = -24.0

## Duration in seconds of the duck fade-in.
const DUCK_FADE_IN: float = 0.3

## Duration in seconds of the duck fade-out (restoration).
const DUCK_FADE_OUT: float = 0.5

var bgm_player: AudioStreamPlayer
var voice_player: AudioStreamPlayer
var sfx_player: AudioStreamPlayer

var _duck_tween: Tween
var _narration_active: bool = false

## Emitted when a narration audio file starts playing.
signal voice_started(slug: String)

## Emitted when a narration audio file finishes playing naturally.
signal voice_finished(slug: String)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	bgm_player = AudioStreamPlayer.new()
	bgm_player.name = "BGMPlayer"
	bgm_player.bus = BUS_MUSIC
	bgm_player.volume_db = BGM_RESTING_DB
	add_child(bgm_player)
	voice_player = AudioStreamPlayer.new()
	voice_player.name = "VoicePlayer"
	voice_player.bus = BUS_VOICE
	add_child(voice_player)
	sfx_player = AudioStreamPlayer.new()
	sfx_player.name = "SFXPlayer"
	sfx_player.bus = BUS_SFX
	add_child(sfx_player)
	if Engine.is_editor_hint() == false:
		play_bgm()


## ═══════════════════════════════════════════════════════════════
#  Background Music
## ═══════════════════════════════════════════════════════════════

## Plays the given AudioStream as looping background music, defaulting to
## a procedurally generated pentatonic melody if no stream is provided.
func play_bgm(stream: AudioStream = null) -> void:
	if stream:
		bgm_player.stream = stream
	else:
		bgm_player.stream = _generate_procedural_bgm()
	bgm_player.play()


func stop_bgm() -> void:
	bgm_player.stop()


## Loads and plays the pre-recorded narration file whose filename matches
## the slugified version of title_key. The file must be placed at
## res://assets/audio/narration/{slug}.ogg by the developer.
## Automatically ducks the BGM volume for the duration of the narration
## and restores it when the file finishes playing.
func play_narration(title_key: String) -> void:
	if title_key.is_empty():
		return
	stop_voice()
	var slug: String = _slugify(title_key)
	var path: String = NARRATION_BASE_PATH + slug + NARRATION_EXTENSION
	if not ResourceLoader.exists(path):
		push_warning("AudioManager: narration file not found at ", path, " for key \"", title_key, "\"")
		return
	var stream: AudioStream = load(path)
	if stream == null:
		push_warning("AudioManager: failed to load narration file at ", path)
		return
	voice_player.stream = stream
	_narration_active = true
	_duck_bgm()
	if voice_player.finished.is_connected(_on_narration_finished):
		voice_player.finished.disconnect(_on_narration_finished)
	voice_player.finished.connect(_on_narration_finished.bind(slug), CONNECT_ONE_SHOT)
	voice_player.play()
	voice_started.emit(slug)


## Stops any currently playing narration and restores BGM volume.
func stop_voice() -> void:
	voice_player.stop()
	_narration_active = false
	if voice_player.finished.is_connected(_on_narration_finished):
		voice_player.finished.disconnect(_on_narration_finished)
	_unduck_bgm()


func is_narration_playing() -> bool:
	return _narration_active


## ═══════════════════════════════════════════════════════════════
#  Sound Effects
## ═══════════════════════════════════════════════════════════════

## Plays a built-in sound effect by name.
## Built-in names: "click", "success", "wrong", "gem_collect"
func play_sfx(sfx_name: String) -> void:
	var stream: AudioStream = _get_sfx_stream(sfx_name)
	if stream:
		sfx_player.stream = stream
		sfx_player.play()


## ═══════════════════════════════════════════════════════════════
#  Internal Helpers
## ═══════════════════════════════════════════════════════════════

## Converts a Spanish-language title string into a safe filesystem
## slug by removing diacritics, lowercasing, and replacing non-alphanumeric
## characters with single underscores.
func _slugify(text: String) -> String:
	var slug: String = text.to_lower()
	slug = slug.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
	slug = slug.replace("ü", "u").replace("ñ", "n")
	var cleaned: String = ""
	var i: int = 0
	while i < slug.length():
		var ch: String = slug[i]
		var code: int = slug.unicode_at(i)
		if (code >= 97 and code <= 122) or (code >= 48 and code <= 57) or code == 95 or code == 45:
			cleaned += ch
		elif code == 32 or code == 47 or code == 92 or code == 46 or code == 44 or code == 58 or code == 59 or code == 33 or code == 63 or code == 34:
			if cleaned.length() > 0 and cleaned.right(1) != "_":
				cleaned += "_"
		elif code == 39:
			pass
		i += 1
	while cleaned.length() > 0 and cleaned[0] == "_":
		cleaned = cleaned.substr(1)
	while cleaned.length() > 0 and cleaned[cleaned.length() - 1] == "_":
		cleaned = cleaned.substr(0, cleaned.length() - 1)
	return cleaned


func _duck_bgm() -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_tween = create_tween().set_trans(Tween.TRANS_SINE)
	_duck_tween.tween_property(bgm_player, "volume_db", BGM_DUCKED_DB, DUCK_FADE_IN)


func _unduck_bgm() -> void:
	if _duck_tween:
		_duck_tween.kill()
	_duck_tween = create_tween().set_trans(Tween.TRANS_SINE)
	_duck_tween.tween_property(bgm_player, "volume_db", BGM_RESTING_DB, DUCK_FADE_OUT)


func _on_narration_finished(slug: String) -> void:
	_narration_active = false
	_unduck_bgm()
	voice_finished.emit(slug)


## Returns a procedural AudioStreamWAV with a simple looping melody.
## This ensures the game always has BGM even without imported audio files.
func _generate_procedural_bgm() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 8.0
	var total_samples: int = int(sample_rate * duration)

	var data := PackedByteArray()
	data.resize(total_samples * 2)  # 16-bit mono

	# Simple pentatonic melody loop (C, D, E, G, A)
	var notes: Array[float] = [261.63, 293.66, 329.63, 392.0, 440.0]
	var note_duration: float = 0.5
	var samples_per_note: int = int(sample_rate * note_duration)
	var note_index: int = 0
	var t: float = 0.0

	for i: int in range(total_samples):
		var freq: float = notes[note_index % notes.size()]
		var envelope: float = 1.0

		# Simple attack/release envelope
		var pos_in_note: int = i % samples_per_note
		var note_progress: float = float(pos_in_note) / float(samples_per_note)
		if note_progress < 0.05:
			envelope = note_progress / 0.05
		elif note_progress > 0.9:
			envelope = 1.0 - (note_progress - 0.9) / 0.1

		# Soft sine + harmonic
		var sample_val: float = sin(TAU * freq * t) * envelope * 0.25
		sample_val += sin(TAU * freq * 2.0 * t) * envelope * 0.08

		# Convert to 16-bit
		var s16: int = int(clamp(sample_val * 16384.0, -32768.0, 32767.0))
		var idx: int = i * 2
		data[idx] = s16 & 0xFF
		data[idx + 1] = (s16 >> 8) & 0xFF

		t += 1.0 / float(sample_rate)
		if pos_in_note >= samples_per_note - 1:
			note_index += 1

	var wav := AudioStreamWAV.new()
	wav.data = data
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	wav.loop_begin = 0
	wav.loop_end = total_samples
	return wav


## Returns a procedural AudioStreamWAV for the given SFX name.
## Each SFX is a distinct short sound generated in code.
func _get_sfx_stream(sfx_name: String) -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float
	var freq_func: Callable

	match sfx_name:
		"click":
			duration = 0.08
			freq_func = func(t: float) -> float: return sin(TAU * 800.0 * t) * exp(-t * 30.0)
		"success":
			duration = 0.5
			freq_func = func(t: float) -> float:
				var f: float = 523.25 + (659.25 - 523.25) * (t / duration)
				return sin(TAU * f * t) * (1.0 - t / duration) * 0.5
		"wrong":
			duration = 0.4
			freq_func = func(t: float) -> float:
				var f: float = 200.0 - 80.0 * (t / duration)
				return sin(TAU * f * t) * (1.0 - t / duration) * 0.4
		"gem_collect":
			duration = 0.6
			freq_func = func(t: float) -> float:
				var f: float = 800.0 + 1200.0 * (t / duration)
				return (sin(TAU * f * t) + sin(TAU * f * 1.5 * t) * 0.3) * (1.0 - t / duration) * 0.3
		_:
			return null

	var total_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(total_samples * 2)

	for i: int in range(total_samples):
		var t: float = float(i) / float(sample_rate)
		var sample_val: float = freq_func.call(t)
		var s16: int = int(clamp(sample_val * 16384.0, -32768.0, 32767.0))
		var idx: int = i * 2
		data[idx] = s16 & 0xFF
		data[idx + 1] = (s16 >> 8) & 0xFF

	var wav := AudioStreamWAV.new()
	wav.data = data
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	return wav
