const productoService = require("../services/productoService");

// Obtener todos los productos
const getAllProducts = async (req, res) => {

    try {

        const productos = await productoService.getAllProducts();

        res.status(200).json(productos);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener los productos"
        });

    }

};

// Obtener producto por ID
const getProductById = async (req, res) => {

    try {

        const { id } = req.params;

        const producto = await productoService.getProductById(id);

        if (!producto) {

            return res.status(404).json({
                message: "Producto no encontrado"
            });

        }

        res.json(producto);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al obtener el producto"
        });

    }

};

// Registrar producto
const createProduct = async (req, res) => {

    try {

        await productoService.createProduct(req.body);

        res.status(201).json({
            message: "Producto registrado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al registrar el producto"
        });

    }

};

// Actualizar producto
const updateProduct = async (req, res) => {

    try {

        const { id } = req.params;

        await productoService.updateProduct(id, req.body);

        res.json({
            message: "Producto actualizado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al actualizar el producto"
        });

    }

};

// Eliminar producto
const deleteProduct = async (req, res) => {

    try {

        const { id } = req.params;

        await productoService.deleteProduct(id);

        res.json({
            message: "Producto eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error al eliminar el producto"
        });

    }

};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};