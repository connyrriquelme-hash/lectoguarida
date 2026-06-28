import http from 'node:http';
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, dirname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pbkdf2Sync, randomBytes, randomUUID, timingSafeEqual, createHmac } from 'node:crypto';
import { nextPityState, pickRarity } from './loot.mjs';
import { normalizeWords, normalizeAnswer, answersMatch, lcsMatches, scoreAttempt } from './shared/scoring.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const DATA_DIR = join(ROOT, 'data');
const STORE_PATH = join(DATA_DIR, 'store.json');
const APK_PATH = join(ROOT, 'Lectoguarida-debug.apk');
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';

const choices = (...items) => items.map(([id, label, icon]) => ({ id, label, icon }));
const mission = (data) => ({ ...data, order: (data.week - 1) * 5 + data.day });

const SKIN_CATALOG = {
  archetype: ['axolotl','capybara','cosmic-cat','garden-dino','pastel-panda','forest-fox','cardboard-robot','rainbow-unicorn','artist-octopus','library-owl','music-frog','bubble-dragon','space-rabbit','river-otter','hummingbird','sea-turtle','mountain-llama','happy-pudu','star-whale','koala-reader','chinchilla','red-panda','friendly-bee','sleepy-sloth','moon-bat','little-penguin','wise-huemul','curious-vizcacha','magic-seal','tiny-alpaca'],
  palette: ['coral','aqua','violet','gold','mint','sky','rose','ocean','sunset','lime','lavender','cocoa'],
  outfit: ['explorer','reader','artist','scientist','gardener','musician','astronomer','veterinarian','chef','cartographer','storyteller','meteorologist','paleontologist','dancer','builder'],
  accessory: ['star-glasses','flower-crown','headphones','backpack','scarf','cap','binoculars','telescope','magnifier','compass','leaf-pin','comet-pin','rainbow-boots','magic-pencil','camera','book-hat','shell-necklace','planet-ring'],
  companion: ['firefly','cloud','star','book-sprite','butterfly','mini-comet','mini-hummingbird','mini-pudu','mini-penguin','mini-otter','mini-turtle','mini-llama','mini-bee','fox-cub','mini-whale']
};
const SHOP_PRICES = { archetype: 150, palette: 60, outfit: 100, accessory: 80, companion: 120 };
const STICKER_PACK_PRICE = 50;
const PITY_LIMIT = 5;
const TRADE_FEE = 10;
const MINIGAME_SECRET = process.env.MINIGAME_SECRET || 'lectoguarida-demo-secret';
// El peso especial total es 10: 9 raro + 1 legendario. Agregar una nueva
// rareza solo requiere sumar otra fila; el selector calcula el total.
const LOOT_TABLE = [
  { id: 'common', weight: 90 },
  { id: 'rare', weight: 9 },
  { id: 'legendary', weight: 1 }
];
const STICKER_SETS = [
  ['Humedales de Chile',[['wet-chercan','Chercán cantor','🐦','common'],['wet-garza','Garza tranquila','🪶','common'],['wet-tagua','Tagua nadadora','🦆','common'],['wet-coipo','Coipo amable','🦫','common'],['wet-junco','Junco verde','🌾','common'],['wet-rana','Rana de humedal','🐸','common'],['wet-libelula','Libélula azul','🪲','common'],['wet-cisne','Cisne brillante','🦢','rare'],['wet-martin','Martín pescador','🐦','rare'],['wet-picaflor','Picaflor legendario','✨','legendary']]],
  ['Cuerpo y bienestar',[['body-heart','Corazón activo','❤️','common'],['body-lungs','Pulmones de aire','🫁','common'],['body-stomach','Estómago feliz','🥣','common'],['body-brain','Cerebro curioso','🧠','common'],['body-hands','Manos limpias','🧼','common'],['body-water','Agua vital','💧','common'],['body-apple','Manzana energética','🍎','common'],['body-skeleton','Esqueleto bailarín','🦴','rare'],['body-muscle','Músculo valiente','💪','rare'],['body-guardian','Guardián del bienestar','🏅','legendary']]],
  ['Agua y clima',[['clima-drop','Gotita viajera','💧','common'],['clima-cloud','Nube suave','☁️','common'],['clima-rain','Lluvia cantora','🌧️','common'],['clima-snow','Copo de nieve','❄️','common'],['clima-sun','Sol cálido','☀️','common'],['clima-wind','Viento veloz','🌬️','common'],['clima-rainbow','Arcoíris lector','🌈','common'],['clima-storm','Tormenta especial','⛈️','rare'],['clima-cycle','Ciclo del agua','🔄','rare'],['clima-crystal','Gota de cristal','💎','legendary']]],
  ['Paisajes de Chile',[['land-desert','Desierto florido','🏜️','common'],['land-valley','Valle luminoso','🏞️','common'],['land-mountain','Montaña nevada','🏔️','common'],['land-forest','Bosque profundo','🌲','common'],['land-river','Río viajero','🌊','common'],['land-island','Isla del sur','🏝️','common'],['land-glacier','Glaciar azul','🧊','common'],['land-volcano','Volcán brillante','🌋','rare'],['land-torres','Torres del viento','⛰️','rare'],['land-chile','Chile estelar','🇨🇱','legendary']]],
  ['Pueblos y memorias',[['memory-loom','Telar de colores','🧶','common'],['memory-clay','Vasija de greda','🏺','common'],['memory-canoe','Canoa viajera','🛶','common'],['memory-drum','Kultrún de memoria','🥁','common'],['memory-basket','Canasto tejido','🧺','common'],['memory-seed','Semilla ancestral','🌱','common'],['memory-shell','Concha del sur','🐚','common'],['memory-condor','Cóndor protector','🦅','rare'],['memory-moai','Moái de historia','🗿','rare'],['memory-fire','Fuego de la memoria','🔥','legendary']]],
  ['Universo lector',[['read-book','Libro explorador','📘','common'],['read-pencil','Lápiz creador','✏️','common'],['read-letter','Letra brillante','🔤','common'],['read-mic','Micrófono lector','🎙️','common'],['read-library','Biblioteca nube','📚','common'],['read-telescope','Telescopio curioso','🔭','common'],['read-planet','Planeta palabra','🪐','common'],['read-comet','Cometa narrador','☄️','rare'],['read-galaxy','Galaxia de cuentos','🌌','rare'],['read-guardian','Guardián de la lectura','🏆','legendary']]],
  ['Clásicos de la Guarida',[['bee-reader','Abeja lectora','🐝','common'],['happy-book','Libro feliz','📘','common'],['letter-star','Estrella A','🌟','common'],['pencil-hero','Lápiz héroe','✏️','common'],['moon-reader','Luna lectora','🌙','common'],['frog-rhythm','Rana rítmica','🐸','common'],['magic-mic','Micrófono mágico','🎙️','rare'],['rainbow-book','Libro arcoíris','🌈','rare'],['owl-master','Búho maestro','🦉','rare'],['comet-word','Cometa palabra','☄️','rare'],['golden-guardian','Guardián dorado','🏆','legendary'],['crystal-castle','Castillo de cristal','🏰','legendary']]]
];
const STICKER_CATALOG = STICKER_SETS.flatMap(([set,items])=>items.map(([id,name,icon,rarity])=>({id,name,icon,rarity,set})));
const inventoryKey = (part, value) => `${part}:${value}`;
const shopPrice = (part, value) => {
  const index = SKIN_CATALOG[part]?.indexOf(value) ?? -1;
  return index <= 0 ? 0 : SHOP_PRICES[part] + (index - 1) * 5;
};

const ARCHETYPE_ICONS = ['🫧','☁️','🐱','🦕','🐼','🦊','🤖','🦄','🐙','🦉','🐸','🐲','🐰','🦦','🐦','🐢','🦙','🦌','🐋','🐨','🐭','🐼','🐝','🦥','🦇','🐧','🦌','🐇','🦭','🦙'];
const skinForIndex = (index = 0) => ({
  archetype: SKIN_CATALOG.archetype[index % SKIN_CATALOG.archetype.length],
  palette: SKIN_CATALOG.palette[index % SKIN_CATALOG.palette.length],
  outfit: SKIN_CATALOG.outfit[index % SKIN_CATALOG.outfit.length],
  accessory: SKIN_CATALOG.accessory[index % SKIN_CATALOG.accessory.length],
  companion: SKIN_CATALOG.companion[index % SKIN_CATALOG.companion.length]
});

function validSkin(input = {}) {
  const skin = {};
  for (const [part, allowed] of Object.entries(SKIN_CATALOG)) {
    if (!allowed.includes(input[part])) return null;
    skin[part] = input[part];
  }
  return skin;
}

