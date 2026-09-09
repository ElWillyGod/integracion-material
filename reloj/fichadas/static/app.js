const cedula = document.getElementById("cedula");
const resultado = document.getElementById("resultado");

// Cada boton de numero agrega su digito a la caja de texto.
document.querySelectorAll(".num").forEach(function (boton) {
  boton.addEventListener("click", function () {
    cedula.value += boton.textContent;
    resultado.textContent = "";
  });
});

document.getElementById("borrar").addEventListener("click", function () {
  cedula.value = "";
  resultado.textContent = "";
});

// Fecha y hora local en formato "YYYY-MM-DDTHH:MM:SS".
// No usamos toISOString() porque devuelve la hora en UTC.
function fechaLocal() {
  const ahora = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return (
    ahora.getFullYear() +
    "-" + dos(ahora.getMonth() + 1) +
    "-" + dos(ahora.getDate()) +
    "T" + dos(ahora.getHours()) +
    ":" + dos(ahora.getMinutes()) +
    ":" + dos(ahora.getSeconds())
  );
}

document.getElementById("enviar").addEventListener("click", function () {
  if (cedula.value === "") {
    return;
  }


  fetch("/fichar/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cedula: cedula.value,
      fecha: fechaLocal(),
    }),
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (datos) {
      resultado.textContent = datos.ok ? datos.nombre + ": " + datos.mensaje : datos.mensaje;
      cedula.value = "";
    });
});
