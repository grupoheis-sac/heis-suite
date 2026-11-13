import { Op } from 'sequelize';
import { Cliente, Venta } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getClientes = async (req, res, next) => {
  try {
    const { busqueda, perfil, con_credito, con_deuda, limit = 200 } = req.query;
    const whereClause = { activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    if (busqueda) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { numero_documento: { [Op.like]: `%${busqueda}%` } },
        { telefono: { [Op.like]: `%${busqueda}%` } },
        { contacto_obra: { [Op.like]: `%${busqueda}%` } },
        { direccion_obra: { [Op.like]: `%${busqueda}%` } },
        { direccion: { [Op.like]: `%${busqueda}%` } },
      ];
    }

    if (perfil === 'CONTRATISTAS') {
      whereClause.perfil_cliente = { [Op.like]: '%Contratista%' };
    } else if (perfil === 'CONSTRUCTORAS') {
      whereClause.perfil_cliente = { [Op.like]: '%Constructora%' };
    } else if (perfil === 'TALLERES') {
      whereClause.perfil_cliente = { [Op.like]: '%Taller%' };
    }

    if (con_credito === 'true') {
      whereClause.limite_credito = { [Op.gt]: 0 };
    }

    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']],
      limit: parseInt(limit, 10),
    });

    // Calcular deuda_total para cada cliente sumando sus ventas a crédito
    const clientesIds = clientes.map((c) => c.id);
    const deudasMap = {};
    if (clientesIds.length > 0) {
      try {
        const ventasCredito = await Venta.findAll({
          where: {
            id_cliente: { [Op.in]: clientesIds },
            tipo_pago: 'Credito',
            estado: { [Op.ne]: 'Anulada' },
          },
          attributes: ['id_cliente', 'total'],
        });
        ventasCredito.forEach((v) => {
          const cid = v.id_cliente;
          deudasMap[cid] = (deudasMap[cid] || 0) + (parseFloat(v.total) || 0);
        });
      } catch (_) {}
    }

    let resultado = clientes.map((c) => {
      const data = c.toJSON();
      data.deuda_total = parseFloat((deudasMap[c.id] || 0).toFixed(2));
      return data;
    });

    if (con_deuda === 'true') {
      resultado = resultado.filter((c) => c.deuda_total > 0);
    }

    res.json({ success: true, clientes: resultado });
  } catch (error) {
    next(error);
  }
};

export const getResumenClientes = async (req, res, next) => {
  try {
    const whereClause = { activo: true };
    if (req.empresa_id) whereClause.empresa_id = req.empresa_id;

    const clientes = await Cliente.findAll({
      where: whereClause,
      attributes: ['id', 'perfil_cliente', 'tipo_precio', 'limite_credito', 'estado_credito'],
    });

    const totalClientes = clientes.length;
    let totalMayoristas = 0;
    let conCredito = 0;
    let totalDeudaGlobal = 0;

    clientes.forEach((c) => {
      if (
        c.tipo_precio === 'Mayorista' ||
        c.tipo_precio === 'Especial Obra' ||
        c.tipo_precio === 'Distribuidor' ||
        (c.perfil_cliente && c.perfil_cliente !== 'Público General' && c.perfil_cliente !== 'Cliente Frecuente')
      ) {
        totalMayoristas++;
      }
      if (parseFloat(c.limite_credito) > 0) {
        conCredito++;
      }
    });

    // Deuda global de ventas a crédito no anuladas
    try {
      const ventasCredito = await Venta.findAll({
        where: {
          ...(req.empresa_id ? { empresa_id: req.empresa_id } : {}),
          tipo_pago: 'Credito',
          estado: { [Op.ne]: 'Anulada' },
        },
        attributes: ['total'],
      });
      ventasCredito.forEach((v) => {
        totalDeudaGlobal += parseFloat(v.total) || 0;
      });
    } catch (_) {}

    res.json({
      success: true,
      metricas: {
        totalClientes,
        totalMayoristas,
        conCredito,
        totalDeudaGlobal: parseFloat(totalDeudaGlobal.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id, activo: true };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const cliente = await Cliente.findOne({
      where,
      include: [{ model: Venta, as: 'ventas', limit: 10, order: [['createdAt', 'DESC']] }],
    });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    res.json({ success: true, cliente });
  } catch (error) {
    next(error);
  }
};

export const getClienteDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id, activo: true };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const cliente = await Cliente.findOne({
      where,
      include: [{ model: Venta, as: 'ventas', limit: 20, order: [['createdAt', 'DESC']] }],
    });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    const data = cliente.toJSON();
    try {
      const ventasCredito = await Venta.findAll({
        where: {
          id_cliente: id,
          tipo_pago: 'Credito',
          estado: { [Op.ne]: 'Anulada' },
        },
        attributes: ['total'],
      });
      data.deuda_total = parseFloat(
        ventasCredito.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0).toFixed(2)
      );
    } catch (_) {
      data.deuda_total = 0;
    }

    res.json({ success: true, cliente: data });
  } catch (error) {
    next(error);
  }
};

export const crearCliente = async (req, res, next) => {
  try {
    const nuevo = await Cliente.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
      activo: true,
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'CREAR_CLIENTE',
      entidad: 'Cliente',
      entidad_id: nuevo.id,
      detalles: { nombre: nuevo.nombre, doc: nuevo.numero_documento },
      req,
    });

    res.status(201).json({ success: true, cliente: nuevo });
  } catch (error) {
    next(error);
  }
};

export const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const cliente = await Cliente.findOne({ where });

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    await cliente.update(req.body);

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ACTUALIZAR_CLIENTE',
      entidad: 'Cliente',
      entidad_id: cliente.id,
      detalles: { nombre: cliente.nombre, doc: cliente.numero_documento },
      req,
    });

    res.json({ success: true, cliente });
  } catch (error) {
    next(error);
  }
};

export const eliminarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const cliente = await Cliente.findOne({ where });
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
    }

    await cliente.update({ activo: false });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ELIMINAR_CLIENTE',
      entidad: 'Cliente',
      entidad_id: id,
      detalles: { nombre: cliente.nombre },
      req,
    });

    res.json({ success: true, message: 'Cliente dado de baja exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getClientes,
  getResumenClientes,
  getClientePorId,
  getClienteDetalle,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};