// Programa de tres semanas: 15 misiones por curso, tres actividades por misión.
const readings = [
  mission({ id:'g1-mila-luna', grade:1, week:1, day:1, title:'Mila y la luna', world:'Isla de los Ecos', skill:'Sonidos M y L', text:'Mila mira la luna. La luna ilumina la loma y el molino.', warmup:{ prompt:'¿Qué palabra comienza con el sonido M?', options:choices(['mapa','Mapa','🗺️'],['luna','Luna','🌙'],['sol','Sol','☀️']), correct:'mapa', skill:'Sonido M' }, comprehension:{ prompt:'¿Qué ilumina la luna?', options:choices(['mill','La loma y el molino','🌾'],['sea','El fondo del mar','🌊'],['house','Una casa roja','🏠']), correct:'mill' } }),
  mission({ id:'g1-sapo-mesa', grade:1, week:1, day:2, title:'El sapo en la mesa', world:'Jardín de las Sílabas', skill:'Sílabas S y M', text:'Sami ve un sapo. El sapo salta a la mesa y mira una sopa.', warmup:{ prompt:'Une S + A. ¿Qué sílaba aparece?', options:choices(['sa','SA','✨'],['ma','MA','🌟'],['pa','PA','💫']), correct:'sa', skill:'Sílaba SA' }, comprehension:{ prompt:'¿Dónde salta el sapo?', options:choices(['table','A la mesa','🪵'],['moon','A la luna','🌙'],['boat','A un bote','🛶']), correct:'table' } }),
  mission({ id:'g1-nina-pan', grade:1, week:1, day:3, title:'Nina prepara pan', world:'Villa del Pan', skill:'Sílabas N y P', text:'Nina pone pan en una canasta. Luego pasa la canasta a papá.', warmup:{ prompt:'¿Cuál palabra comienza con P?', options:choices(['pan','Pan','🍞'],['nube','Nube','☁️'],['mesa','Mesa','🪑']), correct:'pan', skill:'Sonido P' }, comprehension:{ prompt:'¿Qué pone Nina en la canasta?', options:choices(['bread','Pan','🍞'],['fish','Un pez','🐟'],['book','Un libro','📘']), correct:'bread' } }),
  mission({ id:'g1-lola-te', grade:1, week:1, day:4, title:'Lola toma té', world:'Casa de la Tetera', skill:'Sílabas T y L', text:'Lola toma té con limón. La taza está al lado de la tetera.', warmup:{ prompt:'¿Qué sílaba forma T + E?', options:choices(['te','TE','🫖'],['le','LE','🍋'],['ti','TI','🔔']), correct:'te', skill:'Sílaba TE' }, comprehension:{ prompt:'¿Qué está al lado de la tetera?', options:choices(['cup','La taza','☕'],['shoe','Un zapato','👟'],['star','Una estrella','⭐']), correct:'cup' } }),
  mission({ id:'g1-dado-dorado', grade:1, week:1, day:5, title:'El dado dorado', world:'Cueva del Dado', skill:'Sonido D', text:'Dani toma un dado dorado. Lo deja dentro de una caja de madera.', warmup:{ prompt:'¿Cuál comienza con D?', options:choices(['dice','Dado','🎲'],['cat','Gato','🐱'],['sun','Sol','☀️']), correct:'dice', skill:'Sonido D' }, comprehension:{ prompt:'¿Dónde deja Dani el dado?', options:choices(['box','Dentro de una caja','📦'],['river','En el río','🏞️'],['tree','Sobre un árbol','🌳']), correct:'box' } }),

  mission({ id:'g1-foca-fina', grade:1, week:2, day:1, title:'Fina, la foca', world:'Bahía de la Foca', skill:'Sonido F', text:'Fina es una foca feliz. Nada hasta el faro y saluda a Felipe.', warmup:{ prompt:'Busca la palabra con F.', options:choices(['faro','Faro','🗼'],['pato','Pato','🦆'],['luna','Luna','🌙']), correct:'faro', skill:'Sonido F' }, comprehension:{ prompt:'¿Hasta dónde nada Fina?', options:choices(['lighthouse','Hasta el faro','🗼'],['forest','Hasta el bosque','🌲'],['school','Hasta la escuela','🏫']), correct:'lighthouse' } }),
  mission({ id:'g1-rana-rita', grade:1, week:2, day:2, title:'El puente de Rita', world:'Río de las R', skill:'Sonido R inicial', text:'Rita, la rana, salta sobre una roca y encuentra una llave roja junto al río.', warmup:{ prompt:'¿Cuál palabra empieza como Rita?', options:choices(['rock','Roca','🪨'],['moon','Luna','🌙'],['table','Mesa','🪑']), correct:'rock', skill:'Sonido R' }, comprehension:{ prompt:'¿Qué debe recoger Rita para abrir el puente?', options:choices(['key','La llave roja','🗝️'],['boat','El bote azul','🛶'],['flower','La flor','🌼']), correct:'key' } }),
  mission({ id:'g1-sol-sale', grade:1, week:2, day:3, title:'Sale el sol', world:'Valle del Amanecer', skill:'Lectura de oración', text:'Sale el sol. Susi abre la ventana y pone su maceta en la mesa.', warmup:{ prompt:'¿Qué palabra rima con sol?', options:choices(['snail','Caracol','🐌'],['table','Mesa','🪑'],['window','Ventana','🪟']), correct:'snail', skill:'Rima' }, comprehension:{ prompt:'¿Qué pone Susi en la mesa?', options:choices(['plant','La maceta','🪴'],['hat','Un sombrero','🎩'],['ball','Una pelota','⚽']), correct:'plant' } }),
  mission({ id:'g1-pez-azul', grade:1, week:2, day:4, title:'Un pez azul', world:'Laguna Azul', skill:'Sílabas inversas y CVC', text:'Un pez azul nada en el mar. Al final, se esconde bajo un coral.', warmup:{ prompt:'¿Qué palabra termina en Z?', options:choices(['fish','Pez','🐟'],['sea','Mar','🌊'],['coral','Coral','🪸']), correct:'fish', skill:'Final consonántico' }, comprehension:{ prompt:'¿Dónde se esconde el pez?', options:choices(['coral','Bajo un coral','🪸'],['cloud','En una nube','☁️'],['nest','En un nido','🪺']), correct:'coral' } }),
  mission({ id:'g1-tren-corto', grade:1, week:2, day:5, title:'El tren corto', world:'Estación de Cristal', skill:'Grupo TR', text:'El tren trae tres cajas. Tere toma una caja y la lleva al taller.', warmup:{ prompt:'¿Cuál palabra comienza con TR?', options:choices(['train','Tren','🚂'],['tea','Té','🫖'],['sun','Sol','☀️']), correct:'train', skill:'Grupo TR' }, comprehension:{ prompt:'¿A dónde lleva Tere la caja?', options:choices(['workshop','Al taller','🛠️'],['beach','A la playa','🏖️'],['moon','A la luna','🌙']), correct:'workshop' } }),

  mission({ id:'g1-perro-corre', grade:1, week:3, day:1, title:'El perro que corre', world:'Pradera del Eco', skill:'R y RR', text:'El perro de Rosa corre por el cerro. Después, regresa para beber agua.', warmup:{ prompt:'¿En cuál palabra suena fuerte RR?', options:choices(['dog','Perro','🐕'],['face','Cara','🙂'],['moon','Luna','🌙']), correct:'dog', skill:'Sonido RR' }, comprehension:{ prompt:'¿Qué hace el perro después de correr?', options:choices(['drink','Regresa a beber agua','💧'],['sleep','Duerme en una caja','📦'],['fly','Vuela sobre el cerro','🪽']), correct:'drink' } }),
  mission({ id:'g1-queso-quique', grade:1, week:3, day:2, title:'El queso de Quique', world:'Cocina de Cristal', skill:'QUE y QUI', text:'Quique corta queso y prepara un pan. Quiere compartirlo con su amiga Raquel.', warmup:{ prompt:'¿Qué sílaba completa _SO para formar QUESO?', options:choices(['que','QUE','🧀'],['qui','QUI','✨'],['ca','CA','🔔']), correct:'que', skill:'Sílaba QUE' }, comprehension:{ prompt:'¿Con quién quiere compartir Quique?', options:choices(['raquel','Con Raquel','👧'],['rita','Con Rita','🐸'],['nobody','Con nadie','🚫']), correct:'raquel' } }),
  mission({ id:'g1-bruno-abre', grade:1, week:3, day:3, title:'Bruno abre el cofre', world:'Puerto de los Cofres', skill:'Grupo BR', text:'Bruno abre un cofre brillante. Dentro encuentra una brújula y un brazalete.', warmup:{ prompt:'¿Cuál comienza con BR?', options:choices(['compass','Brújula','🧭'],['moon','Luna','🌙'],['fish','Pez','🐟']), correct:'compass', skill:'Grupo BR' }, comprehension:{ prompt:'¿Qué había dentro del cofre?', options:choices(['treasure','Una brújula y un brazalete','🧭'],['food','Pan y queso','🥪'],['animal','Una rana','🐸']), correct:'treasure' } }),
  mission({ id:'g1-planta-crece', grade:1, week:3, day:4, title:'La planta crece', world:'Invernadero de Luz', skill:'Grupo PL', text:'Plinio planta una semilla. Con agua y sol, la planta crece junto a la plaza.', warmup:{ prompt:'¿Cuál palabra comienza con PL?', options:choices(['plant','Planta','🪴'],['frog','Rana','🐸'],['key','Llave','🗝️']), correct:'plant', skill:'Grupo PL' }, comprehension:{ prompt:'¿Qué necesita la planta para crecer?', options:choices(['waterSun','Agua y sol','💧'],['snow','Nieve','❄️'],['box','Una caja','📦']), correct:'waterSun' } }),
  mission({ id:'g1-mapa-tesoro', grade:1, week:3, day:5, title:'El mapa del tesoro', world:'Templo de las Palabras', skill:'Integración de oraciones', text:'Mara sigue un mapa hasta la torre. Allí lee una pista, abre una puerta y encuentra el tesoro de luz.', warmup:{ prompt:'¿Qué palabra indica un lugar alto?', options:choices(['tower','Torre','🏰'],['bread','Pan','🍞'],['fish','Pez','🐟']), correct:'tower', skill:'Vocabulario' }, comprehension:{ prompt:'Ordena la aventura: ¿qué ocurre antes de encontrar el tesoro?', options:choices(['door','Mara abre una puerta','🚪'],['sleep','Mara se duerme','😴'],['boat','Mara sube a un bote','🛶']), correct:'door' } }),

  mission({ id:'g2-cometa-plaza', grade:2, week:1, day:1, title:'El cometa perdido', world:'Ciudad del Viento', skill:'Información explícita', text:'Tomás corrió hasta la plaza porque el viento levantó su cometa. Miró los árboles y descubrió la cinta amarilla atrapada en una rama baja.', warmup:{ prompt:'¿Qué señal indica que debes hacer una pausa breve?', options:choices(['comma','La coma','，'],['letter','La letra M','M'],['space','Un espacio','↔️']), correct:'comma', skill:'Pausa en coma' }, comprehension:{ prompt:'¿Dónde debería buscar Tomás su cometa?', options:choices(['branch','En la rama baja','🌳'],['fountain','Dentro de la fuente','⛲'],['house','Bajo la cama','🛏️']), correct:'branch' } }),
  mission({ id:'g2-sopa-abuela', grade:2, week:1, day:2, title:'La sopa de la abuela', world:'Cocina de los Aromas', skill:'Secuencia', text:'Primero, Elisa lavó las verduras. Luego, su abuela las cortó y las puso en la olla. Al final, ambas sirvieron la sopa.', warmup:{ prompt:'¿Qué palabra anuncia el inicio?', options:choices(['first','Primero','1️⃣'],['later','Luego','2️⃣'],['end','Al final','3️⃣']), correct:'first', skill:'Secuencia temporal' }, comprehension:{ prompt:'¿Qué ocurrió antes de poner las verduras en la olla?', options:choices(['cut','La abuela las cortó','🔪'],['serve','Sirvieron la sopa','🥣'],['eat','Elisa comió pan','🍞']), correct:'cut' } }),
  mission({ id:'g2-biblioteca', grade:2, week:1, day:3, title:'Silencio en la biblioteca', world:'Biblioteca Infinita', skill:'Puntuación y pausas', text:'Ana buscó un libro de animales. —Mira este cóndor —susurró a Leo—. Parece que va a salir volando de la página.', warmup:{ prompt:'¿Cómo se lee una pregunta?', options:choices(['question','Con entonación de pregunta','❓'],['shout','Siempre gritando','📣'],['flat','Sin ninguna pausa','➖']), correct:'question', skill:'Prosodia' }, comprehension:{ prompt:'¿De qué trata el libro que encontró Ana?', options:choices(['animals','De animales','🦅'],['space','Del espacio','🚀'],['cooking','De cocina','🥣']), correct:'animals' } }),
  mission({ id:'g2-semilla-valiente', grade:2, week:1, day:4, title:'La semilla valiente', world:'Jardín de las Palabras', skill:'Vocabulario contextual', text:'La pequeña semilla resistió la lluvia y el frío. Cuando llegó la primavera, brotó con fuerza y mostró dos hojas verdes.', warmup:{ prompt:'En el relato, ¿qué significa brotó?', options:choices(['grow','Comenzó a crecer','🌱'],['hide','Se escondió','🫥'],['break','Se rompió','💥']), correct:'grow', skill:'Vocabulario' }, comprehension:{ prompt:'¿Qué mostró la semilla en primavera?', options:choices(['leaves','Dos hojas verdes','🌿'],['fruit','Una manzana','🍎'],['snow','Un copo de nieve','❄️']), correct:'leaves' } }),
  mission({ id:'g2-noche-campamento', grade:2, week:1, day:5, title:'Una noche de campamento', world:'Bosque de las Linternas', skill:'Inferir emociones', text:'Al escuchar un ruido detrás de la carpa, Martín apretó su linterna y se acercó a su hermana. Cuando apareció un pequeño erizo, volvió a sonreír.', warmup:{ prompt:'¿Qué gesto muestra preocupación?', options:choices(['tight','Apretar la linterna','🔦'],['dance','Bailar','💃'],['laugh','Reír fuerte','😄']), correct:'tight', skill:'Inferencia emocional' }, comprehension:{ prompt:'¿Cómo se sintió Martín antes de ver al erizo?', options:choices(['worried','Preocupado','😟'],['bored','Aburrido','🥱'],['proud','Orgulloso','🏅']), correct:'worried' } }),

  mission({ id:'g2-rio-crecido', grade:2, week:2, day:1, title:'El río crecido', world:'Valle del Agua', skill:'Causa y efecto', text:'Llovió durante toda la noche y el río aumentó su nivel. Por eso, los guardaparques cerraron el puente hasta que el agua bajara.', warmup:{ prompt:'¿Qué expresión anuncia una consecuencia?', options:choices(['therefore','Por eso','➡️'],['yesterday','Ayer','📅'],['maybe','Tal vez','💭']), correct:'therefore', skill:'Conector causal' }, comprehension:{ prompt:'¿Por qué cerraron el puente?', options:choices(['water','Porque el río creció','🌊'],['paint','Porque lo pintaron','🎨'],['party','Porque había una fiesta','🎉']), correct:'water' } }),
  mission({ id:'g2-dialogo-robot', grade:2, week:2, day:2, title:'El robot curioso', world:'Taller de Inventos', skill:'Diálogo y expresividad', text:'—¿Para qué sirve este botón? —preguntó el robot. —Enciende las luces del taller —respondió Inés—, pero debes presionarlo con cuidado.', warmup:{ prompt:'¿Qué signo aparece al inicio de una pregunta?', options:choices(['qmark','¿','❓'],['period','.','⏹️'],['comma',',','⏸️']), correct:'qmark', skill:'Entonación interrogativa' }, comprehension:{ prompt:'¿Qué hace el botón?', options:choices(['lights','Enciende las luces','💡'],['door','Cierra la puerta','🚪'],['music','Toca música','🎵']), correct:'lights' } }),
  mission({ id:'g2-zorro-nieve', grade:2, week:2, day:3, title:'Huellas en la nieve', world:'Montaña Blanca', skill:'Inferencia por descripción', text:'Clara encontró huellas pequeñas que formaban una línea hasta unas rocas. Cerca de ellas había pelos anaranjados y una cola desapareció entre los arbustos.', warmup:{ prompt:'¿Qué palabra ayuda a imaginar un color?', options:choices(['orange','Anaranjados','🟠'],['line','Línea','➖'],['near','Cerca','📍']), correct:'orange', skill:'Descripción' }, comprehension:{ prompt:'¿Qué animal probablemente dejó las huellas?', options:choices(['fox','Un zorro','🦊'],['whale','Una ballena','🐋'],['frog','Una rana','🐸']), correct:'fox' } }),
  mission({ id:'g2-instrucciones-semillas', grade:2, week:2, day:4, title:'Cómo plantar una semilla', world:'Laboratorio Verde', skill:'Texto instructivo', text:'Pon tierra en un vaso. Haz un agujero pequeño, coloca la semilla y cúbrela. Después, agrega un poco de agua y deja el vaso cerca de una ventana.', warmup:{ prompt:'¿Qué palabra indica una acción?', options:choices(['put','Pon','🫳'],['small','Pequeño','🔹'],['near','Cerca','📍']), correct:'put', skill:'Verbos de instrucción' }, comprehension:{ prompt:'¿Qué debes hacer después de cubrir la semilla?', options:choices(['water','Agregar agua','💧'],['freeze','Ponerla en hielo','🧊'],['paint','Pintar el vaso','🎨']), correct:'water' } }),
  mission({ id:'g2-dos-casas', grade:2, week:2, day:5, title:'Dos casas para vivir', world:'Villa de los Contrastes', skill:'Comparar información', text:'La casa del árbol es pequeña y recibe mucho sol. La casa de piedra es amplia y fresca. Ambas tienen una puerta azul y un jardín.', warmup:{ prompt:'¿Qué palabra indica algo en común?', options:choices(['both','Ambas','🤝'],['small','Pequeña','🔹'],['fresh','Fresca','❄️']), correct:'both', skill:'Comparación' }, comprehension:{ prompt:'¿Qué tienen en común las dos casas?', options:choices(['blue','Una puerta azul y jardín','🚪'],['stone','Muros de piedra','🪨'],['height','La misma altura','📏']), correct:'blue' } }),

  mission({ id:'g2-abejas', grade:2, week:3, day:1, title:'Las abejas del jardín', world:'Pradera Dorada', skill:'Idea principal', text:'Las abejas visitan muchas flores para recoger néctar. Mientras vuelan de una flor a otra, transportan polen y ayudan a que nazcan nuevas plantas.', warmup:{ prompt:'¿Qué palabra se repite y señala el tema?', options:choices(['bees','Abejas','🐝'],['fly','Vuelan','🪽'],['new','Nuevas','✨']), correct:'bees', skill:'Identificar tema' }, comprehension:{ prompt:'¿Cuál es la idea más importante?', options:choices(['help','Las abejas ayudan a las plantas','🌼'],['yellow','Las abejas son amarillas','🟡'],['sleep','Las abejas duermen','😴']), correct:'help' } }),
  mission({ id:'g2-tormenta', grade:2, week:3, day:2, title:'Antes de la tormenta', world:'Isla de las Nubes', skill:'Predicción', text:'El cielo se volvió oscuro, las hojas comenzaron a girar y los pájaros buscaron refugio. Emilia cerró las ventanas y guardó la ropa del patio.', warmup:{ prompt:'¿Qué pista anuncia lluvia?', options:choices(['dark','El cielo oscuro','🌧️'],['book','Un libro abierto','📖'],['bread','Pan caliente','🍞']), correct:'dark', skill:'Usar pistas' }, comprehension:{ prompt:'¿Qué probablemente ocurrirá después?', options:choices(['storm','Comenzará una tormenta','⛈️'],['summer','Llegará el verano','🏖️'],['party','Empezará una fiesta','🎉']), correct:'storm' } }),
  mission({ id:'g2-pinguinos', grade:2, week:3, day:3, title:'Noticias de pingüinos', world:'Costa Helada', skill:'Hechos y opiniones', text:'Los pingüinos de Humboldt viven en las costas de Chile y Perú. Tienen plumas que los ayudan a conservar el calor. Para mí, son las aves más simpáticas.', warmup:{ prompt:'¿Qué expresión anuncia una opinión?', options:choices(['forme','Para mí','💬'],['live','Viven','🏠'],['have','Tienen','🪶']), correct:'forme', skill:'Distinguir opinión' }, comprehension:{ prompt:'¿Cuál oración es un hecho del texto?', options:choices(['coast','Viven en costas de Chile y Perú','🗺️'],['cute','Son los más simpáticos','😊'],['best','Son las mejores aves','🏆']), correct:'coast' } }),
  mission({ id:'g2-flauta', grade:2, week:3, day:4, title:'La flauta de madera', world:'Academia del Sonido', skill:'Resumen', text:'Violeta encontró una flauta antigua en el ático. La limpió, practicó durante varios días y finalmente tocó una melodía para su familia.', warmup:{ prompt:'¿Qué tres acciones son esenciales?', options:choices(['cleanPlay','Encontró, practicó y tocó','🎶'],['eatSleep','Comió, corrió y durmió','😴'],['rainSun','Llovió, salió el sol y nevó','🌦️']), correct:'cleanPlay', skill:'Seleccionar ideas clave' }, comprehension:{ prompt:'¿Cuál es el mejor resumen?', options:choices(['summary','Violeta recuperó una flauta y aprendió a tocarla','🪈'],['attic','El ático era muy grande','🏠'],['family','La familia compró una radio','📻']), correct:'summary' } }),
  mission({ id:'g2-guardian-luz', grade:2, week:3, day:5, title:'El Guardián de la Luz', world:'Corazón de Lectoguarida', skill:'Integración e inferencia', text:'El Guardián cerró la puerta porque la lámpara central estaba apagada. Amalia recordó que los cristales brillaban con sonidos claros, leyó la inscripción lentamente y la sala volvió a iluminarse.', warmup:{ prompt:'¿Cómo conviene leer una inscripción difícil?', options:choices(['slow','Lentamente y por frases','📜'],['rush','Muy rápido y sin pausas','🏃'],['skip','Saltando palabras','⏭️']), correct:'slow', skill:'Estrategia de fluidez' }, comprehension:{ prompt:'¿Por qué se abrió el templo?', options:choices(['reading','La lectura encendió los cristales','💎'],['wind','El viento empujó la puerta','🌬️'],['key','Amalia encontró una llave','🗝️']), correct:'reading' } })
];

