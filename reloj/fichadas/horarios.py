"""Horarios de entrada precargados.

La clave es la cedula (texto) y el valor es la hora a la que esa persona
deberia entrar, en formato "HH:MM".

Para agregar a alguien, copia una linea y cambia los valores. Ojo:
  - la cedula va entre comillas (si fuera un numero, "01234" perderia el 0)
  - la hora va en 24 horas y con dos digitos: "09:00", no "9:00"

Esto reemplaza por ahora a una tabla de la base de datos.
"""

HORARIOS = {
    "11111111": {"nombre": "Juan Perez", "entrada": "08:00"},
    "22222222": {"nombre": "Maria Gomez", "entrada": "09:00"},
    "33333333": {"nombre": "Carlos Diaz", "entrada": "13:30"},
    "44444444": {"nombre": "Ana Lopez", "entrada": "07:45"},
}
