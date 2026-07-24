## LecturaContentDB — Base de Datos de Contenido Educativo para Lectoescritura
## Autoload singleton con 200+ actividades organizadas por habilidad y dificultad.
##
## Register in Project Settings > Autoload as "LecturaContentDB"
extends Node

## Formato de actividad:
## {
##   "id": String único,
##   "world": String (bosque, valle, villa, biblioteca, isla),
##   "skill": String (phonological, letters, syllables, words, comprehension, inference),
##   "difficulty": int (1-5),
##   "min_route": String (explorador, constructor, aventurero),
##   "type": String (listen_choose, initial_sound, final_sound, build_syllable,
##                   build_word, word_image, complete_word, order_sentence,
##                   multiple_choice, short_answer, read_aloud),
##   "instruction": String (texto visible),
##   "audio_instruction": String (texto para narración),
##   "image_hint": String (emoji o ruta de imagen),
##   "stimulus": String (sonido, sílaba, palabra, oración o texto),
##   "options": Array[String] (alternativas, vacío para respuesta corta),
##   "correct": int (índice de respuesta correcta -1 para respuesta corta),
##   "correct_answer": String (para respuesta corta),
##   "keywords": Array[String] (para evaluar respuesta corta),
##   "explanation": String (retroalimentación),
##   "hint": String (pista),
##   "coins": int (recompensa),
##   "gem_type": String (red, yellow, green, blue, purple),
## }

## Obtener actividades filtradas por mundo, habilidad y ruta
func get_activities_for(world: String = "", skill: String = "",
		route: String = "", difficulty_min: int = 0, difficulty_max: int = 5,
		exclude_ids: Array[String] = []) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for act: Dictionary in ACTIVITIES:
		if world != "" and act.get("world", "") != world:
			continue
		if skill != "" and act.get("skill", "") != skill:
			continue
		if route != "" and act.get("min_route", "") != route:
			# También mostrar actividades de rutas inferiores
			var route_order: Dictionary = {"explorador": 0, "constructor": 1, "aventurero": 2}
			var act_route: int = route_order.get(act.get("min_route", "explorador"), 0)
			var player_route: int = route_order.get(route, 0)
			if act_route > player_route:
				continue
		var d: int = act.get("difficulty", 1)
		if d < difficulty_min or d > difficulty_max:
			continue
		if act.get("id", "") in exclude_ids:
			continue
		result.append(act)
	return result

## Obtener una actividad por ID
func get_activity(id: String) -> Dictionary:
	for act: Dictionary in ACTIVITIES:
		if act.get("id", "") == id:
			return act
	return {}

## Obtener actividades para diagnóstico
func get_diagnostic_activities() -> Array[Dictionary]:
	return ACTIVITIES.slice(0, 7)  # primeras 7 = diagnóstico

## Obtener prueba final para un mundo
func get_world_final_test(world: String, route: String) -> Array[Dictionary]:
	var all: Array[Dictionary] = get_activities_for(world, "", route, 3, 5)
	all.shuffle()
	return all.slice(0, 3)  # 3 preguntas para prueba final

# ═══════════════════════════════════════════════════════════════
#  200+ ACTIVIDADES EDUCATIVAS
# ═══════════════════════════════════════════════════════════════

