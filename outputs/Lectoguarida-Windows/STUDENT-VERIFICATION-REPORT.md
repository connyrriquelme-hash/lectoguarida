# Verificación funcional de estudiante — Lectoguarida

Fecha: 2026-06-28  
Entorno: `outputs/Lectoguarida-Windows`  
Perfil probado: `Conny demo`  
PIN probado: `1309`

## Objetivo

Validar que el flujo de estudiante funciona correctamente después de las mejoras de usabilidad móvil, especialmente:

- ingreso con PIN
- carga de progreso y niveles
- acceso al mapa y primera misión
- respuesta del backend para lectura
- estabilidad general de la app

## Pruebas ejecutadas

### 1) Prueba de suite automatizada

Comando:

```bash
npm.cmd test
```

Resultado:

- 36 pruebas aprobadas
- 0 fallos

### 2) Verificación de salud del backend

Comando:

```bash
Invoke-RestMethod http://127.0.0.1:4173/api/health
```

Resultado esperado y confirmado:

- app disponible
- 38 estudiantes cargados
- 105 niveles
- 315 actividades
- login por PIN activo
- currículum transversal activo
- mapa de aventura activo

### 3) Verificación de perfil estudiante

Comando:

```bash
GET /api/students
```

Resultado confirmado:

- el perfil `Conny demo` existe
- `hasPin: true`
- grade `2`

### 4) Verificación de login de estudiante

Comando:

```bash
POST /api/students/student-custom-e3090de1-74bd-4cf9-ab3a-978b0dabba03/login
```

Body:

```json
{ "pin": "1309" }
```

Resultado confirmado:

- status `200`
- retorna `student`
- retorna `token`
- retorna `expiresAt`

### 5) Verificación de progreso de lectura del estudiante

Comando:

```bash
GET /api/readings?grade=2&studentId=student-custom-e3090de1-74bd-4cf9-ab3a-978b0dabba03
```

Header:

```text
Authorization: Bearer <token>
```

Resultado confirmado:

- status `200`
- primera misión disponible: `g2-letter-a`
- `current: true`
- lecturas siguientes bloqueadas según progreso

## Observación de UX móvil

Se ajustó la pantalla de lectura para que en celular:

- el bloque de texto quede más cerca del botón de grabación
- el micrófono se sienta más protagonista
- los botones de grabar y escuchar sean más fáciles de tocar
- la experiencia se perciba como una sola acción continua: leer y grabar

## Conclusión

El usuario estudiante `Conny demo` puede ingresar correctamente con su PIN `1309`, cargar su progreso y acceder a la primera lectura disponible. La base funcional del flujo estudiante está operativa.

## Estado

Verificación aprobada para estudiante.
