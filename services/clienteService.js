const ClienteModel = require('../models/clienteModel');

class ClienteService {
    static async listarClientes() {
        return await ClienteModel.obtenerTodos();
    }

    static async registrarCliente(datos) {
        if (datos.tipoCliente === 'NATURAL') {
            if (!datos.dni || !datos.nombres || !datos.apePaterno || !datos.apeMaterno) {
                throw new Error("Faltan datos obligatorios: DNI, Nombres o Apellidos.");
            }
            await ClienteModel.crearClienteNatural(datos);
        } else if (datos.tipoCliente === 'JURIDICO') {
            if (!datos.ruc || !datos.razonSocial) {
                throw new Error("Faltan datos obligatorios: RUC o Razón Social.");
            }
            await ClienteModel.crearClienteJuridico(datos);
        } else {
            throw new Error("Tipo de cliente no válido.");
        }
        return { message: "Cliente registrado con éxito en Capi House" };
    }
static async actualizarCliente(id, datos){

    if(datos.tipoCliente==="NATURAL"){

        await ClienteModel.actualizarClienteNatural(id,datos);

    }else{

        await ClienteModel.actualizarClienteJuridico(id,datos);

    }

    return{
        message:"Cliente actualizado correctamente"
    };
}

static async cambiarEstadoCliente(id) {

    await ClienteModel.cambiarEstadoCliente(id);

    return {
        message: "Estado del cliente actualizado correctamente"
    };

}
}
module.exports = ClienteService;