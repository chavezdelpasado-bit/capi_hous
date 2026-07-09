const EmpleadoModel = require('../models/empleadoModel');

exports.listar = async (req, res) => {
  try {
    res.json(await EmpleadoModel.obtenerTodos());
  } catch (error) {
    console.error('Error al listar empleados:', error);
    res.status(500).json({ message: 'Error al listar empleados', detalle: error.message });
  }
};

exports.cargos = async (req, res) => {
  try {
    res.json(await EmpleadoModel.obtenerCargos());
  } catch (error) {
    res.status(500).json({ message: 'Error al listar cargos', detalle: error.message });
  }
};

exports.contratos = async (req, res) => {
  try {
    res.json(await EmpleadoModel.obtenerContratos());
  } catch (error) {
    res.status(500).json({ message: 'Error al listar contratos', detalle: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { dni, nombres, apePaterno, apeMaterno, idCargo, idContrato, salario } = req.body;
    if (!dni || !nombres || !apePaterno || !apeMaterno || !idCargo || !idContrato || !salario) {
      return res.status(400).json({ message: 'DNI, nombres, apellidos, cargo, contrato y salario son obligatorios.' });
    }
    const nuevo = await EmpleadoModel.crear(req.body);
    res.status(201).json({ message: 'Empleado registrado', idEmpleado: nuevo.IDEMPLEADO });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    if (error.number === 2627) { // violación de índice único (DNI duplicado)
      return res.status(409).json({ message: 'Ya existe una persona registrada con ese DNI.' });
    }
    res.status(500).json({ message: 'Error al crear empleado', detalle: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    await EmpleadoModel.actualizar(req.params.id, req.body);
    res.json({ message: 'Empleado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar empleado', detalle: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['A', 'I'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido.' });
    }
    await EmpleadoModel.cambiarEstado(req.params.id, estado);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar estado', detalle: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await EmpleadoModel.eliminar(req.params.id);
    res.json({ message: 'Empleado desactivado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar empleado', detalle: error.message });
  }
};