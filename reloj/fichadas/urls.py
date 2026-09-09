from django.urls import path

from . import views

# Cada path() conecta una direccion con una funcion de views.py.
# Ojo: Django rutea SOLO por la direccion, no por el metodo (GET/POST).
# El metodo se filtra en la vista, con el decorador @require_POST.
urlpatterns = [
    path("", views.index),          # la pagina con el teclado
    path("fichar/", views.fichar),  # recibe los fichajes (la barra final importa)
]

#127.0.0.1:8000