// Campaña fonético-sintética de 2.º básico: 27 letras, luego combinaciones consonánticas y finalmente fluidez.
const alphabetPath = [
  ['a','A','abeja','🐝','Ana ayuda a una abeja. La abeja vuela hasta una amapola.'],
  ['e','E','estrella','⭐','Elena encuentra una estrella de papel. La estrella está en el estuche.'],
  ['i','I','isla','🏝️','Inés imagina una isla. En la isla hay iguanas y un inmenso árbol.'],
  ['o','O','oso','🐻','Óscar observa un oso. El oso olfatea una olla y luego se oculta.'],
  ['u','U','uva','🍇','Úrsula junta uvas. Usa una bolsa para llevarlas a su abuela.'],
  ['m','M','mapa','🗺️','Mila mira un mapa. Marca el camino hasta la montaña con una moneda.'],
  ['p','P','pato','🦆','Pablo pasea con un pato. El pato pasa por el puente pequeño.'],
  ['l','L','luna','🌙','Lola lee bajo la luna. La luz ilumina las letras de su libro.'],
  ['s','S','sapo','🐸','Sofía sigue a un sapo. El sapo salta sobre seis suaves hojas.'],
  ['t','T','tomate','🍅','Tomás toma un tomate. También trae tres tazas para la tarea.'],
  ['n','N','nube','☁️','Nora nota una nube negra. La nube navega sobre nueve nidos.'],
  ['d','D','dado','🎲','Dante deja un dado dorado. Después dibuja dos delfines.'],
  ['f','F','foca','🦭','Felipe fotografía una foca. La foca feliz nada cerca del faro.'],
  ['r','R','rana','🐸','Rita es una rana rápida. Recorre las rocas junto al río.'],
  ['b','B','barco','⛵','Bruno busca un barco azul. El barco baja por la bahía.'],
  ['c','C','casa','🏠','Camila camina hasta la casa. Cocina cacao con canela.'],
  ['g','G','gato','🐱','Gabriel guía a un gato gris. El gato guarda una goma.'],
  ['v','V','vela','🕯️','Violeta ve una vela verde. El viento mueve su pequeña llama.'],
  ['j','J','jarra','🫙','Josefa junta jugo en una jarra. Javier deja la jarra junto al jardín.'],
  ['h','H','helado','🍦','Hugo hace helado de higo. Hoy lo comparte con Helena.'],
  ['q','Q','queso','🧀','Quique quiere queso. Corta un poquito y lo comparte con Raquel.'],
  ['y','Y','yoyo','🪀','Yasna juega con un yoyó amarillo. El yoyó sube y baja.'],
  ['z','Z','zorro','🦊','Zoe dibuja un zorro. El zorro usa zapatos azules.'],
  ['ñ','Ñ','ñandú','🐦','Ñico observa un ñandú. El ñandú corre cerca de los ñirres.'],
  ['k','K','koala','🐨','Karla lee sobre un koala. El koala come hojas y descansa.'],
  ['w','W','wifi','📶','Waldo conecta el wifi. Luego busca información sobre wombats.'],
  ['x','X','xilófono','🎼','Ximena toca el xilófono. Su próximo examen será un éxito.']
];

const letterMission = ([letter, upper, word, icon, text], index) => {
  const order = index + 1;
  const written = index % 3 === 0;
  const distractors = alphabetPath.filter((item) => item[0] !== letter).slice((index + 4) % 20, (index + 4) % 20 + 2);
  const options = choices([letter, upper, icon], ...distractors.map((item) => [item[0], item[1], item[3]]));
  for (let turn = 0; turn < index % 3; turn += 1) options.push(options.shift());
  const comprehensionOptions = choices([word, word[0].toUpperCase() + word.slice(1), icon],['sol','Sol','☀️'],['mesa','Mesa','🪑']);
  for (let turn = 0; turn < (index + 1) % 3; turn += 1) comprehensionOptions.push(comprehensionOptions.shift());
  return {
    id: `g2-letter-${letter}`, grade: 2, week: Math.ceil(order / 5), day: ((order - 1) % 5) + 1, order,
    stage: 'Letras', focusSymbol: upper, title: `El poder de la ${upper}`, world: `Santuario de la ${upper}`,
    skill: `Letra ${upper} · sonido y escritura`, text,
    warmup: written
      ? { mode:'write', prompt:`Escribe la letra inicial de “${word}”.`, placeholder:`Escribe ${upper}`, correct:letter, skill:`Escritura de ${upper}` }
      : { mode:'tap', prompt:`Toca la letra inicial de “${word}”.`, options, correct:letter, skill:`Reconocimiento de ${upper}` },
    comprehension: { mode:'tap', prompt:`¿Qué palabra protagonista comienza con ${upper}?`, options:comprehensionOptions, correct:word }
  };
};

const clusterPath = [
  ['pl','PL','planta','🪴','Plinio planta una planta. La planta crece junto a la plaza.'],
  ['pr','PR','premio','🏆','Priscila prepara una prueba. Su premio es aprender algo nuevo.'],
  ['bl','BL','bloque','🧱','Blanca arma un bloque azul. Luego ordena los bloques blancos.'],
  ['br','BR','brújula','🧭','Bruno abre un cofre brillante. Dentro encuentra una brújula.'],
  ['cl','CL','clavo','🔨','Clara clasifica clavos. Cada clavo queda en una caja clara.'],
  ['cr','CR','cristal','💎','Cristóbal cuida un cristal. El cristal crea pequeños colores.'],
  ['fl','FL','flor','🌼','Florencia recoge una flor. La flor flota sobre el agua.'],
  ['fr','FR','fruta','🍎','Francisca ofrece fruta fresca. Fredy elige una frutilla.'],
  ['gl','GL','globo','🎈','Gloria infla un globo. El globo brilla bajo la luz.'],
  ['gr','GR','grillo','🦗','Greta escucha un grillo. El grillo canta sobre el granero.'],
  ['tr','TR','tren','🚂','Trinidad sube al tren. El tren atraviesa tres túneles.'],
  ['dr','DR','dragón','🐲','El dragón de Adrián duerme. Al despertar, dibuja una estrella.'],
  ['ch','CH','chocolate','🍫','Chile prepara chocolate caliente. Luego comparte churros con Charo.'],
  ['ll','LL','lluvia','🌧️','La lluvia llega al valle. Guillermo lleva un paraguas amarillo.'],
  ['rr','RR','perro','🐕','El perro corre junto al carro. Después regresa para beber agua.']
];

const clusterMission = ([cluster, upper, word, icon, text], index) => {
  const order = alphabetPath.length + index + 1;
  return {
    id:`g2-cluster-${cluster}`, grade:2, week:Math.ceil(order / 5), day:((order - 1) % 5) + 1, order,
    stage:'Doble consonante', focusSymbol:upper, title:`Forja ${upper}`, world:`Forja de ${upper}`,
    skill:`Grupo consonántico ${upper}`, text,
    warmup:{ mode:'build', prompt:`Construye ${upper} tocando las letras en orden.`, options:choices([cluster[0],cluster[0].toUpperCase(),'🔹'],[cluster[1],cluster[1].toUpperCase(),'🔸'],['a','A','✨']), correct:cluster, skill:`Construcción de ${upper}` },
    comprehension:{ mode:'tap', prompt:`¿Qué palabra contiene ${upper}?`, options:choices([word,word[0].toUpperCase()+word.slice(1),icon],['mesa','Mesa','🪑'],['luna','Luna','🌙']), correct:word }
  };
};

for (const reading of readings) {
  if (reading.grade === 2) {
    reading.order += alphabetPath.length + clusterPath.length;
    reading.week = Math.ceil(reading.order / 5);
    reading.day = ((reading.order - 1) % 5) + 1;
    reading.stage = 'Fluidez';
    reading.focusSymbol = '⚡';
  }
}
readings.push(...alphabetPath.map(letterMission), ...clusterPath.map(clusterMission));

