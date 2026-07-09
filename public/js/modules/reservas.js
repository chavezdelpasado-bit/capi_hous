// ===============================
// MÓDULO RESERVAS
// ===============================
window.listaReservas = [];
window.listaZonas = [];
window.listaMesasDisponibles = [];
window.listaClientesReserva = [];
window.vistaActual = 'tabla';
window.mesCalendario = new Date();
window.diaSeleccionadoCalendario = null;

const ESTADO_LABEL = { P: 'Pendiente', C: 'Confirmada', A: 'Atendida', X: 'Cancelada' };
const ESTADO_CLASE = { P: 'badge-pendiente', C: 'badge-confirmada', A: 'badge-atendida', X: 'badge-cancelada' };

window.init_reservas = async function() {
  const tbody = document.getElementById('tablaReservasBody');
  if (!tbody) return;
  try {
    const [resReservas, resZonas, resMesas, resClientes] = await Promise.all([
      fetch('/api/reservas'),
      fetch('/api/reservas/zonas'),
      fetch('/api/reservas/mesas'),
      fetch('/api/clientes')
    ]);
    window.listaReservas = await resReservas.json();
    window.listaZonas = await resZonas.json();
    window.listaMesasDisponibles = await resMesas.json();
    window.listaClientesReserva = await resClientes.json();

    llenarSelectZonas();
    llenarSelectMesas();
    renderizarTablaReservas(window.listaReservas);
    renderizarCalendario();
  } catch (error) {
    console.error('Error al cargar reservas:', error);
  }
};

function llenarSelectZonas() {
  const sel = document.getElementById('r_idZona');
  sel.innerHTML = window.listaZonas.map(z => `<option value="${z.IDZONA}">${z.NOMAREA}</option>`).join('');
}

function llenarSelectMesas() {
  const sel = document.getElementById('r_idMesa');
  sel.innerHTML = '<option value="">Sin asignar</option>' +
    window.listaMesasDisponibles.map(m =>
      `<option value="${m.IDMESA}">Piso ${m.NUMPISO} - Mesa ${m.NUNMESA}${m.CAPACIDAD ? ' (' + m.CAPACIDAD + ' pers.)' : ''}</option>`
    ).join('');
}

function formatearFecha(fechaStr) {
  const f = new Date(fechaStr);
  const dia = f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  const hora = f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  return { dia, hora };
}

