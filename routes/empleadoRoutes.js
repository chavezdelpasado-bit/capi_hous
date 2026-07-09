const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

router.get('/', empleadoController.listar);
router.get('/cargos', empleadoController.cargos);
router.get('/contratos', empleadoController.contratos);
router.post('/', empleadoController.crear);
router.put('/:id', empleadoController.actualizar);
router.patch('/:id/estado', empleadoController.cambiarEstado);
router.delete('/:id', empleadoController.eliminar);

module.exports = router;