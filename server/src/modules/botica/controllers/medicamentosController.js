import { Op, col, where } from 'sequelize';
import { Medicamento, Categoria, Lote, KardexFarmacia } from '../models/index.js';

export const getMedicamentos = async (req, res) => {
  try {
    const { busqueda, id_categoria, stock_bajo, limit = 50, page = 1 } = req.query;
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const parsedPage = Math.max(1, parseInt(page) || 1);
    
    const whereClause = {
      activo: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (busqueda) {
      whereClause[Op.or] = [
        { nombre_comercial: { [Op.like]: `%${busqueda}%` } },
        { nombre_generico: { [Op.like]: `%${busqueda}%` } },
        { codigo_barras: { [Op.like]: `%${busqueda}%` } },
        { laboratorio: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    if (id_categoria) {
      whereClause.id_categoria = id_categoria;
    }

    if (stock_bajo === 'true') {
      whereClause[Op.and] = where(col('stock_cajas'), '<=', col('stock_minimo'));
    }

    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: medicamentos } = await Medicamento.findAndCountAll({
      where: whereClause,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        {
          model: Lote,
          as: 'lotes',
          where: { activo: true, stock_cajas: { [Op.gt]: 0 } },
          required: false,
          order: [['fecha_vencimiento', 'ASC']] // FEFO
        }
      ],
      order: [['nombre_comercial', 'ASC']],
      limit: parsedLimit,
      offset
    });

    res.json({
      success: true,
      data: medicamentos,
      medicamentos,
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit)
    });
  } catch (error) {
    console.error('Error al listar medicamentos:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener medicamentos' });
  }
};

export const getMedicamentoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const med = await Medicamento.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Lote, as: 'lotes', order: [['fecha_vencimiento', 'ASC']] }
      ]
    });

    if (!med) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }

    res.json({ success: true, data: med });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearMedicamento = async (req, res) => {
  try {
    const datos = {
      ...req.body,
      empresa_id: req.empresa_id || 1,
    };

    const nuevo = await Medicamento.create(datos);

    // Si viene con lote inicial
    if (req.body.lote_inicial && req.body.fecha_vencimiento) {
      await Lote.create({
        empresa_id: req.empresa_id || 1,
        id_medicamento: nuevo.id,
        numero_lote: req.body.lote_inicial,
        fecha_vencimiento: req.body.fecha_vencimiento,
        stock_cajas: nuevo.stock_cajas || 0,
        stock_fraccion: nuevo.stock_fraccion || 0,
        costo_compra: nuevo.precio_compra || 0
      });

      // Registrar kardex inicial
      await KardexFarmacia.create({
        empresa_id: req.empresa_id || 1,
        id_medicamento: nuevo.id,
        tipo_movimiento: 'ENTRADA',
        cantidad_cajas: nuevo.stock_cajas || 0,
        saldo_cajas: nuevo.stock_cajas || 0,
        motivo: 'Inventario Inicial',
        referencia_documento: 'APERTURA',
        id_usuario: req.user?.id || 1
      });
    }

    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const actualizarMedicamento = async (req, res) => {
  try {
    const { id } = req.params;
    const med = await Medicamento.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      }
    });

    if (!med) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }

    await med.update(req.body);
    res.json({ success: true, data: med });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const eliminarMedicamento = async (req, res) => {
  try {
    const { id } = req.params;
    const med = await Medicamento.findOne({
      where: {
        id,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      }
    });

    if (!med) {
      return res.status(404).json({ success: false, message: 'Medicamento no encontrado' });
    }

    await med.update({ activo: false });
    res.json({ success: true, message: 'Medicamento desactivado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: {
        activo: true,
        ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
      },
      order: [['nombre', 'ASC']]
    });
    res.json({ success: true, data: categorias, categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const nueva = await Categoria.create({
      ...req.body,
      empresa_id: req.empresa_id || 1,
    });
    res.status(201).json({ success: true, data: nueva, categoria: nueva });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

