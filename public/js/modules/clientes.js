// ===============================
// MÓDULO CLIENTES — COMPLETO
// ===============================

// Token de Apis Perú
const TOKEN_APIS_PERU = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hdXJpaGVybmFuZGV6eGRAZ21haWwuY29tIn0.t-ac-HheDL10pm776MGdHi8rDnyTlDxZyeTTXsQTrKM";

window.listaClientes = [];
window.tipoActual = 'Natural';

// ===============================
// CARGA INICIAL
// ===============================
window.init_clientes = async function() {
  const tbody = document.getElementById('tablaClientesBody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/clientes');
    const data = await res.json();

    if (!res.ok) {
      console.error('Error del servidor al listar clientes:', data);
      tbody.innerHTML = '';
      const empty = document.getElementById('emptyState');
      empty.style.display = 'block';
      empty.querySelector('h4').textContent = 'No se pudo cargar la lista';
      empty.querySelector('p').textContent = data.detalle || 'Intenta de nuevo en unos segundos.';
      return;
    }

    window.listaClientes = data;
    actualizarContadores();
    filtrarPorTipo('Natural', document.querySelector('.tab-btn.active'));
  } catch (error) {
    console.error("Error al cargar clientes:", error);
  }
};

function iniciales(nombre) {
  const partes = nombre.trim().split(' ');
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

window.actualizarContadores = function() {

    const activos = window.listaClientes.filter(c => c.ESTADO === 'A');

    document.getElementById('count-natural').textContent =
        activos.filter(c => c.DNI).length;

    document.getElementById('count-juridico').textContent =
        activos.filter(c => c.RUC).length;

    document.getElementById('count-todos').textContent =
        activos.length;
};

// ===============================
// RENDER DE TABLA
// ===============================
window.renderizarTabla = function(datos) {
  const tbody = document.getElementById('tablaClientesBody');
  const empty = document.getElementById('emptyState');
  if (!datos.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = datos.map(c => {
    const isNatural = !!c.DNI;
    const nombreCompleto = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ');
    const nombre = nombreCompleto || c.RAZON_SOCIAL || '---';
    const doc = c.DNI || c.RUC || '---';
    const tel = c.CELULAR || c.TELEFONO || '---';
    const ubic = c.DIRECCION;

    // Activo si ESTADO es 'A' o 1 (verdadero); cualquier otro valor cuenta como inactivo
    const activo = c.ESTADO === 'A' || c.ESTADO === 1 || c.ESTADO === true;

    return `
      <tr>
        <td>
          <div class="cliente-cell">
            <div class="avatar ${isNatural ? '' : 'empresa'}">${iniciales(nombre)}</div>
            <div>
              <div class="cliente-nombre">${nombre}</div>
              <span class="badge ${isNatural ? 'badge-natural' : 'badge-juridico'}">${isNatural ? 'Persona' : 'Empresa'}</span>
            </div>
          </div>
        </td>
        <td class="cliente-doc">${doc}</td>
        <td class="telefono">${tel}</td>
        <td class="ubicacion ${ubic ? '' : 'sin'}">${ubic || 'Sin dirección'}</td>
        <td>
          <span class="badge ${activo ? 'badge-activo' : 'badge-inactivo'}">${activo ? 'Activo' : 'Inactivo'}</span>
        </td>
        <td>
            <div class="acciones-cell">
                <button class="btn-icon"
                    title="Editar"
                    onclick="editarCliente(${c.IDCLIENTE})">
                    ✏️
                </button>

                <button
                    class="btn-icon ${activo ? 'danger' : ''}"
                    title="${activo ? 'Desactivar' : 'Activar'}"
                    onclick="cambiarEstadoCliente(${c.IDCLIENTE})">

                    ${activo ? '🚫' : '✅'}

                </button>
            </div>
        </td>
      </tr>
    `;
  }).join('');
};

// ===============================
// EDITAR CLIENTE
// ===============================
window.editarCliente = function(idCliente) {
  const cliente = window.listaClientes.find(c => c.IDCLIENTE === idCliente);
  if (!cliente) return;

  document.getElementById('modalCliente').style.display = 'flex';
  document.getElementById('modalTitulo').textContent = 'Editar cliente';

  const esNatural = !!cliente.DNI;
  document.getElementById('tipoCliente').value = esNatural ? 'NATURAL' : 'JURIDICO';
  document.getElementById('tipoCliente').disabled = true; // no permitir cambiar tipo al editar
  cambiarFormulario();

  if (esNatural) {
    document.getElementById('f_dni').value = cliente.DNI || '';
    document.getElementById('f_dni').disabled = true; // el DNI no debería cambiar
    document.getElementById('f_nombres').value = cliente.NOMBRES || '';
    document.getElementById('f_apepat').value = cliente.APEPATERNO || '';
    document.getElementById('f_apemat').value = cliente.APEMATERNO || '';
    document.getElementById('f_celular_n').value = cliente.TELEFONO || cliente.CELULAR || '';
    document.getElementById('f_direccion_n').value = cliente.DIRECCION || '';
  } else {
    document.getElementById('f_ruc').value = cliente.RUC || '';
    document.getElementById('f_ruc').disabled = true;
    document.getElementById('f_razon').value = cliente.RAZON_SOCIAL || '';
    document.getElementById('f_telefono_j').value = cliente.TELEFONO || '';
    document.getElementById('f_direccion_j').value = cliente.DIRECCION || '';
  }

  // Guardamos el id para que guardarCliente sepa que es edición
  document.getElementById('modalCliente').dataset.editId = idCliente;
};
window.cambiarEstadoCliente = async function(idCliente){

    try{

        const respuesta = await fetch(`/api/clientes/${idCliente}/estado`,{
            method:"PATCH"
        });

        const data = await respuesta.json();

        if(!respuesta.ok){
            throw new Error(data.message);
        }

        await init_clientes();

    }catch(error){

        alert(error.message);

    }

}
// ===============================
// ELIMINAR CLIENTE
// ===============================
window.eliminarCliente = async function(idCliente) {
  const cliente = window.listaClientes.find(c => c.IDCLIENTE === idCliente);
  const nombre = cliente ? ([cliente.NOMBRES, cliente.APEPATERNO].filter(Boolean).join(' ') || cliente.RAZON_SOCIAL) : 'este cliente';

  if (!confirm(`¿Seguro que quieres eliminar a "${nombre}"?`)) return;

  try {
    const res = await fetch(`/api/clientes/${idCliente}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'No se pudo eliminar el cliente.');

    await init_clientes();
  } catch (error) {
    alert(error.message);
  }
};

// ===============================
// FILTROS Y BÚSQUEDA
// ===============================
window.filtrarPorTipo = function(tipo, btn) {
  window.tipoActual = tipo;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const target = btn || document.querySelector('.tab-btn');
  if (target) target.classList.add('active');

  const buscador = document.getElementById('filtroBusqueda');
  if (buscador) buscador.value = '';

  let filtrados = window.listaClientes;
  if (tipo === 'Natural') filtrados = window.listaClientes.filter(c => !!c.DNI);
  else if (tipo === 'Jurídico') filtrados = window.listaClientes.filter(c => !!c.RUC);
  renderizarTabla(filtrados);
};

window.filtrarTabla = function() {
  const busqueda = document.getElementById('filtroBusqueda').value.toLowerCase();
  let datos = window.listaClientes;
  if (window.tipoActual === 'Natural') datos = datos.filter(c => !!c.DNI);
  if (window.tipoActual === 'Jurídico') datos = datos.filter(c => !!c.RUC);

  const filtrados = datos.filter(c => {
    const nombreCompleto = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ');
    const nombre = (nombreCompleto || c.RAZON_SOCIAL || '').toLowerCase();
    const doc = (c.DNI || c.RUC || '').toString();
    return nombre.includes(busqueda) || doc.includes(busqueda);
  });
  renderizarTabla(filtrados);
};

// ===============================
// AUTOCOMPLETADO LOCAL (clientes ya registrados)
// ===============================
function buscarCoincidencias(texto, campo) {
  texto = texto.toLowerCase().trim();
  if (!texto) return [];
  return window.listaClientes.filter(c => {
    if (!c.DNI) return false;
    if (campo === 'dni') return c.DNI.startsWith(texto);
    const nombreCompleto = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ').toLowerCase();
    return nombreCompleto.includes(texto);
  }).slice(0, 6);
}

function renderSugerencias(contenedorId, resultados) {
  const cont = document.getElementById(contenedorId);
  if (!resultados.length) {
    cont.classList.remove('visible');
    cont.innerHTML = '';
    return;
  }
  cont.innerHTML = resultados.map(c => {
    const nombreCompleto = [c.NOMBRES, c.APEPATERNO, c.APEMATERNO].filter(Boolean).join(' ');
    return `
      <div class="suggestion-item" data-dni="${c.DNI}">
        <span class="suggestion-nombre">${nombreCompleto}</span>
        <span class="suggestion-doc">${c.DNI}</span>
      </div>
    `;
  }).join('');
  cont.classList.add('visible');

  cont.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const cliente = window.listaClientes.find(c => c.DNI === item.dataset.dni);
      if (cliente) autorrellenarNatural(cliente);
      cont.classList.remove('visible');
    });
  });
}

function autorrellenarNatural(c) {
  document.getElementById('f_dni').value = c.DNI || '';
  document.getElementById('f_nombres').value = c.NOMBRES || '';
  document.getElementById('f_apepat').value = c.APEPATERNO || '';
  document.getElementById('f_apemat').value = c.APEMATERNO || '';
  document.getElementById('f_celular_n').value = c.TELEFONO || c.CELULAR || '';
  document.getElementById('f_direccion_n').value = c.DIRECCION || '';
}

// ===============================
// CONSULTAR DNI (RENIEC vía Apis Perú)
// ===============================
async function consultarDNI(dni) {
  if (dni.length !== 8) return;
  try {
    document.getElementById("f_nombres").value = "Consultando...";
    document.getElementById("f_apepat").value = "";
    document.getElementById("f_apemat").value = "";

    const response = await fetch(`/api/reniec/${dni}`);
    const data = await response.json();

    if (data.success === false) {
      alert("No se encontró el DNI");
      document.getElementById("f_nombres").value = "";
      return;
    }

    const persona = data.data ? data.data : data;
    document.getElementById("f_nombres").value = persona.nombres || "";
    document.getElementById("f_apepat").value = persona.apellido_paterno || persona.apellidoPaterno || "";
    document.getElementById("f_apemat").value = persona.apellido_materno || persona.apellidoMaterno || "";
  } catch (error) {
    console.error(error);
    alert("Error consultando RENIEC");
    document.getElementById("f_nombres").value = "";
  }
}

async function consultarRUC(ruc) {
  if (ruc.length !== 11) return;
  try {
    document.getElementById("f_razon").value = "Consultando...";

    const response = await fetch(`/api/sunat/${ruc}`);
    const data = await response.json();

    if (!data || data.success === false) {
      alert("No se encontró el RUC");
      document.getElementById("f_razon").value = "";
      return;
    }

    const empresa = data.data || data;
    document.getElementById("f_razon").value = empresa.nombre_o_razon_social || empresa.razonSocial || "";
    document.getElementById("f_direccion_j").value = empresa.direccion || "";
  } catch (error) {
    console.error(error);
    alert("Error consultando SUNAT");
  }
}
// ===============================
// MODAL
// ===============================
window.abrirModal = function() {
  document.getElementById("modalCliente").style.display = "flex";

  const inputDni = document.getElementById("f_dni");
  const inputNombre = document.getElementById("f_nombres");
  const inputRuc = document.getElementById("f_ruc");

  inputDni.oninput = function() {
    renderSugerencias("sugerenciasDni", buscarCoincidencias(this.value, "dni"));
    if (this.value.length === 8) consultarDNI(this.value);
  };

  inputNombre.oninput = function() {
    renderSugerencias("sugerenciasNombre", buscarCoincidencias(this.value, "nombre"));
  };

  if (inputRuc) {
    inputRuc.oninput = function() {
      if (this.value.length === 11) consultarRUC(this.value);
    };
  }

  document.addEventListener("click", function(e) {
    if (!e.target.closest(".field-wrap")) {
      document.getElementById("sugerenciasDni")?.classList.remove("visible");
      document.getElementById("sugerenciasNombre")?.classList.remove("visible");
    }
  }, { once: true });
};

window.cerrarModal = function() {
  document.getElementById("modalCliente").style.display = "none";
  document.getElementById("modalCliente").dataset.editId = '';
  document.getElementById('modalTitulo').textContent = 'Registrar nuevo cliente';
  document.getElementById('tipoCliente').disabled = false;
  document.getElementById('f_dni').disabled = false;
  document.getElementById('f_ruc').disabled = false;
};

// Esta es la función que faltaba y rompía el cambio de tipo de cliente
window.cambiarFormulario = function() {
  const tipo = document.getElementById('tipoCliente').value;
  document.getElementById('formNatural').style.display = tipo === 'NATURAL' ? 'block' : 'none';
  document.getElementById('formJuridico').style.display = tipo === 'JURIDICO' ? 'block' : 'none';
};

// ===============================
// GUARDAR CLIENTE
// ===============================
window.guardarCliente = async function() {
  const modal = document.getElementById('modalCliente');
  const editId = modal.dataset.editId;
  const esEdicion = !!editId;

  const tipo = document.getElementById("tipoCliente").value;
  let payload = { tipoCliente: tipo };

  if (tipo === "NATURAL") {
    payload.dni = document.getElementById("f_dni").value.trim();
    payload.nombres = document.getElementById("f_nombres").value.trim();
    payload.apePaterno = document.getElementById("f_apepat").value.trim();
    payload.apeMaterno = document.getElementById("f_apemat").value.trim();
    payload.celular = document.getElementById("f_celular_n").value.trim();
    payload.direccion = document.getElementById("f_direccion_n").value.trim();

    if (!payload.dni || !payload.nombres || !payload.apePaterno || !payload.apeMaterno) {
      alert("Complete todos los datos.");
      return;
    }
  } else {
    payload.ruc = document.getElementById("f_ruc").value.trim();
    payload.razonSocial = document.getElementById("f_razon").value.trim();
    payload.telefono = document.getElementById("f_telefono_j").value.trim();
    payload.direccion = document.getElementById("f_direccion_j").value.trim();

    if (!payload.ruc || !payload.razonSocial) {
      alert("Complete el RUC y la razón social.");
      return;
    }
  }

  try {
    const url = esEdicion ? `/api/clientes/${editId}` : "/api/clientes";
    const metodo = esEdicion ? "PUT" : "POST";

    const respuesta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.message || "No se pudo guardar.");

    cerrarModal();
    await init_clientes();
    limpiarFormulario();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

function limpiarFormulario() {
  document.getElementById("f_dni").value = "";
  document.getElementById("f_nombres").value = "";
  document.getElementById("f_apepat").value = "";
  document.getElementById("f_apemat").value = "";
  document.getElementById("f_celular_n").value = "";
  document.getElementById("f_direccion_n").value = "";

  document.getElementById("f_ruc").value = "";
  document.getElementById("f_razon").value = "";
  document.getElementById("f_telefono_j").value = "";
  document.getElementById("f_direccion_j").value = "";
}