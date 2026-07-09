const ReservaModel = require('../models/reservaModel');

exports.listar = async (req, res) => {
  try {
    const reservas = await ReservaModel.obtenerTodas();
    res.json(reservas);
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({ message: 'Error al listar reservas', detalle: error.message });
  }
};

exports.zonas = async (req, res) => {
  try {
    res.json(await ReservaModel.obtenerZonas());
  } catch (error) {
    res.status(500).json({ message: 'Error al listar zonas', detalle: error.message });
  }
};

exports.mesas = async (req, res) => {
  try {
    res.json(await ReservaModel.obtenerMesas());
  } catch (error) {
    res.status(500).json({ message: 'Error al listar mesas', detalle: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { idCliente, idZona, fechaReserva, cantidadPersonas } = req.body;
    if (!idCliente || !idZona || !fechaReserva || !cantidadPersonas) {
      return res.status(400).json({ message: 'Cliente, zona, fecha y cantidad de personas son obligatorios.' });
    }
    const nueva = await ReservaModel.crear(req.body);
    res.status(201).json({ message: 'Reserva registrada', idReserva: nueva.IDRESERVA });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ message: 'Error al crear reserva', detalle: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    await ReservaModel.actualizar(req.params.id, req.body);
    res.json({ message: 'Reserva actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar reserva', detalle: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['P', 'C', 'A', 'X'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido.' });
    }
    await ReservaModel.cambiarEstado(req.params.id, estado);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado', detalle: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await ReservaModel.eliminar(req.params.id);
    res.json({ message: 'Reserva eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar reserva', detalle: error.message });
  }
};