// ===============================
// VISTA TABLA
// ===============================
window.renderizarTablaReservas = function(datos) {
  const tbody = document.getElementById('tablaReservasBody');
  const empty = document.getElementById('emptyStateReservas');
  if (!datos.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = datos.map(r => {
    const { dia, hora } = formatearFecha(r.FECHARESERVA);
    const mesaTxt = r.IDMESA ? `Piso ${r.NUMPISO} · Mesa ${r.NUNMESA}` : 'Sin mesa asignada';
    return `
      <tr>
        <td>${r.CLIENTE_NOMBRE || '---'}</td>
        <td>
          <div class="zona-mesa">
            <span class="zona-nombre">${r.ZONA_NOMBRE}</span>
            <span class="mesa-info">${mesaTxt}</span>
          </div>
        </td>
        <td class="fecha-cell">
          <div class="fecha-dia">${dia}</div>
          <div class="fecha-hora">${hora}</div>
        </td>
        <td>${r.CANTIDAD_PERSONAS}</td>
        <td><span class="badge ${ESTADO_CLASE[r.ESTADO]}">${ESTADO_LABEL[r.ESTADO]}</span></td>
        <td>
          <div class="acciones-cell">
            ${r.ESTADO === 'P' ? `<button class="btn-icon confirm" title="Confirmar" onclick="cambiarEstadoReserva(${r.IDRESERVA}, 'C')">✔️</button>` : ''}
            ${r.ESTADO === 'C' ? `<button class="btn-icon confirm" title="Marcar como atendida" onclick="cambiarEstadoReserva(${r.IDRESERVA}, 'A')">🍽️</button>` : ''}
            ${r.ESTADO !== 'X' && r.ESTADO !== 'A' ? `<button class="btn-icon danger" title="Cancelar" onclick="cambiarEstadoReserva(${r.IDRESERVA}, 'X')">✖️</button>` : ''}
            <button class="btn-icon" title="Editar" onclick="editarReserva(${r.IDRESERVA})">✏️</button>
            <button class="btn-icon danger" title="Eliminar" onclick="eliminarReserva(${r.IDRESERVA})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

window.filtrarReservas = function() {
  const busqueda = document.getElementById('filtroBusquedaReserva').value.toLowerCase();
  const estado = document.getElementById('filtroEstado').value;

  const filtradas = window.listaReservas.filter(r => {
    const coincideNombre = (r.CLIENTE_NOMBRE || '').toLowerCase().includes(busqueda);
    const coincideEstado = estado === 'Todos' || r.ESTADO === estado;
    return coincideNombre && coincideEstado;
  });
  renderizarTablaReservas(filtradas);
};

// ===============================
// CAMBIO DE VISTA
// ===============================
window.cambiarVista = function(vista, btn) {
  window.vistaActual = vista;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('vistaTabla').style.display = vista === 'tabla' ? 'block' : 'none';
  document.getElementById('vistaCalendario').style.display = vista === 'calendario' ? 'block' : 'none';
  if (vista === 'calendario') renderizarCalendario();
};

// ===============================
// CALENDARIO
// ===============================
window.cambiarMes = function(delta) {
  window.mesCalendario.setMonth(window.mesCalendario.getMonth() + delta);
  window.diaSeleccionadoCalendario = null;
  document.getElementById('listaDiaSeleccionado').innerHTML = '';
  renderizarCalendario();
};

window.renderizarCalendario = function() {
  const grid = document.getElementById('calendarioGrid');
  const titulo = document.getElementById('calendarioTitulo');
  const fecha = window.mesCalendario;
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();

  titulo.textContent = fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  const primerDia = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = primerDia.getDay(); // 0=domingo
  const hoy = new Date();

  const reservasPorDia = {};
  window.listaReservas.forEach(r => {
    const f = new Date(r.FECHARESERVA);
    if (f.getFullYear() === anio && f.getMonth() === mes) {
      const dia = f.getDate();
      if (!reservasPorDia[dia]) reservasPorDia[dia] = [];
      reservasPorDia[dia].push(r);
    }
  });

  const labels = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = labels.map(l => `<div class="calendar-day-label">${l}</div>`).join('');

  for (let i = 0; i < offset; i++) html += `<div class="calendar-day empty"></div>`;

  for (let d = 1; d <= diasEnMes; d++) {
    const esHoy = hoy.getFullYear() === anio && hoy.getMonth() === mes && hoy.getDate() === d;
    const esSeleccionado = window.diaSeleccionadoCalendario === d;
    const reservasDia = reservasPorDia[d] || [];
    const dots = reservasDia.slice(0, 4).map(r => `<span class="day-dot ${r.ESTADO}"></span>`).join('');

    html += `
      <div class="calendar-day ${esHoy ? 'today' : ''} ${esSeleccionado ? 'selected' : ''}" onclick="seleccionarDia(${d})">
        <span class="day-number">${d}</span>
        <div class="day-dots">${dots}</div>
      </div>
    `;
  }

  grid.innerHTML = html;
};

window.seleccionarDia = function(dia) {
  window.diaSeleccionadoCalendario = dia;
  renderizarCalendario();

  const anio = window.mesCalendario.getFullYear();
  const mes = window.mesCalendario.getMonth();
  const reservasDia = window.listaReservas.filter(r => {
    const f = new Date(r.FECHARESERVA);
    return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === dia;
  });

  const cont = document.getElementById('listaDiaSeleccionado');
  const fechaTexto = new Date(anio, mes, dia).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!reservasDia.length) {
    cont.innerHTML = `<h4>${fechaTexto}</h4><p style="color:var(--text-muted);">Sin reservas este día.</p>`;
    return;
  }

  cont.innerHTML = `<h4>${fechaTexto} — ${reservasDia.length} reserva(s)</h4>` +
    `<table><tbody>` +
    reservasDia.map(r => {
      const { hora } = formatearFecha(r.FECHARESERVA);
      return `
        <tr>
          <td class="fecha-hora" style="width:70px;">${hora}</td>
          <td>${r.CLIENTE_NOMBRE}</td>
          <td>${r.ZONA_NOMBRE}</td>
          <td>${r.CANTIDAD_PERSONAS} pers.</td>
          <td><span class="badge ${ESTADO_CLASE[r.ESTADO]}">${ESTADO_LABEL[r.ESTADO]}</span></td>
        </tr>
      `;
    }).join('') +
    `</tbody></table>`;
};

// ===============================
// AUTOCOMPLETADO DE CLIENTE EN MODAL
// ===============================
function buscarClientesReserva(texto) {
  texto = texto.toLowerCase().trim();
  if (!texto) return [];
  return window.listaClientesReserva.filter(c => {
    const nombre = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ') || c.RAZON_SOCIAL || '';
    const doc = c.DNI || c.RUC || '';
    return nombre.toLowerCase().includes(texto) || doc.includes(texto);
  }).slice(0, 6);
}

function renderSugerenciasCliente(resultados) {
  const cont = document.getElementById('sugerenciasClienteReserva');
  if (!resultados.length) { cont.classList.remove('visible'); cont.innerHTML = ''; return; }

  cont.innerHTML = resultados.map(c => {
    const nombre = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ') || c.RAZON_SOCIAL;
    const doc = c.DNI || c.RUC;
    return `<div class="suggestion-item" data-id="${c.IDCLIENTE}">
              <span class="suggestion-nombre">${nombre}</span>
              <span class="suggestion-doc">${doc}</span>
            </div>`;
  }).join('');
  cont.classList.add('visible');

  cont.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const cliente = window.listaClientesReserva.find(c => c.IDCLIENTE == item.dataset.id);
      seleccionarClienteReserva(cliente);
      cont.classList.remove('visible');
    });
  });
}

function seleccionarClienteReserva(cliente) {
  const nombre = [cliente.NOMBRES, cliente.APEPATERNO, cliente.APEMATERNO].filter(Boolean).join(' ') || cliente.RAZON_SOCIAL;
  document.getElementById('r_idCliente').value = cliente.IDCLIENTE;
  document.getElementById('r_cliente_busqueda').style.display = 'none';
  const chip = document.getElementById('r_cliente_seleccionado');
  chip.style.display = 'flex';
  chip.innerHTML = `<span>${nombre}</span><button onclick="quitarClienteReserva()">✖</button>`;
}

window.quitarClienteReserva = function() {
  document.getElementById('r_idCliente').value = '';
  document.getElementById('r_cliente_busqueda').style.display = 'block';
  document.getElementById('r_cliente_busqueda').value = '';
  document.getElementById('r_cliente_seleccionado').style.display = 'none';
};

// ===============================
// MODAL
// ===============================
window.abrirModalReserva = function() {
  document.getElementById('modalReserva').style.display = 'flex';
  document.getElementById('modalReserva').dataset.editId = '';
  document.getElementById('modalReservaTitulo').textContent = 'Nueva reserva';
  quitarClienteReserva();
  document.getElementById('r_fecha').value = '';
  document.getElementById('r_personas').value = '';
  document.getElementById('r_idMesa').value = '';

  const inputBusqueda = document.getElementById('r_cliente_busqueda');
  inputBusqueda.oninput = () => renderSugerenciasCliente(buscarClientesReserva(inputBusqueda.value));

  document.addEventListener('click', function cerrarFuera(e) {
    if (!e.target.closest('.field-wrap')) {
      document.getElementById('sugerenciasClienteReserva')?.classList.remove('visible');
    }
  }, { once: true });
};

window.cerrarModalReserva = function() {
  document.getElementById('modalReserva').style.display = 'none';
};

window.editarReserva = function(id) {
  const r = window.listaReservas.find(x => x.IDRESERVA === id);
  if (!r) return;

  document.getElementById('modalReserva').style.display = 'flex';
  document.getElementById('modalReserva').dataset.editId = id;
  document.getElementById('modalReservaTitulo').textContent = 'Editar reserva';

  seleccionarClienteReserva({
    IDCLIENTE: r.IDCLIENTE, NOMBRES: r.CLIENTE_NOMBRE, APEPATERNO: '', APEMATERNO: '', RAZON_SOCIAL: r.CLIENTE_NOMBRE
  });
  document.getElementById('r_idZona').value = r.IDZONA;
  document.getElementById('r_idMesa').value = r.IDMESA || '';

  const f = new Date(r.FECHARESERVA);
  const local = new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('r_fecha').value = local;
  document.getElementById('r_personas').value = r.CANTIDAD_PERSONAS;
};

window.guardarReserva = async function() {
  const modal = document.getElementById('modalReserva');
  const editId = modal.dataset.editId;
  const esEdicion = !!editId;

  const idCliente = document.getElementById('r_idCliente').value;
  const idZona = document.getElementById('r_idZona').value;
  const idMesa = document.getElementById('r_idMesa').value;
  const fecha = document.getElementById('r_fecha').value;
  const personas = document.getElementById('r_personas').value;

  if (!idCliente || !idZona || !fecha || !personas) {
    return alert('Cliente, zona, fecha y cantidad de personas son obligatorios.');
  }

  const payload = {
    idCliente: parseInt(idCliente),
    idZona: parseInt(idZona),
    idMesa: idMesa ? parseInt(idMesa) : null,
    fechaReserva: fecha,
    cantidadPersonas: parseInt(personas)
  };

  try {
    const url = esEdicion ? `/api/reservas/${editId}` : '/api/reservas';
    const metodo = esEdicion ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No se pudo guardar la reserva.');

    cerrarModalReserva();
    await init_reservas();
  } catch (error) {
    alert(error.message);
  }
};

window.cambiarEstadoReserva = async function(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/reservas/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error('No se pudo actualizar el estado.');
    await init_reservas();
  } catch (error) {
    alert(error.message);
  }
};

window.eliminarReserva = async function(id) {
  if (!confirm('¿Eliminar esta reserva?')) return;
  try {
    const res = await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('No se pudo eliminar la reserva.');
    await init_reservas();
  } catch (error) {
    alert(error.message);
  }
};