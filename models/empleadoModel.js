const { sql, getConnection } = require('../config/db');

class EmpleadoModel {
  static async obtenerTodos() {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        e.IDEMPLEADO, e.SALARIO, e.TURNO, e.ESTADO,
        p.IDPERSONA, p.DNI, p.NOMBRES, p.APEPATERNO, p.APEMATERNO,
        p.CELULAR, p.CORREO, p.DIRECCION, p.FECNAC, p.GENERO,
        c.IDCARGO, c.NOMCARGO,
        ct.IDCONTRATO, ct.NOMCONTRATO
      FROM EMPLEADO e
      INNER JOIN PERSONA p ON e.IDPERSONA = p.IDPERSONA
      INNER JOIN CARGO c ON e.IDCARGO = c.IDCARGO
      INNER JOIN CONTRATO ct ON e.IDCONTRATO = ct.IDCONTRATO
      ORDER BY p.NOMBRES
    `);
    return result.recordset;
  }

  static async obtenerCargos() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT IDCARGO, NOMCARGO FROM CARGO WHERE ESTADO = 'A' ORDER BY NOMCARGO`);
    return result.recordset;
  }

  static async obtenerContratos() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT IDCONTRATO, NOMCONTRATO FROM CONTRATO WHERE ESTADO = 'A' ORDER BY NOMCONTRATO`);
    return result.recordset;
  }

  static async crear(datos) {
    const pool = await getConnection();
    const query = `
      DECLARE @NuevoIdPersona INT;

      INSERT INTO PERSONA (IDDISTRITO, NOMBRES, APEPATERNO, APEMATERNO, DNI, GENERO, DIRECCION, CELULAR, CORREO, ESTADO)
      VALUES (@idDistrito, @nombres, @apePaterno, @apeMaterno, @dni, @genero, @direccion, @celular, @correo, 'A');

      SET @NuevoIdPersona = SCOPE_IDENTITY();

      INSERT INTO EMPLEADO (IDPERSONA, IDCONTRATO, IDCARGO, SALARIO, TURNO, ESTADO)
      OUTPUT INSERTED.IDEMPLEADO
      VALUES (@NuevoIdPersona, @idContrato, @idCargo, @salario, @turno, 'A');
    `;
    const result = await pool.request()
      .input('idDistrito', sql.Int, datos.idDistrito || 33)
      .input('nombres', sql.VarChar, datos.nombres)
      .input('apePaterno', sql.VarChar, datos.apePaterno)
      .input('apeMaterno', sql.VarChar, datos.apeMaterno)
      .input('dni', sql.Char(8), datos.dni)
      .input('genero', sql.Char(1), datos.genero || 'M')
      .input('direccion', sql.NVarChar, datos.direccion || null)
      .input('celular', sql.Char(9), datos.celular || null)
      .input('correo', sql.VarChar, datos.correo || null)
      .input('idContrato', sql.Int, datos.idContrato)
      .input('idCargo', sql.Int, datos.idCargo)
      .input('salario', sql.Decimal(10, 2), datos.salario)
      .input('turno', sql.VarChar, datos.turno || null)
      .query(query);
    return result.recordset[0];
  }

  static async actualizar(id, datos) {
    const pool = await getConnection();
    const query = `
      UPDATE EMPLEADO SET
        IDCONTRATO = @idContrato,
        IDCARGO = @idCargo,
        SALARIO = @salario,
        TURNO = @turno
      WHERE IDEMPLEADO = @id;

      UPDATE p SET
        NOMBRES = @nombres,
        APEPATERNO = @apePaterno,
        APEMATERNO = @apeMaterno,
        CELULAR = @celular,
        DIRECCION = @direccion,
        CORREO = @correo
      FROM PERSONA p
      INNER JOIN EMPLEADO e ON e.IDPERSONA = p.IDPERSONA
      WHERE e.IDEMPLEADO = @id;
    `;
    await pool.request()
      .input('id', sql.Int, id)
      .input('idContrato', sql.Int, datos.idContrato)
      .input('idCargo', sql.Int, datos.idCargo)
      .input('salario', sql.Decimal(10, 2), datos.salario)
      .input('turno', sql.VarChar, datos.turno || null)
      .input('nombres', sql.VarChar, datos.nombres)
      .input('apePaterno', sql.VarChar, datos.apePaterno)
      .input('apeMaterno', sql.VarChar, datos.apeMaterno)
      .input('celular', sql.Char(9), datos.celular || null)
      .input('direccion', sql.NVarChar, datos.direccion || null)
      .input('correo', sql.VarChar, datos.correo || null)
      .query(query);
    return true;
  }

  static async cambiarEstado(id, estado) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.Char(1), estado)
      .query(`UPDATE EMPLEADO SET ESTADO = @estado WHERE IDEMPLEADO = @id`);
    return true;
  }

  static async eliminar(id) {
    const pool = await getConnection();
    // Borrado lógico: preserva historial de ventas/detalle_pedido ligado al IDUSUARIO del empleado
    await pool.request()
      .input('id', sql.Int, id)
      .query(`UPDATE EMPLEADO SET ESTADO = 'I' WHERE IDEMPLEADO = @id`);
    return true;
  }
}

module.exports = EmpleadoModel;