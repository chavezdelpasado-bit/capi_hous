// services/ventaService.js
// Capa de acceso a datos para el módulo de Ventas (POS + historial).
// Adaptado para utilizar la función getConnection centralizada de config/db.js

const { sql, getConnection } = require('../config/db');

// =====================================================
// CATÁLOGOS PARA EL POS
// =====================================================

async function getMesasDisponibles() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT M.IDMESA, M.NUMPISO, M.NUNMESA, M.CAPACIDAD,
      CASE WHEN P.IDPEDIDO IS NULL THEN 'LIBRE' ELSE 'OCUPADA' END AS ESTADO_MESA
    FROM MESAS M
    LEFT JOIN PEDIDOS P ON P.IDMESA = M.IDMESA AND P.ESTADO = 'P'
    WHERE M.ESTADO = 'A'
    ORDER BY M.NUMPISO, M.NUNMESA
  `);
  return result.recordset;
}

async function getZonas() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT IDZONA, NOMAREA FROM ZONAS WHERE ESTADO = 'A' ORDER BY NOMAREA
  `);
  return result.recordset;
}

async function getMetodosPago() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT IDMETODO_PAGO, NOMMETODO FROM METODO_PAGO WHERE ESTADO = 'A' ORDER BY NOMMETODO
  `);
  return result.recordset;
}

async function getCategorias() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT IDCATEGORIA, NOMCATEGORIA FROM CATEGORIA WHERE ESTADO = 'A' ORDER BY NOMCATEGORIA
  `);
  return result.recordset;
}

async function getProductos(idCategoria) {
  const pool = await getConnection();
  const req = pool.request();
  let where = "WHERE P.ESTADO = 'A'";
  if (idCategoria) {
    req.input('idCategoria', sql.Int, idCategoria);
    where += ' AND P.IDCATEGORIA = @idCategoria';
  }
  const result = await req.query(`
    SELECT P.IDPRODUCTO, P.NOMPRODUCTO, P.PRECIO, P.MARCA, P.IDCATEGORIA, C.NOMCATEGORIA
    FROM PRODUCTO P
    INNER JOIN CATEGORIA C ON C.IDCATEGORIA = P.IDCATEGORIA
    ${where}
    ORDER BY C.NOMCATEGORIA, P.NOMPRODUCTO
  `);
  return result.recordset;
}

async function buscarClientes(termino) {
  const pool = await getConnection();
  const req = pool.request();
  req.input('termino', sql.VarChar, `%${termino || ''}%`);
  const result = await req.query(`
    SELECT TOP 20
      C.IDCLIENTE,
      COALESCE(PE.NOMBRES + ' ' + PE.APEPATERNO + ' ' + PE.APEMATERNO, EM.RAZON_SOCIAL) AS NOMBRE,
      PE.DNI, EM.RUC
    FROM CLIENTE C
    LEFT JOIN PERSONA PE ON PE.IDPERSONA = C.IDPERSONA
    LEFT JOIN EMPRESA EM ON EM.IDEMPRESA = C.IDEMPRESA
    WHERE C.ESTADO = 'A' AND (
      PE.NOMBRES LIKE @termino OR PE.APEPATERNO LIKE @termino OR PE.APEMATERNO LIKE @termino
      OR PE.DNI LIKE @termino OR EM.RAZON_SOCIAL LIKE @termino OR EM.RUC LIKE @termino
    )
    ORDER BY NOMBRE
  `);
  return result.recordset;
}

// =====================================================
// HISTORIAL DE VENTAS
// =====================================================

