const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

router.get('/reniec/:dni', externalController.consultarDni);
router.get('/sunat/:ruc', externalController.consultarRuc);

module.exports = router;