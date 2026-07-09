const express = require("express");

const router = express.Router();

const productoController = require("../controllers/productoController");

// Obtener todos los productos
router.get("/", productoController.getAllProducts);

// Obtener un producto por ID
router.get("/:id", productoController.getProductById);

// Registrar producto
router.post("/", productoController.createProduct);

// Actualizar producto
router.put("/:id", productoController.updateProduct);

// Eliminar producto
router.delete("/:id", productoController.deleteProduct);

module.exports = router;