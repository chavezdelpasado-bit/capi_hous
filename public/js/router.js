// ===============================
// CAPI HOUSE ROUTER - OPTIMIZADO
// ===============================

async function cargarModulo(modulo) {
    const contenedor = document.getElementById("contenido");

    try {
        const respuesta = await fetch(`/modules/${modulo}.html`);
        if (!respuesta.ok) throw new Error("No existe el módulo");

        const html = await respuesta.text();
        contenedor.innerHTML = html;

        // 1. Limpiamos el script anterior
        const scriptAnterior = document.getElementById("module-script");
        if (scriptAnterior) scriptAnterior.remove();

        // 2. Creamos el nuevo script
        const script = document.createElement("script");
        script.src = `/js/modules/${modulo}.js`;
        script.id = "module-script";

        // 3. Carga automática del inicializador del módulo
        script.onload = () => {
            console.log(`Script ${modulo}.js cargado.`);
            
            // Centralizador: Si el JS del módulo tiene una función llamada 'init', la ejecutamos
            // Esto evita tener que poner "if (modulo === 'clientes')" cada vez
            const funcionInit = `init_${modulo}`;
            if (typeof window[funcionInit] === 'function') {
                window[funcionInit]();
            } else if (modulo === 'clientes' && typeof window.cargarClientes === 'function') {
                window.cargarClientes(); // Backward compatibility
            }
        };

        script.onerror = () => {
            console.warn(`Módulo ${modulo} sin script asociado.`);
        };

        document.body.appendChild(script);

    } catch (error) {
        contenedor.innerHTML = `
            <div style="color:white; padding:50px; font-size:22px; text-align:center;">
                Error cargando el módulo <b>${modulo}</b>
            </div>
        `;
    }
}