// Profundización curricular transversal basada en los textos oficiales de 2.º básico
// aportados por la docente. Todas las lecturas son originales y están diseñadas para
// ejercitar fluidez, vocabulario y comprensión sin reproducir los textos fuente.
const crossCurriculumPath = [
  { id:'insectos-cooperan', stage:'Lenguaje y creación', icon:'🐜', title:'El equipo de seis patas', world:'Jardín de los Insectos', skill:'Texto informativo · ca, ce, ci, co, cu', subjectOA:'LE02 OA07 · Comprender textos informativos y ampliar vocabulario', text:'En el jardín, una hormiga carga una semilla y otra despeja el camino. Cerca de ellas, una cigarra descansa sobre el ciruelo. Aunque son pequeñas, ambas cumplen tareas importantes en el ambiente.', warm:['¿Qué palabra contiene la sílaba CI?',['cigarra','Cigarra','🦗'],['hormiga','Hormiga','🐜'],['jardin','Jardín','🌿']], question:['¿Cuál es la idea principal?',['tasks','Los insectos realizan tareas importantes','🤝'],['size','Todos los insectos son grandes','📏'],['sleep','Las hormigas solo descansan','😴']] },
  { id:'viaje-secuencia', stage:'Lenguaje y creación', icon:'🧳', title:'Un viaje bien contado', world:'Estación de las Secuencias', skill:'Cuento · secuencia y sustantivos comunes', subjectOA:'LE02 OA05 · Comprender narraciones e identificar secuencias', text:'Primero, Mara preparó su mochila. Después, tomó el bus hacia el campo y observó cerros por la ventana. Al llegar, saludó a su primo y juntos caminaron hasta un antiguo molino.', warm:['¿Qué palabra anuncia el inicio?',['primero','Primero','1️⃣'],['despues','Después','2️⃣'],['llegar','Al llegar','🏁']], question:['¿Qué hizo Mara antes de caminar al molino?',['greet','Saludó a su primo','👋'],['return','Regresó a casa','🏠'],['sleep','Se quedó dormida','😴']] },
  { id:'gabriela-maestra', stage:'Lenguaje y creación', icon:'✍️', title:'Gabriela, maestra de palabras', world:'Valle de la Poesía', skill:'Biografía · nombres propios y hechos', subjectOA:'LE02 OA07 · Extraer información explícita de una biografía', text:'Gabriela Mistral fue una poeta y maestra chilena. Nació en el valle de Elqui y escribió sobre la infancia, la naturaleza y el cariño. Sus versos viajaron por muchos países y acercaron la poesía a nuevas personas.', warm:['¿Cuál es un nombre propio?',['gabriela','Gabriela Mistral','✍️'],['poeta','poeta','📖'],['valle','valle','🏞️']], question:['¿Sobre qué temas escribió Gabriela?',['themes','La infancia, la naturaleza y el cariño','🌱'],['robots','Robots y máquinas','🤖'],['sports','Solo deportes','⚽']] },
  { id:'curiosidad-palote', stage:'Lenguaje y creación', icon:'🔎', title:'Un maestro del disfraz', world:'Museo de las Curiosidades', skill:'Ficha informativa · dato y descripción', subjectOA:'LE02 OA07 · Comprender artículos y fichas informativas', text:'El insecto palote parece una rama delgada. Su forma y su color le permiten confundirse con las plantas. Este camuflaje lo ayuda a pasar inadvertido cuando un animal se acerca.', warm:['¿Qué significa camuflaje en el texto?',['hide','Parecerse al entorno para ocultarse','🌿'],['sound','Hacer un sonido fuerte','📣'],['food','Guardar alimento','🍎']], question:['¿Para qué le sirve su aspecto de rama?',['protect','Para protegerse al pasar inadvertido','🫥'],['swim','Para nadar más rápido','🏊'],['shine','Para brillar de noche','✨']] },
  { id:'pinguino-costa', stage:'Lenguaje y creación', icon:'🐧', title:'El caminante de la costa', world:'Bahía del Pingüino', skill:'Texto informativo · artículos', subjectOA:'LE02 OA07 · Localizar información en un texto informativo', text:'El pingüino de Humboldt vive en costas de Chile y Perú. Nada con agilidad para buscar peces y descansa en lugares protegidos. La contaminación y la pérdida de refugios pueden poner en riesgo su vida.', warm:['¿Qué artículo completa “___ pingüino”?',['el','El','🔵'],['las','Las','🟣'],['una','Una','🟢']], question:['¿Qué puede poner en riesgo al pingüino?',['risk','La contaminación y la pérdida de refugios','⚠️'],['waves','El movimiento de las olas','🌊'],['sand','La arena de la playa','🏖️']] },
  { id:'flamenco-descripcion', stage:'Lenguaje y creación', icon:'🦩', title:'Retrato de un flamenco', world:'Laguna Rosada', skill:'Descripción · adjetivos calificativos', subjectOA:'LE02 OA19 · Comprender la función de sustantivos y adjetivos', text:'El flamenco tiene patas largas, cuello flexible y plumas rosadas. Camina lentamente por aguas poco profundas mientras busca alimento. Su figura elegante se refleja en la laguna tranquila.', warm:['¿Cuál palabra describe al cuello?',['flexible','Flexible','〰️'],['walk','Camina','🚶'],['water','Agua','💧']], question:['¿Dónde busca alimento el flamenco?',['shallow','En aguas poco profundas','💧'],['mountain','En la cima de una montaña','⛰️'],['house','Dentro de una casa','🏠']] },
  { id:'fabula-huemul', stage:'Lenguaje y creación', icon:'🦌', title:'El huemul y la loica', world:'Bosque de las Enseñanzas', skill:'Fábula · problema y enseñanza', subjectOA:'LE02 OA05 · Comprender personajes, problema y enseñanza', text:'Un huemul quería cruzar un sendero cubierto de ramas. Una loica le indicó un paso seguro, pero él no quiso escuchar. Tras tropezar, aceptó su ayuda. Desde entonces comprendió que pedir consejo también es una forma de aprender.', warm:['¿Qué palabra anuncia un cambio?',['since','Desde entonces','🔄'],['branch','Ramas','🌿'],['trail','Sendero','🥾']], question:['¿Qué aprendió el huemul?',['lesson','Que escuchar y pedir ayuda permite aprender','🤝'],['alone','Que siempre debe caminar solo','🚶'],['fast','Que debe correr sin mirar','🏃']] },
  { id:'poema-colores', stage:'Lenguaje y creación', icon:'🌈', title:'Colores que suenan', world:'Taller del Arcoíris', skill:'Poema · versos, ritmo y rima', subjectOA:'LE02 OA06 · Leer poemas con ritmo y expresión', text:'Roja canta la amapola, verde ríe el caracol. Azul navega una ola y dorado brilla el sol. Cada color trae un ritmo; cada verso, una emoción.', warm:['¿Qué palabras riman?',['rhyme','Amapola y ola','🎵'],['green','Verde y sol','🟢'],['blue','Azul y ritmo','🔵']], question:['¿Qué relación establece el poema?',['colors','Une colores con sonidos y emociones','🌈'],['recipe','Explica una receta','🥣'],['map','Describe un mapa','🗺️']] },
  { id:'ave-investigadora', stage:'Lenguaje y creación', icon:'🪶', title:'Detectives de aves', world:'Observatorio Emplumado', skill:'Investigación · seleccionar datos', subjectOA:'LE02 OA07 · Organizar información de distintas fuentes', text:'Emilia observó un ave pequeña con pecho rojo y anotó tres datos: comía insectos, cantaba al amanecer y construía su nido entre arbustos. Luego comparó sus notas con una guía para identificarla.', warm:['¿Cuál palabra describe el pecho?',['red','Rojo','🔴'],['sing','Cantaba','🎶'],['nest','Nido','🪺']], question:['¿Para qué comparó sus notas con una guía?',['identify','Para identificar el ave','🔎'],['draw','Para borrar el dibujo','🧽'],['feed','Para preparar comida','🥣']] },
  { id:'versos-preguntones', stage:'Lenguaje y creación', icon:'❓', title:'La pregunta de la luna', world:'Teatro de los Signos', skill:'Prosodia · interrogación y exclamación', subjectOA:'LE02 OA02 · Leer oralmente con pausas y entonación', text:'—¿Quién encendió las estrellas? —preguntó la luna. El búho abrió sus grandes ojos y exclamó: —¡Tal vez brillan para guiarnos! Ambos guardaron silencio y contemplaron el cielo.', warm:['¿Cómo se lee una exclamación?',['emotion','Con emoción y cambio de voz','🎭'],['flat','Sin expresión','➖'],['whisper','Siempre en susurro','🤫']], question:['¿Qué hicieron al final la luna y el búho?',['watch','Contemplaron el cielo en silencio','🌌'],['run','Corrieron al bosque','🏃'],['sleep','Durmieron en una caja','📦']] },
  { id:'festival-invitacion', stage:'Lenguaje y creación', icon:'💌', title:'Invitación a la lectura', world:'Plaza de las Celebraciones', skill:'Texto funcional · propósito y datos', subjectOA:'LE02 OA07 · Comprender invitaciones y mensajes funcionales', text:'El segundo básico preparó una invitación: “Festival de lectura, viernes a las cuatro, en la biblioteca”. También agregó un mensaje: “Trae tu historia favorita y ven con tu familia”.', warm:['¿Qué dato indica cuándo será el festival?',['friday','Viernes a las cuatro','🕓'],['library','En la biblioteca','📚'],['story','Historia favorita','📖']], question:['¿Para qué fue escrito el mensaje?',['invite','Para invitar a un festival de lectura','💌'],['sell','Para vender libros','🛒'],['warn','Para cerrar la biblioteca','🚫']] },
  { id:'parque-protegido', stage:'Lenguaje y creación', icon:'🏞️', title:'Guardianes del parque', world:'Bosque de las Buenas Decisiones', skill:'Texto informativo · problema y solución', subjectOA:'LE02 OA07 · Comprender información ambiental y proponer acciones', text:'Un parque nacional protege plantas, animales y paisajes valiosos. Para cuidarlo, las visitas deben llevarse su basura, respetar los senderos y observar a los animales sin molestarlos.', warm:['¿Qué palabra expresa una norma?',['must','Deben','✅'],['park','Parque','🏞️'],['animals','Animales','🦊']], question:['¿Cuál conducta cuida el parque?',['care','Llevarse la basura y respetar senderos','♻️'],['noise','Perseguir animales','🏃'],['flowers','Arrancar flores','🌸']] },
  { id:'leyenda-inventada', stage:'Lenguaje y creación', icon:'🌫️', title:'La campana de la niebla', world:'Cueva de las Leyendas', skill:'Leyenda · inicio, problema y desenlace', subjectOA:'LE02 OA05 · Reconocer estructura y enseñanza de narraciones', text:'El curso inventó una leyenda sobre una campana que dormía dentro de un cerro. Cuando la niebla cubría el valle, su sonido ayudaba a las personas a encontrar el camino de regreso.', warm:['¿Qué elemento es fantástico?',['bell','La campana que duerme dentro del cerro','🔔'],['valley','El valle','🏞️'],['fog','La niebla','🌫️']], question:['¿Qué explicaba la leyenda inventada?',['guide','Cómo las personas encontraban el regreso','🧭'],['food','Cómo preparar pan','🍞'],['rain','Por qué llueve en verano','🌧️']] },
  { id:'receta-macedonia', stage:'Lenguaje y creación', icon:'🥗', title:'Macedonia paso a paso', world:'Cocina de las Instrucciones', skill:'Receta · verbos y orden temporal', subjectOA:'LE02 OA07 · Seguir instrucciones escritas de varios pasos', text:'Lava una manzana, una pera y algunas frutillas. Luego, pide a un adulto que corte las frutas. Pon los trozos en un recipiente, agrega jugo de naranja y mezcla con cuidado.', warm:['¿Qué acción va primero?',['wash','Lavar las frutas','💧'],['mix','Mezclar','🥄'],['juice','Agregar jugo','🍊']], question:['¿Quién debe cortar las frutas?',['adult','Un adulto','🧑'],['child','El niño sin ayuda','👦'],['nobody','Nadie','🚫']] },
  { id:'cuidarnos', stage:'Lenguaje y creación', icon:'💛', title:'Una sopa de cuidado', world:'Casa del Buen Trato', skill:'Relato · emociones y antónimos', subjectOA:'LE02 OA05 · Inferir sentimientos y acciones de cuidado', text:'Lucas estaba enfermo y se sentía débil. Su hermana le llevó agua y habló en voz suave para que descansara. Al día siguiente, Lucas despertó más fuerte y agradeció su compañía.', warm:['¿Cuál es el antónimo de débil?',['strong','Fuerte','💪'],['soft','Suave','🫧'],['sick','Enfermo','🤒']], question:['¿Cómo cuidó la hermana a Lucas?',['care','Le llevó agua y habló suavemente','💛'],['noise','Puso música muy fuerte','📣'],['leave','Lo dejó solo afuera','🚪']] },
  { id:'jardin-reciclado', stage:'Lenguaje y creación', icon:'♻️', title:'El jardín que volvió a vivir', world:'Patio del Reciclaje', skill:'Cuento · causa, efecto y ambiente', subjectOA:'LE02 OA05 · Relacionar acciones y consecuencias', text:'El patio tenía botellas y papeles en el suelo. El curso separó los residuos, reutilizó algunos envases como maceteros y plantó semillas. Con el tiempo, el lugar se convirtió en un jardín limpio y colorido.', warm:['¿Qué significa reutilizó?',['reuse','Usó nuevamente un objeto','♻️'],['throw','Arrojó todo al suelo','🗑️'],['buy','Compró algo nuevo','🛒']], question:['¿Por qué cambió el patio?',['action','Porque el curso limpió, reutilizó y plantó','🌱'],['magic','Porque apareció por magia','🪄'],['storm','Porque hubo una tormenta','⛈️']] },
  { id:'telefono-casero', stage:'Lenguaje y creación', icon:'☎️', title:'Un teléfono con hilo', world:'Laboratorio de Construcción', skill:'Instructivo · familia de palabras', subjectOA:'LE02 OA07 · Comprender y ordenar instrucciones', text:'Para construir un teléfono casero se necesitan dos vasos y un hilo largo. Un adulto perfora cada vaso. Luego, el hilo se pasa por ambos agujeros y se anuda. El hilo debe quedar tenso para transmitir la voz.', warm:['¿Qué palabra pertenece a la familia de hilo?',['thread','Hilito','🧵'],['glass','Vaso','🥛'],['voice','Voz','🗣️']], question:['¿Cómo debe quedar el hilo?',['tight','Tenso','↔️'],['loose','Enredado y suelto','🪢'],['cut','Cortado','✂️']] },
  { id:'dinosaurio-chileno', stage:'Lenguaje y creación', icon:'🦕', title:'Huellas del pasado', world:'Valle de los Dinosaurios', skill:'Noticia científica · hecho y pregunta', subjectOA:'LE02 OA07 · Extraer datos de artículos informativos', text:'Un equipo de paleontología estudia fósiles para conocer animales que vivieron hace muchísimo tiempo. Cada hueso, huella o roca entrega pistas. Antes de afirmar una idea, el equipo observa, compara y hace preguntas.', warm:['¿Qué estudia el equipo?',['fossils','Fósiles','🦴'],['clouds','Nubes','☁️'],['music','Canciones','🎵']], question:['¿Qué hacen antes de afirmar una idea?',['evidence','Observan, comparan y preguntan','🔎'],['guess','Inventan sin mirar','🎲'],['hide','Esconden las pistas','🫥']] },
  { id:'cuento-fantastico', stage:'Lenguaje y creación', icon:'☂️', title:'El paraguas viajero', world:'Ciudad de lo Imposible', skill:'Cuento fantástico · problema y solución', subjectOA:'LE02 OA05 · Comprender acciones en cuentos tradicionales y fantásticos', text:'Apenas Inés abrió su paraguas amarillo, una ráfaga lo elevó sobre los techos. Para bajar, observó el viento y cerró el paraguas cuando pasó sobre una plaza con pasto blando.', warm:['¿Qué hecho es fantástico?',['fly','El paraguas eleva a Inés sobre los techos','☂️'],['grass','La plaza tiene pasto','🌱'],['yellow','El paraguas es amarillo','🟡']], question:['¿Cómo resolvió Inés el problema?',['close','Cerró el paraguas sobre un lugar seguro','✅'],['jump','Saltó sobre un techo','🏠'],['wait','Esperó hasta la noche','🌙']] },
  { id:'afiche-saludable', stage:'Lenguaje y creación', icon:'🥕', title:'Energía para aprender', world:'Feria de los Alimentos', skill:'Afiche · idea principal y prefijos', subjectOA:'LE02 OA07 · Comprender propósito e información de un afiche', text:'El afiche de la feria decía: “Combina colores en tu plato, bebe agua y muévete cada día”. Abajo explicaba que una alimentación variada entrega energía para jugar, aprender y crecer.', warm:['¿Qué palabra significa que algo no es saludable?',['unhealthy','Insalubre','⚠️'],['healthy','Saludable','🥕'],['varied','Variada','🌈']], question:['¿Cuál es el propósito del afiche?',['promote','Promover hábitos saludables','💚'],['story','Contar un cuento fantástico','🐉'],['ticket','Vender entradas','🎟️']] },
  { id:'teatro-mascotas', stage:'Lenguaje y creación', icon:'🎭', title:'La obra de la plaza', world:'Escenario de las Voces', skill:'Teatro · diálogo y expresión', subjectOA:'LE02 OA02 · Leer diálogos con entonación y expresión', text:'—¿Viste a mi perro? —preguntó Ana con voz preocupada. —¡Está junto a la fuente! —respondió Tomás. Ana corrió, lo abrazó y dijo aliviada: —Gracias por ayudarme.', warm:['¿Qué emoción tiene Ana al comienzo?',['worried','Preocupación','😟'],['joy','Alegría','😄'],['anger','Enojo','😠']], question:['¿Cómo cambia la emoción de Ana?',['relief','Pasa de preocupada a aliviada','🙂'],['same','Permanece enojada','😠'],['bored','Termina aburrida','🥱']] },
  { id:'universo-r-rr', stage:'Lenguaje y creación', icon:'🔭', title:'Rumbo a las estrellas', world:'Observatorio de las R', skill:'Texto informativo · R y RR', subjectOA:'LE02 OA02 · Leer palabras con r y rr con precisión', text:'Desde el observatorio, Renato mira una estrella brillante. La Tierra recorre su órbita alrededor del Sol, mientras la Luna gira alrededor de nuestro planeta. Renato registra cada observación en su cuaderno.', warm:['¿En cuál palabra suena fuerte RR?',['earth','Tierra','🌍'],['orbit','Órbita','🔄'],['around','Alrededor','⭕']], question:['¿Qué registra Renato?',['observations','Sus observaciones del cielo','📝'],['recipes','Recetas de cocina','🥣'],['games','Resultados deportivos','⚽']] },
  { id:'enigma-tortuga', stage:'Lenguaje y creación', icon:'🐢', title:'El enigma del caparazón', world:'Laguna de las Pistas', skill:'Enigma · inferencia y vocabulario', subjectOA:'LE02 OA03 · Usar pistas para formular inferencias', text:'Camino despacio, llevo mi casa y no necesito llave. Puedo esconder la cabeza cuando siento peligro. Martina leyó las pistas, pensó en distintos animales y encontró la respuesta.', warm:['¿Qué palabra indica que hay que inferir?',['clues','Pistas','🔎'],['key','Llave','🗝️'],['house','Casa','🏠']], question:['¿Cuál es la respuesta del enigma?',['turtle','La tortuga','🐢'],['bird','El cóndor','🦅'],['whale','La ballena','🐋']] },
  { id:'diccionario-vivo', stage:'Lenguaje y creación', icon:'📗', title:'Palabras con memoria', world:'Biblioteca de las Lenguas', skill:'Diccionario · significado y respeto lingüístico', subjectOA:'LE02 OA10 · Buscar significado y registrar nuevas palabras', text:'Milla escuchó una palabra en mapuzugun y preguntó su significado con respeto. Después la anotó, dibujó una pista visual y registró quién se la enseñó. Así comenzó un pequeño diccionario para compartir con el curso.', warm:['¿Qué hizo Milla antes de anotar?',['ask','Preguntó el significado','💬'],['erase','Borró la palabra','🧽'],['guess','Inventó una respuesta','🎲']], question:['¿Para qué creó el diccionario?',['share','Para aprender y compartir palabras','📗'],['hide','Para ocultar información','🔒'],['grade','Para poner notas','📝']] },

  { id:'cuerpo-organos', stage:'Ciencia y ambiente', icon:'❤️', title:'La orquesta del cuerpo', world:'Laboratorio del Cuerpo', skill:'Causa y función · vocabulario científico', subjectOA:'CN02 OA07 · Ubicar y explicar la función de órganos fundamentales', text:'El corazón impulsa la sangre, los pulmones participan en la respiración y el estómago ayuda a procesar los alimentos. Estos órganos realizan tareas diferentes, pero trabajan coordinados dentro del cuerpo.', warm:['¿Qué órgano participa en la respiración?',['lungs','Los pulmones','🫁'],['stomach','El estómago','🥣'],['heart','El corazón','❤️']], question:['¿Cuál es la idea principal?',['team','Los órganos cumplen funciones y trabajan coordinados','🤝'],['same','Todos los órganos hacen exactamente lo mismo','🟰'],['outside','Los órganos están fuera del cuerpo','🚪']] },
  { id:'habitos-saludables', stage:'Ciencia y ambiente', icon:'🏃', title:'Energía para el cuerpo', world:'Pista del Bienestar', skill:'Texto explicativo · hábitos y consecuencias', subjectOA:'CN02 OA08 · Explicar beneficios de actividad física, higiene y alimentación', text:'Dormir lo necesario, beber agua, moverse, comer alimentos variados y lavarse las manos ayuda a cuidar el cuerpo. Un hábito se fortalece cuando se repite con constancia y apoyo.', warm:['¿Cuál es un hábito de higiene?',['wash','Lavarse las manos','🧼'],['screens','Mirar pantallas toda la noche','📱'],['skip','No beber agua','🚱']], question:['¿Cómo se fortalece un hábito?',['repeat','Repitiéndolo con constancia y apoyo','🔁'],['once','Haciéndolo una sola vez','1️⃣'],['forget','Olvidándolo','🫥']] },
  { id:'animal-nativo', stage:'Ciencia y ambiente', icon:'🐦', title:'Una especie que necesita espacio', world:'Reserva de la Vida', skill:'Texto informativo · especie nativa y amenaza', subjectOA:'CN02 OA05 · Observar animales nativos e identificar riesgo de extinción', text:'Una especie nativa vive naturalmente en un territorio. Cuando pierde su alimento, su refugio o su espacio, puede disminuir. Proteger su ambiente ayuda a que sus poblaciones se recuperen.', warm:['¿Qué significa nativa?',['native','Que vive naturalmente en un territorio','🗺️'],['pet','Que siempre es mascota','🐕'],['foreign','Que llegó ayer desde otro planeta','🛸']], question:['¿Qué acción ayuda a una especie amenazada?',['protect','Proteger su ambiente','🌿'],['remove','Eliminar su alimento','🚫'],['noise','Hacer ruido en su refugio','📣']] },
  { id:'ciclo-vida', stage:'Ciencia y ambiente', icon:'🦋', title:'Cambios para crecer', world:'Sendero de los Ciclos', skill:'Secuencia · ciclo de vida', subjectOA:'CN02 OA03 · Observar y comparar ciclos de vida de animales', text:'Una mariposa comienza como huevo. Luego aparece una oruga, que crece y forma una crisálida. Finalmente emerge la mariposa adulta. Cada etapa es distinta y forma parte del mismo ciclo.', warm:['¿Qué etapa aparece después del huevo?',['caterpillar','La oruga','🐛'],['adult','La mariposa adulta','🦋'],['nest','El nido','🪺']], question:['¿Por qué se llama ciclo?',['cycle','Porque sus etapas forman una secuencia de vida','🔄'],['circle','Porque todos vuelan en círculo','⭕'],['clock','Porque dura una hora','🕐']] },
  { id:'agua-propiedades', stage:'Ciencia y ambiente', icon:'💧', title:'Agua que toma la forma', world:'Laboratorio Azul', skill:'Comparación · propiedades del agua', subjectOA:'CN02 OA09 · Observar características y estados del agua', text:'El agua líquida no tiene una forma fija: adopta la forma del recipiente que la contiene. Puede fluir, mojar y encontrarse en ríos, lagos o vasos. Sin agua, los seres vivos no podrían realizar funciones esenciales.', warm:['¿Qué ocurre al cambiar el agua de recipiente?',['shape','Adopta otra forma','🥛'],['solid','Se vuelve piedra','🪨'],['vanish','Desaparece siempre','🫥']], question:['¿Por qué es importante el agua?',['life','Porque los seres vivos la necesitan','🌱'],['color','Porque siempre es azul','🔵'],['noise','Porque produce música','🎵']] },
  { id:'ciclo-agua', stage:'Ciencia y ambiente', icon:'🌧️', title:'El viaje de una gota', world:'Circuito de las Nubes', skill:'Proceso · evaporación y precipitación', subjectOA:'CN02 OA10 · Describir el ciclo del agua en la naturaleza', text:'El calor del Sol transforma parte del agua en vapor. El vapor sube, se enfría y forma nubes. Cuando las gotas aumentan de tamaño, caen como lluvia y el agua vuelve a la superficie.', warm:['¿Qué energía inicia el proceso descrito?',['sun','El calor del Sol','☀️'],['moon','La luz de la Luna','🌙'],['wind','El sonido del viento','🌬️']], question:['¿Qué ocurre antes de la lluvia?',['clouds','El vapor se enfría y forma nubes','☁️'],['freeze','El río se convierte en arena','🏜️'],['plants','Las plantas se esconden','🫥']] },
  { id:'tiempo-atmosferico', stage:'Ciencia y ambiente', icon:'🌦️', title:'El informe del cielo', world:'Estación Meteorológica', skill:'Reporte · observar y registrar', subjectOA:'CN02 OA11 · Medir y describir el tiempo atmosférico', text:'Cada mañana, Antonia observa las nubes, siente el viento y registra la temperatura. Después compara los datos de varios días. Así puede describir cómo cambió el tiempo atmosférico durante la semana.', warm:['¿Cuál es un dato del tiempo atmosférico?',['temperature','La temperatura','🌡️'],['shoe','El color de un zapato','👟'],['book','El número de páginas','📘']], question:['¿Para qué compara los registros?',['changes','Para describir cambios durante la semana','📊'],['erase','Para borrar el calendario','🧽'],['guess','Para inventar el clima','🎲']] },
  { id:'estaciones-seres-vivos', stage:'Ciencia y ambiente', icon:'🍂', title:'Señales de cada estación', world:'Bosque de las Estaciones', skill:'Causa y evidencia · cambios estacionales', subjectOA:'CN02 OA12 · Relacionar estaciones con cambios en seres vivos y ambiente', text:'En otoño bajan algunas temperaturas y muchos árboles pierden hojas. En primavera aumentan las horas de luz y aparecen nuevos brotes. Plantas y animales responden de distintas maneras a esos cambios.', warm:['¿Qué señal se asocia al otoño?',['leaves','Muchos árboles pierden hojas','🍂'],['buds','Aparecen brotes nuevos','🌱'],['beach','Todos van a la playa','🏖️']], question:['¿Qué explica el texto?',['response','Cómo los seres vivos responden a las estaciones','🌦️'],['planets','Cómo se mueven los planetas','🪐'],['recipes','Cómo preparar una ensalada','🥗']] },

  { id:'mapa-cardinales', stage:'Chile y ciudadanía', icon:'🧭', title:'El mapa tiene pistas', world:'Sala de Cartografía', skill:'Lectura de mapa · orientación espacial', subjectOA:'HI02 OA06-OA07 · Ubicar Chile y orientarse con puntos cardinales', text:'Para leer un mapa, Josefina observa el título, la rosa de los vientos y la simbología. Descubre que el norte está arriba, el sur abajo y que una estrella indica la capital regional.', warm:['¿Qué elemento muestra orientación?',['rose','La rosa de los vientos','🧭'],['title','El título','🔤'],['star','La estrella','⭐']], question:['¿Qué indica la estrella en este mapa?',['capital','La capital regional','🏙️'],['ocean','El océano','🌊'],['mountain','Una montaña','⛰️']] },
  { id:'paisajes-chile', stage:'Chile y ciudadanía', icon:'🏔️', title:'Chile de norte a sur', world:'Galería de los Paisajes', skill:'Comparar · elementos naturales y culturales', subjectOA:'HI02 OA08 · Caracterizar zonas naturales y paisajes de Chile', text:'En el norte hay paisajes muy secos y cielos despejados. En el centro aparecen valles y ciudades. Hacia el sur aumentan los bosques, ríos y lluvias. Cada zona combina elementos naturales y culturales.', warm:['¿Qué conector permite comparar zonas?',['toward','Hacia el sur','⬇️'],['city','Ciudades','🏙️'],['sky','Cielos','🌌']], question:['¿Qué aumenta hacia el sur según el texto?',['south','Bosques, ríos y lluvias','🌧️'],['desert','Solo desiertos secos','🏜️'],['volcano','Únicamente volcanes','🌋']] },
  { id:'pueblos-originarios', stage:'Chile y ciudadanía', icon:'🧶', title:'Primeras comunidades del territorio', world:'Museo de las Memorias', skill:'Continuidad y cambio · comparación temporal', subjectOA:'HI02 OA01-OA02 · Valorar modos de vida de pueblos originarios ayer y hoy', text:'Los pueblos originarios poseen historias, conocimientos, lenguas y prácticas vinculadas a sus territorios. Algunas costumbres han cambiado y otras continúan vivas en familias y comunidades del Chile actual.', warm:['¿Qué significa que una práctica continúa viva?',['continues','Que todavía se realiza o transmite','🔥'],['ends','Que fue olvidada por todos','🚫'],['new','Que comenzó esta mañana','🌅']], question:['¿Qué idea destaca el texto?',['living','Las culturas originarias forman parte del presente','🧶'],['past','Solo existieron en un pasado lejano','⌛'],['same','Todas las culturas son iguales','🟰']] },
  { id:'cambio-permanencia', stage:'Chile y ciudadanía', icon:'🕰️', title:'Lo que cambia y lo que permanece', world:'Puente del Tiempo', skill:'Comparar pasado y presente', subjectOA:'HI02 OA02 · Comparar formas de vida del pasado y del presente', text:'Una comunidad puede cambiar sus herramientas, viviendas o medios de transporte y, al mismo tiempo, mantener relatos, celebraciones o formas de colaboración. Comparar requiere buscar semejanzas y diferencias con respeto.', warm:['¿Qué palabra indica algo que se mantiene?',['maintain','Mantener','🧩'],['change','Cambiar','🔄'],['travel','Transportar','🚌']], question:['¿Cómo se debe comparar culturas y tiempos?',['respect','Buscando semejanzas y diferencias con respeto','🤝'],['judge','Decidiendo cuál es superior','🏆'],['invent','Inventando datos','🎲']] },
  { id:'sociedad-multicultural', stage:'Chile y ciudadanía', icon:'🌎', title:'Muchas historias, un país', world:'Plaza de los Encuentros', skill:'Idea principal · aportes culturales', subjectOA:'HI02 OA03-OA05 · Reconocer aportes a una sociedad mestiza y multicultural', text:'La sociedad chilena se ha formado con aportes de pueblos originarios, españoles y comunidades migrantes de diferentes épocas. Alimentos, palabras, músicas, oficios y celebraciones muestran esa diversidad.', warm:['¿Qué significa multicultural?',['many','Que reúne distintas culturas','🌎'],['one','Que posee una sola costumbre','1️⃣'],['empty','Que no tiene historia','🫥']], question:['¿Dónde se observan aportes culturales?',['examples','En palabras, alimentos, músicas y celebraciones','🎶'],['only','Solo en los mapas','🗺️'],['none','En ningún lugar','🚫']] },
  { id:'migracion-acogida', stage:'Chile y ciudadanía', icon:'🧳', title:'Una bienvenida con preguntas', world:'Escuela de los Encuentros', skill:'Inferencia · diversidad y empatía', subjectOA:'HI02 OA05 · Valorar aportes de personas migrantes y la diversidad', text:'Samira llegó a una escuela nueva y trajo un juego aprendido de su abuela. Sus compañeros hicieron preguntas respetuosas y después le enseñaron una ronda local. Todos descubrieron nuevas formas de jugar.', warm:['¿Qué actitud tuvieron los compañeros?',['respect','Curiosidad respetuosa','🤝'],['mock','Burla','😒'],['ignore','Indiferencia','🫥']], question:['¿Qué aprendió el grupo?',['exchange','Que compartir experiencias amplía lo que conocen','🌍'],['same','Que solo existe una forma de jugar','1️⃣'],['silence','Que no deben hacer preguntas','🤐']] },
  { id:'normas-comunidad', stage:'Chile y ciudadanía', icon:'🤝', title:'Acuerdos que nos cuidan', world:'Consejo de la Guarida', skill:'Argumentar · norma y bien común', subjectOA:'HI02 OA14 · Comprender normas, responsabilidades y buena convivencia', text:'En la biblioteca se acordó hablar en voz baja, ordenar los libros y esperar turno. Estas normas no buscan castigar: ayudan a que todas las personas puedan leer, elegir y participar con tranquilidad.', warm:['¿Para qué sirve esperar turno?',['participate','Para que todas las personas puedan participar','🙋'],['punish','Para castigar a quien lee','🚫'],['close','Para cerrar la biblioteca','🔒']], question:['¿Cuál es la idea principal?',['common','Las normas favorecen el cuidado y el bien común','🤝'],['fear','Las normas deben causar miedo','😨'],['adult','Solo los adultos respetan acuerdos','🧑']] },
  { id:'servicios-comunidad', stage:'Chile y ciudadanía', icon:'🚒', title:'La red que ayuda', world:'Ciudad de los Servicios', skill:'Texto informativo · función de instituciones', subjectOA:'HI02 OA15 · Identificar servicios e instituciones de la comunidad', text:'La biblioteca presta libros, el centro de salud atiende a las personas y bomberos responde ante emergencias. Cada institución cumple una función distinta y todas colaboran con la comunidad.', warm:['¿Qué servicio presta libros?',['library','La biblioteca','📚'],['fire','Bomberos','🚒'],['health','El centro de salud','🏥']], question:['¿Qué tienen en común estas instituciones?',['help','Prestan servicios a la comunidad','🤝'],['sell','Venden juguetes','🧸'],['travel','Organizan viajes','✈️']] },

  { id:'tiempos-andinos', stage:'Interculturalidad', icon:'☀️', title:'Mirar el cielo y la tierra', world:'Territorio Andino', skill:'Relato explicativo · naturaleza y tiempo', subjectOA:'LCPOA02 · Territorio, observación de la naturaleza y ciclos comunitarios', text:'En territorios andinos, observar el Sol, las lluvias, las heladas y las plantas ayuda a reconocer momentos del año. Estos conocimientos se comparten entre generaciones y orientan actividades de la comunidad.', warm:['¿Qué permite reconocer la observación?',['moments','Momentos y cambios del año','📅'],['letters','Solo letras nuevas','🔤'],['traffic','El tránsito de una ciudad','🚦']], question:['¿Cómo se mantienen estos conocimientos?',['generations','Se comparten entre generaciones','👵'],['hidden','Se esconden para siempre','🔒'],['random','Se eligen al azar','🎲']] },
  { id:'ceremonia-respeto', stage:'Interculturalidad', icon:'🌾', title:'Agradecer a la naturaleza', world:'Círculo de la Memoria', skill:'Tradición oral · propósito y respeto', subjectOA:'LCPOA02 · Relatos, ceremonias y vínculo respetuoso con la naturaleza', text:'En distintas comunidades existen ceremonias para agradecer, recordar o pedir bienestar. Para conocerlas, es importante escuchar a quienes las practican, evitar imitarlas como juego y preguntar con respeto por su significado.', warm:['¿Cuál es una forma respetuosa de aprender?',['listen','Escuchar y preguntar por el significado','👂'],['imitate','Imitar sin permiso','🎭'],['laugh','Reírse de la ceremonia','😆']], question:['¿Qué propósito pueden tener las ceremonias?',['purpose','Agradecer, recordar o pedir bienestar','🌾'],['race','Competir para ganar','🏁'],['sell','Vender objetos','🛒']] },
  { id:'memoria-desierto', stage:'Interculturalidad', icon:'🏜️', title:'Historias junto al desierto', world:'Territorio Colla y Lickanantay', skill:'Memoria oral · fuente y territorio', subjectOA:'LCPOA02 · Memoria familiar y relatos vinculados al territorio', text:'Una abuela contó a sus nietos cómo reconocía senderos, aguadas y señales del tiempo en el desierto. Ellos anotaron sus preguntas y comprendieron que un relato familiar también puede guardar conocimientos del territorio.', warm:['¿Qué es una aguada en este contexto?',['water','Un lugar donde se encuentra agua','💧'],['fire','Un lugar para hacer fuego','🔥'],['road','Una carretera urbana','🛣️']], question:['¿Qué guardaba el relato de la abuela?',['knowledge','Conocimientos sobre el territorio','🏜️'],['fiction','Solo bromas sin sentido','😄'],['prices','Precios de una tienda','🏷️']] },
  { id:'relato-mayores', stage:'Interculturalidad', icon:'👵', title:'La entrevista de las tres preguntas', world:'Fogón de las Historias', skill:'Entrevista · escuchar, preguntar y registrar', subjectOA:'LCPOA02 · Oralidad, familia y transmisión intergeneracional', text:'Para entrevistar a una persona mayor, Antü preparó tres preguntas, escuchó sin interrumpir y pidió permiso antes de grabar. Después resumió la historia usando sus propias palabras.', warm:['¿Qué hizo antes de grabar?',['permission','Pidió permiso','✅'],['interrupt','Interrumpió el relato','⛔'],['publish','Publicó el audio','📢']], question:['¿Qué habilidad practicó Antü?',['active','Escucha atenta y registro responsable','👂'],['guess','Adivinar sin preguntar','🎲'],['copy','Copiar sin comprender','📄']] },
  { id:'nombres-territorio', stage:'Interculturalidad', icon:'🗺️', title:'Lugares que hablan', world:'Territorio Diaguita y Rapa Nui', skill:'Vocabulario · topónimos y significado', subjectOA:'LCPOA02 · Lenguas originarias y nombres vinculados al territorio', text:'Muchos lugares conservan nombres creados por pueblos que observaron su territorio y lo nombraron en sus propias lenguas. Investigar un topónimo permite descubrir relaciones entre lengua, historia y paisaje.', warm:['¿Qué es un topónimo?',['place','El nombre de un lugar','📍'],['animal','El sonido de un animal','🐦'],['recipe','Una receta familiar','🥣']], question:['¿Qué puede revelar un nombre de lugar?',['relations','Relaciones entre lengua, historia y paisaje','🗺️'],['weather','El clima de mañana','🌦️'],['score','Un puntaje de juego','🎮']] },
  { id:'arte-naturaleza', stage:'Interculturalidad', icon:'🎨', title:'Formas que cuentan', world:'Taller de los Territorios', skill:'Descripción visual · símbolo y entorno', subjectOA:'LCPOA02 · Expresiones artísticas, identidad y naturaleza', text:'Colores, figuras y materiales de una creación pueden comunicar vínculos con animales, plantas, mar o cordillera. Para interpretarla, primero se observa con atención y luego se investiga su contexto cultural.', warm:['¿Qué se hace primero para interpretar una creación?',['observe','Observar con atención','👀'],['judge','Decidir si es mejor que otra','🏆'],['erase','Borrar sus formas','🧽']], question:['¿Qué puede comunicar una expresión artística?',['links','Vínculos con identidad y territorio','🎨'],['nothing','Nada en particular','🚫'],['price','Solo su precio','🏷️']] },
  { id:'voces-del-sur', stage:'Interculturalidad', icon:'🌊', title:'Voces entre canales y bosques', world:'Territorios del Sur', skill:'Escucha fonológica · diversidad lingüística', subjectOA:'LCPOA02 · Sonidos de lenguas y territorios Kawésqar, Yagán y Mapuche Williche', text:'En los territorios australes existen distintas lenguas, memorias y formas de nombrar el mar, los canales y el bosque. Escuchar sus sonidos con atención ayuda a reconocer y valorar la diversidad lingüística.', warm:['¿Qué ambiente se menciona?',['channels','Mar, canales y bosque','🌊'],['desert','Solo el desierto','🏜️'],['city','Una gran avenida','🏙️']], question:['¿Para qué se escuchan atentamente los sonidos?',['value','Para reconocer y valorar diversidad lingüística','👂'],['imitate','Para burlarse de la pronunciación','😜'],['replace','Para reemplazar todas las lenguas','🚫']] },
  { id:'saberes-compartidos', stage:'Interculturalidad', icon:'🔥', title:'La ronda de los saberes', world:'Gran Encuentro de Lectoguarida', skill:'Síntesis · diversidad y aprendizaje común', subjectOA:'LCPOA02 · Saberes comunitarios, respeto e interculturalidad', text:'Cada grupo presentó un aprendizaje de su familia o comunidad: una historia, una palabra, una técnica o una canción. Nadie debía representar una cultura ajena sin permiso. El encuentro mostró que compartir con respeto enriquece a todo el curso.', warm:['¿Qué límite respetó el encuentro?',['permission','No representar una cultura ajena sin permiso','🛡️'],['silence','No escuchar a las familias','🤐'],['same','Presentar exactamente lo mismo','🟰']], question:['¿Cuál fue la enseñanza final?',['enrich','La diversidad compartida con respeto enriquece','🌟'],['compete','Una cultura debe ganar sobre otra','🏆'],['hide','Los saberes deben ocultarse','🔒']] }
];

