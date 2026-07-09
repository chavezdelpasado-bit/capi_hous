// routes/ventaRoutes.js
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Catálogos para el POS (van antes de '/:id' para que no choquen las rutas)
router.get('/mesas', ventaController.getMesas);
router.get('/zonas', ventaController.getZonas);
router.get('/metodos-pago', ventaController.getMetodosPago);
router.get('/categorias', ventaController.getCategorias);
router.get('/productos', ventaController.getProductos);
router.get('/clientes', ventaController.buscarClientes);

// Reporte de ventas (debe ir antes de '/:id')
router.get('/reporte', ventaController.reporteVentas);

// Historial
router.get('/:id', ventaController.obtenerDetalleVenta);
router.get('/', ventaController.listarVentas);

// Registrar venta
router.post('/', ventaController.crearVenta);

module.exports = router;
router.get("/test", (req, res) => {
    res.json({
        ok: true,
        mensaje: "VentaRoutes funcionando"
    });
});
/*
  Recuerda registrar esta ruta en server.js, igual que haces con clienteRoutes:

  const ventaRoutes = require('./routes/ventaRoutes');
  app.use('/api/ventas', ventaRoutes);
*/