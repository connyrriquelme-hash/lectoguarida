(() => {
  const content = window.LECTOGUARIDA_CONTENT;
  const isAndroidAssetHost = location.hostname === 'appassets.androidplatform.net';
  const isFilePreview = location.protocol === 'file:';
  if (!content || (!isAndroidAssetHost && !isFilePreview)) return;
  const remoteApiBase = String(window.LECTOGUARIDA_REMOTE_API || '').trim().replace(/\/$/, '');

  const STORE_KEY = 'lectoguarida-local-store-v1';
  const PENDING_SYNC_KEY = 'lectoguarida-pending-sync-v1';
  const MAX_STUDENTS = 40;
  const ROSTER_VERSION = 5;
  const PIN = '6284';
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
  const LOOT_TABLE = [
    { id:'common', weight:90 },
    { id:'rare', weight:9 },
    { id:'legendary', weight:1 }
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
  const STICKER_CATALOG=STICKER_SETS.flatMap(([set,items])=>items.map(([id,name,icon,rarity])=>({id,name,icon,rarity,set})));
  const inventoryKey = (part, value) => `${part}:${value}`;
  const shopPrice = (part, value) => {
    const index = SKIN_CATALOG[part]?.indexOf(value) ?? -1;
    return index <= 0 ? 0 : SHOP_PRICES[part] + (index - 1) * 5;
  };
  const ARCHETYPE_ICONS = ['🫧','☁️','🐱','🦕','🐼','🦊','🤖','🦄','🐙','🦉','🐸','🐲','🐰','🦦','🐦','🐢','🦙','🦌','🐋','🐨','🐭','🐼','🐝','🦥','🦇','🐧','🦌','🐇','🦭','🦙'];
  const DEMO_ROSTER = [
    ['student-julian-olmedo', 'Julián Olmedo', 2], ['student-leon-osorio', 'León Osorio', 2],
    ['student-gaspar-morales', 'Gaspar Morales', 2], ['student-simon-ponce', 'Simón Ponce', 2],
    ['student-steven-robles', 'Steven Robles', 2], ['student-santiago-rojas', 'Santiago Rojas', 2],
    ['student-emilio-ruiz', 'Emilio Ruiz', 2], ['student-vicente-tapia', 'Vicente Tapia', 2],
    ['student-renato-torres', 'Renato Torres', 2], ['student-lorenzo-valdes', 'Lorenzo Valdés', 2],
    ['student-aruma-valencia', 'Aruma Valencia', 2], ['student-amaro-vera', 'Amaro Vera', 2],
    ['student-allison-villalobos', 'Allison Villalobos', 2], ['student-mateo-zurita', 'Mateo Zurita', 2],
    ['student-joaquin-alvarez', 'Joaquín Álvarez', 2], ['student-joaquin-astorga', 'Joaquín Astorga', 2],
    ['student-emiliano-avila', 'Emiliano Ávila', 2], ['student-lucas-bustamante', 'Lucas Bustamante', 2],
    ['student-maximo-carreno', 'Máximo Carreño', 2], ['student-renatta-cartes', 'Renatta Cartes', 2],
    ['student-sebastian-castillo', 'Sebastián Castillo', 2], ['student-emilia-catalan', 'Emilia Catalán', 2],
    ['student-matias-del-pino', 'Matías Del Pino', 2], ['student-sebastian-devera', 'Sebastián Devera', 2],
    ['student-bastian-figueroa', 'Bastián Figueroa', 2], ['student-leon-fredes', 'León Fredes', 2],
    ['student-ignacio-fuentes', 'Ignacio Fuentes', 2], ['student-amanda-fuentes', 'Amanda Fuentes', 2],
    ['student-monserrat-fuenzalida', 'Monserrat Fuenzalida', 2], ['student-maria-garcia', 'María García', 2],
    ['student-beatriz-gonzalez', 'Beatriz González', 2], ['student-dante-lopez', 'Dante López', 2],
    ['student-bastian-martinez', 'Bastián Martínez', 2], ['student-dominga-morales', 'Dominga Morales', 2],
    ['student-vicente-nilo', 'Vicente Nilo', 2], ['student-renato-nunez', 'Renato Núñez', 2],
    ['student-luna-nunez', 'Luna Núñez', 2]
  ];
  const challengeModes = [
    { name: 'Exploración', focus: 'Lectura completa con apoyo amable' },
    { name: 'Eco preciso', focus: 'Atención a fonemas y palabras' },
    { name: 'Ritmo', focus: 'Continuidad sin apurarse' },
    { name: 'Voces de personaje', focus: 'Prosodia y expresión' },
    { name: 'Detective de pistas', focus: 'Comprensión literal e inferencial' },
    { name: 'Guardián de la fluidez', focus: 'Integración de precisión, ritmo y sentido' }
  ];

  const now = () => new Date().toISOString();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const response = (body) => clone(body);
  const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const bytesToHex = (bytes) => [...bytes].map((value)=>value.toString(16).padStart(2,'0')).join('');
  const hexToBytes = (value) => new Uint8Array((String(value||'').match(/.{1,2}/g)||[]).map((pair)=>Number.parseInt(pair,16)));
  const derivePinHash = async (pin,salt) => { const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(pin)),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:hexToBytes(salt),iterations:100000},key,256); return bytesToHex(new Uint8Array(bits)); };
  const normalizedName = (name = '') => String(name).trim().toLocaleLowerCase('es-CL');
  const skinForIndex = (index = 0) => ({
    archetype: SKIN_CATALOG.archetype[index % SKIN_CATALOG.archetype.length],
    palette: SKIN_CATALOG.palette[index % SKIN_CATALOG.palette.length],
    outfit: SKIN_CATALOG.outfit[index % SKIN_CATALOG.outfit.length],
    accessory: SKIN_CATALOG.accessory[index % SKIN_CATALOG.accessory.length],
    companion: SKIN_CATALOG.companion[index % SKIN_CATALOG.companion.length]
  });
  const validSkin = (input = {}) => {
    const skin = {};
    for (const [part, allowed] of Object.entries(SKIN_CATALOG)) {
      if (!allowed.includes(input[part])) return null;
      skin[part] = input[part];
    }
    return skin;
  };
  const rosterStudent = ([id, name, grade], index) => ({ id, name, grade, avatar: ARCHETYPE_ICONS[index % ARCHETYPE_ICONS.length], skin: skinForIndex(index), xp: 0, coins: 20, unlocked: [], streak:0, longestStreak:0, lastActiveDate:'', stickers:{}, packsOpened:0, packsSinceRare:0, createdAt: now() });

  const ensureStudentEconomy = (student, index) => {
    if (!Number.isFinite(Number(student.coins))) student.coins = 20;
    const unlocked = new Set(Array.isArray(student.unlocked) ? student.unlocked : []);
    for (const [part, values] of Object.entries(SKIN_CATALOG)) {
      unlocked.add(inventoryKey(part, values[0]));
      unlocked.add(inventoryKey(part, student.skin?.[part] || skinForIndex(index)[part]));
    }
    student.unlocked = [...unlocked];
    student.streak = Math.max(0, Number(student.streak) || 0);
    student.longestStreak = Math.max(student.streak, Number(student.longestStreak) || 0);
    student.lastActiveDate = String(student.lastActiveDate || '');
    student.stickers = student.stickers && typeof student.stickers === 'object' ? student.stickers : {};
    student.packsOpened = Math.max(0, Number(student.packsOpened) || 0);
    student.packsSinceRare = Math.max(0, Number(student.packsSinceRare) || 0);
    student.pinSalt = String(student.pinSalt || ''); student.pinHash = String(student.pinHash || '');
    student.exchangeStars = Math.max(0,Number(student.exchangeStars)||0);
    student.refuge = student.refuge && typeof student.refuge==='object' ? student.refuge : {library:0,garden:0,observatory:0,musicRoom:0};
    for(const part of ['library','garden','observatory','musicRoom']) student.refuge[part]=Math.max(0,Math.min(5,Number(student.refuge[part])||0));
    student.lastDailyRewardDate=String(student.lastDailyRewardDate||'');
    student.skillProgress=student.skillProgress&&typeof student.skillProgress==='object'?student.skillProgress:{};
  };
  const chileDateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const updateStreak = (student) => { const today=chileDateKey(); if(student.lastActiveDate===today)return 0; const yesterday=chileDateKey(new Date(Date.now()-86400000)); student.streak=student.lastActiveDate===yesterday?student.streak+1:1; student.longestStreak=Math.max(student.longestStreak,student.streak); student.lastActiveDate=today; return Math.min(10,2+student.streak); };
  const tradableInventory=(student)=>(student.unlocked||[]).filter((key)=>{const[part,value]=String(key).split(':');return SKIN_CATALOG[part]?.includes(value)&&value!==SKIN_CATALOG[part][0]&&student.skin?.[part]!==value;});
  const awardCurriculumSkill=(student,reading,scores)=>{const previous=student.skillProgress[reading.id];const earned=1+(scores.warmup>=100?1:0)+(scores.comprehension>=100?1:0);const points=Math.min(12,Number(previous?.points||0)+earned);const level=points>=8?3:points>=4?2:1;const skill={id:reading.id,label:reading.skill,oa:reading.curriculum?.supportOA||'',domain:reading.stage||'Fluidez',points,level,activities:3,lastScore:scores.overall,updatedAt:now()};student.skillProgress[reading.id]=skill;return{...skill,newlyUnlocked:!previous,leveledUp:Boolean(previous&&level>Number(previous.level||1))};};
  const safeStudent = (student) => {
    const { pinSalt, pinHash, ...safe } = student;
    return { ...safe, hasPin:Boolean(pinHash) };
  };

  function seedStore() {
    return { version: ROSTER_VERSION, teacher: { id: 'teacher-conny', name: 'Conny', pin: PIN }, students: DEMO_ROSTER.map(rosterStudent), attempts: [], tradeOffers:[] };
  }

  function loadStore() {
    const stored = localStorage.getItem(STORE_KEY);
    const store = stored ? JSON.parse(stored) : seedStore();
    const current = Array.isArray(store.students) ? store.students : [];
    const previous = new Map(current.map((student) => [student.id, student]));
    const fixedIds = new Set(DEMO_ROSTER.map(([id]) => id));
    const fixed = DEMO_ROSTER.map((entry, index) => {
      const base = rosterStudent(entry, index);
      const saved = previous.get(base.id);
      return saved ? { ...base, ...saved, id: base.id, name: base.name, grade: 2 } : base;
    });
    const extras = current.filter((student)=>!fixedIds.has(student.id)&&student?.id&&student?.name).slice(0,MAX_STUDENTS-fixed.length).map((student)=>({...student,grade:2}));
    store.students = [...fixed,...extras];
    const allowedIds = new Set(store.students.map((student) => student.id));
    store.attempts = (Array.isArray(store.attempts) ? store.attempts : []).filter((attempt) => allowedIds.has(attempt.studentId));
    store.version = ROSTER_VERSION;
    store.teacher = { id: 'teacher-conny', name: 'Conny', pin: PIN };
    store.tradeOffers=Array.isArray(store.tradeOffers)?store.tradeOffers.slice(-150):[];
    for (const [index, student] of store.students.entries()) {
      if (!validSkin(student.skin)) student.skin = skinForIndex(index);
      if (!student.avatar) student.avatar = ARCHETYPE_ICONS[index % ARCHETYPE_ICONS.length];
      ensureStudentEconomy(student, index);
    }
    saveStore(store);
    return store;
  }

  function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  function normalizeWords(text = '') {
    return text
      .toLocaleLowerCase('es-CL')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zñü\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function lcsMatches(target, spoken) {
    const dp = Array.from({ length: target.length + 1 }, () => Array(spoken.length + 1).fill(0));
    for (let i = 1; i <= target.length; i += 1) {
      for (let j = 1; j <= spoken.length; j += 1) {
        dp[i][j] = target[i - 1] === spoken[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    const matchedTarget = new Set();
    let i = target.length;
    let j = spoken.length;
    while (i > 0 && j > 0) {
      if (target[i - 1] === spoken[j - 1]) { matchedTarget.add(i - 1); i -= 1; j -= 1; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i -= 1;
      else j -= 1;
    }
    return { count: dp[target.length][spoken.length], matchedTarget };
  }

  function scoreAttempt({ reading, transcript, elapsedSeconds, warmupAnswer, comprehensionAnswer }) {
    const target = normalizeWords(reading.text);
    const spoken = normalizeWords(transcript);
    const match = lcsMatches(target, spoken);
    const correctWords = match.count;
    const accuracy = Math.round((correctWords / Math.max(target.length, 1)) * 100);
    const safeSeconds = Math.max(Number(elapsedSeconds) || 1, 10);
    const wpm = Math.round(correctWords / (safeSeconds / 60));
    const targetWpm = reading.grade === 1 ? 30 : 50;
    const paceScore = Math.min(100, Math.round((wpm / targetWpm) * 100));
    const answer = (value) => String(value || '').trim().toLocaleLowerCase('es-CL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñü0-9]/g, '');
    const warmup = answer(warmupAnswer) === answer(reading.warmup.correct) ? 100 : 0;
    const comprehension = answer(comprehensionAnswer) === answer(reading.comprehension.correct) ? 100 : 0;
    const overall = Math.round(accuracy * 0.45 + paceScore * 0.15 + warmup * 0.15 + comprehension * 0.25);
    const missed = target.filter((_, index) => !match.matchedTarget.has(index));
    const focus = [];
    if (missed.some((word) => word.includes('r'))) focus.push('Sonido R');
    if (missed.some((word) => word.includes('l'))) focus.push('Sonido L');
    if (missed.length >= 3) focus.push('Precisión de palabras');
    if (wpm < targetWpm * 0.65) focus.push('Continuidad lectora');
    if (!warmup) focus.push(reading.warmup.skill);
    if (!comprehension) focus.push('Comprensión del relato');
    if (!focus.length) focus.push('Lectura estable');
    const xp = 20 + Math.round(overall / 4);
    const coins = 5 + Math.round(overall / 10);
    const message = overall >= 85 ? '¡Lectoguarida recuperó toda su luz!' : overall >= 65 ? '¡Gran avance! Tu guardián encontró una nueva pista.' : 'Cada intento enciende una luz. La próxima misión traerá más ayuda.';
    return { accuracy, wpm, warmup, comprehension, overall, correctWords, totalWords: target.length, focus, xp, coins, message };
  }

  function summaryFor(store) {
    return store.students.map((student) => {
      const attempts = store.attempts.filter((attempt) => attempt.studentId === student.id);
      const latest = attempts.at(-1) || null;
      const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.scores.overall, 0) / attempts.length) : null;
      const focusCounts = {};
      for (const attempt of attempts) for (const skill of attempt.scores.focus) focusCounts[skill] = (focusCounts[skill] || 0) + 1;
      const focus = Object.entries(focusCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([skill]) => skill);
      const completed = new Set(attempts.map((attempt) => attempt.readingId)).size;
      const totalMissions = content.readings.filter((reading) => reading.grade === student.grade).length;
      return { ...safeStudent(student), attempts: attempts.length, completed, totalMissions, progress: Math.round((completed / totalMissions) * 100), currentWeek: Math.min(Math.ceil(totalMissions / 5), Math.floor(completed / 5) + 1), average, latest, focus };
    });
  }

  function classStats(store, students) {
    const allAttempts = store.attempts;
    const activeStudents = students.filter((student) => student.attempts > 0).length;
    const average = allAttempts.length ? Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.scores.overall, 0) / allAttempts.length) : null;
    const possible = Math.max(students.reduce((sum, student) => sum + student.totalMissions, 0), 1);
    const completed = students.reduce((sum, student) => sum + student.completed, 0);
    return { totalStudents: students.length, activeStudents, totalAttempts: allAttempts.length, average, completed, possible, completion: Math.round((completed / possible) * 100) };
  }

  async function remoteApi(path, options = {}) {
    if (!remoteApiBase || !path.startsWith('/api/')) throw new Error('Servidor online no configurado');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const classCode = sessionStorage.getItem('classCode');
    if (classCode) headers['X-Class-Code'] = classCode;
    const teacherToken = sessionStorage.getItem('teacherToken');
    if (path.startsWith('/api/teacher/') && teacherToken) headers.Authorization = `Bearer ${teacherToken}`;
    const response = await fetch(`${remoteApiBase}${path}`, { ...options, headers, mode: 'cors' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No fue posible conectar con el servidor online');
    return data;
  }

  function queueSync(path, options = {}) {
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    queue.push({ path, options: { method: options.method || 'GET', body: options.body || '' }, queuedAt: now() });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue.slice(-50)));
  }

  async function flushPendingSync() {
    if (!remoteApiBase) return;
    const queue = JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try { await remoteApi(item.path, item.options); }
      catch { remaining.push(item); }
    }
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining.slice(-50)));
  }

  async function localApi(path, options = {}) {
    let remoteFailed = false;
    if (remoteApiBase) {
      await flushPendingSync();
      try {
        return await remoteApi(path, options);
      } catch (error) {
        remoteFailed = true;
        console.warn('Lectoguarida usará modo local porque el servidor online no respondió:', error.message);
      }
    }
    const url = new URL(path, location.origin);
    const method = String(options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    const store = loadStore();

    if (method === 'GET' && url.pathname === '/api/students') {
      return response(store.students.map((student)=>({id:student.id,name:student.name,grade:student.grade,avatar:student.avatar,skin:student.skin,xp:Number(student.xp||0),coins:Number(student.coins||0),streak:Number(student.streak||0),skillsUnlocked:Object.keys(student.skillProgress||{}).length,hasPin:Boolean(student.pinHash)})));
    }
    const pinSetupMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/pin\/setup$/);
    if(method==='POST'&&pinSetupMatch){ const student=store.students.find((item)=>item.id===decodeURIComponent(pinSetupMatch[1])); if(!student)throw new Error('Perfil no encontrado'); if(!/^\d{4}$/.test(String(body.pin||'')))throw new Error('El PIN debe tener exactamente 4 números.'); if(student.pinHash)throw new Error('Este perfil ya tiene PIN.'); const salt=crypto.getRandomValues(new Uint8Array(16)); student.pinSalt=bytesToHex(salt); student.pinHash=await derivePinHash(body.pin,student.pinSalt); saveStore(store); return response({student:safeStudent(student),token:`local-${student.id}-${randomId()}`,expiresAt:new Date(Date.now()+43200000).toISOString()}); }
    const studentLoginMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/login$/);
    if(method==='POST'&&studentLoginMatch){ const student=store.students.find((item)=>item.id===decodeURIComponent(studentLoginMatch[1])); if(!student)throw new Error('Perfil no encontrado'); if(!student.pinSalt||!student.pinHash)throw new Error('Este perfil todavía no tiene PIN.'); const hash=await derivePinHash(body.pin,student.pinSalt); if(hash!==student.pinHash)throw new Error('PIN incorrecto. Intenta otra vez con calma.'); return response({student:safeStudent(student),token:`local-${student.id}-${randomId()}`,expiresAt:new Date(Date.now()+43200000).toISOString()}); }
    if (method === 'GET' && url.pathname === '/api/readings') {
      const grade = Number(url.searchParams.get('grade'));
      const studentId = url.searchParams.get('studentId');
      let pool = content.readings.filter((reading) => reading.grade === grade);
      if (!studentId) return response(pool.sort((a, b) => a.order - b.order));
      const attempts = store.attempts.filter((attempt) => attempt.studentId === studentId);
      const counts = {};
      for (const attempt of attempts) counts[attempt.readingId] = (counts[attempt.readingId] || 0) + 1;
      pool = pool.sort((a, b) => a.order - b.order);
      const level = attempts.length + 1;
      const expedition = Math.floor(attempts.length / 10) + 1;
      const challenge = challengeModes[attempts.length % challengeModes.length];
      const nextOrder = pool.find((reading) => !counts[reading.id])?.order ?? (pool.length + 1);
      return response(pool.map((reading) => ({ ...reading, level, expedition, challenge, attempts:counts[reading.id] || 0, completed:Boolean(counts[reading.id]), locked:!counts[reading.id] && reading.order>nextOrder, current:reading.order===nextOrder })));
    }
    const skinMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/skin$/);
    if (method === 'POST' && skinMatch) {
      const skin = validSkin(body.skin);
      if (!skin) throw new Error('Configuración de skin inválida');
      const student = store.students.find((item) => item.id === decodeURIComponent(skinMatch[1]));
      if (!student) throw new Error('Perfil no encontrado');
      if (Object.entries(skin).some(([part, value]) => !student.unlocked.includes(inventoryKey(part, value)))) throw new Error('Primero desbloquea ese objeto en la tienda.');
      student.skin = skin;
      student.avatar = ARCHETYPE_ICONS[SKIN_CATALOG.archetype.indexOf(skin.archetype)];
      saveStore(store);
      return response(safeStudent(student));
    }
    const stickerPackMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/sticker-pack$/);
    if (method === 'POST' && stickerPackMatch) {
      const student = store.students.find((item) => item.id === decodeURIComponent(stickerPackMatch[1]));
      if (!student || student.coins < STICKER_PACK_PRICE) throw new Error(`Necesitas ${Math.max(0, STICKER_PACK_PRICE - (student?.coins || 0))} coins más para abrir el sobre.`);
      student.coins -= STICKER_PACK_PRICE;
      const results=[]; let rareFound=false; let duplicateRefund=0;
      const pityTriggered=student.packsSinceRare>=PITY_LIMIT-1;
      const pickWeighted=(table)=>{ const total=table.reduce((sum,item)=>sum+item.weight,0); let roll=Math.random()*total; for(const item of table){ roll-=item.weight; if(roll<0)return item; } return table.at(-1); };
      for(let index=0;index<3;index+=1){ const force=pityTriggered&&index===2&&!rareFound; const table=force?LOOT_TABLE.filter((item)=>item.id!=='common'):LOOT_TABLE; const rarity=pickWeighted(table).id; const pool=STICKER_CATALOG.filter((item)=>item.rarity===rarity); const sticker=pool[Math.floor(Math.random()*pool.length)]; const previous=Number(student.stickers[sticker.id]||0); student.stickers[sticker.id]=previous+1; const duplicate=previous>0; const refund=duplicate?(rarity==='legendary'?15:rarity==='rare'?8:4):0; duplicateRefund+=refund; if(rarity!=='common')rareFound=true; results.push({...sticker,duplicate,refund}); }
      student.coins+=duplicateRefund; student.packsOpened+=1; student.packsSinceRare=rareFound?0:student.packsSinceRare+1; saveStore(store);
      return response({student:safeStudent(student),results,duplicateRefund,lootWeights:Object.fromEntries(LOOT_TABLE.map(({id,weight})=>[id,weight])),pityLimit:PITY_LIMIT,pityTriggered,pityProgress:student.packsSinceRare});
    }
    const purchaseMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/purchase$/);
    if (method === 'POST' && purchaseMatch) {
      const part = String(body.part || '');
      const value = String(body.value || '');
      const price = shopPrice(part, value);
      const student = store.students.find((item) => item.id === decodeURIComponent(purchaseMatch[1]));
      if (!student || !SKIN_CATALOG[part]?.includes(value) || price <= 0) throw new Error('Objeto de tienda inválido');
      const key = inventoryKey(part, value);
      if (!student.unlocked.includes(key)) {
        if (student.coins < price) throw new Error(`Necesitas ${price - student.coins} coins más.`);
        student.coins -= price;
        student.unlocked.push(key);
        saveStore(store);
      }
      return response(safeStudent(student));
    }
    const refugeMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/refuge\/upgrade$/);
    if(method==='POST'&&refugeMatch){const student=store.students.find((item)=>item.id===decodeURIComponent(refugeMatch[1]));const part=String(body.part||'');if(!student||!['library','garden','observatory','musicRoom'].includes(part))throw new Error('Parte de la guarida inválida');const level=Number(student.refuge[part]||0);if(level>=5)throw new Error('Esta parte ya está completa.');const cost=40+level*30;if(student.coins<cost)throw new Error(`Necesitas ${cost-student.coins} coins más para construir.`);student.coins-=cost;student.refuge[part]=level+1;saveStore(store);return response({student:safeStudent(student),part,level:level+1,cost});}
    const dailyMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/daily-reward$/);
    if(method==='POST'&&dailyMatch){const student=store.students.find((item)=>item.id===decodeURIComponent(dailyMatch[1]));if(!student)throw new Error('Perfil no encontrado');const today=chileDateKey();if(student.lastDailyRewardDate===today)throw new Error('El cofre de hoy ya fue abierto. Mañana aparecerá otro.');const roll=Math.random();const reward=roll<.55?{id:'small-coins',coins:12,stars:0,label:'Bolsa de coins'}:roll<.85?{id:'bright-coins',coins:22,stars:2,label:'Cofre luminoso'}:{id:'star-treasure',coins:35,stars:5,label:'Tesoro estelar'};student.coins+=reward.coins;student.exchangeStars+=reward.stars;student.lastDailyRewardDate=today;saveStore(store);return response({student:safeStudent(student),reward});}
    const tradesMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/trades$/);
    if(tradesMatch&&(method==='GET'||method==='POST')){const studentId=decodeURIComponent(tradesMatch[1]);const student=store.students.find((item)=>item.id===studentId);if(!student)throw new Error('Perfil no encontrado');if(method==='GET')return response({fee:TRADE_FEE,mine:tradableInventory(student),offers:store.tradeOffers.filter((offer)=>offer.fromStudentId===studentId||offer.toStudentId===studentId).slice(-30).reverse(),students:store.students.filter((item)=>item.id!==studentId).map((item)=>({id:item.id,name:item.name,inventory:tradableInventory(item),owned:item.unlocked||[]}))});const to=store.students.find((item)=>item.id===body.toStudentId);const offeredKey=String(body.offeredKey||''),requestedKey=String(body.requestedKey||'');if(!to||to.id===student.id)throw new Error('Selecciona otro perfil para intercambiar.');if(!tradableInventory(student).includes(offeredKey)||!tradableInventory(to).includes(requestedKey))throw new Error('Uno de los objetos ya no está disponible para intercambio.');if(student.unlocked.includes(requestedKey)||to.unlocked.includes(offeredKey))throw new Error('El intercambio debe entregar un objeto nuevo a cada estudiante.');if(store.tradeOffers.filter((offer)=>offer.fromStudentId===student.id&&offer.status==='pending').length>=5)throw new Error('Tienes cinco propuestas pendientes. Espera una respuesta.');const offer={id:randomId(),fromStudentId:student.id,fromName:student.name,toStudentId:to.id,toName:to.name,offeredKey,requestedKey,fee:TRADE_FEE,status:'pending',createdAt:now()};store.tradeOffers.push(offer);saveStore(store);return response({offer});}
    const tradeResponseMatch=url.pathname.match(/^\/api\/students\/([^/]+)\/trades\/([^/]+)\/respond$/);
    if(method==='POST'&&tradeResponseMatch){const studentId=decodeURIComponent(tradeResponseMatch[1]);const decision=String(body.decision||'');if(!['accept','reject'].includes(decision))throw new Error('Respuesta de intercambio inválida.');const offer=store.tradeOffers.find((item)=>item.id===decodeURIComponent(tradeResponseMatch[2]));if(!offer||offer.toStudentId!==studentId||offer.status!=='pending')throw new Error('La propuesta ya no está disponible.');const to=store.students.find((item)=>item.id===studentId),from=store.students.find((item)=>item.id===offer.fromStudentId);if(decision==='reject'){offer.status='rejected';offer.respondedAt=now();saveStore(store);return response({trade:offer,student:safeStudent(to)});}if(!from||!to||!tradableInventory(from).includes(offer.offeredKey)||!tradableInventory(to).includes(offer.requestedKey))throw new Error('Los objetos cambiaron y la propuesta ya no puede aceptarse.');if(from.unlocked.includes(offer.requestedKey)||to.unlocked.includes(offer.offeredKey))throw new Error('Uno de los objetos ya fue conseguido.');if(from.coins<TRADE_FEE||to.coins<TRADE_FEE)throw new Error(`Cada perfil necesita ${TRADE_FEE} coins para completar el intercambio.`);from.coins-=TRADE_FEE;to.coins-=TRADE_FEE;from.unlocked=from.unlocked.filter((key)=>key!==offer.offeredKey);to.unlocked=to.unlocked.filter((key)=>key!==offer.requestedKey);from.unlocked.push(offer.requestedKey);to.unlocked.push(offer.offeredKey);offer.status='accepted';offer.respondedAt=now();saveStore(store);return response({trade:offer,student:safeStudent(to)});}
    if (method === 'POST' && url.pathname === '/api/attempts') {
      const student = store.students.find((item) => item.id === body.studentId);
      const reading = content.readings.find((item) => item.id === body.readingId);
      if (!student || !reading || reading.grade !== student.grade || !String(body.transcript || '').trim()) throw new Error('Perfil, lectura o transcripción inválida');
      const scores = scoreAttempt({ ...body, reading });
      const attempt = {
        id: randomId(),
        studentId: student.id,
        readingId: reading.id,
        readingTitle: reading.title,
        transcript: String(body.transcript).slice(0, 1000),
        elapsedSeconds: Math.max(10, Math.min(600, Number(body.elapsedSeconds) || 60)),
        warmupAnswer: body.warmupAnswer,
        comprehensionAnswer: body.comprehensionAnswer,
        scores,
        createdAt: now()
      };
      store.attempts.push(attempt);
      student.xp = Number(student.xp || 0) + scores.xp;
      scores.streakBonus = updateStreak(student);
      student.coins = Number(student.coins || 0) + scores.coins + scores.streakBonus;
      const skillAward=awardCurriculumSkill(student,reading,scores);
      saveStore(store);
      if (remoteFailed) queueSync(path, options);
      return response({ attempt, student:safeStudent(student), skillAward });
    }
    if (method === 'POST' && url.pathname === '/api/teacher/login') {
      if (String(body.pin || '') !== PIN) throw new Error('PIN incorrecto');
      return response({ token: 'local-teacher-token', teacher: { id: 'teacher-conny', name: 'Conny' } });
    }
    if (method === 'GET' && url.pathname === '/api/teacher/summary') {
      const students = summaryFor(store);
      return response({ teacher: { id: 'teacher-conny', name: 'Conny' }, classStats: classStats(store, students), students });
    }
    const setPinMatch=url.pathname.match(/^\/api\/teacher\/students\/([^/]+)\/set-pin$/);
    if(method==='POST'&&setPinMatch){const student=store.students.find((item)=>item.id===decodeURIComponent(setPinMatch[1]));if(!student)throw new Error('Perfil no encontrado');if(!/^\d{4}$/.test(String(body.pin||'')))throw new Error('El PIN debe tener exactamente 4 números.');const salt=crypto.getRandomValues(new Uint8Array(16));student.pinSalt=bytesToHex(salt);student.pinHash=await derivePinHash(body.pin,student.pinSalt);saveStore(store);return response({student:safeStudent(student)});}
    const resetPinMatch=url.pathname.match(/^\/api\/teacher\/students\/([^/]+)\/reset-pin$/);
    if(method==='POST'&&resetPinMatch){const student=store.students.find((item)=>item.id===decodeURIComponent(resetPinMatch[1]));if(!student)throw new Error('Perfil no encontrado');student.pinSalt='';student.pinHash='';saveStore(store);return response({student:{id:student.id,name:student.name,hasPin:false}});}
    if (method === 'POST' && url.pathname === '/api/teacher/students') {
      const name=String(body.name||'').trim().replace(/\s+/g,' ');if(name.length<3||name.length>60)throw new Error('Escribe un nombre y apellido válidos.');if(store.students.length>=MAX_STUDENTS)throw new Error(`El curso alcanzó el máximo de ${MAX_STUDENTS} estudiantes.`);if(store.students.some((student)=>normalizedName(student.name)===normalizedName(name)))throw new Error('Ya existe un perfil con ese nombre.');const student=rosterStudent([`student-custom-${randomId()}`,name,2],store.students.length);ensureStudentEconomy(student,store.students.length);store.students.push(student);saveStore(store);return response({student:safeStudent(student),totalStudents:store.students.length,maxStudents:MAX_STUDENTS});
    }
    if (method === 'POST' && url.pathname === '/api/teacher/students/bulk') {
      throw new Error('Para proteger la nómina, agrega estudiantes individualmente desde el panel.');
    }
    throw new Error('Ruta local no encontrada');
  }

  window.lectoguaridaLocalApi = localApi;
})();
