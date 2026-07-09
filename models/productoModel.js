const { sql, getConnection } = require("../config/db");

// Obtener todos los productos
const getAll = async () => {

    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT
            IDPRODUCTO,
            IDCATEGORIA,
            NOMPRODUCTO,
            DESCRIPCION,
            PRECIO,
            MARCA,
            ESTADO,
            STOCK,
            STOCK_MINIMO
        FROM PRODUCTO
        ORDER BY IDPRODUCTO DESC
    `);

    return result.recordset;

};

// Obtener producto por ID
const getById = async (id) => {

    const pool = await getConnection();

    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT *
            FROM PRODUCTO
            WHERE IDPRODUCTO = @id
        `);

    return result.recordset[0];

};

// Registrar producto
const create = async (producto) => {

    const pool = await getConnection();

    await pool.request()

        .input("idcategoria", sql.Int, producto.idcategoria)
        .input("nombre", sql.VarChar, producto.nombre)
        .input("descripcion", sql.VarChar, producto.descripcion)
        .input("precio", sql.Decimal(10,2), producto.precio)
        .input("marca", sql.VarChar, producto.marca)
        .input("estado", sql.Char, producto.estado)
        .input("stock", sql.Int, producto.stock)
        .input("stockMinimo", sql.Int, producto.stockMinimo)

        .query(`
            INSERT INTO PRODUCTO
            (
                IDCATEGORIA,
                NOMPRODUCTO,
                DESCRIPCION,
                PRECIO,
                MARCA,
                ESTADO,
                STOCK,
                STOCK_MINIMO
            )
            VALUES
            (
                @idcategoria,
                @nombre,
                @descripcion,
                @precio,
                @marca,
                @estado,
                @stock,
                @stockMinimo
            )
        `);

    return true;

};

// Actualizar producto
const update = async (id, producto) => {

    const pool = await getConnection();

    await pool.request()

        .input("id", sql.Int, id)
        .input("idcategoria", sql.Int, producto.idcategoria)
        .input("nombre", sql.VarChar, producto.nombre)
        .input("descripcion", sql.VarChar, producto.descripcion)
        .input("precio", sql.Decimal(10,2), producto.precio)
        .input("marca", sql.VarChar, producto.marca)
        .input("estado", sql.Char, producto.estado)
        .input("stock", sql.Int, producto.stock)
        .input("stockMinimo", sql.Int, producto.stockMinimo)

        .query(`
            UPDATE PRODUCTO
            SET
                IDCATEGORIA = @idcategoria,
                NOMPRODUCTO = @nombre,
                DESCRIPCION = @descripcion,
                PRECIO = @precio,
                MARCA = @marca,
                ESTADO = @estado,
                STOCK = @stock,
                STOCK_MINIMO = @stockMinimo
            WHERE IDPRODUCTO = @id
        `);

    return true;

};

// Eliminar producto
const remove = async (id) => {

    const pool = await getConnection();

    await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE FROM PRODUCTO
            WHERE IDPRODUCTO = @id
        `);

    return true;

};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};