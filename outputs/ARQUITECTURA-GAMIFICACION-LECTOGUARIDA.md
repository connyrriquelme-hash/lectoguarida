# Arquitectura de gamificación · Lectoguarida

## Estructura ligera del proyecto

```text
public/
  app.js          Estado global y componentes de interfaz
  local-api.js    Persistencia sin conexión y paridad con el servidor
  content.js      Campaña curricular exportada
  styles.css      mapa, tienda, álbum, celebraciones y accesibilidad
server.mjs        API, economía, racha, sorteos y analíticas
android/
  MainActivity    voz es-CL, grabación y reproducción local
```

La aplicación conserva un único `state` observable en el cliente para no añadir el peso de Redux al APK. Las mutaciones persistentes se realizan mediante la API y se replican en `local-api.js` cuando no hay conexión.

## Componentes clave

- `MapView`: agrupa 105 niveles en Letras, Doble consonante, Fluidez, Lenguaje y creación, Ciencia y ambiente, Chile y ciudadanía e Interculturalidad. Cada nodo puede estar bloqueado, disponible, actual o completado.
- `StreakCounter`: muestra racha actual, récord y bonificación diaria.
- `CelebrationLayer`: confeti CSS, respuesta háptica y resumen de XP/coins.
- `ShopView`: categorías Skins y Stickers, saldo global y precios.
- `StickerPack`: sobre de tres stickers con meta brillante visible y pesos ocultos configurables.
- `StickerAlbum`: colección, rareza, duplicados y progreso.
- `SkinEditor`: solo permite equipar objetos desbloqueados.

## Estado persistente por estudiante

```js
{
  xp, coins,
  streak, longestStreak, lastActiveDate,
  skin, unlocked,
  stickers: { "bee-reader": 2 },
  packsOpened, packsSinceRare
}
```

## Economía

- Recompensa de misión: `5 + round(puntajeGeneral / 10)`; rango habitual de 10 a 15 coins.
- Bonificación de racha: `min(10, 2 + díasDeRacha)` una vez al día.
- Sobre de tres stickers: 50 coins. El botón siempre comunica el precio antes de abrir y nunca usa dinero real.
- Skins: desde 150 coins; una skin premium requiere aproximadamente dos semanas de constancia.
- Duplicados: devuelven 4 coins si son comunes, 8 si son raros y 15 si son legendarios.

El sorteo usa pesos, no porcentajes codificados: común `90`, raro `9` y legendario `1`. El peso especial total es `10`; agregar una rareza épica solo exige añadir otra fila a `LOOT_TABLE`, porque el algoritmo recalcula el peso total automáticamente.

El contador persistente `packsSinceRare` implementa el sistema de piedad. Si cuatro sobres consecutivos no entregan un sticker especial, el último sticker del quinto sobre se sortea exclusivamente entre las categorías rara y legendaria. Un premio especial obtenido antes reinicia el contador. La interfaz infantil no muestra porcentajes: convierte el azar en la meta positiva «en cinco sobres encontrarás uno brillante» y representa el avance con cinco estrellas.

La revelación también se adapta al resultado: un premio común usa un sonido corto y una animación breve; un premio raro o legendario pausa la apertura durante 650 ms, ilumina el sobre, usa vibración diferencial y reproduce «¡Increíble, encontraste uno especial!» con voz `es-CL`.

## Audio localizado

En web se fuerza `SpeechSynthesisUtterance.lang = "es-CL"`, velocidad `0.9` y reconocimiento `SpeechRecognition.lang = "es-CL"`. Android utiliza `new Locale("es", "CL")` tanto en TTS como en reconocimiento. Si se migra a un proveedor en la nube, debe elegirse explícitamente una voz `es-CL` o, como segunda opción, `es-MX`; nunca una voz `es-ES` ni detección automática de idioma.

## Inclusión y accesibilidad

- Controles táctiles grandes, nombres accesibles y estados no dependientes solo del color.
- Animaciones desactivables mediante `prefers-reduced-motion`.
- Error sin pérdida de vidas ni coins.
- Probabilidades transparentes y garantía de rareza para evitar frustración.
- Grabaciones de lectura locales, temporales y no enviadas al servidor.
