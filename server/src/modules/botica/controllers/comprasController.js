import { Compra, CompraDetalle, Proveedor, Medicamento, Lote, KardexFarmacia } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: {
        activo: true,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      order: [['razon_social', 'ASC']]
    });
    res.json({ success: true, data: proveedores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearProveedor = async (req, res) => {
  try {
    const nuevo = await Proveedor.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
    });
    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompras = async (req, res) => {
  try {
    const compras = await Compra.findAll({
      where: {
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
        {
          model: CompraDetalle,
          as: 'detalles',
          include: [{ model: Medicamento, as: 'medicamento' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });
    res.json({ success: true, data: compras });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearCompra = async (req, res) => {
  try {
    const { id_proveedor, serie, numero, tipo_comprobante, subtotal, igv, total, items = [] } = req.body;
    const empresaId = req.empresa_id || 1;

    const compra = await Compra.create({
      empresa_id: empresaId,
      id_sucursal: req.sucursal_id || 1,
      id_proveedor,
      id_usuario: req.user?.id || 1,
      serie,
      numero,
      tipo_comprobante: tipo_comprobante || 'Factura',
      fecha: new Date(),
      subtotal: parseFloat(subtotal) || 0,
      igv: parseFloat(igv) || 0,
      total: parseFloat(total) || 0,
      estado: 'Registrada'
    });

    for (const item of items) {
      const cant = parseFloat(item.cantidad);
      const precio = parseFloat(item.precio_unitario);
      await CompraDetalle.create({
        empresa_id: empresaId,
        id_compra: compra.id,
        id_medicamento: item.id_medicamento,
        numero_lote: item.numero_lote || null,
        fecha_vencimiento: item.fecha_vencimiento || null,
        cantidad: cant,
        precio_unitario: precio,
        subtotal: cant * precio
      });

      // Actualizar stock de medicamento
      const med = await Medicamento.findByPk(item.id_medicamento);
      if (med) {
        const nuevoStock = parseFloat(med.stock_cajas) + cant;
        await med.update({
          stock_cajas: nuevoStock,
          precio_compra: precio
        });

        // Registrar lote si viene
        let loteId = null;
        if (item.numero_lote && item.fecha_vencimiento) {
          const lote = await Lote.create({
            empresa_id: empresaId,
            id_medicamento: item.id_medicamento,
            numero_lote: item.numero_lote,
            fecha_vencimiento: item.fecha_vencimiento,
            stock_cajas: cant,
            costo_compra: precio
          });
          loteId = lote.id;
        }

        await KardexFarmacia.create({
          empresa_id: empresaId,
          id_medicamento: item.id_medicamento,
          id_lote: loteId,
          tipo_movimiento: 'ENTRADA',
          cantidad_cajas: cant,
          saldo_cajas: nuevoStock,
          motivo: `Compra ${serie}-${numero}`,
          referencia_documento: `${serie}-${numero}`,
          id_usuario: req.user?.id || 1
        });
      }
    }

    res.status(201).json({ success: true, data: compra, message: 'Compra registrada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

