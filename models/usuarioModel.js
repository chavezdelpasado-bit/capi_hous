const { sql, getConnection } = require("../config/db");

const findByLogin = async (login) => {
    const pool = await getConnection();

    const result = await pool.request()
        .input("login", sql.VarChar(50), login)
        .query(`
            SELECT *
            FROM USUARIO
            WHERE LOGEO = @login
            AND ESTADO = 'A'
        `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
};

module.exports = {
    findByLogin
};