const curriculumStartOrder = Math.max(...readings.filter((reading) => reading.grade === 2).map((reading) => reading.order));
const curriculumMission = (entry, index) => {
  const order = curriculumStartOrder + index + 1;
  const [warmPrompt, warmCorrect, warmWrongA, warmWrongB] = entry.warm;
  const [questionPrompt, questionCorrect, questionWrongA, questionWrongB] = entry.question;
  return {
    id:`g2-cross-${entry.id}`, grade:2, order, week:Math.ceil(order / 5), day:((order - 1) % 5) + 1,
    stage:entry.stage, focusSymbol:entry.icon, title:entry.title, world:entry.world, skill:entry.skill,
    subjectOA:entry.subjectOA, text:entry.text,
    warmup:{ mode:'tap', prompt:warmPrompt, options:choices(warmCorrect, warmWrongA, warmWrongB), correct:warmCorrect[0], skill:entry.skill },
    comprehension:{ mode:'tap', prompt:questionPrompt, options:choices(questionCorrect, questionWrongA, questionWrongB), correct:questionCorrect[0] }
  };
};
readings.push(...crossCurriculumPath.map(curriculumMission));

const transversalThemes = [
  { category: 'Crecimiento y autoformación personal', theme: 'Bienestar, emociones y confianza lectora', objective: 'Reconocer avances, pedir ayuda y perseverar sin temor al error.' },
  { category: 'Desarrollo del pensamiento', theme: 'Pensamiento crítico y resolución de problemas', objective: 'Usar pistas, secuencias e inferencias para tomar decisiones.' },
  { category: 'Formación ética', theme: 'Convivencia, empatía y buen trato', objective: 'Escuchar, compartir y valorar distintas formas de aprender.' },
  { category: 'La persona y su entorno', theme: 'Medioambiente, comunidad y patrimonio chileno', objective: 'Relacionar la lectura con el cuidado de personas, animales y lugares.' },
  { category: 'Tecnologías de información y comunicación', theme: 'Ciudadanía digital y uso responsable de la voz', objective: 'Usar micrófono y tecnología con propósito, cuidado y privacidad.' }
];

