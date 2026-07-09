const { sql, getConnection } = require('../config/db');

class ClienteModel {
static async obtenerTodos() {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                c.IDCLIENTE, 
                c.ESTADO,
                p.DNI, 
                p.NOMBRES, 
                p.APEPATERNO, 
                p.APEMATERNO,
                e.RUC, 
                e.RAZON_SOCIAL,
                COALESCE(p.CELULAR, e.TELEFONO) AS TELEFONO,
                COALESCE(p.DIRECCION, e.DIRECCION) AS DIRECCION
            FROM CLIENTE c
            LEFT JOIN PERSONA p ON c.IDPERSONA = p.IDPERSONA
            LEFT JOIN EMPRESA e ON c.IDEMPRESA = e.IDEMPRESA
        `);
        return result.recordset;
    } catch (error) {
        console.error("Error en Modelo obtenerTodos:", error);
        throw error;
    }
}

static async crearClienteNatural(datos) {
    try {
        const pool = await getConnection();
        const query = `
            DECLARE @NuevoIdPersona INT;
            
            INSERT INTO PERSONA (IDDISTRITO, NOMBRES, APEPATERNO, APEMATERNO, DNI, GENERO, DIRECCION, CELULAR, CORREO, ESTADO)
            VALUES (@idDistrito, @nombres, @apePaterno, @apeMaterno, @dni, @genero, @direccion, @celular, @correo, 'A');
            
            SET @NuevoIdPersona = SCOPE_IDENTITY();
            
            INSERT INTO CLIENTE (IDPERSONA, IDEMPRESA, ESTADO)
            VALUES (@NuevoIdPersona, NULL, 'A');
        `;
        
        await pool.request()
            .input('idDistrito', sql.Int, datos.idDistrito || 33)
            .input('nombres', sql.VarChar, datos.nombres)
            .input('apePaterno', sql.VarChar, datos.apePaterno)
            .input('apeMaterno', sql.VarChar, datos.apeMaterno)
            .input('dni', sql.Char(8), datos.dni)
            .input('genero', sql.Char(1), datos.genero || 'M')
            .input('direccion', sql.NVarChar, datos.direccion || null)
            .input('celular', sql.Char(9), datos.celular || null)
            .input('correo', sql.VarChar, datos.correo || null)
            .query(query);
            
        return true;
    } catch (error) {
        console.error("Error en Modelo crearClienteNatural:", error);
        throw error;
    }
}

    static async crearClienteJuridico(datos) {
        try {
            const pool = await getConnection();
            const query = `
                DECLARE @NuevoIdEmpresa INT;
                
                INSERT INTO EMPRESA (RUC, RAZON_SOCIAL, DIRECCION, TELEFONO, ESTADO)
                VALUES (@ruc, @razonSocial, @direccion, @telefono, 'A');
                
                SET @NuevoIdEmpresa = SCOPE_IDENTITY();
                
                INSERT INTO CLIENTE (IDPERSONA, IDEMPRESA, ESTADO)
                VALUES (NULL, @NuevoIdEmpresa, 'A');
            `;
            
            await pool.request()
                .input('ruc', sql.Char(11), datos.ruc)
                .input('razonSocial', sql.NVarChar, datos.razonSocial)
                .input('direccion', sql.NVarChar, datos.direccion || null)
                .input('telefono', sql.Char(9), datos.telefono || null)
                .query(query);
                
            return true;
        } catch (error) {
            console.error("Error en Modelo crearClienteJuridico:", error);
            throw error;
        }
    }

static async actualizarClienteNatural(id,datos){

    const pool=await getConnection();

    await pool.request()

    .input("id",sql.Int,id)

    .input("nombres",sql.VarChar,datos.nombres)

    .input("apePaterno",sql.VarChar,datos.apePaterno)

    .input("apeMaterno",sql.VarChar,datos.apeMaterno)

    .input("celular",sql.Char(9),datos.celular)

    .input("direccion",sql.NVarChar,datos.direccion)

    .query(`

        UPDATE PERSONA

        SET

        NOMBRES=@nombres,

        APEPATERNO=@apePaterno,

        APEMATERNO=@apeMaterno,

        CELULAR=@celular,

        DIRECCION=@direccion

        WHERE IDPERSONA=(

            SELECT IDPERSONA

            FROM CLIENTE

            WHERE IDCLIENTE=@id

        )

    `);

}
static async actualizarClienteJuridico(id,datos){

    const pool=await getConnection();

    await pool.request()

    .input("id",sql.Int,id)

    .input("razonSocial",sql.NVarChar,datos.razonSocial)

    .input("telefono",sql.Char(9),datos.telefono)

    .input("direccion",sql.NVarChar,datos.direccion)

    .query(`

        UPDATE EMPRESA

        SET

        RAZON_SOCIAL=@razonSocial,

        TELEFONO=@telefono,

        DIRECCION=@direccion

        WHERE IDEMPRESA=(

            SELECT IDEMPRESA

            FROM CLIENTE

            WHERE IDCLIENTE=@id

        )

    `);

}
static async cambiarEstadoCliente(id) {
    const pool = await getConnection();

    await pool.request()
        .input("id", sql.Int, id)
        .query(`
            UPDATE CLIENTE
            SET ESTADO =
                CASE
                    WHEN ESTADO = 'A' THEN 'I'
                    ELSE 'A'
                END
            WHERE IDCLIENTE = @id
        `);
}
}
module.exports = ClienteModel;