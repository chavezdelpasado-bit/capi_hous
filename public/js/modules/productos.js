(function() {
    let productosGlobal = [];

    function initProductos() {
        document.addEventListener('DOMContentLoaded', setup);
        // Por si el script se carga después de que el DOM ya está listo
        if (document.readyState !== 'loading') setup();
    }

    function setup() {
        const tabla = document.getElementById('tablaProductos');
        if (!tabla) return;

        const btnNuevo = document.getElementById('btnNuevoProducto');
        if (btnNuevo) btnNuevo.onclick = () => abrirModal();

        const btnCerrar = document.getElementById('btnCerrar');
        if (btnCerrar) btnCerrar.onclick = () => cerrarModal();

        const modal = document.getElementById('modalProducto');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) cerrarModal();
            });
        }

        const form = document.getElementById('formProducto');
        if (form) form.addEventListener('submit', onSubmitForm);

        // Delegación de eventos para Editar / Eliminar
        const tbody = tabla.querySelector('tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const btnEditar = e.target.closest('.btnEditar');
                const btnEliminar = e.target.closest('.btnEliminar');

                if (btnEditar) {
                    const id = btnEditar.dataset.id;
                    onEditar(id);
                } else if (btnEliminar) {
                    const id = btnEliminar.dataset.id;
                    onEliminar(id);
                }
            });
        }

        const txtBuscar = document.getElementById('txtBuscar');
        if (txtBuscar) {
            txtBuscar.addEventListener('input', () => {
                const termino = txtBuscar.value.trim().toLowerCase();
                if (!termino) {
                    renderizarTabla(productosGlobal);
                    return;
                }
                const filtrados = productosGlobal.filter(p => {
                    const nombre = String(getCampo(p, ['NOMPRODUCTO', 'nombre', 'name']) || '').toLowerCase();
                    const desc = String(getCampo(p, ['DESCRIPCION', 'descripcion']) || '').toLowerCase();
                    const marca = String(getCampo(p, ['MARCA', 'marca']) || '').toLowerCase();
                    return nombre.includes(termino) || desc.includes(termino) || marca.includes(termino);
                });
                renderizarTabla(filtrados);
            });
        }

        cargarProductos();
    }

    // Devuelve el primer valor definido entre varias posibles claves de campo
    function getCampo(obj, claves) {
        for (const clave of claves) {
            if (obj[clave] !== undefined && obj[clave] !== null) return obj[clave];
        }
        return undefined;
    }

    // Escapa texto para inserción segura en innerHTML
    function escapeHtml(valor) {
        const div = document.createElement('div');
        div.textContent = valor === undefined || valor === null ? '' : String(valor);
        return div.innerHTML;
    }

    async function cargarProductos() {
        try {
            const res = await fetch(`/api/productos?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            const data = await res.json();
            productosGlobal = Array.isArray(data) ? data : (data.productos || []);

            if (productosGlobal.length > 0) {
                console.log('Estructura de un producto:', productosGlobal[0]);
            }

            renderizarTabla(productosGlobal);
        } catch (err) {
            console.error('Error al cargar productos:', err);
        }
    }

    function renderizarTabla(lista) {
        const tabla = document.getElementById('tablaProductos');
        if (!tabla) return;
        let tbody = tabla.querySelector('tbody') || tabla.appendChild(document.createElement('tbody'));
        tbody.innerHTML = '';

        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">No se encontraron productos.</td></tr>`;
            return;
        }

        lista.forEach(p => {
            const id = getCampo(p, ['IDPRODUCTO', 'idproducto', 'id']);
            const nombre = getCampo(p, ['NOMPRODUCTO', 'nombre', 'name']);
            const descripcion = getCampo(p, ['DESCRIPCION', 'descripcion']);
            const precio = getCampo(p, ['PRECIO', 'precio']) || '0.00';
            const marca = getCampo(p, ['MARCA', 'marca']);
            const stock = getCampo(p, ['STOCK', 'stock']) || '0';
            const estado = getCampo(p, ['ESTADO', 'estado']);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(id ?? 'N/A')}</td>
                <td>${escapeHtml(nombre ?? 'N/A')}</td>
                <td>${escapeHtml(descripcion ?? 'N/A')}</td>
                <td>S/ ${escapeHtml(precio)}</td>
                <td>${escapeHtml(marca ?? 'N/A')}</td>
                <td>${escapeHtml(stock)}</td>
                <td>${escapeHtml(estado === 'A' ? 'Activo' : estado === 'I' ? 'Inactivo' : (estado ?? 'N/A'))}</td>
                <td>
                    <button class="btnEditar" data-id="${escapeHtml(id)}">Editar</button>
                    <button class="btnEliminar" data-id="${escapeHtml(id)}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function abrirModal(producto = null) {
        const form = document.getElementById('formProducto');
        const modal = document.getElementById('modalProducto');
        const titulo = modal ? modal.querySelector('h3') : null;

        if (form) form.reset();
        document.getElementById('idProducto').value = '';

        if (producto) {
            if (titulo) titulo.textContent = 'Editar Producto';
            document.getElementById('idProducto').value = getCampo(producto, ['IDPRODUCTO', 'idproducto', 'id']) ?? '';
            document.getElementById('idCategoria').value = getCampo(producto, ['IDCATEGORIA']) ?? '';
            document.getElementById('nombre').value = getCampo(producto, ['NOMPRODUCTO', 'nombre', 'name']) ?? '';
            document.getElementById('descripcion').value = getCampo(producto, ['DESCRIPCION', 'descripcion']) ?? '';
            document.getElementById('precio').value = getCampo(producto, ['PRECIO', 'precio']) ?? '';
            document.getElementById('marca').value = getCampo(producto, ['MARCA', 'marca']) ?? '';
            document.getElementById('stock').value = getCampo(producto, ['STOCK', 'stock']) ?? '';
            document.getElementById('stockMinimo').value = getCampo(producto, ['STOCK_MINIMO', 'stockMinimo']) ?? '';
            document.getElementById('estado').value = getCampo(producto, ['ESTADO', 'estado']) ?? 'A';
        } else {
            if (titulo) titulo.textContent = 'Nuevo Producto';
        }

        if (modal) modal.style.display = 'flex';
    }

    function cerrarModal() {
        const modal = document.getElementById('modalProducto');
        if (modal) modal.style.display = 'none';
    }

    function onEditar(id) {
        const producto = productosGlobal.find(p => {
            const pid = getCampo(p, ['IDPRODUCTO', 'idproducto', 'id']);
            return String(pid) === String(id);
        });
        if (!producto) {
            console.error('Producto no encontrado para editar:', id);
            return;
        }
        abrirModal(producto);
    }

    async function onEliminar(id) {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

        try {
            const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            await cargarProductos();
        } catch (err) {
            console.error('Error al eliminar producto:', err);
            alert('No se pudo eliminar el producto.');
        }
    }

    async function onSubmitForm(e) {
        e.preventDefault();

        const idProducto = document.getElementById('idProducto').value;
        const payload = {
            idcategoria: parseInt(document.getElementById('idCategoria').value, 10) || null,
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            precio: parseFloat(document.getElementById('precio').value) || 0,
            marca: document.getElementById('marca').value.trim(),
            stock: parseInt(document.getElementById('stock').value, 10) || 0,
            stockMinimo: parseInt(document.getElementById('stockMinimo').value, 10) || 0,
            estado: document.getElementById('estado').value
        };

        if (!payload.nombre) {
            alert('El nombre es obligatorio.');
            return;
        }

        const esEdicion = !!idProducto;
        const url = esEdicion ? `/api/productos/${idProducto}` : '/api/productos';
        const method = esEdicion ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

            cerrarModal();
            await cargarProductos();
        } catch (err) {
            console.error('Error al guardar producto:', err);
            alert('No se pudo guardar el producto.');
        }
    }

    initProductos();
})();