for (const reading of readings) {
  const transversal = transversalThemes[(reading.order + reading.grade - 2) % transversalThemes.length];
  reading.curriculum = {
    fluencyOA: reading.grade === 1 ? 'LE01 OA05 · Lectura oral con precisión y expresión' : 'LE02 OA02 · Lectura oral fluida con precisión, pausas y expresión',
    supportOA: reading.subjectOA || (reading.grade === 1
      ? (reading.order <= 10 ? 'LE01 OA04 · Decodificación y correspondencia letra-sonido' : 'LE01 OA08 · Comprensión de narraciones')
      : (reading.order % 3 === 0 ? 'LE02 OA07 · Comprensión de textos no literarios' : 'LE02 OA05 · Comprensión de narraciones')),
    transversal
  };
}

const challengeModes = [
  { name: 'Exploración', focus: 'Lectura completa con apoyo amable' },
  { name: 'Eco preciso', focus: 'Atención a fonemas y palabras' },
  { name: 'Ritmo', focus: 'Continuidad sin apurarse' },
  { name: 'Voces de personaje', focus: 'Prosodia y expresión' },
  { name: 'Detective de pistas', focus: 'Comprensión literal e inferencial' },
  { name: 'Guardián de la fluidez', focus: 'Integración de precisión, ritmo y sentido' }
];

const teacherSessions = new Set();
const studentSessions = new Map();
const MAX_STUDENTS = 40;
const ROSTER_VERSION = 5;
const DEMO_ROSTER = [
  ['student-julian-olmedo', 'Julián Olmedo', 2],
  ['student-leon-osorio', 'León Osorio', 2],
  ['student-gaspar-morales', 'Gaspar Morales', 2],
  ['student-simon-ponce', 'Simón Ponce', 2],
  ['student-steven-robles', 'Steven Robles', 2],
  ['student-santiago-rojas', 'Santiago Rojas', 2],
  ['student-emilio-ruiz', 'Emilio Ruiz', 2],
  ['student-vicente-tapia', 'Vicente Tapia', 2],
  ['student-renato-torres', 'Renato Torres', 2],
  ['student-lorenzo-valdes', 'Lorenzo Valdés', 2],
  ['student-aruma-valencia', 'Aruma Valencia', 2],
  ['student-amaro-vera', 'Amaro Vera', 2],
  ['student-allison-villalobos', 'Allison Villalobos', 2],
  ['student-mateo-zurita', 'Mateo Zurita', 2],
  ['student-joaquin-alvarez', 'Joaquín Álvarez', 2],
  ['student-joaquin-astorga', 'Joaquín Astorga', 2],
  ['student-emiliano-avila', 'Emiliano Ávila', 2],
  ['student-lucas-bustamante', 'Lucas Bustamante', 2],
  ['student-maximo-carreno', 'Máximo Carreño', 2],
  ['student-renatta-cartes', 'Renatta Cartes', 2],
  ['student-sebastian-castillo', 'Sebastián Castillo', 2],
  ['student-emilia-catalan', 'Emilia Catalán', 2],
  ['student-matias-del-pino', 'Matías Del Pino', 2],
  ['student-sebastian-devera', 'Sebastián Devera', 2],
  ['student-bastian-figueroa', 'Bastián Figueroa', 2],
  ['student-leon-fredes', 'León Fredes', 2],
  ['student-ignacio-fuentes', 'Ignacio Fuentes', 2],
  ['student-amanda-fuentes', 'Amanda Fuentes', 2],
  ['student-monserrat-fuenzalida', 'Monserrat Fuenzalida', 2],
  ['student-maria-garcia', 'María García', 2],
  ['student-beatriz-gonzalez', 'Beatriz González', 2],
  ['student-dante-lopez', 'Dante López', 2],
  ['student-bastian-martinez', 'Bastián Martínez', 2],
  ['student-dominga-morales', 'Dominga Morales', 2],
  ['student-vicente-nilo', 'Vicente Nilo', 2],
  ['student-renato-nunez', 'Renato Núñez', 2],
  ['student-luna-nunez', 'Luna Núñez', 2]
];

const rosterStudent = ([id, name, grade], index) => ({
  id,
  name,
  grade,
  avatar: ARCHETYPE_ICONS[index % ARCHETYPE_ICONS.length],
  skin: skinForIndex(index),
  xp: 0,
  coins: 20,
  unlocked: [],
  streak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  stickers: {},
  packsOpened: 0,
  packsSinceRare: 0,
  pinSalt: '',
  pinHash: '',
  exchangeStars: 0,
  refuge: { library:0, garden:0, observatory:0, musicRoom:0 },
  lastDailyRewardDate: '',
  createdAt: new Date().toISOString()
});

function ensureStudentEconomy(student, index) {
  if (!Number.isFinite(Number(student.coins))) student.coins = 20;
  student.coins = Math.max(0, Math.round(Number(student.coins)));
  const unlocked = new Set(Array.isArray(student.unlocked) ? student.unlocked : []);
  for (const [part, values] of Object.entries(SKIN_CATALOG)) {
    unlocked.add(inventoryKey(part, values[0]));
    const selected = student.skin?.[part] || skinForIndex(index)[part];
    unlocked.add(inventoryKey(part, selected));
  }
  student.unlocked = [...unlocked];
  student.streak = Math.max(0, Number(student.streak) || 0);
  student.longestStreak = Math.max(student.streak, Number(student.longestStreak) || 0);
  student.lastActiveDate = String(student.lastActiveDate || '');
  student.stickers = student.stickers && typeof student.stickers === 'object' ? student.stickers : {};
  student.packsOpened = Math.max(0, Number(student.packsOpened) || 0);
  student.packsSinceRare = Math.max(0, Number(student.packsSinceRare) || 0);
  student.pinSalt = String(student.pinSalt || '');
  student.pinHash = String(student.pinHash || '');
  student.exchangeStars = Math.max(0, Number(student.exchangeStars) || 0);
  student.refuge = student.refuge && typeof student.refuge === 'object' ? student.refuge : { library:0, garden:0, observatory:0, musicRoom:0 };
  for (const part of ['library','garden','observatory','musicRoom']) student.refuge[part] = Math.max(0, Math.min(5, Number(student.refuge[part]) || 0));
  student.lastDailyRewardDate = String(student.lastDailyRewardDate || '');
  student.skillProgress = student.skillProgress && typeof student.skillProgress === 'object' ? student.skillProgress : {};
  ensureMissionFieldsForStudent(student);
}

function getDefaultMastery() {
  return {
    decoding: 50,
    fluency: 50,
    accuracy: 50,
    vocabulary: 50,
    literal_comprehension: 50,
    inferential_comprehension: 50,
    sequence: 50,
    prosody: 50,
    attention: 50
  };
}

function ensureMissionFieldsForStudent(student) {
  if (!student.mastery || typeof student.mastery !== 'object') {
    student.mastery = getDefaultMastery();
  } else {
    const defaults = getDefaultMastery();
    for (const key of Object.keys(defaults)) {
      if (student.mastery[key] === undefined || student.mastery[key] === null) {
        student.mastery[key] = defaults[key];
      }
    }
  }
  if (!Array.isArray(student.unlockedZones)) student.unlockedZones = ['starter'];
  if (!Array.isArray(student.completedMissionIds)) student.completedMissionIds = [];
  if (!Array.isArray(student.recentMissionTypes)) student.recentMissionTypes = [];
  if (student.missionEngineEnabled === undefined || student.missionEngineEnabled === null) student.missionEngineEnabled = false;
  if (!Number.isFinite(Number(student.progressionVersion))) student.progressionVersion = 1;
}

function ensureMissionFieldsForAttempt(attempt) {
  if (attempt.missionId === undefined || attempt.missionId === null) attempt.missionId = null;
  if (attempt.missionType === undefined || attempt.missionType === null) attempt.missionType = null;
  if (!Array.isArray(attempt.focusAreas)) attempt.focusAreas = [];
  if (!attempt.assistanceUsed || typeof attempt.assistanceUsed !== 'object') attempt.assistanceUsed = {};
  if (!attempt.readingErrors || typeof attempt.readingErrors !== 'object') attempt.readingErrors = {};
  if (attempt.progressionSnapshot === undefined || attempt.progressionSnapshot === null) attempt.progressionSnapshot = null;
}

function chileDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Santiago', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function updateDailyStreak(student, now = new Date()) {
  const today = chileDateKey(now);
  if (student.lastActiveDate === today) return { changed:false, bonus:0 };
  const yesterday = chileDateKey(new Date(now.getTime() - 86_400_000));
  student.streak = student.lastActiveDate === yesterday ? student.streak + 1 : 1;
  student.longestStreak = Math.max(student.longestStreak, student.streak);
  student.lastActiveDate = today;
  return { changed:true, bonus:Math.min(10, 2 + student.streak) };
}
function awardCurriculumSkill(student, reading, scores) {
  const previous = student.skillProgress[reading.id];
  const earned = 1 + (scores.warmup >= 100 ? 1 : 0) + (scores.comprehension >= 100 ? 1 : 0);
  const points = Math.min(12, Number(previous?.points || 0) + earned);
  const level = points >= 8 ? 3 : points >= 4 ? 2 : 1;
  const skill = { id:reading.id, label:reading.skill, oa:reading.curriculum?.supportOA || '', domain:reading.stage || 'Fluidez', points, level, activities:3, lastScore:scores.overall, updatedAt:new Date().toISOString() };
  student.skillProgress[reading.id] = skill;
  return { ...skill, newlyUnlocked:!previous, leveledUp:Boolean(previous && level > Number(previous.level || 1)) };
}

function drawSticker(forceSpecial = false) {
  const rarity = pickRarity(LOOT_TABLE, { forceSpecial });
  const pool = STICKER_CATALOG.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function signMiniPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', MINIGAME_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verifyMiniToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', MINIGAME_SECRET).update(body).digest('base64url');
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload?.studentId || !payload?.levelId || !payload?.minigameId || !payload?.exp) return null;
  if (Date.now() > Number(payload.exp)) return null;
  return payload;
}
function tradableInventory(student) {
  return (student.unlocked || []).filter((key) => {
    const [part, value] = String(key).split(':');
    return SKIN_CATALOG[part]?.includes(value) && value !== SKIN_CATALOG[part][0] && student.skin?.[part] !== value;
  });
}