const ACTIVITIES: Array[Dictionary] = [

# ── BOSQUE DE LOS SONIDOS — Conciencia Fonológica ──
# world: "bosque", skill: "phonological"

# Vocales (difficulty 1, explorador)
{"id":"bos_fon_001","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y elige la vocal","audio_instruction":"Escucha el sonido y elige la vocal que escuchaste","image_hint":"👂","stimulus":"AAAAA","options":["A","E","O"],"correct":0,"explanation":"¡Muy bien! El sonido 'AAAAA' es la letra A.","hint":"Escucha con atención el sonido que hace la boca.","coins":3,"gem_type":"red"},
{"id":"bos_fon_002","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y elige la vocal","audio_instruction":"Escucha el sonido y elige la vocal","image_hint":"👂","stimulus":"EEEEE","options":["I","E","A"],"correct":1,"explanation":"¡Correcto! El sonido 'EEEEE' es la letra E.","hint":"Escucha bien el sonido.","coins":3,"gem_type":"red"},
{"id":"bos_fon_003","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y elige la vocal","audio_instruction":"Escucha el sonido","image_hint":"👂","stimulus":"IIIII","options":["E","I","O"],"correct":1,"explanation":"¡Bien! El sonido 'IIIII' es la letra I.","hint":"Presta atención al sonido.","coins":3,"gem_type":"red"},
{"id":"bos_fon_004","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y elige la vocal","audio_instruction":"Escucha","image_hint":"👂","stimulus":"OOOOO","options":["A","O","U"],"correct":1,"explanation":"¡Excelente! El sonido 'OOOOO' es la letra O.","hint":"Escucha con cuidado.","coins":3,"gem_type":"red"},
{"id":"bos_fon_005","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y elige la vocal","audio_instruction":"Escucha","image_hint":"👂","stimulus":"UUUUU","options":["U","O","A"],"correct":0,"explanation":"¡Perfecto! El sonido 'UUUUU' es la letra U.","hint":"Concéntrate en el sonido.","coins":3,"gem_type":"red"},

# Sonido inicial (difficulty 1-2)
{"id":"bos_fon_006","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"initial_sound","instruction":"¿Con qué sonido empieza SOL?","audio_instruction":"Escucha: SOL. ¿Con qué letra empieza?","image_hint":"☀️","stimulus":"SOL","options":["S","T","P"],"correct":0,"explanation":"¡Sí! SOL empieza con la letra S.","hint":"Escucha el principio de la palabra: S-S-S-SOL.","coins":5,"gem_type":"red"},
{"id":"bos_fon_007","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"initial_sound","instruction":"¿Con qué sonido empieza LUNA?","audio_instruction":"Escucha: LUNA. ¿Qué letra suena primero?","image_hint":"🌙","stimulus":"LUNA","options":["M","L","N"],"correct":1,"explanation":"¡Muy bien! LUNA empieza con L.","hint":"L-L-L-LUNA. ¿Qué escuchas al empezar?","coins":5,"gem_type":"red"},
{"id":"bos_fon_008","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"initial_sound","instruction":"¿Con qué sonido empieza MAMÁ?","audio_instruction":"Escucha: MAMÁ","image_hint":"👩","stimulus":"MAMÁ","options":["P","M","N"],"correct":1,"explanation":"¡Correcto! MAMÁ empieza con M.","hint":"M-M-M-MAMÁ.","coins":5,"gem_type":"red"},
{"id":"bos_fon_009","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"initial_sound","instruction":"¿Con qué sonido empieza PAPÁ?","audio_instruction":"Escucha: PAPÁ","image_hint":"👨","stimulus":"PAPÁ","options":["T","P","B"],"correct":1,"explanation":"¡Muy bien! PAPÁ empieza con P.","hint":"P-P-P-PAPÁ.","coins":5,"gem_type":"red"},
{"id":"bos_fon_010","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"initial_sound","instruction":"¿Con qué sonido empieza CASA?","audio_instruction":"Escucha: CASA","image_hint":"🏠","stimulus":"CASA","options":["C","G","S"],"correct":0,"explanation":"¡Sí! CASA empieza con C.","hint":"C-C-C-CASA.","coins":5,"gem_type":"red"},

# Más sonido inicial (difficulty 2, constructor)
{"id":"bos_fon_011","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"initial_sound","instruction":"¿Qué letra suena al empezar FLOR?","audio_instruction":"FLOR","image_hint":"🌸","stimulus":"FLOR","options":["F","L","R"],"correct":0,"explanation":"¡Correcto! FLOR empieza con F.","hint":"F-F-F-FLOR.","coins":5,"gem_type":"red"},
{"id":"bos_fon_012","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"initial_sound","instruction":"¿Qué letra suena al empezar GATO?","audio_instruction":"GATO","image_hint":"🐱","stimulus":"GATO","options":["J","G","T"],"correct":1,"explanation":"¡Muy bien! GATO empieza con G.","hint":"G-G-G-GATO.","coins":5,"gem_type":"red"},
{"id":"bos_fon_013","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"initial_sound","instruction":"¿Qué letra suena al empezar BOTA?","audio_instruction":"BOTA","image_hint":"👢","stimulus":"BOTA","options":["B","P","D"],"correct":0,"explanation":"¡Excelente! BOTA empieza con B.","hint":"B-B-B-BOTA.","coins":5,"gem_type":"red"},

# Sonido final (difficulty 2)
{"id":"bos_fon_014","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"final_sound","instruction":"¿Qué sonido escuchas al final de SOL?","audio_instruction":"SOL. ¿Qué escuchas al final?","image_hint":"☀️","stimulus":"SOL","options":["L","S","O"],"correct":0,"explanation":"¡Sí! SOL termina con el sonido L.","hint":"SO-L-L-L. Escucha el final.","coins":5,"gem_type":"red"},
{"id":"bos_fon_015","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"final_sound","instruction":"¿Qué sonido escuchas al final de MAR?","audio_instruction":"MAR","image_hint":"🌊","stimulus":"MAR","options":["M","A","R"],"correct":2,"explanation":"¡Correcto! MAR termina con R.","hint":"MA-R-R-R.","coins":5,"gem_type":"red"},
{"id":"bos_fon_016","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"final_sound","instruction":"¿Qué sonido escuchas al final de PAN?","audio_instruction":"PAN","image_hint":"🍞","stimulus":"PAN","options":["P","A","N"],"correct":2,"explanation":"¡Muy bien! PAN termina con N.","hint":"PA-N-N-N.","coins":5,"gem_type":"red"},
{"id":"bos_fon_017","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"final_sound","instruction":"¿Qué sonido escuchas al final de TREN?","audio_instruction":"TREN","image_hint":"🚂","stimulus":"TREN","options":["T","E","N"],"correct":2,"explanation":"¡Bien! TREN termina con N.","hint":"TRE-N-N-N.","coins":5,"gem_type":"red"},

# Segmentación oral (difficulty 2-3)
{"id":"bos_fon_018","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"listen_choose","instruction":"¿Cuántas partes tiene la palabra MESA?","audio_instruction":"MESA. Vamos a separarla: ME - SA.","image_hint":"🪑","stimulus":"MESA","options":["ME-SA (2 partes)","ME-SA-PA (3 partes)","M-E-S-A (4 partes)"],"correct":0,"explanation":"¡Sí! ME-SA tiene 2 partes, llamadas sílabas.","hint":"Escucha: ME... SA. ¿Cuántas partes?","coins":5,"gem_type":"red"},
{"id":"bos_fon_019","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"listen_choose","instruction":"¿Cuántas partes tiene CASA?","audio_instruction":"CASA: CA - SA","image_hint":"🏠","stimulus":"CASA","options":["CA-SA (2)","CA-SA-PA (3)","C-A-S-A (4)"],"correct":0,"explanation":"¡Correcto! CASA tiene 2 sílabas.","hint":"CA... SA.","coins":5,"gem_type":"red"},
{"id":"bos_fon_020","world":"bosque","skill":"phonological","difficulty":3,"min_route":"constructor","type":"listen_choose","instruction":"¿Cuántas partes tiene MARIPOSA?","audio_instruction":"MA-RI-PO-SA","image_hint":"🦋","stimulus":"MARIPOSA","options":["MA-RI-PO-SA (4)","MA-RI-PO (3)","MA-RI-PO-SA-SA (5)"],"correct":0,"explanation":"¡Sí! MARIPOSA tiene 4 sílabas.","hint":"MA... RI... PO... SA.","coins":5,"gem_type":"red"},

# Asociación imagen-palabra (difficulty 1)
{"id":"bos_fon_021","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"word_image","instruction":"¿Qué animal ves?","audio_instruction":"Mira la imagen. ¿Qué animal es?","image_hint":"🐱","stimulus":"gato","options":["GATO","PERRO","PATO"],"correct":0,"explanation":"¡Sí! Ese es un GATO.","hint":"Mira bien el animal.","coins":3,"gem_type":"red"},
{"id":"bos_fon_022","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"word_image","instruction":"¿Qué animal ves?","audio_instruction":"Mira la imagen","image_hint":"🐕","stimulus":"perro","options":["GATO","PERRO","PATO"],"correct":1,"explanation":"¡Muy bien! Es un PERRO.","hint":"¿Qué animal ladra?","coins":3,"gem_type":"red"},
{"id":"bos_fon_023","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"word_image","instruction":"¿Qué ves en la imagen?","audio_instruction":"Mira","image_hint":"🌳","stimulus":"árbol","options":["FLOR","ÁRBOL","CASA"],"correct":1,"explanation":"¡Correcto! Es un ÁRBOL.","hint":"Es muy grande y tiene hojas.","coins":3,"gem_type":"red"},
{"id":"bos_fon_024","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"word_image","instruction":"¿Qué ves?","audio_instruction":"Mira la imagen","image_hint":"🚗","stimulus":"auto","options":["BICICLETA","AUTO","TREN"],"correct":1,"explanation":"¡Bien! Es un AUTO.","hint":"Tiene 4 ruedas.","coins":3,"gem_type":"red"},
{"id":"bos_fon_025","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"word_image","instruction":"¿Qué ves?","audio_instruction":"Mira","image_hint":"🐟","stimulus":"pez","options":["AVE","PEZ","GATO"],"correct":1,"explanation":"¡Sí! Es un PEZ.","hint":"Vive en el agua.","coins":3,"gem_type":"red"},

# Vocabulario oral (difficulty 1, explorador)
{"id":"bos_fon_026","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha la palabra: ÁRBOL. ¿Qué imagen corresponde?","audio_instruction":"ÁRBOL. ¿Cuál es la imagen del ÁRBOL?","image_hint":"🌳","stimulus":"ÁRBOL","options":["🌳 ÁRBOL","🌸 FLOR","🍎 MANZANA"],"correct":0,"explanation":"¡Muy bien! Ese es un ÁRBOL.","hint":"Busca el árbol.","coins":3,"gem_type":"red"},
{"id":"bos_fon_027","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: SOL. ¿Cuál es la imagen?","audio_instruction":"SOL","image_hint":"☀️","stimulus":"SOL","options":["☀️ SOL","🌙 LUNA","⭐ ESTRELLA"],"correct":0,"explanation":"¡Sí! Ese es el SOL.","hint":"Brilla en el cielo de día.","coins":3,"gem_type":"red"},
{"id":"bos_fon_028","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: AGUA. ¿Cuál es?","audio_instruction":"AGUA","image_hint":"💧","stimulus":"AGUA","options":["🔥 FUEGO","🌊 AGUA","🌬️ VIENTO"],"correct":1,"explanation":"¡Correcto! Es AGUA.","hint":"Bebemos agua todos los días.","coins":3,"gem_type":"red"},
{"id":"bos_fon_029","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: PAN. ¿Cuál es?","audio_instruction":"PAN","image_hint":"🍞","stimulus":"PAN","options":["🍞 PAN","🧀 QUESO","🥛 LECHE"],"correct":0,"explanation":"¡Bien! Es PAN.","hint":"Se come en el desayuno.","coins":3,"gem_type":"red"},
{"id":"bos_fon_030","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: FLOR. ¿Cuál es?","audio_instruction":"FLOR","image_hint":"🌸","stimulus":"FLOR","options":["🌳 ÁRBOL","🌸 FLOR","🍃 HOJA"],"correct":1,"explanation":"¡Muy bien! Es una FLOR.","hint":"Huele rico y tiene colores.","coins":3,"gem_type":"red"},

# ── VALLE DE LAS SÍLABAS — Letras y Sílabas ──
# world: "valle", skill: "letters" o "syllables"

# Correspondencia sonido-letra (difficulty 1)
{"id":"val_let_001","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra hace el sonido 'M'?","audio_instruction":"Escucha: MMMMM. ¿Cuál letra es?","image_hint":"🔤","stimulus":"M","options":["N","M","P"],"correct":1,"explanation":"¡Sí! La M suena MMMMM.","hint":"Junta los labios: M-M-M.","coins":5,"gem_type":"yellow"},
{"id":"val_let_002","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra hace el sonido 'S'?","audio_instruction":"SSSSS","image_hint":"🔤","stimulus":"S","options":["S","C","Z"],"correct":0,"explanation":"¡Correcto! La S suena como una serpiente: SSSSS.","hint":"SSSS como una serpiente.","coins":5,"gem_type":"yellow"},
{"id":"val_let_003","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra hace el sonido 'P'?","audio_instruction":"PPPPP","image_hint":"🔤","stimulus":"P","options":["B","T","P"],"correct":2,"explanation":"¡Muy bien! La P suena PPPPP.","hint":"Junta los labios y suelta: P.","coins":5,"gem_type":"yellow"},
{"id":"val_let_004","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra hace el sonido 'L'?","audio_instruction":"LLLLL","image_hint":"🔤","stimulus":"L","options":["R","L","N"],"correct":1,"explanation":"¡Sí! La L suena LLLLL.","hint":"Lengua arriba: L-L-L.","coins":5,"gem_type":"yellow"},
{"id":"val_let_005","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra hace el sonido 'T'?","audio_instruction":"TTTTT","image_hint":"🔤","stimulus":"T","options":["T","D","P"],"correct":0,"explanation":"¡Bien! La T suena TTTTT.","hint":"T-T-T como un reloj.","coins":5,"gem_type":"yellow"},

# Sílabas directas MA, ME, MI, MO, MU (difficulty 1-2)
{"id":"val_sil_001","world":"valle","skill":"syllables","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: MA.","image_hint":"🔊","stimulus":"MA","options":["MA","ME","MI"],"correct":0,"explanation":"¡Muy bien! Es MA, como en MAMÁ.","hint":"MA... como MAMÁ.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_002","world":"valle","skill":"syllables","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: PA.","image_hint":"🔊","stimulus":"PA","options":["PA","PE","PI"],"correct":0,"explanation":"¡Sí! Es PA, como en PAPÁ.","hint":"PA... como PAPÁ.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_003","world":"valle","skill":"syllables","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: SA.","image_hint":"🔊","stimulus":"SA","options":["SA","SE","SO"],"correct":0,"explanation":"¡Correcto! Es SA, como en SAPO.","hint":"SA... como SAPO.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_004","world":"valle","skill":"syllables","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: TA.","image_hint":"🔊","stimulus":"TA","options":["TA","TE","TI"],"correct":0,"explanation":"¡Bien! Es TA, como en TAZA.","hint":"TA... como TAZA.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_005","world":"valle","skill":"syllables","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: LA.","image_hint":"🔊","stimulus":"LA","options":["LA","LE","LO"],"correct":0,"explanation":"¡Muy bien! Es LA, como en LÁPIZ.","hint":"LA... como LÁPIZ.","coins":5,"gem_type":"yellow"},

# Armar sílabas (difficulty 2-3, constructor)
{"id":"val_sil_006","world":"valle","skill":"syllables","difficulty":2,"min_route":"constructor","type":"build_syllable","instruction":"Arma la sílaba MA","audio_instruction":"Ordena las letras para formar MA","image_hint":"🧩","stimulus":"MA","options":["A","M"],"correct":-1,"correct_answer":"MA","keywords":["MA"],"explanation":"¡Muy bien! M + A = MA.","hint":"Primero la M, después la A.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_007","world":"valle","skill":"syllables","difficulty":2,"min_route":"constructor","type":"build_syllable","instruction":"Arma la sílaba PA","audio_instruction":"Ordena: PA","image_hint":"🧩","stimulus":"PA","options":["P","A"],"correct":-1,"correct_answer":"PA","keywords":["PA"],"explanation":"¡Correcto! P + A = PA.","hint":"P... después A.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_008","world":"valle","skill":"syllables","difficulty":2,"min_route":"constructor","type":"build_syllable","instruction":"Arma la sílaba SOL","audio_instruction":"Ordena para formar SOL","image_hint":"☀️","stimulus":"SOL","options":["S","O","L"],"correct":-1,"correct_answer":"SOL","keywords":["SOL"],"explanation":"¡Excelente! S + O + L = SOL.","hint":"Primero la S, luego O, después L.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_009","world":"valle","skill":"syllables","difficulty":3,"min_route":"constructor","type":"build_syllable","instruction":"Arma la sílaba MAR","audio_instruction":"Forma MAR","image_hint":"🌊","stimulus":"MAR","options":["M","A","R"],"correct":-1,"correct_answer":"MAR","keywords":["MAR"],"explanation":"¡Bien! M + A + R = MAR.","hint":"M... A... R.","coins":7,"gem_type":"yellow"},

# Silabas inversas (difficulty 3)
{"id":"val_sil_010","world":"valle","skill":"syllables","difficulty":3,"min_route":"constructor","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: AL","image_hint":"🔊","stimulus":"AL","options":["AL","LA","EL"],"correct":0,"explanation":"¡Sí! Es AL, con la A antes que la L.","hint":"A... L → AL.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_011","world":"valle","skill":"syllables","difficulty":3,"min_route":"constructor","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: ES","image_hint":"🔊","stimulus":"ES","options":["SE","ES","EL"],"correct":1,"explanation":"¡Correcto! ES, como en ESCUELA.","hint":"E... S → ES.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_012","world":"valle","skill":"syllables","difficulty":3,"min_route":"constructor","type":"listen_choose","instruction":"¿Qué sílaba escuchas?","audio_instruction":"Escucha: IN","image_hint":"🔊","stimulus":"IN","options":["IN","NI","AN"],"correct":0,"explanation":"¡Muy bien! IN, como en INVIERNO.","hint":"I... N → IN.","coins":5,"gem_type":"yellow"},

# ── VILLA DE LAS PALABRAS — Formación de Palabras ──
# world: "villa", skill: "words"

# Armar palabras (difficulty 2)
{"id":"vil_pal_001","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma la palabra: GATO","audio_instruction":"Junta las sílabas para formar GATO","image_hint":"🐱","stimulus":"GATO","options":["GA","TO"],"correct":-1,"correct_answer":"GATO","keywords":["GATO"],"explanation":"¡Sí! GA + TO = GATO.","hint":"GA... TO.","coins":8,"gem_type":"green"},
{"id":"vil_pal_002","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma la palabra: CASA","audio_instruction":"Forma CASA","image_hint":"🏠","stimulus":"CASA","options":["CA","SA"],"correct":-1,"correct_answer":"CASA","keywords":["CASA"],"explanation":"¡Correcto! CA + SA = CASA.","hint":"CA... SA.","coins":8,"gem_type":"green"},
{"id":"vil_pal_003","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: PERRO","audio_instruction":"PERRO","image_hint":"🐕","stimulus":"PERRO","options":["PE","RRO"],"correct":-1,"correct_answer":"PERRO","keywords":["PERRO"],"explanation":"¡Muy bien! PE + RRO = PERRO.","hint":"PE... RRO.","coins":8,"gem_type":"green"},
{"id":"vil_pal_004","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: MESA","audio_instruction":"MESA","image_hint":"🪑","stimulus":"MESA","options":["ME","SA"],"correct":-1,"correct_answer":"MESA","keywords":["MESA"],"explanation":"¡Bien! ME + SA = MESA.","hint":"ME... SA.","coins":8,"gem_type":"green"},
{"id":"vil_pal_005","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: SAPO","audio_instruction":"SAPO","image_hint":"🐸","stimulus":"SAPO","options":["SA","PO"],"correct":-1,"correct_answer":"SAPO","keywords":["SAPO"],"explanation":"¡Sí! SA + PO = SAPO.","hint":"SA... PO.","coins":8,"gem_type":"green"},

# Palabras de 3 sílabas (difficulty 3)
{"id":"vil_pal_006","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"build_word","instruction":"Arma: MARIPOSA","audio_instruction":"MARIPOSA","image_hint":"🦋","stimulus":"MARIPOSA","options":["MA","RI","PO","SA"],"correct":-1,"correct_answer":"MARIPOSA","keywords":["MARIPOSA"],"explanation":"¡Excelente! MA-RI-PO-SA = MARIPOSA.","hint":"MA... RI... PO... SA.","coins":10,"gem_type":"green"},

# Completar palabra (difficulty 2-3)
{"id":"vil_pal_007","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"complete_word","instruction":"Completa: CA_A","audio_instruction":"Completa la palabra: CA...A","image_hint":"🏠","stimulus":"CA_A","options":["S","R","T"],"correct":0,"explanation":"¡Sí! CA + S + A = CASA.","hint":"CA-SA, falta la S.","coins":8,"gem_type":"green"},
{"id":"vil_pal_008","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"complete_word","instruction":"Completa: GA_O","audio_instruction":"Completa: GA...O","image_hint":"🐱","stimulus":"GA_O","options":["T","P","M"],"correct":0,"explanation":"¡Correcto! GA + T + O = GATO.","hint":"GA-TO, falta la T.","coins":8,"gem_type":"green"},
{"id":"vil_pal_009","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"complete_word","instruction":"Completa: ESCU_LA","audio_instruction":"Completa: ESCU...LA","image_hint":"🏫","stimulus":"ESCUELA","options":["E","A","O"],"correct":0,"explanation":"¡Muy bien! ESCU + E + LA = ESCUELA.","hint":"ESCUE-LA, falta la E.","coins":10,"gem_type":"green"},
{"id":"vil_pal_010","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"complete_word","instruction":"Completa: AMI_O","audio_instruction":"Completa: AMI...O","image_hint":"🤝","stimulus":"AMIGO","options":["G","J","B"],"correct":0,"explanation":"¡Sí! AMI + G + O = AMIGO.","hint":"AMI-GO, falta la G.","coins":10,"gem_type":"green"},

# Palabra e imagen (difficulty 2)
{"id":"vil_pal_011","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"word_image","instruction":"¿Qué palabra dice aquí?","audio_instruction":"Lee la palabra","image_hint":"🪀","stimulus":"TROMPO","options":["TROMPO","TRAJE","TREN"],"correct":0,"explanation":"¡Bien! Dice TROMPO, como el juguete.","hint":"TR... dice TROMPO.","coins":8,"gem_type":"green"},
{"id":"vil_pal_012","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"word_image","instruction":"¿Qué palabra es?","audio_instruction":"Lee","image_hint":"🎈","stimulus":"VOLANTÍN","options":["VOLANTÍN","VIOLETA","VOLCÁN"],"correct":0,"explanation":"¡Correcto! VOLANTÍN, el juguete que vuela.","hint":"VO-LAN-TÍN.","coins":8,"gem_type":"green"},
{"id":"vil_pal_013","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"word_image","instruction":"¿Qué palabra es?","audio_instruction":"Lee","image_hint":"🍞","stimulus":"EMPAREDADO","options":["EMPANADA","EMPAREDADO","ENSALADA"],"correct":1,"explanation":"¡Sí! EMPAREDADO, el pan con algo adentro.","hint":"EM-PA-RE-DA-DO.","coins":8,"gem_type":"green"},

# Lectura de palabras frecuentes (difficulty 3)
{"id":"vil_pal_014","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"listen_choose","instruction":"¿Qué palabra es más larga?","audio_instruction":"Compara las palabras","image_hint":"📏","stimulus":"mariposa","options":["SOL (3 letras)","MARIPOSA (8 letras)","PAN (3 letras)"],"correct":1,"explanation":"¡Correcto! MARIPOSA tiene 8 letras, es la más larga.","hint":"Cuenta las letras de cada una.","coins":5,"gem_type":"green"},

# ── BIBLIOTECA DE LOS CUENTOS — Comprensión Lectora ──
# world: "biblioteca", skill: "comprehension"

# Comprensión literal (difficulty 3, constructor/aventurero)
{"id":"bib_com_001","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee con atención:","audio_instruction":"Escucha el texto","image_hint":"📖","stimulus":"El gato de María es negro y blanco. Le gusta jugar con un ovillo de lana rojo.","options":["El gato es café","El gato es negro y blanco","El gato es gris"],"correct":1,"explanation":"¡Sí! El texto dice que el gato es negro y blanco.","hint":"Busca en el texto los colores del gato.","coins":10,"gem_type":"blue"},
{"id":"bib_com_002","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"Los niños juegan en la plaza. Pedro tiene una pelota roja. Ana tiene una cuerda azul.","options":["Pedro tiene una cuerda","Pedro tiene una pelota roja","Ana tiene una pelota"],"correct":1,"explanation":"¡Correcto! Pedro tiene una pelota roja.","hint":"Busca qué tiene Pedro.","coins":10,"gem_type":"blue"},
{"id":"bib_com_003","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"La abuela cocina sopa de verduras. Le pone zanahoria, papa y zapallo.","options":["La sopa tiene frutas","La sopa tiene verduras","La sopa tiene carne"],"correct":1,"explanation":"¡Sí! La sopa tiene verduras: zanahoria, papa y zapallo.","hint":"¿Qué tipo de ingredientes tiene la sopa?","coins":10,"gem_type":"blue"},
{"id":"bib_com_004","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"El sol brilla en el cielo. Las flores del jardín están de colores. Una mariposa vuela sobre ellas.","options":["Está lloviendo","Hay nieve","Hay sol en el cielo"],"correct":2,"explanation":"¡Muy bien! Dice que el sol brilla en el cielo.","hint":"¿Cómo está el día?","coins":10,"gem_type":"blue"},

# Comprensión de oraciones (difficulty 2)
{"id":"bib_com_005","world":"biblioteca","skill":"comprehension","difficulty":2,"min_route":"constructor","type":"multiple_choice","instruction":"¿Qué animal vive en el agua?","audio_instruction":"Escucha la pregunta","image_hint":"🐟","stimulus":"","options":["🐕 El perro","🐟 El pez","🐱 El gato"],"correct":1,"explanation":"¡Sí! El pez vive en el agua.","hint":"¿Cuál de estos animales nada?","coins":5,"gem_type":"blue"},
{"id":"bib_com_006","world":"biblioteca","skill":"comprehension","difficulty":2,"min_route":"constructor","type":"multiple_choice","instruction":"¿Qué usamos para escribir?","audio_instruction":"Pregunta","image_hint":"✏️","stimulus":"","options":["🧣 Bufanda","✏️ Lápiz","🥣 Cuchara"],"correct":1,"explanation":"¡Correcto! El lápiz se usa para escribir.","hint":"¿Qué tiene tinta o grafito?","coins":5,"gem_type":"blue"},
{"id":"bib_com_007","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"¿Dónde vive el caracol?","audio_instruction":"Pregunta","image_hint":"🐌","stimulus":"Los caracoles viven en el jardín, entre las plantas y las flores.","options":["En el mar","En el jardín","En la cocina"],"correct":1,"explanation":"¡Sí! El texto dice que viven en el jardín.","hint":"Busca dónde dice que viven.","coins":8,"gem_type":"blue"},

# Secuencia (difficulty 3-4)
{"id":"bib_com_008","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"¿Qué pasó primero?","audio_instruction":"Escucha la historia","image_hint":"📖","stimulus":"María se levantó temprano. Después desayunó pan con mantequilla. Luego se lavó los dientes. Finalmente se fue a la escuela.","options":["Desayunó","Se levantó","Se lavó los dientes"],"correct":1,"explanation":"¡Correcto! Primero se levantó, después desayunó.","hint":"¿Qué fue lo primero que hizo María?","coins":10,"gem_type":"blue"},
{"id":"bib_com_009","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"¿Qué pasó al final?","audio_instruction":"Escucha","image_hint":"📖","stimulus":"Primero sembraron la semilla. Después regaron la planta todos los días. Luego creció un hermoso girasol.","options":["La planta creció","Sembraron","Regaron"],"correct":0,"explanation":"¡Sí! Al final, creció un hermoso girasol.","hint":"¿Qué fue lo último que pasó?","coins":10,"gem_type":"blue"},
{"id":"bib_com_010","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"Ordena la secuencia:","audio_instruction":"Ordena","image_hint":"📖","stimulus":"1. El niño se cayó. 2. Se levantó y se sacudió. 3. Siguió jugando feliz.","options":["Se cayó, se levantó, jugó","Jugó, se cayó, se levantó","Se levantó, jugó, se cayó"],"correct":0,"explanation":"¡Correcto! Primero se cayó, después se levantó, luego siguió jugando.","hint":"¿Qué pasó primero?","coins":12,"gem_type":"blue"},

# Causa y consecuencia (difficulty 4, aventurero)
{"id":"bib_com_011","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Por qué el niño está feliz?","audio_instruction":"Lee o escucha","image_hint":"😊","stimulus":"Hoy es el cumpleaños de Tomás. Su mamá le hizo una torta de chocolate. Todos sus amigos vinieron a jugar.","options":["Porque llueve","Porque es su cumpleaños","Porque está triste"],"correct":1,"explanation":"¡Sí! Es su cumpleaños y todos celebran con él.","hint":"¿Qué día especial es hoy?","coins":12,"gem_type":"blue"},
{"id":"bib_com_012","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Por qué la planta se secó?","audio_instruction":"Escucha","image_hint":"🌱","stimulus":"Pedro olvidó regar su planta por una semana. El sol estaba muy fuerte todos los días.","options":["Porque no le gustaba","Porque nadie la regó","Porque era de noche"],"correct":1,"explanation":"¡Correcto! La planta se secó porque nadie la regó.","hint":"¿Qué olvidó hacer Pedro?","coins":12,"gem_type":"blue"},
{"id":"bib_com_013","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Qué pasó porque había mucho viento?","audio_instruction":"Escucha","image_hint":"🌬️","stimulus":"Había mucho viento. El volantín de Sofía voló muy alto. De repente, el hilo se rompió y el volantín se fue volando.","options":["El volantín se fue volando","El volantín cayó al suelo","El volantín se hizo más grande"],"correct":0,"explanation":"¡Sí! Por el viento, el hilo se rompió y el volantín se fue.","hint":"¿Qué pasó con el hilo?","coins":12,"gem_type":"blue"},

# ── ISLA DE LAS INFERENCIAS — Inferencias y Creatividad ──
# world: "isla", skill: "inference"

# Predicción (difficulty 4, aventurero)
{"id":"isl_inf_001","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Qué crees que pasará después?","audio_instruction":"Escucha la historia y adivina qué pasará","image_hint":"🔮","stimulus":"La nube gris cubrió todo el cielo. El viento empezó a soplar fuerte. Las hojas de los árboles volaban.","options":["Va a salir el sol","Va a llover","Va a nevar"],"correct":1,"explanation":"¡Sí! Cuando el cielo se pone gris y hay viento, generalmente va a llover.","hint":"¿Cómo se ve el cielo antes de la lluvia?","coins":12,"gem_type":"purple"},
{"id":"isl_inf_002","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Qué crees que pasará?","audio_instruction":"Adivina","image_hint":"🔮","stimulus":"La mamá de Carla le dijo: 'Guarda tus juguetes y ponte el pijama. Mañana hay que madrugar.'","options":["Van a salir de paseo","Carla se va a dormir","Carla va a cocinar"],"correct":1,"explanation":"¡Correcto! Si le dice que se ponga el pijama, es porque se va a dormir.","hint":"¿Qué hacemos cuando nos ponemos pijama?","coins":12,"gem_type":"purple"},

# Inferencia de personajes y ambiente (difficulty 4)
{"id":"isl_inf_003","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Dónde está esta persona?","audio_instruction":"Adivina dónde está","image_hint":"🏥","stimulus":"La sala es blanca y luminosa. Hay camas con sábanas limpias. Se escuchan personas tosiendo.","options":["En un cine","En un hospital","En una escuela"],"correct":1,"explanation":"¡Sí! Las camas blancas y las personas enfermas están en un hospital.","hint":"¿Dónde hay camas para personas enfermas?","coins":12,"gem_type":"purple"},
{"id":"isl_inf_004","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Cómo se siente el niño?","audio_instruction":"¿Cómo crees que se siente?","image_hint":"😢","stimulus":"El niño perdió su juguete favorito. Buscó en toda la casa pero no lo encontró.","options":["Está feliz","Está triste","Tiene hambre"],"correct":1,"explanation":"¡Correcto! Perder algo que queremos nos pone tristes.","hint":"¿Cómo te sentirías tú si pierdes algo?","coins":12,"gem_type":"purple"},

# Vocabulario en contexto (difficulty 3-4)
{"id":"isl_inf_005","world":"isla","skill":"inference","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"¿Qué significa 'resbaló'?","audio_instruction":"Escucha la palabra en la oración","image_hint":"📖","stimulus":"El niño resbaló en el piso mojado y casi se cae.","options":["Se durmió","Se deslizó sin querer","Saltó muy alto"],"correct":1,"explanation":"¡Sí! Resbalar significa deslizarse sin querer.","hint":"Si el piso está mojado, ¿qué puede pasar?","coins":10,"gem_type":"purple"},
{"id":"isl_inf_006","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Qué significa 'susurró'?","audio_instruction":"Escucha","image_hint":"🤫","stimulus":"La mamá le susurró algo al oído para que nadie más escuchara.","options":["Gritó muy fuerte","Habló muy bajito","Cantó una canción"],"correct":1,"explanation":"¡Correcto! Susurrar es hablar muy bajito.","hint":"¿Cómo hablas cuando no quieres que otros escuchen?","coins":10,"gem_type":"purple"},

# Opinión fundamentada (difficulty 5, aventurero)
{"id":"isl_inf_007","world":"isla","skill":"inference","difficulty":5,"min_route":"aventurero","type":"multiple_choice","instruction":"¿Cuál es la mejor idea para cuidar el planeta?","audio_instruction":"¿Qué crees tú?","image_hint":"🌍","stimulus":"","options":["Tirar basura al río","Reciclar latas y botellas","Usar el auto siempre"],"correct":1,"explanation":"¡Sí! Reciclar ayuda a cuidar nuestro planeta.","hint":"¿Qué podemos hacer con las botellas usadas?","coins":10,"gem_type":"purple"},

# Respuesta corta (aventurero, difficulty 4-5)
{"id":"isl_inf_008","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"short_answer","instruction":"Escribe qué crees que pasará:","audio_instruction":"Escribe lo que crees que pasará","image_hint":"🤔","stimulus":"El niño está trepando un árbol muy alto. La rama se empieza a quebrar. ¿Qué crees que pasará?","options":[],"correct":-1,"correct_answer":"Se caerá","keywords":["caer","caere","rama","rompe","quiebra","suelo"],"explanation":"¡Buena respuesta! Si la rama se quiebra, es probable que el niño se caiga.","hint":"¿Qué pasa cuando una rama se quiebra?","coins":15,"gem_type":"purple"},
{"id":"isl_inf_009","world":"isla","skill":"inference","difficulty":4,"min_route":"aventurero","type":"short_answer","instruction":"¿Por qué es importante lavarse las manos?","audio_instruction":"Escribe por qué","image_hint":"🧼","stimulus":"","options":[],"correct":-1,"correct_answer":"Para no enfermarse","keywords":["enfermar","salud","limpia","germenes","bacteria","sucio","comer"],"explanation":"¡Muy bien! Lavarse las manos nos protege de enfermedades.","hint":"¿Qué pasó cuando tocamos cosas sucias?","coins":12,"gem_type":"purple"},
{"id":"isl_inf_010","world":"isla","skill":"inference","difficulty":5,"min_route":"aventurero","type":"short_answer","instruction":"¿Qué enseñanza tiene esta historia?","audio_instruction":"Escribe la enseñanza","image_hint":"📖","stimulus":"Había una vez una tortuga que caminaba muy lento. Los otros animales se reían de ella. Pero un día hubo un incendio y la tortuga fue la única que pudo escapar porque iba cerca del suelo donde había menos humo.","options":[],"correct":-1,"correct_answer":"No burlarse de los demás","keywords":["burlar","respetar","todos","diferentes","valor","cada uno","importante","ayuda","humildad"],"explanation":"¡Excelente reflexión! La historia enseña que todos tenemos cualidades valiosas.","hint":"¿Qué aprendieron los animales que se reían?","coins":20,"gem_type":"purple"},

# Más comprensión literal (biblioteca, difficulty 3)
{"id":"bib_com_014","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"El huemul es un ciervo chileno. Vive en el sur de Chile. Está en peligro de extinción.","options":["Vive en el norte","Es un ciervo chileno","Es un ave"],"correct":1,"explanation":"¡Correcto! Dice que el huemul es un ciervo chileno.","hint":"Busca en el texto qué animal es.","coins":10,"gem_type":"blue"},
{"id":"bib_com_015","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"El copihue es la flor nacional de Chile. Es de color rojo y blanco. Crece en los bosques del sur.","options":["Es amarilla","Crece en el desierto","Es la flor nacional"],"correct":2,"explanation":"¡Sí! El copihue es nuestra flor nacional.","hint":"¿Qué flor representa a Chile?","coins":10,"gem_type":"blue"},
{"id":"bib_com_016","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"📖","stimulus":"Los niños de segundo básico fueron de paseo al museo. Vieron huesos de dinosaurio y piedras brillantes.","options":["Fueron a la playa","Fueron al museo","Fueron al cine"],"correct":1,"explanation":"¡Sí! Fueron al museo a ver huesos de dinosaurio.","hint":"¿Adónde fueron los niños?","coins":10,"gem_type":"blue"},

# Palabras de 2-3 sílabas más (villa)
{"id":"vil_pal_015","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: PATO","audio_instruction":"Forma PATO","image_hint":"🦆","stimulus":"PATO","options":["PA","TO"],"correct":-1,"correct_answer":"PATO","keywords":["PATO"],"explanation":"¡Bien! PA + TO = PATO.","hint":"PA... TO.","coins":8,"gem_type":"green"},
{"id":"vil_pal_016","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: TAZA","audio_instruction":"Forma TAZA","image_hint":"☕","stimulus":"TAZA","options":["TA","ZA"],"correct":-1,"correct_answer":"TAZA","keywords":["TAZA"],"explanation":"¡Correcto! TA + ZA = TAZA.","hint":"TA... ZA.","coins":8,"gem_type":"green"},
{"id":"vil_pal_017","world":"villa","skill":"words","difficulty":2,"min_route":"constructor","type":"build_word","instruction":"Arma: LÁPIZ","audio_instruction":"Forma LÁPIZ","image_hint":"✏️","stimulus":"LÁPIZ","options":["LÁ","PIZ"],"correct":-1,"correct_answer":"LÁPIZ","keywords":["LAPIZ"],"explanation":"¡Muy bien! LÁ + PIZ = LÁPIZ.","hint":"LÁ... PIZ.","coins":8,"gem_type":"green"},
{"id":"vil_pal_018","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"complete_word","instruction":"Completa: MA_ANA","audio_instruction":"Completa: MA...ANA","image_hint":"🍎","stimulus":"MANZANA","options":["N","M","P"],"correct":0,"explanation":"¡Sí! MA + N + ZANA = MANZANA.","hint":"MAN-ZA-NA.","coins":10,"gem_type":"green"},

# Más sílabas (valle)
{"id":"val_sil_013","world":"valle","skill":"syllables","difficulty":2,"min_route":"constructor","type":"build_syllable","instruction":"Arma la sílaba: LUNA","audio_instruction":"Forma LUNA","image_hint":"🌙","stimulus":"LUNA","options":["LU","NA"],"correct":-1,"correct_answer":"LUNA","keywords":["LUNA"],"explanation":"¡Correcto! LU + NA = LUNA.","hint":"LU... NA.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_014","world":"valle","skill":"syllables","difficulty":2,"min_route":"constructor","type":"build_syllable","instruction":"Arma: AGUA","audio_instruction":"Forma AGUA","image_hint":"💧","stimulus":"AGUA","options":["A","GUA"],"correct":-1,"correct_answer":"AGUA","keywords":["AGUA"],"explanation":"¡Sí! A + GUA = AGUA.","hint":"A... GUA.","coins":5,"gem_type":"yellow"},
{"id":"val_sil_015","world":"valle","skill":"syllables","difficulty":3,"min_route":"constructor","type":"build_syllable","instruction":"Arma: ESTRELLA","audio_instruction":"Forma ESTRELLA","image_hint":"⭐","stimulus":"ESTRELLA","options":["ES","TRE","LLA"],"correct":-1,"correct_answer":"ESTRELLA","keywords":["ESTRELLA"],"explanation":"¡Excelente! ES + TRE + LLA = ESTRELLA.","hint":"ES... TRE... LLA.","coins":7,"gem_type":"yellow"},

# Más conciencia fonológica (bosque)
{"id":"bos_fon_031","world":"bosque","skill":"phonological","difficulty":2,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: Sapo. ¿Cuántas sílabas?","audio_instruction":"SA-PO. ¿Cuántas partes?","image_hint":"🐸","stimulus":"SAPO","options":["SA-PO (2)","SA-PO-RE (3)","S-A-P-O (4)"],"correct":0,"explanation":"¡Sí! SA-PO tiene 2 sílabas.","hint":"SA... PO. 2 partes.","coins":5,"gem_type":"red"},
{"id":"bos_fon_032","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: OLA. ¿Con qué vocal empieza?","audio_instruction":"O-LA. ¿Qué escuchas primero?","image_hint":"🌊","stimulus":"OLA","options":["A","E","O"],"correct":2,"explanation":"¡Sí! OLA empieza con O.","hint":"O-O-OLA.","coins":3,"gem_type":"red"},
{"id":"bos_fon_033","world":"bosque","skill":"phonological","difficulty":2,"min_route":"constructor","type":"listen_choose","instruction":"Escucha: AMIGO. ¿Con qué vocal empieza?","audio_instruction":"A-MI-GO","image_hint":"🤝","stimulus":"AMIGO","options":["O","A","E"],"correct":1,"explanation":"¡Correcto! AMIGO empieza con A.","hint":"A-A-AMIGO.","coins":5,"gem_type":"red"},

# Ordenar oración (biblioteca, difficulty 4)
{"id":"bib_com_017","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"order_sentence","instruction":"Ordena las palabras para formar una oración","audio_instruction":"Ordena las palabras","image_hint":"🧩","stimulus":"","options":["El","gato","bebe","leche"],"correct":-1,"correct_answer":"El gato bebe leche","keywords":["El","gato","bebe","leche"],"explanation":"¡Muy bien! 'El gato bebe leche' es una oración correcta.","hint":"¿Quién hace la acción? Primero el sujeto.","coins":15,"gem_type":"blue"},
{"id":"bib_com_018","world":"biblioteca","skill":"comprehension","difficulty":4,"min_route":"aventurero","type":"order_sentence","instruction":"Ordena:","audio_instruction":"Ordena las palabras","image_hint":"🧩","stimulus":"","options":["Los","niños","juegan","en","la","plaza"],"correct":-1,"correct_answer":"Los niños juegan en la plaza","keywords":["Los","niños","juegan","plaza"],"explanation":"¡Correcto! 'Los niños juegan en la plaza'.","hint":"¿Quiénes juegan? ¿Dónde juegan?","coins":15,"gem_type":"blue"},

# Respuesta corta (isla, aventurero)
{"id":"isl_inf_011","world":"isla","skill":"inference","difficulty":5,"min_route":"aventurero","type":"short_answer","instruction":"¿Cómo crees que se sintió el personaje?","audio_instruction":"Escribe cómo crees que se sintió","image_hint":"😔","stimulus":"Andrés esperó todo el día a su amigo para jugar a la pelota. Pero su amigo nunca llegó.","options":[],"correct":-1,"correct_answer":"Triste","keywords":["triste","decepcionado","solo","aburrido","espero","esperó","desilusion"],"explanation":"¡Muy bien! Andrés probablemente se sintió triste o decepcionado.","hint":"¿Cómo te sentirías si esperas a alguien y no llega?","coins":15,"gem_type":"purple"},

# Bonus: cuidado del entorno y emociones (skill: comprehension)
{"id":"bib_com_019","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"🌳","stimulus":"Los árboles nos dan sombra y oxígeno. Por eso es importante cuidarlos y no cortarlos sin necesidad.","options":["Los árboles dan sombra","Los árboles son peligrosos","Los árboles no sirven"],"correct":0,"explanation":"¡Sí! Los árboles nos dan sombra y oxígeno.","hint":"¿Qué nos dan los árboles?","coins":8,"gem_type":"blue"},
{"id":"bib_com_020","world":"biblioteca","skill":"comprehension","difficulty":3,"min_route":"constructor","type":"multiple_choice","instruction":"Lee:","audio_instruction":"Escucha","image_hint":"🤗","stimulus":"Cuando un amigo está triste, podemos abrazarlo y preguntarle qué le pasa.","options":["Ignorarlo","Abrazarlo y preguntarle","Reírnos de él"],"correct":1,"explanation":"¡Correcto! Un abrazo y una pregunta ayudan a un amigo triste.","hint":"¿Qué harías si tu amigo está triste?","coins":10,"gem_type":"blue"},

# Más formación de palabras (villa)
{"id":"vil_pal_019","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"build_word","instruction":"Arma: ESCUELA","audio_instruction":"Forma ESCUELA","image_hint":"🏫","stimulus":"ESCUELA","options":["ES","CUE","LA"],"correct":-1,"correct_answer":"ESCUELA","keywords":["ESCUELA"],"explanation":"¡Excelente! ES + CUE + LA = ESCUELA.","hint":"ES... CUE... LA.","coins":10,"gem_type":"green"},
{"id":"vil_pal_020","world":"villa","skill":"words","difficulty":3,"min_route":"constructor","type":"build_word","instruction":"Arma: VENTANA","audio_instruction":"Forma VENTANA","image_hint":"🪟","stimulus":"VENTANA","options":["VEN","TA","NA"],"correct":-1,"correct_answer":"VENTANA","keywords":["VENTANA"],"explanation":"¡Bien! VEN + TA + NA = VENTANA.","hint":"VEN... TA... NA.","coins":10,"gem_type":"green"},

# Más fonología para explorador
{"id":"bos_fon_034","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha y señala: NARIZ","audio_instruction":"Señala la NARIZ","image_hint":"👃","stimulus":"NARIZ","options":["👂 OREJA","👃 NARIZ","👀 OJO"],"correct":1,"explanation":"¡Sí! Esa es la NARIZ.","hint":"¿Con qué olemos?","coins":3,"gem_type":"red"},
{"id":"bos_fon_035","world":"bosque","skill":"phonological","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"Escucha: MANO. ¿Qué es?","audio_instruction":"MANO","image_hint":"🖐️","stimulus":"MANO","options":["🖐️ MANO","🦶 PIE","👂 OREJA"],"correct":0,"explanation":"¡Correcto! Es la MANO.","hint":"Con esto saludamos.","coins":3,"gem_type":"red"},

# Más letras (valle)
{"id":"val_let_006","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra es esta?","audio_instruction":"Mira la letra","image_hint":"🔤","stimulus":"D visual","options":["B","D","P"],"correct":1,"explanation":"¡Sí! Esa es la letra D.","hint":"La D tiene una barriga al lado derecho.","coins":5,"gem_type":"yellow"},
{"id":"val_let_007","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Qué letra es?","audio_instruction":"Mira","image_hint":"🔤","stimulus":"R visual","options":["R","P","B"],"correct":0,"explanation":"¡Muy bien! Es la R.","hint":"La R tiene una patita.","coins":5,"gem_type":"yellow"},
{"id":"val_let_008","world":"valle","skill":"letters","difficulty":1,"min_route":"explorador","type":"listen_choose","instruction":"¿Cuál es la letra F?","audio_instruction":"Encuentra la F","image_hint":"🔤","stimulus":"","options":["E","F","H"],"correct":1,"explanation":"¡Correcto! Esa es la F.","hint":"La F tiene una línea y dos rayitas.","coins":5,"gem_type":"yellow"},

# ── PRUEBAS FINALES (world: "prueba") ──
# 3 pruebas finales adaptativas (una por ruta)
{"id":"prue_explorador","world":"prueba","skill":"phonological","difficulty":2,"min_route":"explorador","type":"multiple_choice","instruction":"PRUEBA FINAL — Escucha y responde","audio_instruction":"¡Prueba final! Escucha con atención. ¿Qué animal empieza con P?","image_hint":"🏆","stimulus":"","options":["🐱 GATO","🐕 PERRO","🐟 PEZ"],"correct":2,"explanation":"¡Excelente! PEZ empieza con P.","hint":"P-P-PEZ.","coins":20,"gem_type":"red"},
{"id":"prue_constructor","world":"prueba","skill":"words","difficulty":3,"min_route":"constructor","type":"complete_word","instruction":"PRUEBA FINAL — Completa la palabra","audio_instruction":"¡Prueba final! Completa: MA_IPOSA","image_hint":"🏆","stimulus":"MARIPOSA","options":["R","L","N"],"correct":0,"explanation":"¡Excelente! MA-RI-PO-SA, falta la R.","hint":"MA-RI-PO-SA.","coins":25,"gem_type":"green"},
{"id":"prue_aventurero","world":"prueba","skill":"comprehension","difficulty":5,"min_route":"aventurero","type":"multiple_choice","instruction":"PRUEBA FINAL — Lee y responde","audio_instruction":"¡Prueba final! Lee con atención","image_hint":"🏆","stimulus":"El niño encontró un pájaro con el ala lastimada. Lo llevó a su casa, le dio agua y arroz. Al otro día, el pájaro intentó volar. El niño lo subió a una rama baja y el pájaro voló.","options":["El pájaro se quedó en la casa","El pájaro voló después de descansar","El niño se quedó con el pájaro"],"correct":1,"explanation":"¡Excelente! El pájaro voló después de descansar y recuperarse.","hint":"¿Qué pasó al otro día?","coins":30,"gem_type":"blue"},
]

func _ready() -> void:
	print("LecturaContentDB: %d actividades educativas cargadas" % ACTIVITIES.size())
