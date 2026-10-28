# Trabajo práctico 06

Refactorización modular de la aplicación de reservas de salas de estudio.

## Proyecto de partida y cambios

El punto de partida es una copia de mi TP 05
(`tp-05-salas-middleware`), copiada sin `node_modules` ni `.git`. El TP 05
quedó intacto en su propia carpeta y su propio repositorio.

En el TP 05 todo estaba en `src/index.js`: los datos, el contador de
solicitudes, el middleware, la validación, las rutas, el 404 y `app.listen`.
Acá lo reorganicé en módulos, siguiendo el mismo orden de la clase: **un paso
por vez, probando la matriz completa antes de seguir y con un commit por
paso**. El historial del repositorio muestra ese recorrido:

| Commit | Qué se hizo |
| ------ | ----------- |
| Copia del TP 05 como línea de base | La copia sin cambios |
| Paso 1 | Middleware a `middleware/solicitudes.js` y `middleware/reservas.js`; corrección del POST sin cuerpo |
| Paso 2 | El arreglo y sus operaciones pasan a `servicios/reservas.js` |
| Paso 3 | Los handlers pasan a `controladores/reservas.js` |
| Paso 4 | Las rutas del área pasan a `rutas/reservas.js` |
| Paso 5 | `app.js` construye Express; `index.js` solo arranca |
| Paso 6 | `configuracion.js` lee `PORT` y `NODE_ENV` |
| Formato, análisis estático y README | Prettier, ESLint, scripts y esta documentación |

### Línea de base y reparación

