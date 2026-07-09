const ClienteService = require('../services/clienteService');

class ClienteController {
    static async getClientes(req, res) {
        try {
            const clientes = await ClienteService.listarClientes();
            res.status(200).json(clientes);
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
        }
    }

    static async createCliente(req, res) {
        try {
            const response = await ClienteService.registrarCliente(req.body);
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
  static async updateCliente(req, res) {
    try {
        const response = await ClienteService.actualizarCliente(
            req.params.id,
            req.body
        );

        res.json(response);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
}

static async cambiarEstadoCliente(req, res) {
    try {

        const response = await ClienteService.cambiarEstadoCliente(req.params.id);

        res.json(response);

    } catch (error) {

        res.status(400).json({
            message: error.message
        });

    }
}


}

module.exports = ClienteController;