function ensureClassRoster(store) {
  const current = Array.isArray(store.students) ? store.students : [];
  const previous = new Map(current.map((student) => [student.id, student]));
  const fixedIds = new Set(DEMO_ROSTER.map(([id]) => id));
  const fixed = DEMO_ROSTER.map((entry, index) => {
    const base = rosterStudent(entry, index);
    const saved = previous.get(base.id);
    return saved ? { ...base, ...saved, id: base.id, name: base.name, grade: 2 } : base;
  });
  const extras = current.filter((student) => !fixedIds.has(student.id) && student?.id && student?.name).slice(0, MAX_STUDENTS - fixed.length).map((student) => ({ ...student, grade:2 }));
  store.students = [...fixed, ...extras];
  const allowedIds = new Set(store.students.map((student) => student.id));
  store.attempts = (Array.isArray(store.attempts) ? store.attempts : []).filter((attempt) => allowedIds.has(attempt.studentId));
}

const seedStore = () => ({
  version: ROSTER_VERSION,
  teacher: { id: 'teacher-conny', name: 'Conny', pin: process.env.TEACHER_PIN || '6284' },
  students: DEMO_ROSTER.map(rosterStudent),
  attempts: [],
  tradeOffers: []
});

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await stat(STORE_PATH);
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(seedStore(), null, 2), 'utf8');
  }
}

async function loadStore() {
  await ensureStore();
  const store = JSON.parse(await readFile(STORE_PATH, 'utf8'));
  let changed = false;
  const legacyIds = { 'rana-rita': 'g1-rana-rita', 'cometa-plaza': 'g2-cometa-plaza' };
  if (store.version !== ROSTER_VERSION) { store.version = ROSTER_VERSION; changed = true; }
  store.teacher = store.teacher || { id: 'teacher-conny', name: 'Conny', pin: '6284' };
  store.tradeOffers = Array.isArray(store.tradeOffers) ? store.tradeOffers.slice(-150) : [];
  if (!process.env.TEACHER_PIN && store.teacher.pin === '2468') { store.teacher.pin = '6284'; changed = true; }
  if (store.teacher.name !== (process.env.TEACHER_NAME || 'Conny')) { store.teacher.name = process.env.TEACHER_NAME || 'Conny'; changed = true; }
  if (process.env.TEACHER_PIN && store.teacher.pin !== process.env.TEACHER_PIN) { store.teacher.pin = process.env.TEACHER_PIN; changed = true; }
  const previousRoster = JSON.stringify((store.students || []).map(({ id, name, grade }) => ({ id, name, grade })));
  const previousAttemptCount = Array.isArray(store.attempts) ? store.attempts.length : 0;
  ensureClassRoster(store);
  const nextRoster = JSON.stringify(store.students.map(({ id, name, grade }) => ({ id, name, grade })));
  if (previousRoster !== nextRoster || store.attempts.length !== previousAttemptCount) changed = true;
  for (const [index, student] of store.students.entries()) {
    if (!validSkin(student.skin)) {
      student.skin = skinForIndex(index);
      student.avatar = ARCHETYPE_ICONS[index % ARCHETYPE_ICONS.length];
      changed = true;
    }
    const economyBefore = JSON.stringify({ coins: student.coins, unlocked: student.unlocked, streak:student.streak, longestStreak:student.longestStreak, lastActiveDate:student.lastActiveDate, stickers:student.stickers, packsOpened:student.packsOpened, packsSinceRare:student.packsSinceRare, pinSalt:student.pinSalt, pinHash:student.pinHash, exchangeStars:student.exchangeStars, refuge:student.refuge, lastDailyRewardDate:student.lastDailyRewardDate });
    ensureStudentEconomy(student, index);
    ensureMissionFieldsForStudent(student);
    if (economyBefore !== JSON.stringify({ coins: student.coins, unlocked: student.unlocked, streak:student.streak, longestStreak:student.longestStreak, lastActiveDate:student.lastActiveDate, stickers:student.stickers, packsOpened:student.packsOpened, packsSinceRare:student.packsSinceRare, pinSalt:student.pinSalt, pinHash:student.pinHash, exchangeStars:student.exchangeStars, refuge:student.refuge, lastDailyRewardDate:student.lastDailyRewardDate })) changed = true;
  }
  for (const attempt of store.attempts) {
    if (legacyIds[attempt.readingId]) { attempt.readingId = legacyIds[attempt.readingId]; changed = true; }
    if (attempt.scores && attempt.scores.warmup == null) { attempt.scores.warmup = 100; changed = true; }
    ensureMissionFieldsForAttempt(attempt);
  }
  if (changed) await saveStore(store);
  return store;
}

async function saveStore(store) {
  const temp = `${STORE_PATH}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2), 'utf8');
  await rename(temp, STORE_PATH);
}

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Class-Code',
    'Access-Control-Max-Age': '86400',
    ...extra
  };
}

function empty(res, status = 204) {
  res.writeHead(status, corsHeaders({ 'Cache-Control': 'no-store' }));
  res.end();
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...corsHeaders()
  });
  res.end(payload);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  const payload = String(body);
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...corsHeaders(extraHeaders)
  });
  res.end(payload);
}

async function parseBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('Payload demasiado grande');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function getToken(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

function requireTeacher(req, res) {
  if (!teacherSessions.has(getToken(req))) {
    json(res, 401, { error: 'Sesión docente no válida' });
    return false;
  }
  return true;
}

function publicStudent(student) {
  return { id:student.id, name:student.name, grade:student.grade, avatar:student.avatar, skin:student.skin, xp:Number(student.xp || 0), coins:Number(student.coins || 0), streak:Number(student.streak || 0), skillsUnlocked:Object.keys(student.skillProgress || {}).length, hasPin:Boolean(student.pinHash) };
}

function authenticatedStudent(student) {
  const { pinSalt, pinHash, ...safe } = student;
  return { ...safe, hasPin:Boolean(pinHash) };
}

function validPin(pin) {
  return /^\d{4}$/.test(String(pin || ''));
}

function createPinRecord(pin) {
  const salt = randomBytes(16);
  return { pinSalt:salt.toString('hex'), pinHash:pbkdf2Sync(String(pin), salt, 100_000, 32, 'sha256').toString('hex') };
}

function verifyPin(pin, student) {
  if (!validPin(pin) || !student.pinSalt || !student.pinHash) return false;
  const expected = Buffer.from(student.pinHash, 'hex');
  const actual = pbkdf2Sync(String(pin), Buffer.from(student.pinSalt, 'hex'), 100_000, 32, 'sha256');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function createStudentSession(studentId) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 12 * 3_600_000).toISOString();
  studentSessions.set(token, { studentId, expiresAt });
  return { token, expiresAt };
}

function requireStudent(req, res, studentId) {
  const session = studentSessions.get(getToken(req));
  if (!session || session.studentId !== studentId || session.expiresAt <= new Date().toISOString()) {
    json(res, 401, { error:'Sesión de estudiante no válida. Ingresa nuevamente con tu PIN.' });
    return false;
  }
  return true;
}

function summaryFor(store) {
  return store.students.map((student) => {
    const attempts = store.attempts.filter((attempt) => attempt.studentId === student.id);
    const latest = attempts.at(-1) || null;
    const average = attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.scores.overall, 0) / attempts.length)
      : null;
    const focusCounts = {};
    for (const attempt of attempts) {
      for (const skill of attempt.scores.focus) focusCounts[skill] = (focusCounts[skill] || 0) + 1;
    }
    const focus = Object.entries(focusCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([skill]) => skill);
    const completed = new Set(attempts.map((attempt) => attempt.readingId)).size;
    const totalMissions = readings.filter((reading) => reading.grade === student.grade).length;
    return { ...authenticatedStudent(student), attempts: attempts.length, completed, totalMissions, progress: Math.round((completed / totalMissions) * 100), currentWeek: Math.min(Math.ceil(totalMissions / 5), Math.floor(completed / 5) + 1), average, latest, focus };
  });
}

function classStats(store, students) {
  const allAttempts = store.attempts;
  const active = students.filter((student) => student.attempts > 0).length;
  const average = allAttempts.length
    ? Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.scores.overall, 0) / allAttempts.length)
    : null;
  const possible = Math.max(students.reduce((sum, student) => sum + student.totalMissions, 0), 1);
  const completed = students.reduce((sum, student) => sum + student.completed, 0);
  return { totalStudents: students.length, activeStudents: active, totalAttempts: allAttempts.length, average, completed, possible, completion: Math.round((completed / possible) * 100) };
}

function csvCell(value = '') {
  const textValue = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${textValue.replace(/"/g, '""')}"`;
}

