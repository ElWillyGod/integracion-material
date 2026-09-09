# Reloj de fichadas

Proyecto Integrador — Ingenieria de Software.

Una persona ingresa su cedula en un teclado numerico en pantalla. El sistema
registra la hora en la que fichó, la compara con el horario de entrada que ya
tenia asignado, y avisa si llego tarde, temprano o a horario.

Por ahora **el resultado se imprime por la consola del servidor**, no en la
pantalla. Es una decision temporal: la etapa siguiente es mostrarlo al usuario.

```
[04/09/2026 08:10] Juan Perez (11111111): llego 10 minutos tarde (esperado 08:00, llego 08:10)
```

---

## Indice

1. [Que necesitas antes de empezar](#1-que-necesitas-antes-de-empezar)
2. [Instalacion paso a paso](#2-instalacion-paso-a-paso)
3. [Como correr el proyecto](#3-como-correr-el-proyecto)
4. [Como probarlo](#4-como-probarlo)
5. [Estructura de archivos](#5-estructura-de-archivos)
6. [El recorrido completo de un fichaje](#6-el-recorrido-completo-de-un-fichaje)
7. [Como modificar cosas comunes](#7-como-modificar-cosas-comunes)
8. [Lo que todavia NO hace](#8-lo-que-todavia-no-hace)
9. [Problemas frecuentes](#9-problemas-frecuentes)
10. [Glosario](#10-glosario)

Si queres entender el codigo linea por linea, despues de este README leete
[`docs/COMO-FUNCIONA.md`](docs/COMO-FUNCIONA.md).

---

## 1. Que necesitas antes de empezar

- **Python 3.10 o superior** instalado. Para verificarlo, abri una terminal y escribi:

      python3 --version

  Si no lo tenes, bajalo de [python.org](https://www.python.org/downloads/).

- **Un navegador web** cualquiera (Chrome, Firefox, Edge).

- **Git**, para clonar el repositorio.

No hace falta instalar ninguna base de datos, ni Node, ni npm. El frontend es
HTML, CSS y JavaScript a mano, sin frameworks.

---

## 2. Instalacion paso a paso

### Paso 1 — Clonar el repositorio

```bash
git clone <URL-DEL-REPO>
cd prueba-de-django   # o el nombre que le hayan puesto al repo
```

### Paso 2 — Crear el entorno virtual

Un **entorno virtual** (o *venv*) es una carpeta donde se instalan las
librerias de este proyecto sin ensuciar el resto de tu computadora. Cada
persona se crea el suyo; por eso `venv/` esta en el `.gitignore` y no se sube
al repositorio.

**Linux / Mac:**

```bash
python3 -m venv venv
```

**Windows:**

```cmd
python -m venv venv
```

### Paso 3 — Activar el entorno virtual

**Linux / Mac:**

```bash
source venv/bin/activate
```

**Windows (CMD):**

```cmd
venv\Scripts\activate
```

Vas a saber que funciono porque tu terminal ahora empieza con `(venv)`:

```
(venv) usuario@maquina:~/prueba-de-django$
```

> **Importante:** el venv se activa *por terminal*. Si cerras la terminal o
> abris una nueva, tenes que volver a activarlo antes de trabajar.

### Paso 4 — Instalar las dependencias

```bash
pip install -r requirements.txt
```

Esto instala Django (y sus dos dependencias) dentro del venv. Las versiones
exactas estan fijadas en `requirements.txt` para que a todos nos funcione igual.

### Paso 5 — Preparar la base de datos

```bash
cd reloj
python manage.py migrate
```

Esto crea el archivo `db.sqlite3`. **Nuestro codigo todavia no usa la base de
datos** (los horarios estan escritos en un archivo Python), pero Django necesita
sus propias tablas internas para arrancar sin quejarse.

---

## 3. Como correr el proyecto

Con el venv activado y parado en la carpeta `reloj/`:

```bash
python manage.py runserver
```

Vas a ver algo asi:

```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

Abri **http://127.0.0.1:8000/** en el navegador y vas a tener el teclado.

**Dejá esa terminal abierta y a la vista**: ahi es donde aparecen los mensajes
de los fichajes. Para frenar el servidor, `Ctrl+C`.

---

## 4. Como probarlo

El sistema viene con cuatro personas cargadas de prueba:

| Cedula   | Nombre      | Deberia entrar a |
|----------|-------------|------------------|
| 11111111 | Juan Perez  | 08:00            |
| 22222222 | Maria Gomez | 09:00            |
| 33333333 | Carlos Diaz | 13:30            |
| 44444444 | Ana Lopez   | 07:45            |

Marcá una cedula en el teclado y tocá **OK**. Mirá la terminal del servidor.

Segun la hora en la que estes probando vas a ver una de estas tres:

```
[08/09/2026 08:10] Juan Perez (11111111): llego 10 minutos tarde (esperado 08:00, llego 08:10)
[08/09/2026 07:52] Juan Perez (11111111): llego 8 minutos temprano (esperado 08:00, llego 07:52)
[08/09/2026 08:00] Juan Perez (11111111): llego a horario (esperado 08:00, llego 08:00)
```

Y si marcás una cedula que no existe:

```
[08/09/2026 10:00] Cedula 99999999: no esta registrada
```

> **Tip:** para no tener que esperar a las 8 de la mañana para probar el caso
> "tarde", cambiale el horario a alguien en `reloj/fichadas/horarios.py`
> (ver seccion 7).

### Probar sin el navegador

Si queres probar solo el backend, podes mandarle una consulta directa con
`curl` desde otra terminal:

```bash
curl -X POST http://127.0.0.1:8000/fichar/ \
  -H "Content-Type: application/json" \
  -d '{"cedula":"11111111","fecha":"2026-09-08T08:10:00"}'
```

Respuesta:

```json
{"ok": true, "nombre": "Juan Perez", "esperado": "08:00", "llegada": "08:10", "diferencia": 10, "mensaje": "llego 10 minutos tarde"}
```

Esto es util porque te deja elegir la hora a mano, sin depender del reloj real.

---

## 5. Estructura de archivos

```
prueba-de-django/
├── README.md                 <- este archivo
├── requirements.txt          <- las librerias que hay que instalar
├── .gitignore                <- que archivos NO se suben al repo
├── docs/
│   └── COMO-FUNCIONA.md      <- explicacion del codigo linea por linea
├── venv/                     <- entorno virtual (NO se sube, lo crea cada uno)
└── reloj/                    <- el proyecto Django
    ├── manage.py             <- comando para correr todo (runserver, migrate...)
    ├── db.sqlite3            <- base de datos (NO se sube, se crea con migrate)
    ├── reloj/                <- configuracion general del proyecto
    │   ├── settings.py       <- configuracion de Django
    │   ├── urls.py           <- primer nivel de rutas
    │   ├── wsgi.py           <- para publicarlo en un servidor real (no lo tocamos)
    │   └── asgi.py           <- idem wsgi, version asincronica (no lo tocamos)
    └── fichadas/             <- NUESTRA app, aca esta todo lo que escribimos
        ├── horarios.py       <- los horarios de entrada precargados
        ├── views.py          <- la logica: recibe el fichaje y lo compara
        ├── urls.py           <- las rutas de la app
        ├── templates/
        │   └── index.html    <- la pagina con el teclado
        └── static/
            ├── style.css     <- los estilos
            └── app.js        <- el JavaScript que manda los datos al backend
```

**La carpeta que importa es `reloj/fichadas/`.** Ahi estan los 6 archivos que
escribimos nosotros. Todo lo demas lo genero Django solo.

Ojo con la repeticion del nombre: hay una carpeta `reloj/` adentro de otra
`reloj/`. La de afuera es el proyecto entero; la de adentro es la
configuracion. Es la forma estandar en la que Django arma las cosas.

### Los documentos de la materia

La consigna, el diagrama conceptual y los casos de uso **no estan en este
repositorio**: quedaron en la carpeta de la materia, un nivel mas arriba. Son
la especificacion de lo que hay que construir, y el codigo tiene que responder
a eso.

---

## 6. El recorrido completo de un fichaje

Esta es la parte importante para entender el proyecto. Seguimos un fichaje
desde que alguien toca un boton hasta que sale el mensaje en la terminal.

```
   NAVEGADOR (el cliente)                    SERVIDOR (Django, en Python)
   ─────────────────────                     ────────────────────────────

1. La persona toca "1","1","1"...
   index.html muestra los botones
   app.js los va guardando
   en la caja de texto
                                    │
2. Toca OK                          │
   app.js arma un paquete JSON:     │
   {"cedula": "11111111",           │
    "fecha": "2026-09-08T08:10:00"} │
                                    │
3. Lo manda por la red ─────────────┼──────►  4. urls.py mira la direccion
   fetch("/fichar/", POST)          │            "/fichar/" y decide que
                                    │            eso lo atiende views.fichar
                                    │
                                    │         5. views.py:
                                    │            - abre el JSON
                                    │            - busca la cedula en
                                    │              horarios.py -> 08:00
                                    │            - resta: 08:10 - 08:00 = 10
                                    │            - IMPRIME EN LA TERMINAL
                                    │              "llego 10 minutos tarde"
                                    │
7. app.js recibe la respuesta ◄─────┼───────  6. Devuelve un JSON con el
   y limpia la caja de texto        │            resultado
                                    │
```

**Los dos lados hablan por JSON.** El JavaScript arma un texto con los datos,
el navegador se lo manda al servidor por HTTP, y Python lo vuelve a convertir
en un diccionario. JSON es simplemente un formato de texto que las dos partes
entienden — es el "idioma comun" entre el frontend y el backend.

**Por que la hora la manda el navegador y no la calcula el servidor:** porque
es el reloj que ve la persona que esta fichando. Ademas nos deja probar con
horas inventadas (como en el ejemplo de `curl` de arriba) sin tener que esperar
a que sea esa hora de verdad.

---

## 7. Como modificar cosas comunes

### Agregar o cambiar una persona

Abri `reloj/fichadas/horarios.py`. Es un diccionario comun de Python:

```python
HORARIOS = {
    "11111111": {"nombre": "Juan Perez", "entrada": "08:00"},
    #  ^cedula              ^como se llama          ^a que hora deberia entrar
}
```

Para agregar a alguien, copiá una linea y cambiá los valores:

```python
    "55555555": {"nombre": "Pedro Ruiz", "entrada": "10:15"},
```

Reglas:
- La cedula va **entre comillas** (es texto, no un numero). Si fuera un numero
  se perderian los ceros de la izquierda: `01234` no es lo mismo que `1234`.
- La hora va en formato **`"HH:MM"`**, con dos digitos y en 24 horas.
  `"9:00"` esta mal, va `"09:00"`. `"14:30"`, no `"2:30 PM"`.
- Cada linea termina en **coma**.

No hace falta reiniciar el servidor: Django detecta el cambio y se recarga solo.

### Cambiar como se ve el teclado

`reloj/fichadas/static/style.css`. Es CSS comun y esta comentado.

### Cambiar el texto de los mensajes

`reloj/fichadas/views.py`, en el bloque `if diferencia > 0:`.

---

## 8. Lo que todavia NO hace

Esto es una primera etapa deliberadamente minima. Falta, en orden aproximado
de prioridad:

- [ ] **Mostrar el mensaje en pantalla.** Hoy solo se imprime en la terminal.
      El backend ya devuelve todos los datos necesarios en el JSON, asi que
      es trabajo del lado del frontend.
- [ ] **Guardar los fichajes.** Ahora mismo no queda registro de nada: cuando
      cerras el servidor se pierde todo. Habria que crear un modelo de Django
      y guardar en la base.
- [ ] **Los horarios en la base de datos**, en vez de escritos a mano en
      `horarios.py`.
- [ ] **Validar lo que llega.** Si el JSON viene mal formado o le falta un
      campo, el servidor tira un error 500. Falta el `try/except`.
- [ ] **Registrar la salida**, no solo la entrada.
- [ ] **Seguridad.** No hay login, ni sesiones, ni proteccion CSRF (esta
      desactivada a proposito con `@csrf_exempt`). Cualquiera que llegue a la
      pagina puede fichar por cualquier otro. Es aceptable mientras corre solo
      en nuestras maquinas; no lo es si algun dia se publica.

**Limitacion conocida:** la comparacion ignora la fecha y usa solo la hora, asi
que un turno que cruza la medianoche (entra 23:00, ficha 00:10) daria
"1370 minutos temprano" en vez de "10 minutos tarde".

---

## 9. Problemas frecuentes

**`python: command not found`**
Probá con `python3` en vez de `python`. En Linux y Mac suelen convivir los dos.

**`ModuleNotFoundError: No module named 'django'`**
No activaste el venv, o lo activaste y abriste otra terminal. Fijate que tu
prompt diga `(venv)` al principio; si no, volvé al Paso 3.

**`That port is already in use`**
Ya tenes un servidor corriendo en otra terminal. Cerralo con `Ctrl+C`, o usá
otro puerto: `python manage.py runserver 8001`.

**Toco OK y no pasa nada**
Abri la consola del navegador con `F12`, pestaña *Console*, y fijate si hay un
error en rojo. Lo mas comun es que el servidor no este corriendo.

**No veo los mensajes en la terminal**
Tienen que aparecer en la misma terminal donde corriste `runserver`. Si la
tapaste con otra ventana, buscala. No aparecen en el navegador (todavia).

**Cambie el CSS y no se ve el cambio**
El navegador guarda los archivos en cache. Recargá con `Ctrl+F5`.

---

## 10. Glosario

Terminos que aparecen en este README y en el codigo.

| Termino | Que significa |
|---|---|
| **Frontend** | Lo que corre en el navegador de la persona: HTML, CSS y JavaScript. Lo que se ve. |
| **Backend** | Lo que corre en el servidor: nuestro codigo Python. Lo que piensa. |
| **Django** | El framework de Python que usamos para el backend. Se encarga de recibir las consultas web. |
| **Framework** | Un conjunto de herramientas que ya resuelven los problemas comunes para que no los escribas de cero. |
| **Ruta / URL** | La direccion de una pagina o servicio. En este proyecto: `/` es el teclado, `/fichar/` recibe los fichajes. |
| **Vista (*view*)** | En Django, la funcion de Python que atiende una ruta. Las nuestras estan en `views.py`. |
| **Template** | Un archivo HTML que Django completa con datos antes de mandarlo. El nuestro es `index.html`. |
| **App** | En Django, un modulo del proyecto. La nuestra se llama `fichadas`. |
| **JSON** | Un formato de texto para intercambiar datos: `{"cedula": "11111111"}`. Lo entienden tanto JavaScript como Python. |
| **HTTP** | El protocolo con el que el navegador y el servidor se hablan. |
| **GET / POST** | Dos formas de pedir algo por HTTP. GET es "dame esta pagina", POST es "te mando estos datos". Nosotros fichamos por POST. |
| **`fetch`** | La funcion de JavaScript que manda consultas al servidor sin recargar la pagina. |
| **Endpoint** | Una direccion del backend pensada para recibir datos en vez de mostrar una pagina. El nuestro es `/fichar/`. |
| **venv** | Entorno virtual: una carpeta con las librerias de este proyecto, aislada del resto del sistema. |
| **Migracion** | El mecanismo de Django para crear y actualizar las tablas de la base de datos. |
