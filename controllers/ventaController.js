// controllers/ventaController.js
const ventaService = require('../services/ventaService');

async function listarVentas(req, res) {
  try {
    const { desde, hasta, documento, idCliente, page, pageSize } = req.query;
    const data = await ventaService.listarVentas({
      desde, hasta, documento, idCliente,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20
    });
    res.json(data);
  } catch (err) {
    console.error('Error al listar ventas:', err);
    res.status(500).json({ mensaje: 'Error al obtener las ventas' });
  }
}

async function obtenerDetalleVenta(req, res) {
  try {
    const { id } = req.params;
    const data = await ventaService.obtenerDetalleVenta(id);
    if (!data.cabecera) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' });
    }
    res.json(data);
  } catch (err) {
    console.error('Error al obtener detalle de venta:', err);
    res.status(500).json({ mensaje: 'Error al obtener el detalle de la venta' });
  }
}

async function getMesas(req, res) {
  try {
    res.json(await ventaService.getMesasDisponibles());
  } catch (err) {
    console.error('Error al obtener mesas:', err);
    res.status(500).json({ mensaje: 'Error al obtener las mesas' });
  }
}

async function getZonas(req, res) {
  try {
    res.json(await ventaService.getZonas());
  } catch (err) {
    console.error('Error al obtener zonas:', err);
    res.status(500).json({ mensaje: 'Error al obtener las zonas' });
  }
}

async function getMetodosPago(req, res) {
  try {
    res.json(await ventaService.getMetodosPago());
  } catch (err) {
    console.error('Error al obtener métodos de pago:', err);
    res.status(500).json({ mensaje: 'Error al obtener los métodos de pago' });
  }
}

async function getCategorias(req, res) {
  try {
    res.json(await ventaService.getCategorias());
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ mensaje: 'Error al obtener las categorías' });
  }
}

async function getProductos(req, res) {
  try {
    const { idCategoria } = req.query;
    res.json(await ventaService.getProductos(idCategoria));
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ mensaje: 'Error al obtener los productos' });
  }
}

async function buscarClientes(req, res) {
  try {
    const { q } = req.query;
    res.json(await ventaService.buscarClientes(q));
  } catch (err) {
    console.error('Error al buscar clientes:', err);
    res.status(500).json({ mensaje: 'Error al buscar clientes' });
  }
}

async function crearVenta(req, res) {
  try {
    // Ajusta esta línea al mecanismo real de auth de tu app
    // (sesión, JWT decodificado en middleware, etc.)
    const idUsuario = req.body.idUsuario || (req.usuario && req.usuario.idUsuario);
    const resultado = await ventaService.crearVenta({ ...req.body, idUsuario });
    res.status(201).json(resultado);
  } catch (err) {
    console.error('Error al registrar venta:', err);
    res.status(400).json({ mensaje: err.message || 'Error al registrar la venta' });
  }
}
async function reporteVentas(req, res) {
  try {
    const { inicio, fin, documento } = req.query; // <-- agregar documento aquí
    const datos = await ventaService.reporteVentas(inicio, fin, documento);
    res.json(datos);
  } catch (err) {
    console.error("Error al generar reporte:", err);
    res.status(500).json({ mensaje: "Error al generar reporte" });
  }
}
module.exports = {
  listarVentas,
  obtenerDetalleVenta,
  getMesas,
  getZonas,
  getMetodosPago,
  getCategorias,
  getProductos,
  buscarClientes,
  crearVenta,
  reporteVentas
};