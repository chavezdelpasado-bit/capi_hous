(function () {

    let empleadosGlobal = [];
    let cargosGlobal = [];
    let contratosGlobal = [];

    function init_empleados() {

        document.addEventListener("DOMContentLoaded", setup);

        if (document.readyState !== "loading") {

            setup();

        }

    }

    async function setup() {

        const btnNuevo = document.getElementById("btnNuevoEmpleado");

        if (btnNuevo) {

            btnNuevo.onclick = () => abrirModal();

        }

        const btnCancelar = document.getElementById("btnCancelar");

        if (btnCancelar) {

            btnCancelar.onclick = cerrarModal;

        }

        const modal = document.getElementById("modalEmpleado");

        if (modal) {

            modal.addEventListener("click", (e) => {

                if (e.target === modal) {

                    cerrarModal();

                }

            });

        }

        const form = document.getElementById("formEmpleado");

        if (form) {

            form.addEventListener("submit", guardarEmpleado);

        }

        document.getElementById("txtBuscarEmpleado")
            .addEventListener("input", buscarEmpleado);

        await cargarCombos();

        await cargarEmpleados();

    }

    async function cargarCombos() {

        try {

            const cargos = await fetch("/api/empleados/cargos");

            cargosGlobal = await cargos.json();

            const contratos = await fetch("/api/empleados/contratos");

            contratosGlobal = await contratos.json();

            llenarSelect("idCargo", cargosGlobal, "IDCARGO", "NOMCARGO");

            llenarSelect("idContrato", contratosGlobal, "IDCONTRATO", "NOMCONTRATO");

        } catch (error) {

            console.error(error);

        }

    }

    function llenarSelect(id, datos, value, text) {

        const select = document.getElementById(id);

        select.innerHTML = "";

        datos.forEach(item => {

            select.innerHTML += `

                <option value="${item[value]}">

                    ${item[text]}

                </option>

            `;

        });

    }

    async function cargarEmpleados() {

        try {

            const respuesta = await fetch("/api/empleados");

            empleadosGlobal = await respuesta.json();

            renderizarTabla(empleadosGlobal);

        } catch (error) {

            console.error(error);

        }

    }

  function renderizarTabla(lista) {

    const tabla = document.getElementById("tablaEmpleados");

    tabla.innerHTML = "";

    lista.forEach(emp => {

        tabla.innerHTML += `

            <tr>

                <td>${emp.DNI}</td>

                <td>

                    ${emp.NOMBRES}
                    ${emp.APEPATERNO}
                    ${emp.APEMATERNO}

                </td>

                <td>${emp.NOMCARGO}</td>

                <td>${emp.NOMCONTRATO}</td>

                <td>S/. ${emp.SALARIO}</td>

                <td>${emp.TURNO ?? "-"}</td>

                <td>

                    ${emp.ESTADO === "A"

                        ? '<span class="estado-activo">Activo</span>'

                        : '<span class="estado-inactivo">Inactivo</span>'}

                </td>

                <td>

                    <button

                        class="btnEditar"

                        onclick="editarEmpleado(${emp.IDEMPLEADO})"

                    >

                        Editar

                    </button>

                    <button

                        class="${emp.ESTADO === 'A' ? 'btnEliminar' : 'btnActivar'}"

                        onclick="cambiarEstadoEmpleado(${emp.IDEMPLEADO}, '${emp.ESTADO}')"

                    >

                        ${emp.ESTADO === "A" ? "Desactivar" : "Activar"}

                    </button>

                </td>

            </tr>

        `;

    });

}
        function abrirModal(empleado = null) {

        document.getElementById("formEmpleado").reset();

        document.getElementById("idEmpleado").value = "";

        document.getElementById("tituloModal").textContent = "Nuevo Empleado";

        if (empleado) {

            document.getElementById("tituloModal").textContent = "Editar Empleado";

            document.getElementById("idEmpleado").value = empleado.IDEMPLEADO;

            document.getElementById("dni").value = empleado.DNI;

            document.getElementById("nombres").value = empleado.NOMBRES;

            document.getElementById("apePaterno").value = empleado.APEPATERNO;

            document.getElementById("apeMaterno").value = empleado.APEMATERNO;

            document.getElementById("celular").value = empleado.CELULAR || "";

            document.getElementById("correo").value = empleado.CORREO || "";

            document.getElementById("direccion").value = empleado.DIRECCION || "";

            document.getElementById("salario").value = empleado.SALARIO;

            document.getElementById("turno").value = empleado.TURNO || "";

            document.getElementById("idCargo").value = empleado.IDCARGO;

            document.getElementById("idContrato").value = empleado.IDCONTRATO;

        }

        document.getElementById("modalEmpleado").style.display = "flex";

    }

    function cerrarModal() {

        document.getElementById("modalEmpleado").style.display = "none";

    }

    function buscarEmpleado() {

        const texto = document
            .getElementById("txtBuscarEmpleado")
            .value
            .toLowerCase();

        const filtrados = empleadosGlobal.filter(emp => {

            const nombre = `${emp.NOMBRES} ${emp.APEPATERNO} ${emp.APEMATERNO}`.toLowerCase();

            return nombre.includes(texto)

                || emp.DNI.includes(texto);

        });

        renderizarTabla(filtrados);

    }

    async function guardarEmpleado(e) {

        e.preventDefault();

        const id = document.getElementById("idEmpleado").value;

        const datos = {

            dni: document.getElementById("dni").value,

            nombres: document.getElementById("nombres").value,

            apePaterno: document.getElementById("apePaterno").value,

            apeMaterno: document.getElementById("apeMaterno").value,

            celular: document.getElementById("celular").value,

            correo: document.getElementById("correo").value,

            direccion: document.getElementById("direccion").value,

            salario: document.getElementById("salario").value,

            turno: document.getElementById("turno").value,

            idCargo: document.getElementById("idCargo").value,

            idContrato: document.getElementById("idContrato").value

        };

        const url = id

            ? `/api/empleados/${id}`

            : "/api/empleados";

        const metodo = id

            ? "PUT"

            : "POST";

        try {

            const respuesta = await fetch(url, {

                method: metodo,

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(datos)

            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {

                alert(resultado.message);

                return;

            }

            cerrarModal();

            cargarEmpleados();

        }

        catch (error) {

            console.error(error);

        }

    }
        window.editarEmpleado = function (id) {

        const empleado = empleadosGlobal.find(e => e.IDEMPLEADO == id);

        if (!empleado) return;

        abrirModal(empleado);

    };


window.cambiarEstadoEmpleado = async function (id, estadoActual) {

    const nuevoEstado = estadoActual === "A" ? "I" : "A";

    const mensaje = estadoActual === "A"
        ? "¿Desea desactivar este empleado?"
        : "¿Desea activar este empleado?";

    if (!confirm(mensaje)) return;

    try {

        const respuesta = await fetch(`/api/empleados/${id}/estado`, {

            method: "PATCH",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                estado: nuevoEstado

            })

        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {

            alert(resultado.message || "Ocurrió un error.");

            return;

        }

        await cargarEmpleados();

    }

    catch (error) {

        console.error(error);

        alert("No se pudo cambiar el estado del empleado.");

    }

};


    window.abrirModal = abrirModal;

    window.cerrarModal = cerrarModal;

    window.guardarEmpleado = guardarEmpleado;

    window.buscarEmpleado = buscarEmpleado;

    window.init_empleados = init_empleados;


    init_empleados();

})();