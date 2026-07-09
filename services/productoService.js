const productoModel = require("../models/productoModel");

// Obtener todos los productos
const getAllProducts = async () => {

    return await productoModel.getAll();

};

// Obtener producto por ID
const getProductById = async (id) => {

    return await productoModel.getById(id);

};

// Registrar producto
const createProduct = async (producto) => {

    return await productoModel.create(producto);

};

// Actualizar producto
const updateProduct = async (id, producto) => {

    return await productoModel.update(id, producto);

};

// Eliminar producto
const deleteProduct = async (id) => {

    return await productoModel.remove(id);

};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};