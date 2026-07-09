// public/js/modules/ventas.js

(function () {
  const API_BASE = '/api/ventas';

  let carrito = [];
  let clienteSeleccionado = null;
  let productosCache = [];
  let paginaActual = 1;
  let ventaDetalleActual = null; // cabecera+detalle de la venta abierta en el modal
  let formatoExportarPendiente = null; // 'excel' o 'pdf', para el modal de tipo de reporte

  // ---------- HELPERS ----------

  function getUsuarioActual() {
    try {
      const raw = localStorage.getItem('usuario');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error('Error de red al consultar el servidor');
    return res.json();
  }

  async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || 'Error al procesar la solicitud');
    return data;
  }

  function formatMoney(valor) {
    return `S/ ${Number(valor || 0).toFixed(2)}`;
  }

  // ---------- TABS ----------

  function initTabs() {
    document.querySelectorAll('.venta-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.venta-tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.venta-tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        if (btn.dataset.tab === 'historial') cargarHistorial();
      });
    });
  }

  // ---------- CATÁLOGOS ----------

  async function cargarCatalogos() {
    try {
      const mesas = await apiGet('/mesas');
      const zonas = await apiGet('/zonas');
      const metodos = await apiGet('/metodos-pago');
      const categorias = await apiGet('/categorias');

      const selMesa = document.getElementById('filtroMesa');
      selMesa.innerHTML = mesas
        .map(m => `
          <option value="${m.IDMESA}" ${m.ESTADO_MESA === 'OCUPADA' ? 'disabled' : ''}>
            Piso ${m.NUMPISO} - Mesa ${m.NUNMESA}
          </option>
        `)
        .join('');

      const selZona = document.getElementById('filtroZona');
      selZona.innerHTML = zonas
        .map(z => `<option value="${z.IDZONA}">${z.NOMAREA}</option>`)
        .join('');

      const selMetodo = document.getElementById('metodoPago');
      selMetodo.innerHTML = metodos
        .map(m => `<option value="${m.IDMETODO_PAGO}">${m.NOMMETODO}</option>`)
        .join('');

      const selCategoria = document.getElementById('filtroCategoria');
      selCategoria.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

      categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.IDCATEGORIA;
        opt.textContent = c.NOMCATEGORIA;
        selCategoria.appendChild(opt);
      });

      await cargarProductos();

    } catch (err) {
      console.error(err);
    }
  }

  async function cargarProductos() {
    const idCategoria = document.getElementById('filtroCategoria').value;
    productosCache = await apiGet(`/productos${idCategoria ? `?idCategoria=${idCategoria}` : ''}`);
    renderProductos(productosCache);
  }

  function renderProductos(lista) {
    const contenedor = document.getElementById('listaProductos');
    if (!lista.length) {
      contenedor.innerHTML = '<p class="pos-vacio">No hay productos</p>';
      return;
    }
    contenedor.innerHTML = lista
      .map(
        (p) => `
        <div class="pos-producto-card" data-id="${p.IDPRODUCTO}">
          <div class="pos-producto-nombre">${p.NOMPRODUCTO}</div>
          <div class="pos-producto-marca">${p.MARCA || ''}</div>
          <div class="pos-producto-precio">${formatMoney(p.PRECIO)}</div>
        </div>`
      )
      .join('');

    contenedor.querySelectorAll('.pos-producto-card').forEach((card) => {
      card.addEventListener('click', () => {
        const producto = productosCache.find((p) => String(p.IDPRODUCTO) === card.dataset.id);
        if (producto) agregarAlCarrito(producto);
      });
    });
  }

  // ---------- CARRITO ----------

  function agregarAlCarrito(producto) {
    const existente = carrito.find((i) => i.idProducto === producto.IDPRODUCTO);
    if (existente) {
      existente.cantidad += 1;
    } else {
      carrito.push({
        idProducto: producto.IDPRODUCTO,
        nombre: producto.NOMPRODUCTO,
        precio: Number(producto.PRECIO),
        cantidad: 1
      });
    }
    renderCarrito();
  }

  function renderCarrito() {
    const contenedor = document.getElementById('carritoItems');
    if (!carrito.length) {
      contenedor.innerHTML = '<p class="pos-vacio">Aún no agregas productos</p>';
    } else {
      contenedor.innerHTML = carrito
        .map(
          (item, idx) => `
          <div class="pos-carrito-item">
            <div class="pos-carrito-item-info">
              <span>${item.nombre}</span>
              <small>${formatMoney(item.precio)} c/u</small>
            </div>
            <div class="pos-carrito-item-controles">
              <button data-idx="${idx}" data-accion="restar">-</button>
              <span>${item.cantidad}</span>
              <button data-idx="${idx}" data-accion="sumar">+</button>
              <button data-idx="${idx}" data-accion="quitar" class="pos-quitar">&times;</button>
            </div>
          </div>`
        )
        .join('');

      contenedor.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.idx);
          const accion = btn.dataset.accion;
          if (accion === 'sumar') carrito[idx].cantidad += 1;
          if (accion === 'restar') carrito[idx].cantidad = Math.max(1, carrito[idx].cantidad - 1);
          if (accion === 'quitar') carrito.splice(idx, 1);
          renderCarrito();
        });
      });
    }
    actualizarTotales();
  }

  function actualizarTotales() {
    const subtotal = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const igv = subtotal * 0.18;
    document.getElementById('totalSubtotal').textContent = formatMoney(subtotal);
    document.getElementById('totalIgv').textContent = formatMoney(igv);
    document.getElementById('totalPagar').textContent = formatMoney(subtotal + igv);
  }

  // ---------- BÚSQUEDA DE CLIENTE ----------

  function initBusquedaCliente() {
    const inputBuscar = document.getElementById('buscarCliente');
    const listaSugerencias = document.getElementById('lista-sugerencias-cliente');
    const searchContainer = document.getElementById('cliente-search-container');
    const seleccionadoContainer = document.getElementById('cliente-seleccionado-container');
    const nombreClienteSeleccionado = document.getElementById('nombre-cliente-seleccionado');
    const btnRemoverCliente = document.getElementById('btn-remover-cliente');

    let timerBusqueda = null;

    inputBuscar.addEventListener('input', (e) => {
      const termino = e.target.value.trim();
      clearTimeout(timerBusqueda);

      if (termino.length < 2) {
        listaSugerencias.innerHTML = '';
        listaSugerencias.classList.add('oculto');
        return;
      }

      timerBusqueda = setTimeout(async () => {
        try {
          const clientes = await apiGet(`/clientes?q=${encodeURIComponent(termino)}`);

          listaSugerencias.innerHTML = '';
          if (clientes.length === 0) {
            listaSugerencias.innerHTML = '<li style="color:#aaa; cursor:default;">No se encontraron coincidencias</li>';
          } else {
            clientes.forEach(cli => {
              const li = document.createElement('li');
              const documento = cli.DNI ? `DNI: ${cli.DNI}` : (cli.RUC ? `RUC: ${cli.RUC}` : 'Sin doc');

              li.innerHTML = `
                <span class="sug-nombre">${cli.NOMBRE}</span>
                <span class="sug-doc">${documento}</span>
              `;

              li.addEventListener('click', () => {
                clienteSeleccionado = { id: cli.IDCLIENTE, nombre: cli.NOMBRE };

                nombreClienteSeleccionado.textContent = cli.NOMBRE;
                searchContainer.classList.add('oculto');
                seleccionadoContainer.classList.remove('oculto');
                listaSugerencias.classList.add('oculto');
                inputBuscar.value = '';
              });

              listaSugerencias.appendChild(li);
            });
          }
          listaSugerencias.classList.remove('oculto');
        } catch (error) {
          console.error('Error buscando clientes:', error);
        }
      }, 300);
    });

    btnRemoverCliente.addEventListener('click', () => {
      clienteSeleccionado = null;
      seleccionadoContainer.classList.add('oculto');
      searchContainer.classList.remove('oculto');
      inputBuscar.focus();
    });

    document.addEventListener('click', (e) => {
      if (!searchContainer.contains(e.target)) {
        listaSugerencias.classList.add('oculto');
      }
    });
  }

  // ---------- REGISTRAR VENTA ----------

  async function registrarVenta() {
    const idMesa = document.getElementById('filtroMesa').value;
    const idZona = document.getElementById('filtroZona').value;
    const idMetodoPago = document.getElementById('metodoPago').value;
    const documento = document.getElementById('tipoDocumento').value;
    const usuario = getUsuarioActual();

    if (!idMesa) return alert('Selecciona una mesa');
    if (!clienteSeleccionado) return alert('Selecciona un cliente');
    if (!carrito.length) return alert('Agrega al menos un producto');
    if (!usuario) return alert('No se identificó al usuario. Vuelve a iniciar sesión.');

    const payload = {
      idMesa: Number(idMesa),
      idZona: Number(idZona),
      idCliente: Number(clienteSeleccionado.id),
      idMetodoPago: Number(idMetodoPago),
      idUsuario: usuario?.idUsuario || usuario?.IDUSUARIO || usuario?.id || 1,
      documento,
      items: carrito.map((i) => ({ idProducto: i.idProducto, cantidad: i.cantidad, precio: i.precio }))
    };

    const boton = document.getElementById('btnRegistrarVenta');
    boton.disabled = true;
    boton.textContent = 'Registrando...';

    try {
      const resultado = await apiPost('', payload);
      alert(
        `Venta registrada con éxito. ${resultado.documento === 'F' ? 'Factura' : 'Boleta'} ${resultado.serie}-${resultado.numero}`
      );

      carrito = [];
      clienteSeleccionado = null;
      document.getElementById('cliente-seleccionado-container').classList.add('oculto');
      document.getElementById('cliente-search-container').classList.remove('oculto');

      renderCarrito();
      await cargarCatalogos();
    } catch (err) {
      alert(err.message);
    } finally {
      boton.disabled = false;
      boton.textContent = 'Registrar venta';
    }
  }

  // ---------- HISTORIAL ----------

  async function cargarHistorial() {
    const desde = document.getElementById('filtroDesde').value;
    const hasta = document.getElementById('filtroHasta').value;
    const documento = document.getElementById('filtroDocumento').value;

    const params = new URLSearchParams({ page: paginaActual, pageSize: 20 });
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    if (documento) params.append('documento', documento);

    const { rows, total } = await apiGet(`?${params.toString()}`);
    renderHistorial(rows);
    renderPaginacion(total, 20);
  }

  function renderHistorial(rows) {
    const tbody = document.getElementById('tablaVentasBody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8">Sin ventas registradas</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(
        (v) => `
        <tr>
          <td>#${v.IDVENTAS}</td>
          <td>${new Date(v.FECHAVENTA).toLocaleString('es-PE')}</td>
          <td>${v.CLIENTE}</td>
          <td>Piso ${v.NUMPISO} - Mesa ${v.NUNMESA}</td>
          <td>${
            v.DOCUMENTO === 'F'
              ? `Factura ${v.SERIE_FACTURA || ''}-${v.NUMERO_FACTURA || ''}`
              : `Boleta ${v.SERIE_BOLETA || ''}-${v.NUMERO_BOLETA || ''}`
          }</td>
          <td>${v.NOMMETODO}</td>
          <td>${formatMoney(v.TOTALPAGAR)}</td>
          <td><button class="btn-ver-detalle" data-id="${v.IDVENTAS}">Ver</button></td>
        </tr>`
      )
      .join('');

    tbody.querySelectorAll('.btn-ver-detalle').forEach((btn) => {
      btn.addEventListener('click', () => verDetalleVenta(btn.dataset.id));
    });
  }

  function renderPaginacion(total, pageSize) {
    const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
    const contenedor = document.getElementById('paginacionVentas');
    contenedor.innerHTML = `
      <button id="pagAnterior" ${paginaActual <= 1 ? 'disabled' : ''}>&laquo;</button>
      <span>Página ${paginaActual} de ${totalPaginas}</span>
      <button id="pagSiguiente" ${paginaActual >= totalPaginas ? 'disabled' : ''}>&raquo;</button>
    `;
    const btnAnt = document.getElementById('pagAnterior');
    const btnSig = document.getElementById('pagSiguiente');
    if (btnAnt) btnAnt.addEventListener('click', () => { paginaActual -= 1; cargarHistorial(); });
    if (btnSig) btnSig.addEventListener('click', () => { paginaActual += 1; cargarHistorial(); });
  }

  async function verDetalleVenta(idVentas) {
    const { cabecera, detalle } = await apiGet(`/${idVentas}`);
    ventaDetalleActual = { cabecera, detalle };

    const contenido = document.getElementById('contenidoDetalleVenta');
    contenido.innerHTML = `
      <h3>${cabecera.DOCUMENTO === 'F' ? 'Factura' : 'Boleta'} #${cabecera.IDVENTAS}</h3>
      <p><strong>Cliente:</strong> ${cabecera.CLIENTE}</p>
      <p><strong>Fecha:</strong> ${new Date(cabecera.FECHAVENTA).toLocaleString('es-PE')}</p>
      <p><strong>Mesa:</strong> Piso ${cabecera.NUMPISO} - Mesa ${cabecera.NUNMESA}</p>
      <p><strong>Método de pago:</strong> ${cabecera.NOMMETODO}</p>
      <table class="tabla-detalle-venta">
        <thead><tr><th>Producto</th><th>Zona</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
        <tbody>
          ${detalle
            .map(
              (d) => `
              <tr>
                <td>${d.NOMPRODUCTO}</td>
                <td>${d.NOMAREA}</td>
                <td>${d.CANTIDAD}</td>
                <td>${formatMoney(d.PRECIO)}</td>
                <td>${formatMoney(d.TOTAL_LINEA)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="pos-totales">
        <div><span>Subtotal</span><span>${formatMoney(cabecera.SUBTOTAL)}</span></div>
        <div><span>IGV</span><span>${formatMoney(cabecera.IGV)}</span></div>
        <div class="pos-total-final"><span>Total</span><span>${formatMoney(cabecera.TOTALPAGAR)}</span></div>
      </div>
    `;
    document.getElementById('modalDetalleVenta').classList.remove('oculto');
  }

  function initModal() {
    document.getElementById('cerrarModalDetalle').addEventListener('click', () => {
      document.getElementById('modalDetalleVenta').classList.add('oculto');
    });
  }

  function initFiltrosVarios() {
    document.getElementById('filtroCategoria').addEventListener('change', cargarProductos);
    document.getElementById('buscarProducto').addEventListener('input', (e) => {
      const termino = e.target.value.toLowerCase();
      renderProductos(productosCache.filter((p) => p.NOMPRODUCTO.toLowerCase().includes(termino)));
    });
    document.getElementById('btnRegistrarVenta').addEventListener('click', registrarVenta);
    document.getElementById('btnFiltrarHistorial').addEventListener('click', () => {
      paginaActual = 1;
      cargarHistorial();
    });
  }

  // ---------- EXPORTACIÓN: REPORTE GENERAL ----------

  function abrirSelectorTipoReporte(formato) {
    formatoExportarPendiente = formato;
    document.getElementById('modalTipoReporte').classList.remove('oculto');
  }

  function initModalTipoReporte() {
    document.getElementById('cerrarModalTipoReporte').addEventListener('click', () => {
      document.getElementById('modalTipoReporte').classList.add('oculto');
    });

    document.querySelectorAll('#modalTipoReporte button[data-tipo]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tipoDoc = btn.dataset.tipo; // '', 'B', 'F'
        document.getElementById('modalTipoReporte').classList.add('oculto');
        await generarReporte(formatoExportarPendiente, tipoDoc);
      });
    });
  }

  async function obtenerDatosReporte(tipoDoc) {
    const desde = document.getElementById('filtroDesde').value;
    const hasta = document.getElementById('filtroHasta').value;

    const params = new URLSearchParams();
    if (desde) params.append('inicio', desde);
    if (hasta) params.append('fin', hasta);
    if (tipoDoc) params.append('documento', tipoDoc);

    return await apiGet(`/reporte?${params.toString()}`);
  }

  async function generarReporte(formato, tipoDoc) {
    try {
      const filas = await obtenerDatosReporte(tipoDoc);
      if (!filas || !filas.length) {
        alert('No hay ventas para el filtro seleccionado.');
        return;
      }

      if (formato === 'excel') exportarExcel(filas);
      if (formato === 'pdf') exportarPDF(filas, tipoDoc);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el reporte: ' + err.message);
    }
  }

  function exportarExcel(filas) {
    const datos = filas.map((v) => ({
      'N° Venta': v.IDVENTAS,
      'Fecha': new Date(v.FECHAVENTA).toLocaleString('es-PE'),
      'Cliente': v.CLIENTE,
      'Mesa': `Piso ${v.NUMPISO} - Mesa ${v.NUNMESA}`,
      'Comprobante': v.DOCUMENTO === 'F'
        ? `Factura ${v.SERIE_FACTURA || ''}-${v.NUMERO_FACTURA || ''}`
        : `Boleta ${v.SERIE_BOLETA || ''}-${v.NUMERO_BOLETA || ''}`,
      'Método de pago': v.NOMMETODO,
      'Subtotal': Number(v.SUBTOTAL || 0),
      'IGV': Number(v.IGV || 0),
      'Total': Number(v.TOTALPAGAR || 0)
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte de Ventas');
    XLSX.writeFile(libro, `reporte_ventas_${Date.now()}.xlsx`);
  }

  function exportarPDF(filas, tipoDoc) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const titulo = tipoDoc === 'F' ? 'Reporte de Facturas' : tipoDoc === 'B' ? 'Reporte de Boletas' : 'Reporte General de Ventas';
    doc.setFontSize(16);
    doc.text('CAPI HOUSE', 14, 15);
    doc.setFontSize(11);
    doc.text(titulo, 14, 22);

    const columnas = ['N° Venta', 'Fecha', 'Cliente', 'Mesa', 'Comprobante', 'Método de pago', 'Total'];
    const filasTabla = filas.map((v) => [
      `#${v.IDVENTAS}`,
      new Date(v.FECHAVENTA).toLocaleString('es-PE'),
      v.CLIENTE,
      `Piso ${v.NUMPISO} - Mesa ${v.NUNMESA}`,
      v.DOCUMENTO === 'F'
        ? `Factura ${v.SERIE_FACTURA || ''}-${v.NUMERO_FACTURA || ''}`
        : `Boleta ${v.SERIE_BOLETA || ''}-${v.NUMERO_BOLETA || ''}`,
      v.NOMMETODO,
      formatMoney(v.TOTALPAGAR)
    ]);

    doc.autoTable({
      head: [columnas],
      body: filasTabla,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 166, 39], textColor: 20 }
    });

    doc.save(`reporte_ventas_${Date.now()}.pdf`);
  }

  // ---------- EXPORTACIÓN: DETALLE DE UNA VENTA ----------

  function exportarDetalleExcel() {
    if (!ventaDetalleActual) return;
    const { cabecera, detalle } = ventaDetalleActual;

    const datos = detalle.map((d) => ({
      'Producto': d.NOMPRODUCTO,
      'Zona': d.NOMAREA,
      'Cantidad': d.CANTIDAD,
      'Precio unitario': Number(d.PRECIO),
      'Total línea': Number(d.TOTAL_LINEA)
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.sheet_add_aoa(hoja, [
      [`${cabecera.DOCUMENTO === 'F' ? 'Factura' : 'Boleta'} #${cabecera.IDVENTAS}`],
      [`Cliente: ${cabecera.CLIENTE}`],
      [`Fecha: ${new Date(cabecera.FECHAVENTA).toLocaleString('es-PE')}`],
      []
    ], { origin: 'A1' });

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Detalle');
    XLSX.writeFile(libro, `venta_${cabecera.IDVENTAS}.xlsx`);
  }

  function exportarDetallePDF() {
    if (!ventaDetalleActual) return;
    const { cabecera, detalle } = ventaDetalleActual;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('CAPI HOUSE', 14, 15);
    doc.setFontSize(12);
    doc.text(`${cabecera.DOCUMENTO === 'F' ? 'Factura' : 'Boleta'} #${cabecera.IDVENTAS}`, 14, 24);
    doc.setFontSize(10);
    doc.text(`Cliente: ${cabecera.CLIENTE}`, 14, 32);
    doc.text(`Fecha: ${new Date(cabecera.FECHAVENTA).toLocaleString('es-PE')}`, 14, 38);
    doc.text(`Mesa: Piso ${cabecera.NUMPISO} - Mesa ${cabecera.NUNMESA}`, 14, 44);
    doc.text(`Método de pago: ${cabecera.NOMMETODO}`, 14, 50);

    const filas = detalle.map((d) => [d.NOMPRODUCTO, d.NOMAREA, d.CANTIDAD, formatMoney(d.PRECIO), formatMoney(d.TOTAL_LINEA)]);

    doc.autoTable({
      head: [['Producto', 'Zona', 'Cant.', 'Precio', 'Total']],
      body: filas,
      startY: 56,
      headStyles: { fillColor: [217, 166, 39], textColor: 20 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${formatMoney(cabecera.SUBTOTAL)}`, 140, finalY);
    doc.text(`IGV: ${formatMoney(cabecera.IGV)}`, 140, finalY + 6);
    doc.setFontSize(12);
    doc.text(`Total: ${formatMoney(cabecera.TOTALPAGAR)}`, 140, finalY + 14);

    doc.save(`${cabecera.DOCUMENTO === 'F' ? 'factura' : 'boleta'}_${cabecera.IDVENTAS}.pdf`);
  }

  // ---------- TICKET (IMAGEN) ----------

  function llenarPlantillaTicket() {
    if (!ventaDetalleActual) return;
    const { cabecera, detalle } = ventaDetalleActual;

    document.getElementById('tk-tipo-doc').textContent = cabecera.DOCUMENTO === 'F' ? 'FACTURA' : 'BOLETA DE VENTA';
    document.getElementById('tk-fecha').textContent = new Date(cabecera.FECHAVENTA).toLocaleString('es-PE');
    document.getElementById('tk-cliente').textContent = cabecera.CLIENTE;
    document.getElementById('tk-mesa').textContent = `Piso ${cabecera.NUMPISO} - Mesa ${cabecera.NUNMESA}`;
    document.getElementById('tk-pago').textContent = cabecera.NOMMETODO;

    document.getElementById('tk-items').innerHTML = detalle.map((d) => `
      <div class="tk-item-fila">
        <span class="tk-desc">${d.NOMPRODUCTO} x${d.CANTIDAD}</span>
        <span class="tk-precio">${formatMoney(d.TOTAL_LINEA)}</span>
      </div>
    `).join('');

    document.getElementById('tk-sub').textContent = formatMoney(cabecera.SUBTOTAL);
    document.getElementById('tk-igv').textContent = formatMoney(cabecera.IGV);
    document.getElementById('tk-total').textContent = formatMoney(cabecera.TOTALPAGAR);
  }

  async function descargarTicketImagen() {
    if (!ventaDetalleActual) return;
    llenarPlantillaTicket();

    const nodo = document.getElementById('ticket-impresion');
    const wrapper = document.getElementById('contenedor-ticket-oculto');

    // Sacamos el ticket de su escondite momentáneamente para que html2canvas lo renderice bien
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '9999';
    wrapper.style.opacity = '0'; // invisible pero presente en el layout

    const canvas = await html2canvas(nodo, { scale: 2, backgroundColor: '#ffffff' });

    wrapper.style.position = 'absolute';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.opacity = '1';

    const link = document.createElement('a');
    link.download = `ticket_${ventaDetalleActual.cabecera.IDVENTAS}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function initBotonesExportacion() {
    document.getElementById('btnExportarExcel').addEventListener('click', () => abrirSelectorTipoReporte('excel'));
    document.getElementById('btnExportarPDF').addEventListener('click', () => abrirSelectorTipoReporte('pdf'));

    document.getElementById('btnExportarDetalleExcel').addEventListener('click', exportarDetalleExcel);
    document.getElementById('btnExportarDetallePDF').addEventListener('click', exportarDetallePDF);
    document.getElementById('btnDescargarTicket').addEventListener('click', descargarTicketImagen);

    initModalTipoReporte();
  }

  // ---------- BOOTSTRAP ----------

  async function init() {
    initTabs();
    initModal();
    initBusquedaCliente();
    initFiltrosVarios();
    initBotonesExportacion();
    await cargarCatalogos();
  }

  window.init_ventas = init;
})();