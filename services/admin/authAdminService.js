const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usuarioModel = require("../../models/usuarioModel");

const login = async (login, password) => {

    const usuario = await usuarioModel.findByLogin(login);

    if (!usuario) {
        throw new Error("Usuario no encontrado");
    }

    // Contraseña en texto plano
    if (usuario.HASH_CLAVE === password) {

        const token = jwt.sign(
            {
                id: usuario.IDUSUARIO,
                login: usuario.LOGEO,
                rol: usuario.IDTIPO_USUARIO
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return {
            message: "Login exitoso",
            token,
            usuario: {
                id: usuario.IDUSUARIO,
                login: usuario.LOGEO,
                rol: usuario.IDTIPO_USUARIO
            }
        };
    }

    // Contraseña con bcrypt
    const coincide = await bcrypt.compare(password, usuario.HASH_CLAVE);

    if (!coincide) {
        throw new Error("Contraseña incorrecta");
    }

    const token = jwt.sign(
        {
            id: usuario.IDUSUARIO,
            login: usuario.LOGEO,
            rol: usuario.IDTIPO_USUARIO
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
    );

    return {
        message: "Login exitoso",
        token,
        usuario: {
            id: usuario.IDUSUARIO,
            login: usuario.LOGEO,
            rol: usuario.IDTIPO_USUARIO
        }
    };

};

module.exports = {
    login
};