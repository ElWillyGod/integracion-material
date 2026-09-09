import json
from datetime import datetime

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .horarios import HORARIOS


# Una "vista" en Django es una funcion que recibe la consulta que llego
# (request) y devuelve la respuesta. Se conectan con una direccion en urls.py.


def index(request):
    """Muestra el teclado numerico."""
    # render() busca el template, lo procesa y devuelve el HTML.
    # Encuentra index.html solo porque 'fichadas' esta en INSTALLED_APPS.
    return render(request, "index.html")


# @require_POST rechaza con un 405 todo lo que no sea POST (urls.py no
# filtra metodos, asi que esto va aca).
# @csrf_exempt desactiva la proteccion CSRF de Django. Es temporal: sin esto
# el fichaje seria rechazado con un 403 porque no mandamos ningun token.
@csrf_exempt
@require_POST
def fichar(request):
    """Recibe {"cedula": "...", "fecha": "..."} y compara con el horario cargado."""
    # request.body es el texto crudo que mando app.js. Django no convierte
    # el JSON solo, asi que lo hacemos nosotros.
    datos = json.loads(request.body)
    cedula = datos["cedula"]
    fecha = datetime.fromisoformat(datos["fecha"])

    # .get() devuelve None si la cedula no existe, en vez de romper.
    persona = HORARIOS.get(cedula)
    if persona is None:
        print(f"[{fecha:%d/%m/%Y %H:%M}] Cedula {cedula}: no esta registrada")
        return JsonResponse({"ok": False, "mensaje": "Cedula no registrada"})

    # Pasamos las dos horas a "minutos desde la medianoche" para poder
    # restarlas como numeros comunes:  08:10 -> 8 * 60 + 10 = 490
    esperada = datetime.strptime(persona["entrada"], "%H:%M")
    minutos_esperados = esperada.hour * 60 + esperada.minute
    minutos_llegada = fecha.hour * 60 + fecha.minute
    diferencia = minutos_llegada - minutos_esperados

    # El signo de la resta decide el mensaje.
    if diferencia > 0:
        mensaje = f"llego {diferencia} minutos tarde"
    elif diferencia < 0:
        mensaje = f"llego {-diferencia} minutos temprano"
    else:
        mensaje = "llego a horario"

    # Por ahora el aviso sale por la terminal donde corre el servidor.
    print(
        f"[{fecha:%d/%m/%Y %H:%M}] {persona['nombre']} ({cedula}): {mensaje} "
        f"(esperado {persona['entrada']}, llego {fecha:%H:%M})"
    )

    # Devolvemos mas datos de los que app.js usa hoy, para que cuando se
    # implemente el mensaje en pantalla ya esten disponibles.
    return JsonResponse(
        {
            "ok": True,
            "nombre": persona["nombre"],
            "esperado": persona["entrada"],
            "llegada": f"{fecha:%H:%M}",
            "diferencia": diferencia,
            "mensaje": mensaje,
        }
    )