Antes de mover código ejecuté el TP 05 y anoté el resultado de cada ruta (ver
[Matriz antes/después](#matriz-antesdespués)). Todo el contrato funcionaba,
salvo un caso: un **POST sin cuerpo** o con `Content-Type: text/plain`
respondía **500** con `TypeError: Cannot read properties of undefined
(reading 'estudiante')`. Pasaba porque ningún parser arma `req.body` en esos
casos y el validador leía `req.body.estudiante` directamente.

La reparación está en `middleware/reservas.js`, en el paso 1:

```js
const datos = req.body ?? {};
const estudiante = String(datos.estudiante ?? "").trim();
```

Si `req.body` no existe se usa un objeto vacío, todos los campos quedan vacíos
y la solicitud cae en el **400** de siempre ("Hay que completar todos los
campos."), sin crear nada. Ese es el único cambio de comportamiento. Los
campos, las reglas, los mensajes y los valores que se le devuelven al
formulario son los mismos del TP 05.

Las vistas, el layout, el CSS y las cuatro reservas iniciales no cambiaron. El
pie de las páginas sigue diciendo "Trabajo práctico 05" porque las vistas se
conservaron tal cual.

## Instalación y ejecución

Hay que tener Node.js instalado (lo probé con la versión 24). Desde la carpeta
del proyecto:

```
npm install
npm start
```

El servidor queda escuchando en http://localhost:3000. Para detenerlo:
**Ctrl + C** en la terminal donde está corriendo.

`npm start` funciona sin ningún archivo `.env`, porque los valores por defecto
están en `configuracion.js`.

Para probar con un `.env` local (ver la sección siguiente):

```
npm run start:local
```

Ese script usa `node --env-file=.env src/index.js`, así que **requiere** que
exista el archivo `.env`; si no existe, Node no arranca.

Para revisar formato y análisis estático:

```
npm run format
npm run check
```

## Configuración del entorno

`src/configuracion.js` es el único archivo que lee `process.env`:

| Variable   | Valor por defecto | Qué hace |
| ---------- | ----------------- | -------- |
| `PORT`     | `3000`            | Puerto donde escucha el servidor |
| `NODE_ENV` | sin valor         | Si es `production`, Morgan usa el formato `combined`; si no, usa `dev` |

`process.env` siempre trae texto, por eso `PORT` se convierte con `Number`. Si
el resultado no es un entero entre 1 y 65535, `leerConfiguracion` lanza un
error, `index.js` lo muestra y el servidor **no arranca** (código de salida 1).

`NODE_ENV=production` **solo** cambia el formato de registro de Morgan. No
vuelve la aplicación "de producción" ni cambia nada más.

`.env.example` está en el repositorio con valores no secretos:

```
PORT=3000
NODE_ENV=development
```

Para usarlo se copia como `.env` y se cambian los valores. `.env` y
`node_modules/` están en `.gitignore`, así que nunca se suben.

Pruebas que hice:

| Caso | Comando | Resultado |
| ---- | ------- | --------- |
| Sin `PORT` | `npm start` | Escucha en 3000 |
| Puerto alternativo | `PORT=4100 npm start` | Escucha en 4100; la matriz completa da lo mismo que en 3000 |
| `.env` local | `.env` con `PORT=4300` y `npm run start:local` | Escucha en 4300 |
| `PORT=abc` | `PORT=abc npm start` | No inicia: `No se pudo iniciar la aplicación: PORT tiene que ser un número entero entre 1 y 65535 (llegó: abc).` |
| `PORT=70000` | idem | No inicia, mismo mensaje con `70000` |
| `PORT=0`, `PORT=3000.5`, `PORT=` vacío | idem | No inicia |
| Producción | `NODE_ENV=production` | Morgan muestra líneas `combined`: `::1 - - [28/Oct/2026:11:44:33 +0000] "GET /reservas HTTP/1.1" 200 2909 "-" "curl/8.2.1"` |

En PowerShell las variables se ponen así: `$env:PORT=4100; npm start`.

## Mapa de módulos y dependencias

```
tp-06-salas-modular/
|-- public/css/estilos.css        # sin cambios
|-- views/                        # sin cambios (layout, inicio, reservas, no-encontrado)
|-- src/
|   |-- index.js                  # semilla + servicio + app + listen
|   |-- configuracion.js          # PORT y NODE_ENV
|   |-- app.js                    # Express, pipeline, montaje y 404
|   |-- rutas/reservas.js         # método + camino -> middleware y controlador
|   |-- controladores/reservas.js # req/res: render, JSON, 404, redirect
|   |-- servicios/reservas.js     # el arreglo: listar, buscar, contar, crear
|   `-- middleware/
|       |-- solicitudes.js        # ID de solicitud y medición hasta finish
|       `-- reservas.js           # sección del área y validación del POST
|-- .env.example
|-- .gitattributes
|-- .gitignore
|-- eslint.config.js
|-- package.json
|-- package-lock.json
`-- README.md
```

| Si quiero saber... | Abro |
| ------------------ | ---- |
| cómo arranca el proceso | `src/index.js` |
| qué variables acepta | `src/configuracion.js` |
| en qué orden actúa Express | `src/app.js` |
| qué URLs tiene reservas | `src/rutas/reservas.js` |
| cómo se responde cada solicitud | `src/controladores/reservas.js` |
| cómo se guardan y buscan las reservas | `src/servicios/reservas.js` |
| cómo se identifica, mide o valida | `src/middleware/*` |

Quién importa a quién:

```
index.js ──> configuracion.js
   │
   ├──> servicios/reservas.js     (crea la única instancia)
   │
   └──> app.js ──> middleware/solicitudes.js
           │
           ├──> controladores/reservas.js ──> middleware/reservas.js (listas de salas y turnos)
           │
           └──> rutas/reservas.js ──> middleware/reservas.js (sección y validación)
```

`index.js` crea el servicio y se lo pasa a `crearApp`. `app.js` se lo pasa a
`crearControladorReservas`, y el controlador se lo pasa al router. Así **todos
usan el mismo objeto**.

### Por qué el servicio no usa `res`

El servicio solo sabe de reservas: guarda el arreglo y lo consulta o modifica.
No sabe si la respuesta va a ser una vista EJS, un JSON o una redirección, ni
qué código HTTP corresponde. Devuelve datos (una reserva, una lista, un número)
o `null` cuando no encuentra algo. Si usara `res.render`, quedaría atado a
Express y a las vistas, y el día que las reservas se guarden en una base de
datos habría que tocar también la parte HTTP. Separado, ese cambio queda
adentro de `servicios/reservas.js`.

### Qué hace el controlador

Es el traductor entre HTTP y el servicio. Lee lo que llega en la solicitud
(`req.params.id`, `req.reservaValidada`, `res.locals.solicitudId`), le pide al
servicio la operación que corresponde y decide la respuesta: qué vista
renderizar, cuándo responder 404, cuándo devolver JSON (`/estado`) y cuándo
redirigir con 302 después de crear. No guarda el arreglo ni sabe cómo se
busca una reserva adentro.

### Por qué el router declara caminos relativos

`app.js` monta el router con `app.use("/reservas", reservasRouter)`. Express
suma el montaje y el camino interno:

| Montaje | Camino en el router | URL pública |
| ------- | ------------------- | ----------- |
| `/reservas` | `/` | `/reservas` |
| `/reservas` | `/nueva` | `/reservas/nueva` |
| `/reservas` | `/:id` | `/reservas/:id` |

Si adentro del router volviera a escribir `/reservas`, la dirección real sería
`/reservas/reservas`. `/nueva` está declarada antes que `/:id` para que
Express no tome la palabra `nueva` como si fuera un id.

### Dónde quedaron las listas de salas y turnos

`SALAS_PERMITIDAS` y `TURNOS_PERMITIDOS` están en `middleware/reservas.js`,
junto a la validación que las usa. El controlador las importa de ahí para
dibujar las opciones del formulario, así cada lista existe una sola vez.

## Pipeline y contrato de rutas

El orden del pipeline está en `app.js` y es el mismo del TP 05:

```
morgan(formatoRegistro)
  -> identificarSolicitud   (crearIdentificadorSolicitud())
  -> medirDuracion
  -> expressLayouts
  -> express.static(public)
  -> express.urlencoded
  -> express.json
  -> GET /  y  GET /estado          (rutas de aplicación)
  -> /reservas                      (router: prepararAreaReservas + rutas)
  -> 404 final
```

**Qué solicitudes quedan registradas:** Morgan, el identificador y la
medición están antes que `express.static`, así que **todas** las solicitudes
quedan registradas dos veces en la terminal (la línea de Morgan y la mía),
incluso las del CSS, los 400 y los 404. Por ejemplo:

```
GET /reservas 200 1.679 ms - 2909
BIB-0004 GET /reservas -> 200 (3 ms)
BIB-0009 POST /reservas -> 400 (12 ms)
BIB-0007 GET /reservas/999 -> 404 (2 ms)
```

El identificador ahora sale de una fábrica, `crearIdentificadorSolicitud()`. El
contador quedó encerrado adentro, en vez de ser una variable global del
archivo principal.

Contrato que se conserva:

```
GET  /                 -> 200, inicio
GET  /estado           -> 200, JSON con cantidad e ID BIB-
GET  /reservas         -> 200, listado
GET  /reservas/nueva   -> 200, formulario
GET  /reservas/:id     -> 200 o 404 HTML
POST /reservas         -> 302 válido; 400 inválido
GET  /css/estilos.css  -> 200
otra URL               -> 404 HTML
```

`express.urlencoded` sigue antes del validador. En el camino inválido
`validarReserva` responde 400 y **no** llama a `next()`, así que ni el
controlador ni el servicio se ejecutan. En el camino válido arma
`req.reservaValidada` y llama a `next()` para seguir hacia
`controladorReservas.crear`.

## Matriz antes/después

"Antes" es el TP 05 copiado, sin tocar. "Después" es la versión final. Probé
cada caso con `curl` y la matriz completa se repitió después de cada paso. Los
pasos 2 a 6 dieron exactamente lo mismo que el paso 1.

| Caso | Antes | Después | Evidencia |
| ---- | ----- | ------- | --------- |
| `GET /` | 200 | 200 | "Ahora mismo hay 4 reservas"; pie con `Solicitud BIB-0002` |
| `GET /estado` | 200 | 200 | `{"servicio":"activo","reservas":4,"solicitudId":"BIB-0003"}` |
| `GET /reservas` | 200 | 200 | 4 tarjetas |
| `GET /reservas/nueva` | 200 | 200 | 6 campos + botón; 3 salas y 3 turnos (8 `<option>` con los "Elegir...") |
| `GET /reservas/1` | 200 | 200 | "Reserva número 1", Germán Nieva |
| `GET /reservas/999` | 404 | 404 | Vista "Reserva no encontrada"; el servidor sigue andando |
| `GET /reservas/abc` | 404 | 404 | Vista "Reserva no encontrada" |
| POST vacío (formulario sin campos) | 400 | 400 | "Hay que completar todos los campos." |
| POST sin cuerpo | **500** | **400** | Antes: `TypeError`. Después: mensaje de campos vacíos |
| POST `text/plain` | **500** | **400** | Antes: `TypeError`. Después: mensaje de campos vacíos |
| Sala no permitida (`Sala Este`) | 400 | 400 | "Esa sala no está en la lista de salas permitidas." |
| Turno no permitido | 400 | 400 | "El turno tiene que ser Mañana, Tarde o Noche." |
| Email sin `@` | 400 | 400 | "El email tiene que tener una arroba." |
| Personas 0, 7 y 2.5 | 400 | 400 | "La cantidad de personas tiene que ser un número entero del 1 al 6." |
| 400 conserva valores | sí | sí | El formulario vuelve con `value="Lucía Fernández"` y el email |
| POST válido | 302 | 302 | `Location: /reservas` |
| Listado después del POST | 200 | 200 | 5 tarjetas, aparece Lucía Fernández |
| `/estado` después del POST | 200 | 200 | `"reservas":5`, mismo arreglo que el listado |
| `GET /css/estilos.css` | 200 | 200 | `text/css`, 2890 bytes |
| `GET /url-inexistente` | 404 | 404 | Vista "Página no encontrada" |
| Reinicio | 200 | 200 | Vuelve a `"reservas":4`; `/reservas/5` da 404 |
| Puerto alternativo | no existía | 200 | Responde en 4100 |
| Puerto inválido | no existía | no inicia | Mensaje explícito, código de salida 1 |

En todos los casos Morgan y la medición propia siguieron mostrando 200, 302,
400 y 404 en la terminal.

## Formato y análisis estático

Instalé Prettier y ESLint como dependencias de desarrollo:

```
npm install --save-dev prettier eslint @eslint/js
```

Scripts de `package.json`:

| Script | Qué hace |
| ------ | -------- |
| `npm run format` | `prettier --write src`: reescribe el formato |
| `npm run format:check` | `prettier --check src`: solo revisa, no cambia nada |
| `npm run lint` | `eslint src`: busca patrones problemáticos |
| `npm run check` | `format:check` y después `lint` |

`eslint.config.js` aplica las reglas recomendadas a `src/**/*.js` como
CommonJS, declarando `require`, `module`, `__dirname`, `process` y `console`.

Comandos que ejecuté y qué dieron:

- `npm run format:check` antes de formatear: avisó de estilo distinto en
  `controladores/reservas.js` y `middleware/reservas.js`.
- `npm run format`: corrigió esos dos archivos y dejó los otros seis sin
  cambios.
- `npm run check`: `All matched files use Prettier code style!` y ESLint sin
  problemas (código de salida 0).
- Para confirmar que ESLint realmente revisa, agregué un archivo temporal con
  una variable sin usar y otra sin declarar. Marcó `no-unused-vars` y
  `no-undef`, y después lo borré.

`.gitattributes` fija los finales de línea en LF. Sin eso, en Windows git
puede bajar los archivos con CRLF y `prettier --check` los marca a todos.

Estas herramientas revisan cómo está escrito el código, no lo que hace.
Ninguna comprueba que un POST inválido dé 400, por eso la matriz manual sigue
siendo necesaria.

## Persistencia temporal y límites

Hay **un solo arreglo de reservas** y vive adentro de
`crearServicioReservas`, en `servicios/reservas.js`:

```js
const reservas = [...reservasIniciales];
```

Es una copia de la semilla `reservasIniciales` de `index.js`. Como
`crearServicioReservas` se llama una sola vez, el listado, el detalle,
`/estado` y el POST trabajan sobre ese mismo arreglo. Por eso después de crear
una reserva el listado muestra 5 y `/estado` también dice 5. `listar()`
devuelve una copia, así que desde afuera no se puede hacer `push` sobre el
arreglo real: la única forma de agregar es `crear()`.

Ese arreglo está en la memoria del proceso de Node. Cuando el servidor se
detiene con Ctrl + C, la memoria se libera. Al volver a ejecutar
`npm start`, `index.js` crea otro servicio desde la semilla y se vuelve a las
cuatro reservas iniciales. Las reservas cargadas desde el formulario se
pierden, y el contador `BIB-` vuelve a empezar en `BIB-0001`.

No hay base de datos ni escritura de archivos, porque están fuera del alcance
de este trabajo. Si más adelante las reservas pasan a una base de datos, el
cambio queda adentro del servicio: las rutas, el controlador y las vistas no
tendrían por qué enterarse.