function attemptsCsv(store) {
  const studentsById = new Map(store.students.map((student) => [student.id, student]));
  const rows = [[
    'fecha',
    'estudiante',
    'curso',
    'lectura',
    'calentamiento',
    'precision',
    'palabras_por_minuto',
    'comprension',
    'puntaje_general',
    'xp',
    'focos_apoyo'
  ]];
  for (const attempt of store.attempts) {
    const student = studentsById.get(attempt.studentId) || {};
    rows.push([
      attempt.createdAt,
      student.name || attempt.studentId,
      student.grade || '',
      attempt.readingTitle,
      attempt.scores?.warmup ?? '',
      attempt.scores?.accuracy ?? '',
      attempt.scores?.wpm ?? '',
      attempt.scores?.comprehension ?? '',
      attempt.scores?.overall ?? '',
      attempt.scores?.xp ?? '',
      attempt.scores?.focus || []
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

async function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') return empty(res);
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const store = await loadStore();
    return json(res, 200, { ok: true, app: 'Lectoguarida', version: '1.3.0', grade: 2, students: store.students.length, maxStudents:MAX_STUDENTS, missions: readings.filter((reading) => reading.grade === 2).length, activities: readings.filter((reading) => reading.grade === 2).length * 3, progression: 'mapa de aventura', studentPin: true, teacherSetPin:true, transversalCurriculum:true, skillUnlocks:true, studentTrades:true, refuge: true, dailyReward: true, karaoke: true, audioLanguage: 'es-CL', selfPlayback: true, apk: '/Lectoguarida-debug.apk', teacherDashboard: '/conny.html' });
  }
  if (req.method === 'GET' && url.pathname === '/api/students') {
    const store = await loadStore();
    return json(res, 200, store.students.map(publicStudent));
  }
  const pinSetupMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/pin\/setup$/);
  if (req.method === 'POST' && pinSetupMatch) {
    const body = await parseBody(req);
    if (!validPin(body.pin)) return json(res, 400, { error:'El PIN debe tener exactamente 4 números.' });
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(pinSetupMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (student.pinHash) return json(res, 409, { error:'Este perfil ya tiene PIN. Conny puede restablecerlo desde su panel.' });
    Object.assign(student, createPinRecord(body.pin));
    await saveStore(store);
    return json(res, 201, { student:authenticatedStudent(student), ...createStudentSession(student.id) });
  }
  const studentLoginMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/login$/);
  if (req.method === 'POST' && studentLoginMatch) {
    const body = await parseBody(req);
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(studentLoginMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (!verifyPin(body.pin, student)) return json(res, 401, { error:'PIN incorrecto. Intenta otra vez con calma.' });
    return json(res, 200, { student:authenticatedStudent(student), ...createStudentSession(student.id) });
  }
  if (req.method === 'GET' && url.pathname === '/api/readings') {
    const grade = Number(url.searchParams.get('grade'));
    const studentId = url.searchParams.get('studentId');
    let pool = readings.filter((reading) => reading.grade === grade);
    if (!studentId) return json(res, 200, pool.sort((a, b) => a.order - b.order));
    if (!requireStudent(req, res, studentId)) return;
    const store = await loadStore();
    const studentAttempts = store.attempts.filter((item) => item.studentId === studentId);
    const counts = {};
    for (const attempt of studentAttempts) {
      counts[attempt.readingId] = (counts[attempt.readingId] || 0) + 1;
    }
    pool.sort((a, b) => a.order - b.order);
    const level = studentAttempts.length + 1;
    const expedition = Math.floor(studentAttempts.length / 10) + 1;
    const challenge = challengeModes[studentAttempts.length % challengeModes.length];
    const nextOrder = pool.find((reading) => !counts[reading.id])?.order ?? (pool.length + 1);
    pool = pool.map((reading) => ({ ...reading, level, expedition, challenge, attempts:counts[reading.id] || 0, completed:Boolean(counts[reading.id]), locked:!counts[reading.id] && reading.order > nextOrder, current:reading.order === nextOrder }));
    return json(res, 200, pool);
  }
  const skinMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/skin$/);
  if (req.method === 'POST' && skinMatch) {
    const body = await parseBody(req);
    const skin = validSkin(body.skin);
    if (!skin) return json(res, 400, { error: 'Configuración de skin inválida' });
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(skinMatch[1]));
    if (!student) return json(res, 404, { error: 'Perfil no encontrado' });
    if (!requireStudent(req, res, student.id)) return;
    if (Object.entries(skin).some(([part, value]) => !student.unlocked.includes(inventoryKey(part, value)))) {
      return json(res, 403, { error: 'Primero desbloquea ese objeto en la tienda.' });
    }
    student.skin = skin;
    student.avatar = ARCHETYPE_ICONS[SKIN_CATALOG.archetype.indexOf(skin.archetype)];
    await saveStore(store);
    return json(res, 200, authenticatedStudent(student));
  }
  const purchaseMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/purchase$/);
  if (req.method === 'POST' && purchaseMatch) {
    const body = await parseBody(req);
    const part = String(body.part || '');
    const value = String(body.value || '');
    const price = shopPrice(part, value);
    if (!SKIN_CATALOG[part]?.includes(value) || price <= 0) return json(res, 400, { error: 'Objeto de tienda inválido' });
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(purchaseMatch[1]));
    if (!student) return json(res, 404, { error: 'Perfil no encontrado' });
    if (!requireStudent(req, res, student.id)) return;
    const key = inventoryKey(part, value);
    if (student.unlocked.includes(key)) return json(res, 200, authenticatedStudent(student));
    if (student.coins < price) return json(res, 400, { error: `Necesitas ${price - student.coins} coins más.` });
    student.coins -= price;
    student.unlocked.push(key);
    await saveStore(store);
    return json(res, 200, authenticatedStudent(student));
  }
  const stickerPackMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/sticker-pack$/);
  if (req.method === 'POST' && stickerPackMatch) {
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(stickerPackMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (!requireStudent(req, res, student.id)) return;
    if (student.coins < STICKER_PACK_PRICE) return json(res, 400, { error:`Necesitas ${STICKER_PACK_PRICE - student.coins} coins más para abrir el sobre.` });
    student.coins -= STICKER_PACK_PRICE;
    const pityTriggered = nextPityState(student.packsSinceRare, false, PITY_LIMIT).triggered;
    const results = [];
    let rareFound = false;
    let duplicateRefund = 0;
    for (let index = 0; index < 3; index += 1) {
      const sticker = drawSticker(pityTriggered && index === 2 && !rareFound);
      const previous = Number(student.stickers[sticker.id] || 0);
      student.stickers[sticker.id] = previous + 1;
      const duplicate = previous > 0;
      const refund = duplicate ? (sticker.rarity === 'legendary' ? 15 : sticker.rarity === 'rare' ? 8 : 4) : 0;
      duplicateRefund += refund;
      if (sticker.rarity !== 'common') rareFound = true;
      results.push({ ...sticker, duplicate, refund });
    }
    student.coins += duplicateRefund;
    student.packsOpened += 1;
    student.packsSinceRare = nextPityState(student.packsSinceRare, rareFound, PITY_LIMIT).next;
    await saveStore(store);
    return json(res, 200, {
      student:authenticatedStudent(student),
      results,
      duplicateRefund,
      lootWeights: Object.fromEntries(LOOT_TABLE.map(({ id, weight }) => [id, weight])),
      pityLimit: PITY_LIMIT,
      pityTriggered,
      pityProgress: student.packsSinceRare
    });
  }
  const refugeMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/refuge\/upgrade$/);
  if (req.method === 'POST' && refugeMatch) {
    const body = await parseBody(req);
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(refugeMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (!requireStudent(req, res, student.id)) return;
    const part = String(body.part || '');
    if (!['library','garden','observatory','musicRoom'].includes(part)) return json(res, 400, { error:'Parte de la guarida inválida' });
    const level = Number(student.refuge[part] || 0);
    if (level >= 5) return json(res, 409, { error:'Esta parte de tu refugio ya alcanzó su máximo nivel.' });
    const cost = 40 + level * 30;
    if (student.coins < cost) return json(res, 400, { error:`Necesitas ${cost - student.coins} coins más para construir.` });
    student.coins -= cost;
    student.refuge[part] = level + 1;
    await saveStore(store);
    return json(res, 200, { student:authenticatedStudent(student), part, level:level + 1, cost });
  }
  const dailyMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/daily-reward$/);
  if (req.method === 'POST' && dailyMatch) {
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(dailyMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (!requireStudent(req, res, student.id)) return;
    const today = chileDateKey();
    if (student.lastDailyRewardDate === today) return json(res, 409, { error:'El cofre de hoy ya fue abierto. Mañana aparecerá otro.' });
    const roll = Math.random();
    const reward = roll < .55 ? { id:'small-coins', coins:12, stars:0, label:'Bolsa de coins' } : roll < .85 ? { id:'bright-coins', coins:22, stars:2, label:'Cofre luminoso' } : { id:'star-treasure', coins:35, stars:5, label:'Tesoro estelar' };
    student.coins += reward.coins;
    student.exchangeStars += reward.stars;
    student.lastDailyRewardDate = today;
    await saveStore(store);
    return json(res, 200, { student:authenticatedStudent(student), reward });
  }
  const tradesMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/trades$/);
  if (tradesMatch && (req.method === 'GET' || req.method === 'POST')) {
    const studentId = decodeURIComponent(tradesMatch[1]);
    if (!requireStudent(req, res, studentId)) return;
    const store = await loadStore(); const student = store.students.find((item) => item.id === studentId);
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (req.method === 'GET') return json(res, 200, { fee:TRADE_FEE, mine:tradableInventory(student), offers:store.tradeOffers.filter((offer) => offer.fromStudentId === studentId || offer.toStudentId === studentId).slice(-30).reverse(), students:store.students.filter((item) => item.id !== studentId).map((item) => ({ id:item.id, name:item.name, inventory:tradableInventory(item), owned:item.unlocked || [] })) });
    const body = await parseBody(req); const to = store.students.find((item) => item.id === body.toStudentId); const offeredKey=String(body.offeredKey||''); const requestedKey=String(body.requestedKey||'');
    if (!to || to.id === student.id) return json(res, 400, { error:'Selecciona otro perfil para intercambiar.' });
    if (!tradableInventory(student).includes(offeredKey) || !tradableInventory(to).includes(requestedKey)) return json(res, 409, { error:'Uno de los objetos ya no está disponible para intercambio.' });
    if (student.unlocked.includes(requestedKey) || to.unlocked.includes(offeredKey)) return json(res, 409, { error:'El intercambio debe entregar un objeto nuevo a cada estudiante.' });
    if (store.tradeOffers.filter((offer)=>offer.fromStudentId===student.id&&offer.status==='pending').length>=5) return json(res,409,{error:'Tienes cinco propuestas pendientes. Espera una respuesta.'});
    const offer={id:randomUUID(),fromStudentId:student.id,fromName:student.name,toStudentId:to.id,toName:to.name,offeredKey,requestedKey,fee:TRADE_FEE,status:'pending',createdAt:new Date().toISOString()};store.tradeOffers.push(offer);await saveStore(store);return json(res,201,{offer});
  }
  const tradeResponseMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/trades\/([^/]+)\/respond$/);
  if(req.method==='POST'&&tradeResponseMatch){const studentId=decodeURIComponent(tradeResponseMatch[1]);if(!requireStudent(req,res,studentId))return;const body=await parseBody(req);const decision=String(body.decision||'');if(!['accept','reject'].includes(decision))return json(res,400,{error:'Respuesta de intercambio inválida.'});const store=await loadStore();const offer=store.tradeOffers.find((item)=>item.id===decodeURIComponent(tradeResponseMatch[2]));if(!offer||offer.toStudentId!==studentId||offer.status!=='pending')return json(res,409,{error:'La propuesta ya no está disponible.'});const to=store.students.find((item)=>item.id===studentId);const from=store.students.find((item)=>item.id===offer.fromStudentId);if(decision==='reject'){offer.status='rejected';offer.respondedAt=new Date().toISOString();await saveStore(store);return json(res,200,{trade:offer,student:authenticatedStudent(to)});}if(!from||!to||!tradableInventory(from).includes(offer.offeredKey)||!tradableInventory(to).includes(offer.requestedKey))return json(res,409,{error:'Los objetos cambiaron y la propuesta ya no puede aceptarse.'});if(from.unlocked.includes(offer.requestedKey)||to.unlocked.includes(offer.offeredKey))return json(res,409,{error:'Uno de los objetos ya fue conseguido.'});if(from.coins<TRADE_FEE||to.coins<TRADE_FEE)return json(res,400,{error:`Cada perfil necesita ${TRADE_FEE} coins para completar el intercambio.`});from.coins-=TRADE_FEE;to.coins-=TRADE_FEE;from.unlocked=from.unlocked.filter((key)=>key!==offer.offeredKey);to.unlocked=to.unlocked.filter((key)=>key!==offer.requestedKey);from.unlocked.push(offer.requestedKey);to.unlocked.push(offer.offeredKey);offer.status='accepted';offer.respondedAt=new Date().toISOString();await saveStore(store);return json(res,200,{trade:offer,student:authenticatedStudent(to)});}
  if (req.method === 'POST' && url.pathname === '/api/attempts') {
    const body = await parseBody(req);
    const store = await loadStore();
    const student = store.students.find((item) => item.id === body.studentId);
    const reading = readings.find((item) => item.id === body.readingId);
    if (!student || !reading || reading.grade !== student.grade || !String(body.transcript || '').trim()) {
      return json(res, 400, { error: 'Perfil, lectura o transcripción inválida' });
    }
    if (!requireStudent(req, res, student.id)) return;
    const scores = scoreAttempt({ ...body, reading });
    const attempt = {
      id: randomUUID(),
      studentId: student.id,
      readingId: reading.id,
      readingTitle: reading.title,
      transcript: String(body.transcript).slice(0, 1000),
      elapsedSeconds: Math.max(10, Math.min(600, Number(body.elapsedSeconds) || 60)),
      warmupAnswer: body.warmupAnswer,
      comprehensionAnswer: body.comprehensionAnswer,
      scores,
      createdAt: new Date().toISOString()
    };
    store.attempts.push(attempt);
    student.xp = Number(student.xp || 0) + scores.xp;
    const streakResult = updateDailyStreak(student);
    scores.streakBonus = streakResult.bonus;
    student.coins = Number(student.coins || 0) + scores.coins + streakResult.bonus;
    const skillAward = awardCurriculumSkill(student, reading, scores);
    await saveStore(store);
    return json(res, 201, { attempt, student:authenticatedStudent(student), skillAward });
  }
  if (req.method === 'POST' && url.pathname === '/api/minigames/start') {
    const body = await parseBody(req);
    if (!(await requireStudent(req, res, body.studentId))) return;
    const store = await loadStore();
    const student = store.students.find((item) => item.id === body.studentId);
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    const payload = {
      minigameId: String(body.minigameId || 'construct-demo'),
      studentId: student.id,
      levelId: String(body.levelId || 'unknown'),
      skill: String(body.skill || 'Fluidez'),
      difficulty: Math.max(1, Math.min(5, Number(body.difficulty) || 1)),
      issuedAt: Date.now(),
      exp: Date.now() + 15 * 60_000
    };
    return json(res, 200, {
      title: 'Prueba Construct 3',
      description: 'Módulo HTML5 aislado para probar integración modular.',
      playUrl: '/minigames/construct-demo/index.html',
      token: signMiniPayload(payload),
      payload
    });
  }
  if (req.method === 'POST' && url.pathname === '/api/minigames/submit') {
    const body = await parseBody(req);
    const payload = verifyMiniToken(body.token);
    if (!payload) return json(res, 401, { error:'Token de minijuego inválido o vencido.' });
    if (String(body.studentId || '') !== payload.studentId) return json(res, 403, { error:'Perfil no autorizado.' });
    const store = await loadStore();
    const student = store.students.find((item) => item.id === payload.studentId);
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    if (!(await requireStudent(req, res, student.id))) return;
    const score = Math.max(0, Math.min(100, Number(body.score) || 0));
    const hits = Math.max(0, Math.min(100, Number(body.aciertos) || 0));
    const errors = Math.max(0, Math.min(100, Number(body.errores) || 0));
    const timeMs = Math.max(0, Math.min(10 * 60_000, Number(body.timeMs) || 0));
    const completed = Boolean(body.completed) && score >= 60 && hits >= errors;
    const attempt = {
      id: randomUUID(),
      type: 'minigame',
      studentId: student.id,
      readingId: payload.levelId,
      readingTitle: `Minijuego: ${payload.minigameId}`,
      transcript: '',
      elapsedSeconds: Math.max(1, Math.round(timeMs / 1000)),
      warmupAnswer: payload.skill,
      comprehensionAnswer: completed ? 'completed' : 'incomplete',
      scores: {
        accuracy: score,
        wpm: Math.max(0, Math.round((hits + 1) * 2)),
        warmup: score,
        comprehension: completed ? 100 : 0,
        overall: score,
        correctWords: hits,
        totalWords: hits + errors,
        focus: [payload.skill],
        xp: completed ? 15 : 5,
        coins: completed ? 8 : 2,
        message: completed ? 'Minijuego completado' : 'Minijuego registrado'
      },
      createdAt: new Date().toISOString()
    };
    store.attempts.push(attempt);
    student.xp = Number(student.xp || 0) + attempt.scores.xp;
    student.coins = Number(student.coins || 0) + attempt.scores.coins;
    await saveStore(store);
    return json(res, 201, { ok:true, attempt, student:authenticatedStudent(student), validated:true });
  }
  if (req.method === 'POST' && url.pathname === '/api/teacher/login') {
    const body = await parseBody(req);
    const store = await loadStore();
    if (String(body.pin || '') !== store.teacher.pin) return json(res, 401, { error: 'PIN incorrecto' });
    const token = randomUUID();
    teacherSessions.add(token);
    return json(res, 200, { token, teacher: { id: store.teacher.id, name: store.teacher.name } });
  }
  if (req.method === 'GET' && url.pathname === '/api/teacher/summary') {
    if (!requireTeacher(req, res)) return;
    const store = await loadStore();
    const students = summaryFor(store);
    return json(res, 200, { teacher: { id: store.teacher.id, name: store.teacher.name }, classStats: classStats(store, students), students });
  }
  if (req.method === 'GET' && url.pathname === '/api/teacher/export.csv') {
    if (!requireTeacher(req, res)) return;
    const store = await loadStore();
    return text(res, 200, attemptsCsv(store), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="lectoguarida-resultados.csv"' });
  }
  const setPinMatch = url.pathname.match(/^\/api\/teacher\/students\/([^/]+)\/set-pin$/);
  if (req.method === 'POST' && setPinMatch) {
    if (!requireTeacher(req, res)) return;
    const body = await parseBody(req);
    if (!validPin(body.pin)) return json(res, 400, { error:'El PIN debe tener exactamente 4 números.' });
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(setPinMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    Object.assign(student, createPinRecord(body.pin));
    for (const [token, session] of studentSessions) if (session.studentId === student.id) studentSessions.delete(token);
    await saveStore(store);
    return json(res, 200, { student:publicStudent(student) });
  }
  const resetPinMatch = url.pathname.match(/^\/api\/teacher\/students\/([^/]+)\/reset-pin$/);
  if (req.method === 'POST' && resetPinMatch) {
    if (!requireTeacher(req, res)) return;
    const store = await loadStore();
    const student = store.students.find((item) => item.id === decodeURIComponent(resetPinMatch[1]));
    if (!student) return json(res, 404, { error:'Perfil no encontrado' });
    student.pinSalt = '';
    student.pinHash = '';
    for (const [token, session] of studentSessions) if (session.studentId === student.id) studentSessions.delete(token);
    await saveStore(store);
    return json(res, 200, { student:publicStudent(student) });
  }
  if (req.method === 'POST' && url.pathname === '/api/teacher/students') {
    if (!requireTeacher(req, res)) return;
    const body = await parseBody(req);
    const name = String(body.name || '').trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 60) return json(res, 400, { error:'Escribe un nombre y apellido válidos.' });
    const store = await loadStore();
    if (store.students.length >= MAX_STUDENTS) return json(res, 409, { error:`El curso alcanzó el máximo de ${MAX_STUDENTS} estudiantes.` });
    if (store.students.some((student) => normalizeAnswer(student.name) === normalizeAnswer(name))) return json(res, 409, { error:'Ya existe un perfil con ese nombre.' });
    const student = rosterStudent([`student-custom-${randomUUID()}`, name, 2], store.students.length);
    ensureStudentEconomy(student, store.students.length);
    store.students.push(student);
    await saveStore(store);
    return json(res, 201, { student:publicStudent(student), totalStudents:store.students.length, maxStudents:MAX_STUDENTS });
  }
  if (req.method === 'POST' && url.pathname === '/api/teacher/students/bulk') {
    if (!requireTeacher(req, res)) return;
    return json(res, 409, { error:'Para proteger la nómina, agrega estudiantes individualmente desde el panel.' });
  }
  return json(res, 404, { error: 'Ruta no encontrada' });
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

async function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(requested.replace(/^[/\\]+/, ''));
  const filePath = join(PUBLIC, safePath);
  if (filePath !== PUBLIC && !filePath.startsWith(`${PUBLIC}${sep}`)) return json(res, 403, { error: 'Acceso denegado' });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('No es archivo');
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    createReadStream(filePath).pipe(res);
  } catch {
    const indexPath = join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': mime['.html'], 'Cache-Control': 'no-cache' });
    createReadStream(indexPath).pipe(res);
  }
}

async function serveApk(req, res) {
  try {
    const info = await stat(APK_PATH);
    if (!info.isFile()) throw new Error('APK no disponible');
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': info.size,
      'Content-Disposition': 'attachment; filename="Lectoguarida-debug.apk"',
      'Cache-Control': 'no-cache',
      ...corsHeaders()
    });
    createReadStream(APK_PATH).pipe(res);
  } catch {
    json(res, 404, { error: 'APK no disponible. Compila o copia Lectoguarida-debug.apk en la raíz del servidor.' });
  }
}

await ensureStore();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname === '/Lectoguarida-debug.apk' || url.pathname === '/descargar-apk') await serveApk(req, res);
    else if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error: 'Error interno del prototipo' });
    else res.end();
  }
});

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  server.listen(PORT, HOST, () => {
    console.log(`Lectoguarida disponible en http://${HOST}:${PORT}`);
  });
}

export { normalizeWords, lcsMatches, scoreAttempt, readings, SKIN_CATALOG, STICKER_CATALOG, awardCurriculumSkill, getDefaultMastery, ensureMissionFieldsForStudent, ensureMissionFieldsForAttempt };
