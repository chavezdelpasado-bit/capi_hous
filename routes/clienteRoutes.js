const express = require("express");
const router = express.Router();

const ClienteController = require("../controllers/clienteController");

router.get("/", ClienteController.getClientes);
router.post("/", ClienteController.createCliente);

router.put("/:id", ClienteController.updateCliente);

router.patch("/:id/estado", ClienteController.cambiarEstadoCliente);

module.exports = router;