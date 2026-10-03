// Este archivo se ejecuta en el navegador de la persona, no en el servidor.
// La lista de personas y sus horarios NO esta aca: vive en el backend
// (fichadas/horarios.py). Este archivo solo junta la cedula y se la manda.

const LARGO_CEDULA = 8;

// Referencias a los elementos del HTML, se buscan una sola vez.
const clock = document.getElementById('clock');
const date = document.getElementById('date');
const accessForm = document.getElementById('accessForm');
const identificationInput = document.getElementById('identificationInput');
const errorMessage = document.getElementById('errorMessage');
const actionHint = document.getElementById('actionHint');
const userPreview = document.getElementById('userPreview');
const accessPanel = document.getElementById('accessPanel');
const successPanel = document.getElementById('successPanel');
const addButton = document.getElementById('addButton');
let resetTimer;
let enviando = false;

function updateDateTime() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('es-UY', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  date.textContent = now.toLocaleDateString('es-UY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// Fecha y hora local en formato "YYYY-MM-DDTHH:MM:SS", que es lo que el
// backend lee con datetime.fromisoformat().
// No usamos toISOString() porque devuelve la hora en UTC.
function fechaLocal() {
  const ahora = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return (
    ahora.getFullYear() +
    '-' + dos(ahora.getMonth() + 1) +
    '-' + dos(ahora.getDate()) +
    'T' + dos(ahora.getHours()) +
    ':' + dos(ahora.getMinutes()) +
    ':' + dos(ahora.getSeconds())
  );
}

// Solo revisa el formato (8 digitos). Si la cedula existe o no lo decide
// el backend cuando se registra el ingreso.
function validateIdentification(showError = false) {
  const cedula = identificationInput.value;
  const isComplete = cedula.length === LARGO_CEDULA;

  actionHint.hidden = !isComplete;
  userPreview.textContent = isComplete ? `Cédula ${formatCi(cedula)}` : '';

  if (showError && cedula.length > 0 && !isComplete) {
    showErrorMessage('Debe ingresar los ocho números de la cédula.');
  } else {
    showErrorMessage('');
  }

  return isComplete;
}

function showErrorMessage(text) {
  errorMessage.textContent = text;
  identificationInput.classList.toggle('invalid', Boolean(text));
}

// 45789216 -> 4.578.921-6
function formatCi(ci) {
  return `${ci.slice(0, 1)}.${ci.slice(1, 4)}.${ci.slice(4, 7)}-${ci.slice(7)}`;
}

// async permite usar await: el codigo espera la respuesta del servidor
// sin congelar la pagina, y se lee de arriba hacia abajo.
async function registerEntry() {
  if (enviando || !validateIdentification(true)) {
    identificationInput.focus();
    return;
  }

  const cedula = identificationInput.value;
  enviando = true;

  try {
    // Manda la cedula y la hora a /fichar/ (el path de urls.py).
    const respuesta = await fetch('/fichar/', {
      method: 'POST',
      body: JSON.stringify({ cedula: cedula, fecha: fechaLocal() }),
    });
    const datos = await respuesta.json();

    if (datos.ok) {
      showSuccess(cedula, datos);
      saveRecord(cedula, datos);
    } else {
      showErrorMessage('La cédula no está registrada.');
    }
  } catch {
    // El servidor esta apagado o respondio algo que no es JSON.
    showErrorMessage('No se pudo conectar con el servidor.');
  }

  enviando = false;
}

// Guarda el ingreso en registros.json a traves de /registrar/.
// Si llego temprano o a horario, los minutos tarde son 0.
async function saveRecord(cedula, datos) {
  try {
    await fetch('/registrar/', {
      method: 'POST',
      body: JSON.stringify({
        cedula: cedula,
        dia: fechaLocal().slice(0, 10), // "YYYY-MM-DD"
        minutos_tarde: Math.max(datos.diferencia, 0),
      }),
    });
  } catch {
    // El ingreso ya se mostro; si falla el guardado solo queda en consola.
    console.error('No se pudo guardar el registro de', cedula);
  }
}

// "datos" es el JSON que devuelve views.fichar:
// { ok, nombre, esperado, llegada, diferencia, mensaje }
function showSuccess(cedula, datos) {
  document.getElementById('successLabel').textContent = 'Ingreso registrado';
  document.getElementById('successTitle').textContent = `Bienvenido, ${datos.nombre}`;
  document.getElementById('successMovement').textContent = 'Ingreso';
  document.getElementById('successResult').textContent =
    datos.mensaje.charAt(0).toUpperCase() + datos.mensaje.slice(1);
  document.getElementById('successCi').textContent = formatCi(cedula);
  document.getElementById('successTime').textContent = datos.llegada;

  accessPanel.hidden = true;
  successPanel.hidden = false;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(resetScreen, 5000);
}

function resetScreen() {
  identificationInput.value = '';
  validateIdentification(false);
  successPanel.hidden = true;
  accessPanel.hidden = false;
  requestAnimationFrame(() => identificationInput.focus());
}

// Deja solo digitos y como maximo 8.
identificationInput.addEventListener('input', () => {
  identificationInput.value = identificationInput.value.replace(/\D/g, '').slice(0, LARGO_CEDULA);
  validateIdentification(false);
});

identificationInput.addEventListener('blur', () => validateIdentification(true));

// Enter no envia el formulario (recargaria la pagina): solo valida.
accessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  validateIdentification(true);
  identificationInput.focus();
});

// Clic en el boton de registrar ingreso: hace lo mismo que la tecla +.
addButton.addEventListener('click', registerEntry);

document.addEventListener('keydown', (event) => {
  if (accessPanel.hidden) return;

  // La tecla + (la del teclado comun o la del numerico) registra el ingreso.
  if (event.key === '+' || event.code === 'NumpadAdd') {
    event.preventDefault();
    registerEntry();
    return;
  }

  // Cualquier otra tecla que no sea un numero no se escribe en la caja.
  if (document.activeElement === identificationInput && event.key.length === 1 && !/[0-9]/.test(event.key)) {
    event.preventDefault();
  }
});

updateDateTime();
setInterval(updateDateTime, 1000);
validateIdentification(false);