async function listarVentas({ desde, hasta, documento, idCliente, page = 1, pageSize = 20 }) {
  const pool = await getConnection();
  const req = pool.request();
  const offset = (Math.max(1, page) - 1) * pageSize;

  let where = "WHERE V.ESTADO = '1'";
  if (desde) { req.input('desde', sql.Date, desde); where += ' AND CONVERT(date, V.FECHAVENTA) >= @desde'; }
  if (hasta) { req.input('hasta', sql.Date, hasta); where += ' AND CONVERT(date, V.FECHAVENTA) <= @hasta'; }
  if (documento) { req.input('documento', sql.Char(1), documento); where += ' AND V.DOCUMENTO = @documento'; }
  if (idCliente) { req.input('idCliente', sql.Int, idCliente); where += ' AND V.IDCLIENTE = @idCliente'; }

  req.input('offset', sql.Int, offset);
  req.input('pageSize', sql.Int, pageSize);

  const result = await req.query(`
    SELECT
      V.IDVENTAS, V.FECHAVENTA, V.DOCUMENTO, V.MONTOTOTAL, V.SUBTOTAL, V.IGV, V.TOTALPAGAR, V.ESTADO,
      MP.NOMMETODO,
      COALESCE(PE.NOMBRES + ' ' + PE.APEPATERNO + ' ' + PE.APEMATERNO, EM.RAZON_SOCIAL) AS CLIENTE,
      M.NUMPISO, M.NUNMESA,
      B.SERIE AS SERIE_BOLETA, B.NUMERO AS NUMERO_BOLETA,
      F.SERIE AS SERIE_FACTURA, F.NUMERO AS NUMERO_FACTURA,
      COUNT(*) OVER() AS TOTAL_ROWS
    FROM VENTAS V
    INNER JOIN CLIENTE C ON C.IDCLIENTE = V.IDCLIENTE
    LEFT JOIN PERSONA PE ON PE.IDPERSONA = C.IDPERSONA
    LEFT JOIN EMPRESA EM ON EM.IDEMPRESA = C.IDEMPRESA
    INNER JOIN METODO_PAGO MP ON MP.IDMETODO_PAGO = V.IDMETODO_PAGO
    INNER JOIN PEDIDOS P ON P.IDPEDIDO = V.IDPEDIDO
    INNER JOIN MESAS M ON M.IDMESA = P.IDMESA
    LEFT JOIN BOLETA B ON B.IDVENTAS = V.IDVENTAS
    LEFT JOIN FACTURA F ON F.IDVENTAS = V.IDVENTAS
    ${where}
    ORDER BY V.FECHAVENTA DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  const rows = result.recordset;
  const total = rows.length ? rows[0].TOTAL_ROWS : 0;
  return { rows, total, page, pageSize };
}

async function obtenerDetalleVenta(idVentas) {
  const pool = await getConnection();
  const req = pool.request();
  req.input('idVentas', sql.Int, idVentas);

  const cabecera = await req.query(`
    SELECT V.*, MP.NOMMETODO,
      COALESCE(PE.NOMBRES + ' ' + PE.APEPATERNO + ' ' + PE.APEMATERNO, EM.RAZON_SOCIAL) AS CLIENTE,
      M.NUMPISO, M.NUNMESA,
      B.SERIE AS SERIE_BOLETA, B.NUMERO AS NUMERO_BOLETA,
      F.SERIE AS SERIE_FACTURA, F.NUMERO AS NUMERO_FACTURA
    FROM VENTAS V
    INNER JOIN CLIENTE C ON C.IDCLIENTE = V.IDCLIENTE
    LEFT JOIN PERSONA PE ON PE.IDPERSONA = C.IDPERSONA
    LEFT JOIN EMPRESA EM ON EM.IDEMPRESA = C.IDEMPRESA
    INNER JOIN METODO_PAGO MP ON MP.IDMETODO_PAGO = V.IDMETODO_PAGO
    INNER JOIN PEDIDOS P ON P.IDPEDIDO = V.IDPEDIDO
    INNER JOIN MESAS M ON M.IDMESA = P.IDMESA
    LEFT JOIN BOLETA B ON B.IDVENTAS = V.IDVENTAS
    LEFT JOIN FACTURA F ON F.IDVENTAS = V.IDVENTAS
    WHERE V.IDVENTAS = @idVentas
  `);

  const detalle = await req.query(`
    SELECT DP.IDDETALLE_PEDIDO, DP.CANTIDAD, DP.PRECIO, (DP.CANTIDAD * DP.PRECIO) AS TOTAL_LINEA,
      PR.NOMPRODUCTO, Z.NOMAREA
    FROM VENTAS V
    INNER JOIN DETALLE_PEDIDO DP ON DP.IDPEDIDO = V.IDPEDIDO
    INNER JOIN PRODUCTO PR ON PR.IDPRODUCTO = DP.IDPRODUCTO
    INNER JOIN ZONAS Z ON Z.IDZONA = DP.IDZONA
    WHERE V.IDVENTAS = @idVentas AND DP.ESTADO = 'A'
  `);

  return { cabecera: cabecera.recordset[0], detalle: detalle.recordset };
}

// =====================================================
// REGISTRO DE VENTA (POS)
// Crea PEDIDO + DETALLE_PEDIDO + VENTAS + BOLETA/FACTURA en una transacción.
// =====================================================

async function crearVenta(payload) {
  const {
    idMesa, idZona, idCliente, idMetodoPago, idUsuario,
    documento, items
  } = payload;

  if (!idMesa || !idZona || !idCliente || !idMetodoPago || !idUsuario || !documento) {
    throw new Error('Faltan datos obligatorios para registrar la venta');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El pedido debe tener al menos un producto');
  }
  if (documento !== 'B' && documento !== 'F') {
    throw new Error('Tipo de comprobante inválido (use B o F)');
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Crear PEDIDO (queda 'P' = pendiente hasta que se registre la venta)
    const pedidoResult = await new sql.Request(transaction)
      .input('idMesa', sql.Int, idMesa)
      .query(`
        INSERT INTO PEDIDOS (IDMESA, FECHA, ESTADO)
        OUTPUT INSERTED.IDPEDIDO
        VALUES (@idMesa, GETDATE(), 'P')
      `);
    const idPedido = pedidoResult.recordset[0].IDPEDIDO;

    // 2. Insertar DETALLE_PEDIDO y acumular subtotal
    let subtotal = 0;
    for (const item of items) {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio);
      if (!item.idProducto || cantidad <= 0 || precio < 0) {
        throw new Error('Producto inválido en el detalle del pedido');
      }
      subtotal += cantidad * precio;

      await new sql.Request(transaction)
        .input('idPedido', sql.Int, idPedido)
        .input('idProducto', sql.Int, item.idProducto)
        .input('idZona', sql.Int, idZona)
        .input('idUsuario', sql.Int, idUsuario)
        .input('cantidad', sql.Int, cantidad)
        .input('precio', sql.Decimal(10, 2), precio)
        .query(`
          INSERT INTO DETALLE_PEDIDO (IDPEDIDO, IDPRODUCTO, IDZONA, IDUSUARIO, CANTIDAD, PRECIO, ESTADO)
          VALUES (@idPedido, @idProducto, @idZona, @idUsuario, @cantidad, @precio, 'A')
        `);
    }

    const igv = Math.round(subtotal * 0.18 * 100) / 100;
    const totalPagar = Math.round((subtotal + igv) * 100) / 100;

    // 3. Insertar VENTAS
    const ventaResult = await new sql.Request(transaction)
      .input('idCliente', sql.Int, idCliente)
      .input('idMetodoPago', sql.Int, idMetodoPago)
      .input('idPedido', sql.Int, idPedido)
      .input('idUsuario', sql.Int, idUsuario)
      .input('documento', sql.Char(1), documento)
      .input('montoTotal', sql.Decimal(10, 2), subtotal)
      .input('subtotal', sql.Decimal(10, 2), subtotal)
      .input('igv', sql.Decimal(10, 2), igv)
      .input('totalPagar', sql.Decimal(10, 2), totalPagar)
      .query(`
        INSERT INTO VENTAS
          (IDCLIENTE, IDMETODO_PAGO, IDPEDIDO, IDUSUARIO, FECHAVENTA, DOCUMENTO,
           MONTOTOTAL, DESCUENTO, SUBTOTAL, IGV, TOTALPAGAR, ESTADO)
        OUTPUT INSERTED.IDVENTAS
        VALUES
          (@idCliente, @idMetodoPago, @idPedido, @idUsuario, GETDATE(), @documento,
           @montoTotal, NULL, @subtotal, @igv, @totalPagar, '1')
      `);
    const idVentas = ventaResult.recordset[0].IDVENTAS;

    // 4. Generar comprobante (BOLETA o FACTURA)
    const serie = documento === 'F' ? 'F001' : 'B001';
    const numero = String(idVentas).padStart(8, '0');
    const tabla = documento === 'F' ? 'FACTURA' : 'BOLETA';
    const idCampo = documento === 'F' ? 'IDFACTURA' : 'IDBOLETA';

    await new sql.Request(transaction)
      .input('idVentas', sql.Int, idVentas)
      .input('serie', sql.Char(4), serie)
      .input('numero', sql.Char(8), numero)
      .query(`
        INSERT INTO ${tabla} (IDVENTAS, FECHAEMISION, SERIE, NUMERO, ESTADO)
        OUTPUT INSERTED.${idCampo}
        VALUES (@idVentas, GETDATE(), @serie, @numero, '1')
      `);

    // 5. Cerrar el pedido (ya fue facturado)
    await new sql.Request(transaction)
      .input('idPedido', sql.Int, idPedido)
      .query(`UPDATE PEDIDOS SET ESTADO = 'A' WHERE IDPEDIDO = @idPedido`);

    await transaction.commit();

    return { idVentas, idPedido, documento, serie, numero, subtotal, igv, totalPagar };
  } catch (err) {
    try { await transaction.rollback(); } catch (_) { /* noop */ }
    throw err;
  }
}
// =====================================================
// REPORTE DE VENTAS
// =====================================================

async function reporteVentas(inicio, fin, documento) {
  const pool = await getConnection();
  const request = pool.request();
  let where = "WHERE V.ESTADO = '1'";

  if (inicio) {
    request.input("inicio", sql.Date, inicio);
    where += " AND CONVERT(date,V.FECHAVENTA)>=@inicio";
  }
  if (fin) {
    request.input("fin", sql.Date, fin);
    where += " AND CONVERT(date,V.FECHAVENTA)<=@fin";
  }
  if (documento) {
    request.input("documento", sql.Char(1), documento);
    where += " AND V.DOCUMENTO = @documento";
  }

  const result = await request.query(`
    SELECT
      V.IDVENTAS, V.FECHAVENTA,
      COALESCE(PE.NOMBRES + ' ' + PE.APEPATERNO + ' ' + PE.APEMATERNO, EM.RAZON_SOCIAL) AS CLIENTE,
      MP.NOMMETODO, V.SUBTOTAL, V.IGV, V.TOTALPAGAR, V.DOCUMENTO,
      M.NUMPISO, M.NUNMESA,
      B.SERIE AS SERIE_BOLETA, B.NUMERO AS NUMERO_BOLETA,
      F.SERIE AS SERIE_FACTURA, F.NUMERO AS NUMERO_FACTURA
    FROM VENTAS V
    INNER JOIN CLIENTE C ON C.IDCLIENTE = V.IDCLIENTE
    LEFT JOIN PERSONA PE ON PE.IDPERSONA = C.IDPERSONA
    LEFT JOIN EMPRESA EM ON EM.IDEMPRESA = C.IDEMPRESA
    INNER JOIN METODO_PAGO MP ON MP.IDMETODO_PAGO = V.IDMETODO_PAGO
    INNER JOIN PEDIDOS P ON P.IDPEDIDO = V.IDPEDIDO
    INNER JOIN MESAS M ON M.IDMESA = P.IDMESA
    LEFT JOIN BOLETA B ON B.IDVENTAS = V.IDVENTAS
    LEFT JOIN FACTURA F ON F.IDVENTAS = V.IDVENTAS
    ${where}
    ORDER BY V.FECHAVENTA DESC
  `);
  return result.recordset;
}
module.exports = {
  getMesasDisponibles,
  getZonas,
  getMetodosPago,
  getCategorias,
  getProductos,
  buscarClientes,
  listarVentas,
  obtenerDetalleVenta,
  crearVenta,
  reporteVentas
};