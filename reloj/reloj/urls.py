from django.urls import include, path

# Punto de entrada de todas las direcciones del proyecto.
# include() delega: todo se lo pasa a fichadas/urls.py.
urlpatterns = [
    path("", include("fichadas.urls")),
]
