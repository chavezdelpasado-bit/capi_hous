const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

router.get('/', reservaController.listar);
router.get('/zonas', reservaController.zonas);
router.get('/mesas', reservaController.mesas);
router.post('/', reservaController.crear);
router.put('/:id', reservaController.actualizar);
router.patch('/:id/estado', reservaController.cambiarEstado);
router.delete('/:id', reservaController.eliminar);

module.exports = router;