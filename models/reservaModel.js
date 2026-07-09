const { sql, getConnection } = require('../config/db');

class ReservaModel {
  static async obtenerTodas() {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        r.IDRESERVA, r.FECHARESERVA, r.CANTIDAD_PERSONAS, r.ESTADO,
        r.IDCLIENTE,
        COALESCE(p.NOMBRES + ' ' + p.APEPATERNO + ' ' + p.APEMATERNO, e.RAZON_SOCIAL) AS CLIENTE_NOMBRE,
        COALESCE(p.CELULAR, e.TELEFONO) AS CLIENTE_TELEFONO,
        r.IDZONA, z.NOMAREA AS ZONA_NOMBRE,
        r.IDMESA, m.NUNMESA, m.NUMPISO,
        r.IDUSUARIO
      FROM RESERVAS r
      INNER JOIN CLIENTE c ON r.IDCLIENTE = c.IDCLIENTE
      LEFT JOIN PERSONA p ON c.IDPERSONA = p.IDPERSONA
      LEFT JOIN EMPRESA e ON c.IDEMPRESA = e.IDEMPRESA
      INNER JOIN ZONAS z ON r.IDZONA = z.IDZONA
      LEFT JOIN MESAS m ON r.IDMESA = m.IDMESA
      ORDER BY r.FECHARESERVA DESC
    `);
    return result.recordset;
  }

  static async obtenerZonas() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT IDZONA, NOMAREA FROM ZONAS WHERE ESTADO = 'A' ORDER BY NOMAREA`);
    return result.recordset;
  }

  static async obtenerMesas() {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT IDMESA, NUMPISO, NUNMESA, CAPACIDAD FROM MESAS WHERE ESTADO = 'A' ORDER BY NUMPISO, NUNMESA`);
    return result.recordset;
  }

  static async crear(datos) {
    const pool = await getConnection();
    const query = `
      INSERT INTO RESERVAS (IDCLIENTE, IDZONA, IDMESA, IDUSUARIO, FECHARESERVA, CANTIDAD_PERSONAS, ESTADO)
      OUTPUT INSERTED.IDRESERVA
      VALUES (@idCliente, @idZona, @idMesa, @idUsuario, @fechaReserva, @cantidadPersonas, 'P');
    `;
    const result = await pool.request()
      .input('idCliente', sql.Int, datos.idCliente)
      .input('idZona', sql.Int, datos.idZona)
      .input('idMesa', sql.Int, datos.idMesa || null)
      .input('idUsuario', sql.Int, datos.idUsuario || null)
      .input('fechaReserva', sql.DateTime, datos.fechaReserva)
      .input('cantidadPersonas', sql.Int, datos.cantidadPersonas)
      .query(query);
    return result.recordset[0];
  }

  static async actualizar(id, datos) {
    const pool = await getConnection();
    const query = `
      UPDATE RESERVAS SET
        IDCLIENTE = @idCliente,
        IDZONA = @idZona,
        IDMESA = @idMesa,
        FECHARESERVA = @fechaReserva,
        CANTIDAD_PERSONAS = @cantidadPersonas
      WHERE IDRESERVA = @id;
    `;
    await pool.request()
      .input('id', sql.Int, id)
      .input('idCliente', sql.Int, datos.idCliente)
      .input('idZona', sql.Int, datos.idZona)
      .input('idMesa', sql.Int, datos.idMesa || null)
      .input('fechaReserva', sql.DateTime, datos.fechaReserva)
      .input('cantidadPersonas', sql.Int, datos.cantidadPersonas)
      .query(query);
    return true;
  }

  static async cambiarEstado(id, estado) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.Char(1), estado)
      .query(`UPDATE RESERVAS SET ESTADO = @estado WHERE IDRESERVA = @id`);
    return true;
  }

  static async eliminar(id) {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM RESERVAS WHERE IDRESERVA = @id`);
    return true;
  }
}

module.exports = ReservaModel;