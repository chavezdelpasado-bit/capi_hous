const adminService = require("./admin/authAdminService");
const clienteService = require("./cliente/authClienteService");
const empleadoService = require("./empleado/authEmpleadoService");

const login = async (login, password, rol) => {

    switch (rol) {

        case "Administrador":
            return await adminService.login(login, password);

        case "Cliente":
            return await clienteService.login(login, password);

        case "Empleado":
            return await empleadoService.login(login, password);

        default:
            throw new Error("Rol no válido");

    }

};

module.exports = {
    login
};