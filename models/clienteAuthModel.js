const { getConnection, sql } = require('../config/db');

const verificarClienteExiste = async (documento) => {
    const pool = await getConnection();
    const result = await pool.request()
        .input('documento', sql.VarChar, documento)
        .query(`
            SELECT C.IDCLIENTE, P.DNI, E.RUC 
            FROM CLIENTE C
            LEFT JOIN PERSONA P ON C.IDPERSONA = P.IDPERSONA
            LEFT JOIN EMPRESA E ON C.IDEMPRESA = E.IDEMPRESA
            WHERE P.DNI = @documento OR E.RUC = @documento
        `);
    return result.recordset[0];
};

const obtenerLoginCliente = async (documento) => {
    const pool = await getConnection();
    const result = await pool.request()
        .input('documento', sql.VarChar, documento)
        .query(`
            SELECT L.ID_LOGIN, L.IDCLIENTE, L.PASSWORD_HASH, L.ESTADO,
                   P.NOMBRES, E.RAZON_SOCIAL
            FROM LOGIN_CLIENTE L
            INNER JOIN CLIENTE C ON L.IDCLIENTE = C.IDCLIENTE
            LEFT JOIN PERSONA P ON C.IDPERSONA = P.IDPERSONA
            LEFT JOIN EMPRESA E ON C.IDEMPRESA = E.IDEMPRESA
            WHERE P.DNI = @documento OR E.RUC = @documento
        `);
    return result.recordset[0];
};

const crearLoginCliente = async (idCliente, passwordHash) => {
    const pool = await getConnection();
    await pool.request()
        .input('idCliente', sql.Int, idCliente)
        .input('passwordHash', sql.VarChar, passwordHash)
        .query(`
            INSERT INTO LOGIN_CLIENTE (IDCLIENTE, PASSWORD_HASH, ESTADO, ULTIMO_ACCESO)
            VALUES (@idCliente, @passwordHash, 'A', GETDATE())
        `);
};

module.exports = { verificarClienteExiste, obtenerLoginCliente, crearLoginCliente };