const express = require("express");

const cors = require("cors");

const dotenv = require("dotenv");

const path = require("path");



dotenv.config();



// Importamos la función de conexión correcta

const { getConnection } = require("./config/db");



const app = express();



// ======================

// Middlewares

// ======================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));



// Archivos públicos

app.use(express.static(path.join(__dirname, "public")));



// ======================

// Rutas API

// ======================

const authRoutes = require("./routes/authRoutes");

const productoRoutes = require("./routes/productoRoutes");

const clienteRoutes = require("./routes/clienteRoutes");

const externalRoutes = require('./routes/externalRoutes');

const ventaRoutes = require('./routes/ventaRoutes');

const reservaRoutes = require('./routes/reservaRoutes');

const empleadoRoutes = require('./routes/empleadoRoutes');



app.use('/api/empleados', empleadoRoutes);

app.use('/api/reservas', reservaRoutes);

app.use('/api/ventas', ventaRoutes);

app.use('/api', externalRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/productos", productoRoutes);

app.use("/api/clientes", clienteRoutes);



// ======================

// Vistas

// ======================

app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "views", "index.html"));

});



app.get("/dashboard", (req, res) => {

    res.sendFile(path.join(__dirname, "views", "dashboard.html"));

});



app.get("/modules/:archivo", (req, res) => {

    res.sendFile(path.join(__dirname, "views", "modules", req.params.archivo));

});



app.get("/test-servidor", (req, res) => {

    res.json({ ok: true, mensaje: "Servidor correcto" });

});



// ======================

// Inicio del Servidor

// ======================

const PORT = process.env.PORT || 3000;



const iniciarServidor = async () => {

    try {

        // Probamos la conexión antes de levantar el servidor

        await getConnection(); 

        

        app.listen(PORT, () => {

            console.log(`Servidor corriendo en el puerto ${PORT}`);

        });

    } catch (error) {

        console.error("Error al iniciar el servidor: no se pudo conectar a la DB");

        process.exit(1); // Cerramos si no hay DB

    }

};



iniciarServidor();