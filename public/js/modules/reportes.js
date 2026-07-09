(function () {

    let datosReporte = [];

    function init_reportes() {

        document.addEventListener("DOMContentLoaded", setup);

        if (document.readyState !== "loading") {

            setup();

        }

    }

    function setup() {

        const btnGenerar = document.getElementById("btnGenerarReporte");

        if (btnGenerar) {

            btnGenerar.onclick = generarReporte;

        }

        const btnPDF = document.getElementById("btnPDF");

        if (btnPDF) {

            btnPDF.onclick = exportarPDF;

        }

        const btnExcel = document.getElementById("btnExcel");

        if (btnExcel) {

            btnExcel.onclick = exportarExcel;

        }

    }

    async function generarReporte() {

        const tipo = document.getElementById("tipoReporte").value;

        let url = "";

        switch (tipo) {

    case "ventas": {

        const inicio = document.getElementById("fechaInicio").value;

        const fin = document.getElementById("fechaFin").value;

        const params = new URLSearchParams();

        if (inicio) params.append("inicio", inicio);

        if (fin) params.append("fin", fin);

        url = "/api/ventas/reporte";

        if (params.toString()) {

            url += "?" + params.toString();

        }

        break;

    }

    case "empleados":

        url = "/api/empleados";

        break;

    case "productos":

        url = "/api/productos";

        break;

    case "reservas":

        url = "/api/reservas";

        break;

}

        try {

const respuesta = await fetch(url);

const resultado = await respuesta.json();

if (tipo === "ventas") {

    datosReporte = Array.isArray(resultado)
        ? resultado
        : [];

}
else if (Array.isArray(resultado)) {

    datosReporte = resultado;

}
else if (Array.isArray(resultado.rows)) {

    datosReporte = resultado.rows;

}
else {

    datosReporte = [];

}

mostrarReporte(datosReporte);
        }

        catch (error) {

            console.error(error);

            alert("No se pudo generar el reporte.");

        }

    }

    function mostrarReporte(datos) {

        const contenedor = document.getElementById("contenedorReporte");

        if (!datos.length) {

            contenedor.innerHTML = "<h3>No hay información.</h3>";

            return;

        }

        const columnas = Object.keys(datos[0]);

        let html = "<table class='tabla-reportes'>";

        html += "<thead><tr>";

        columnas.forEach(col => {

            html += `<th>${col}</th>`;

        });

        html += "</tr></thead>";

        html += "<tbody>";

        datos.forEach(fila => {

            html += "<tr>";

            columnas.forEach(col => {

                html += `<td>${fila[col] ?? ""}</td>`;

            });

            html += "</tr>";

        });

        html += "</tbody></table>";

        contenedor.innerHTML = html;

    }
        function exportarExcel() {

        if (!datosReporte.length) {

            alert("Primero genera un reporte.");

            return;

        }

        const columnas = Object.keys(datosReporte[0]);

        let csv = columnas.join(",") + "\n";

        datosReporte.forEach(fila => {

            csv += columnas.map(col => {

                let valor = fila[col] ?? "";

                valor = String(valor).replace(/"/g, '""');

                return `"${valor}"`;

            }).join(",");

            csv += "\n";

        });

        const blob = new Blob([csv], {

            type: "text/csv;charset=utf-8;"

        });

        const enlace = document.createElement("a");

        enlace.href = URL.createObjectURL(blob);

        enlace.download = "reporte.csv";

        enlace.click();

    }


   function exportarPDF() {

    if (!datosReporte.length) {

        alert("Primero genera un reporte.");

        return;

    }

    const { jsPDF } = window.jspdf;

const doc = new jsPDF({

    orientation: "landscape",

    unit: "mm",

    format: "a4"

});
    const tipoReporte = document.getElementById("tipoReporte");

    const nombreReporte = tipoReporte.options[tipoReporte.selectedIndex].text;

    // ==========================================
    // ENCABEZADO
    // ==========================================

    doc.setFont("helvetica", "bold");

    doc.setFontSize(20);

    doc.text("CAPI HOUSE", 14, 18);

    doc.setFontSize(13);

    doc.text(`Reporte de ${nombreReporte}`, 14, 28);

    doc.setFont("helvetica", "normal");

    doc.setFontSize(10);

    doc.text(

        `Fecha de generación: ${new Date().toLocaleString()}`,

        14,

        36

    );

    // ==========================================
    // TABLA
    // ==========================================

    const columnas = Object.keys(datosReporte[0]);

    const filas = datosReporte.map(item =>

        columnas.map(col => item[col])

    );

    doc.autoTable({

        head: [columnas],

        body: filas,

        startY: 45,

        theme: "grid",

        headStyles: {

            fillColor: [34, 34, 34],

            textColor: 255,

            fontStyle: "bold"

        },

        styles: {

            fontSize: 8,

            cellPadding: 3

        },

        alternateRowStyles: {

            fillColor: [245, 245, 245]

        }

    });

    // ==========================================
    // PIE DE PÁGINA
    // ==========================================

    const paginas = doc.internal.getNumberOfPages();

    for (let i = 1; i <= paginas; i++) {

        doc.setPage(i);

        doc.setFontSize(9);

        doc.text(

            `Página ${i} de ${paginas}`,

            250,

            200

        );

    }

    doc.save(`Reporte_${nombreReporte}.pdf`);

}


    window.init_reportes = init_reportes;

    init_reportes();

})();