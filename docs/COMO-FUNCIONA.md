# Como funciona el codigo, archivo por archivo

Esta guia explica **cada archivo que escribimos nosotros**, en el orden en el
que conviene leerlos. Asume que ya leiste el [README](../README.md) y que
pudiste correr el proyecto.

Los archivos que Django genero solos (`wsgi.py`, `asgi.py`, `manage.py`) estan
al final, en la seccion "Los archivos que no tocamos".

Orden de lectura recomendado:

1. [`horarios.py`](#1-fichadashorariospy) — los datos
2. [`urls.py`](#2-las-rutas-urlspy) — como Django decide que ejecutar
3. [`views.py`](#3-fichadasviewspy) — la logica
4. [`index.html`](#4-fichadastemplatesindexhtml) — la pantalla
5. [`app.js`](#5-fichadasstaticappjs) — la conexion con el backend
6. [`style.css`](#6-fichadasstaticstylecss) — los estilos

---

## 1. `fichadas/horarios.py`

El archivo mas simple del proyecto: los datos precargados.

```python
HORARIOS = {
    "11111111": {"nombre": "Juan Perez", "entrada": "08:00"},
    "22222222": {"nombre": "Maria Gomez", "entrada": "09:00"},
}
```

Es un **diccionario** de Python. Un diccionario guarda pares de *clave* y
*valor*, y sirve para buscar algo rapido a partir de su clave. Aca la clave es
la cedula, y el valor es otro diccionario con el nombre y la hora de entrada.

Buscar una persona es entonces una sola linea:

```python
HORARIOS["11111111"]        # -> {"nombre": "Juan Perez", "entrada": "08:00"}
```

**Por que la cedula es texto y no un numero.** Fijate que va entre comillas:
`"11111111"`, no `11111111`. Si fuera un numero, una cedula como `01234`
perderia el cero de adelante y se convertiria en `1234`. Ademas nunca vamos a
hacer cuentas con una cedula: es un identificador, no una cantidad.

**Por que la hora es texto y no un objeto de tiempo.** Porque asi es facil de
leer y de editar para cualquiera que abra el archivo. La conversion a un tipo
de dato con el que se pueda calcular la hace `views.py` cuando la necesita.

> Este archivo es un reemplazo temporal de una base de datos. Cuando el
> proyecto avance, estos datos van a salir de una tabla y este archivo va a
> desaparecer. Mientras tanto, es lo mas simple que funciona.

---

## 2. Las rutas: `urls.py`

Cuando llega una consulta al servidor, Django tiene que decidir **que funcion
de Python ejecutar**. Esa decision se toma mirando la direccion (la URL), y las
reglas estan en los archivos `urls.py`.

Hay dos, y trabajan encadenados.

### `reloj/urls.py` (el general)

```python
urlpatterns = [
    path("", include("fichadas.urls")),
]
```

Este es el punto de entrada de todo el proyecto (Django sabe que tiene que
empezar aca porque `settings.py` dice `ROOT_URLCONF = "reloj.urls"`).

`include()` significa "esto no lo resuelvo yo, preguntale a la app". Le pasa
todas las consultas a `fichadas/urls.py`. Es el patron normal de Django: cada
app se encarga de sus propias direcciones.

### `fichadas/urls.py` (el de nuestra app)

```python
urlpatterns = [
    path("", views.index),          # la pagina con el teclado
    path("fichar/", views.fichar),  # donde se mandan los fichajes
]
```

Cada `path()` conecta **una direccion** con **una funcion** de `views.py`.

Asi queda la cadena completa cuando alguien ficha:

```
POST /fichar/
   ↓
reloj/urls.py       path("", include("fichadas.urls"))
                    consume el prefijo (vacio) y delega
   ↓
fichadas/urls.py    path("fichar/", views.fichar)
                    coincide -> ejecuta views.fichar(request)
```

### Dos detalles importantes

**La barra final cuenta.** `path("fichar/", ...)` responde a `/fichar/` pero
**no** a `/fichar`. Por eso en `app.js` la direccion se escribe con la barra al
final. Es un error tipico y silencioso.

**Django NO rutea por metodo HTTP.** Esto sorprende a quien viene de otros
frameworks (en Flask, por ejemplo, se escribe
`@app.route("/fichar", methods=["POST"])`, con la ruta y el metodo juntos).

En Django, `urls.py` mira **solo la direccion**. Si la consulta llega por GET o
por POST le da exactamente lo mismo: ejecuta la funcion igual. Filtrar el
metodo es responsabilidad de la vista, y se hace con un decorador
(`@require_POST`), como vas a ver en la proxima seccion.

---

## 3. `fichadas/views.py`

Aca esta la logica. Una **vista** en Django es simplemente una funcion que
recibe un parametro `request` (la consulta que llego) y devuelve una respuesta.

### La vista `index`

```python
def index(request):
    return render(request, "index.html")
```

Es todo lo que hace falta para mostrar una pagina. `render()` busca el
template, lo procesa y devuelve el HTML listo.

Django encuentra `index.html` solo, sin que le digamos la ruta, porque
`'fichadas'` esta declarada en `INSTALLED_APPS` (en `settings.py`) y Django
revisa automaticamente la carpeta `templates/` de cada app instalada.

### La vista `fichar`

Esta es la importante. Vamos por partes.

#### Los decoradores

```python
@csrf_exempt
@require_POST
def fichar(request):
```

Un **decorador** es una linea con `@` arriba de una funcion que le agrega
comportamiento sin tocar su codigo. Estos dos hacen cosas opuestas:

- **`@require_POST`** *restringe*: si la consulta no llega por POST, Django
  corta ahi y responde `405 Method Not Allowed` sin llegar a ejecutar nuestra
  funcion. Esto es lo que reemplaza al ruteo por metodo que `urls.py` no hace.
  Sin este decorador, entrar a `http://127.0.0.1:8000/fichar/` desde el
  navegador (que es un GET, sin datos) reventaria con un error 500.

- **`@csrf_exempt`** *permite*: Django trae activada por defecto una proteccion
  llamada CSRF, que rechaza los POST que no traigan un token de seguridad.
  Como todavia no implementamos nada de seguridad, sin este decorador nuestro
  fichaje seria rechazado con un `403 Forbidden`. **Es una concesion temporal
  que hay que revertir** cuando el proyecto salga de nuestras maquinas.

El orden importa: se aplican de abajo hacia arriba, asi que `@csrf_exempt`
queda por fuera. Es el orden convencional, porque la verificacion de CSRF
ocurre antes de entrar a la vista.

#### Leer los datos que llegaron

```python
datos = json.loads(request.body)
cedula = datos["cedula"]
fecha = datetime.fromisoformat(datos["fecha"])
```

`request.body` es el contenido crudo que mando el navegador, en bytes. Django
**no** convierte JSON automaticamente, asi que lo hacemos nosotros con
`json.loads()`, que transforma el texto en un diccionario de Python.

`datetime.fromisoformat()` convierte el texto `"2026-09-08T08:10:00"` en un
objeto `datetime` de verdad, con el que ya se pueden hacer cuentas. Ese formato
(ISO 8601) es el acuerdo entre `app.js` y este archivo: uno lo escribe asi y el
otro lo lee asi.

#### Buscar a la persona

```python
persona = HORARIOS.get(cedula)
if persona is None:
    print(f"[...] Cedula {cedula}: no esta registrada")
    return JsonResponse({"ok": False, "mensaje": "Cedula no registrada"})
```

Usamos `.get()` y no `HORARIOS[cedula]` porque `.get()` devuelve `None` si la
clave no existe, mientras que los corchetes lanzarian un error y romperian el
servidor. Como la cedula la escribe una persona, tenemos que contar con que se
equivoque.

#### La comparacion de horarios

Este es el corazon del proyecto:

```python
esperada = datetime.strptime(persona["entrada"], "%H:%M")
minutos_esperados = esperada.hour * 60 + esperada.minute
minutos_llegada = fecha.hour * 60 + fecha.minute
diferencia = minutos_llegada - minutos_esperados
```

La idea es convertir las dos horas a **minutos contados desde la medianoche**,
que son numeros enteros comunes y se pueden restar sin complicaciones:

```
08:00  ->  8 * 60 + 0  = 480 minutos
08:10  ->  8 * 60 + 10 = 490 minutos
                          ─────────
diferencia:               10 minutos
```

`strptime` ("parse time") lee el texto `"08:00"` segun el formato `"%H:%M"`
(`%H` = hora, `%M` = minutos) y lo convierte en un `datetime`. Ese objeto trae
ademas una fecha inventada de 1900, que ignoramos: solo usamos `.hour` y
`.minute`.

**El signo de la resta es lo que decide todo:**

| Resultado | Significa |
|---|---|
| positivo | llego **tarde** (mas minutos que los esperados) |
| negativo | llego **temprano** |
| cero | llego **a horario** |

```python
if diferencia > 0:
    mensaje = f"llego {diferencia} minutos tarde"
elif diferencia < 0:
    mensaje = f"llego {-diferencia} minutos temprano"
else:
    mensaje = "llego a horario"
```

El `-diferencia` de la rama del medio es solo para mostrar el numero en
positivo: si la diferencia es `-8`, queremos leer "8 minutos temprano" y no
"-8 minutos temprano".

> **Limitacion:** al usar solo la hora y descartar la fecha, un turno que cruce
> la medianoche se calcula mal (entra 23:00, ficha 00:10 -> "1370 minutos
> temprano"). Para nuestros horarios de oficina no molesta, pero esta ahi.

#### Imprimir y responder

```python
print(f"[{fecha:%d/%m/%Y %H:%M}] {persona['nombre']} ({cedula}): {mensaje} ...")
```

El `print()` va a la terminal donde corre el servidor. Es el "aviso" que pide
la consigna, en su version mas simple: todavia no se muestra en pantalla.

Lo que esta adentro de las llaves son **f-strings**: Python reemplaza cada
`{...}` por su valor. `{fecha:%d/%m/%Y %H:%M}` ademas le da formato a la fecha,
para que se lea `08/09/2026 08:10`.

```python
return JsonResponse({
    "ok": True,
    "nombre": persona["nombre"],
    "esperado": persona["entrada"],
    "llegada": f"{fecha:%H:%M}",
    "diferencia": diferencia,
    "mensaje": mensaje,
})
```

`JsonResponse` agarra un diccionario, lo convierte a texto JSON y arma la
respuesta HTTP. Es lo que del otro lado va a leer `app.js`.

Devolvemos **mas datos de los que el frontend usa hoy** (`esperado`, `llegada`,
`diferencia`). Es a proposito: cuando se implemente el mensaje en pantalla, los
datos ya van a estar disponibles sin tener que tocar el backend.

---

## 4. `fichadas/templates/index.html`

La pantalla. Es HTML normal salvo por dos lineas de Django.

### Las partes

```html
<input id="cedula" type="text" readonly>
```

La caja donde aparecen los numeros. `readonly` impide escribir con el teclado
de la computadora: los digitos solo pueden entrar tocando los botones, que es
como funciona un reloj de fichar real.

```html
<button class="num">1</button>
<button class="num">2</button>
...
<button id="borrar">C</button>
<button class="num">0</button>
<button id="enviar">OK</button>
```

Los doce botones. Fijate en la diferencia:

- Los diez digitos comparten `class="num"` — se los trata a todos igual.
- `borrar` y `enviar` tienen `id`, porque cada uno hace algo distinto.

**El numero que se escribe es el texto del propio boton.** No hay una lista de
digitos en el JavaScript: `app.js` lee el contenido del boton que tocaste. Si
agregas un boton nuevo con `class="num"`, funciona solo.

```html
<p id="resultado"></p>
```

Arranca vacio. Es el lugar preparado para mostrar el mensaje en pantalla mas
adelante.

### Las dos lineas de Django

```html
{% load static %}
<link rel="stylesheet" href="{% static 'style.css' %}">
```

Todo lo que va entre `{% %}` son instrucciones para Django, no HTML: se
ejecutan en el servidor y no llegan al navegador.

`{% static 'style.css' %}` se convierte en la direccion real del archivo
(`/static/style.css`). Se hace asi, y no escribiendo la ruta a mano, porque
cuando el proyecto se publique de verdad esa direccion cambia — y usando
`{% static %}` no hay que tocar el HTML.

---

## 5. `fichadas/static/app.js`

El JavaScript que conecta la pantalla con el backend. Se ejecuta **en el
navegador de la persona**, no en el servidor.

### Los botones de numero

```js
document.querySelectorAll(".num").forEach(function (boton) {
  boton.addEventListener("click", function () {
    cedula.value += boton.textContent;
    resultado.textContent = "";
  });
});
```

`querySelectorAll(".num")` busca **todos** los elementos con `class="num"`, o
sea los diez digitos. En vez de escribir diez funciones iguales, recorremos la
lista y le enganchamos a cada boton el mismo comportamiento.

`addEventListener("click", ...)` significa "cuando toquen este boton, ejecuta
esto".

`cedula.value += boton.textContent` agrega el texto del boton a la caja. Ojo
que el `+` entre textos **pega**, no suma: `"1" + "1"` da `"11"`, que es lo que
queremos para una cedula.

La segunda linea limpia el mensaje anterior, para que no te quede en pantalla
el resultado de la persona que ficho antes mientras marcas tu cedula.

### La fecha

```js
function fechaLocal() {
  const ahora = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return ahora.getFullYear() + "-" + dos(ahora.getMonth() + 1) + ...
}
```

Arma la hora actual en el formato `"2026-09-08T08:10:00"`, que es el que Python
sabe leer con `fromisoformat()`.

Hay una funcion escrita a mano por dos motivos que son tipicos de JavaScript:

1. **`getMonth()` cuenta desde 0.** Enero es `0` y diciembre es `11`, por eso
   el `+ 1`. Es una de las trampas clasicas del lenguaje.

2. **Hay que rellenar con ceros.** `padStart(2, "0")` convierte `"5"` en
   `"05"`. Sin eso el texto quedaria `"2026-9-8T8:5:0"` y Python lo rechazaria.

**Por que no usamos `toISOString()`,** que hace casi lo mismo en una linea:
porque devuelve la hora en **UTC**, el horario de referencia mundial. En
Argentina eso son 3 horas de diferencia, asi que quien fichara a las 08:10
figuraria llegando a las 11:10 y el sistema diria que llego 190 minutos tarde.
Los metodos `getHours()`, `getMinutes()`, etc. si devuelven la hora local.

### El envio

```js
fetch("/fichar/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cedula: cedula.value,
    fecha: fechaLocal(),
  }),
})
```

`fetch()` es la funcion de JavaScript que manda consultas al servidor **sin
recargar la pagina**. Sus partes:

| Parte | Que es |
|---|---|
| `"/fichar/"` | La direccion. Es relativa: el navegador la completa con el servidor actual. Coincide con el `path("fichar/", ...)` de `urls.py`. |
| `method: "POST"` | Le avisa al servidor que le estamos mandando datos. Es lo que `@require_POST` exige del otro lado. |
| `headers` | Aclara que lo que va adentro es JSON. |
| `body` | Los datos. **Siempre viajan como texto**, por eso `JSON.stringify()` convierte el objeto de JavaScript en texto. Del otro lado, `json.loads()` hace exactamente lo contrario. |

### La respuesta

```js
  .then(function (respuesta) {
    return respuesta.json();
  })
  .then(function (datos) {
    resultado.textContent = datos.ok
      ? datos.nombre + ": " + datos.mensaje
      : datos.mensaje;
    cedula.value = "";
  });
```

`fetch` es **asincronico**: no congela la pagina esperando al servidor, sigue
funcionando y avisa cuando la respuesta llega. Los `.then()` son "y despues
haz esto".

Hay dos porque la respuesta llega en dos momentos: primero los encabezados
(¿anduvo?, ¿que tipo de contenido es?) y despues el contenido. El primer
`.then` pide leer el contenido y convertirlo de JSON, el segundo ya recibe los
datos listos para usar.

`datos.ok` es el campo que puso `views.py` en el JSON. El `? :` es un `if`
corto: si `ok` es verdadero muestra `"Juan Perez: llego 10 minutos tarde"`, si
no muestra solo el mensaje de error.

Por ultimo se limpia la caja de texto para la proxima persona.

> **Falta un `.catch()`.** Si el servidor esta apagado o devuelve un error, no
> pasa nada visible: el error queda escondido en la consola del navegador
> (`F12`). Es una de las cosas a mejorar.

---

## 6. `fichadas/static/style.css`

Lo minimo para que se vea como un teclado. Lo unico que vale la pena explicar
es esto:

```css
#teclado {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
```

`display: grid` acomoda los botones en una **grilla**, y
`repeat(3, 1fr)` dice "tres columnas del mismo ancho" (`1fr` = una fraccion del
espacio disponible). Los doce botones se van ubicando solos de a tres por fila,
en el orden en el que estan escritos en el HTML. Por eso el orden de los
botones en `index.html` es el que es: `C` va antes que `0` para que quede en la
esquina de abajo a la izquierda, como en un teclado de verdad.

---

## Los archivos que no tocamos

Django genera varios archivos solo. Sirve saber que hace cada uno para no
asustarse, pero no hay que editarlos.

| Archivo | Para que sirve |
|---|---|
| `manage.py` | El comando con el que se corre todo: `runserver`, `migrate`, etc. Nunca se edita. |
| `reloj/settings.py` | La configuracion. **Le tocamos una sola linea**: agregar `'fichadas'` a `INSTALLED_APPS`, que es como se le avisa a Django que nuestra app existe. |
| `reloj/wsgi.py` y `asgi.py` | Se usan para publicar el proyecto en un servidor real. En desarrollo no se tocan. |
| `db.sqlite3` | La base de datos. Todavia no guardamos nada nuestro ahi; solo la usan las tablas internas de Django. |

---

## Resumen de una hojeada

| Archivo | Responsabilidad |
|---|---|
| `horarios.py` | **Los datos.** Que hora le corresponde a cada cedula. |
| `urls.py` | **El ruteo.** Que direccion ejecuta que funcion. |
| `views.py` | **La logica.** Recibe el fichaje, compara, imprime, responde. |
| `index.html` | **La estructura** de la pantalla. |
| `style.css` | **El aspecto** de la pantalla. |
| `app.js` | **El comportamiento**: junta los digitos y habla con el backend. |
