const sql = require("mssql");

require("dotenv").config();



const dbConfig = {

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    server: process.env.DB_SERVER,

    database: process.env.DB_DATABASE,

    options: {

        encrypt: true, // Cambiado a true: Requisito obligatorio para Azure SQL

        trustServerCertificate: false, // En producción con Azure, es mejor tenerlo en false

        useUTC: false

    }

};



// Variable para guardar la instancia única de la conexión

let pool = null;



const getConnection = async () => {

    try {

        // Si ya existe una conexión, devuélvela

        if (pool) return pool;



        // Si no existe, crea una nueva

        pool = await sql.connect(dbConfig);

        console.log("Conexión a SQL Server en Azure exitosa");

        return pool;

    } catch (error) {

        console.error("Error de conexión a la base de datos:", error);

        throw error;

    }

};



module.exports = { sql, getConnection }; 

