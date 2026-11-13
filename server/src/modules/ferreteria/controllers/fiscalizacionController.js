import { Op } from 'sequelize';
import { Producto, Categoria, Proveedor } from '../models/index.js';
import { registrarAuditoria } from '../../../core/middleware/auditoria.middleware.js';

export const getResumenFiscalizacion = async (req, res, next) => {
  try {
    const whereBase = {};
    if (req.empresa_id) whereBase.empresa_id = req.empresa_id;

    const totalCatalogo = await Producto.count({ where: whereBase });

    const productosFiscalizados = await Producto.findAll({
      where: {
        ...whereBase,
        es_fiscalizado: true,
      },
      attributes: ['id', 'tipo_fiscalizacion', 'codigo_iqbf', 'stock'],
    });

    const totalFiscalizados = productosFiscalizados.length;
    let totalSunatIqbf = 0;
    let totalSucamec = 0;
    let conCodigoIqbf = 0;
    let sinCodigoIqbf = 0;
    let conStockDisponible = 0;

    productosFiscalizados.forEach((p) => {
      if (p.tipo_fiscalizacion === 'SUNAT_IQBF') totalSunatIqbf++;
      if (p.tipo_fiscalizacion === 'SUCAMEC') totalSucamec++;

      const tieneCod = p.codigo_iqbf && p.codigo_iqbf.trim().length > 0;
      if (tieneCod) conCodigoIqbf++;
      else sinCodigoIqbf++;

      if (parseFloat(p.stock || 0) > 0) conStockDisponible++;
    });

    const porcentajeCumplimiento =
      totalFiscalizados > 0 ? Math.round((conCodigoIqbf / totalFiscalizados) * 100) : 100;
    const estadoSemaforo = sinCodigoIqbf === 0 ? 'Optimo' : 'Alerta';

    res.json({
      success: true,
      metricas: {
        totalCatalogo,
        totalFiscalizados,
        totalSunatIqbf,
        totalSucamec,
        conCodigoIqbf,
        sinCodigoIqbf,
        conStockDisponible,
        porcentajeCumplimiento,
        estadoSemaforo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductosFiscalizados = async (req, res, next) => {
  try {
    const { busqueda, filtro = 'TODOS' } = req.query;
    const where = {};
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    if (filtro === 'SUNAT_IQBF') {
      where.es_fiscalizado = true;
      where.tipo_fiscalizacion = 'SUNAT_IQBF';
    } else if (filtro === 'SUCAMEC') {
      where.es_fiscalizado = true;
      where.tipo_fiscalizacion = 'SUCAMEC';
    } else if (filtro === 'SIN_CODIGO') {
      where.es_fiscalizado = true;
      where[Op.or] = [{ codigo_iqbf: null }, { codigo_iqbf: '' }];
    } else if (filtro === 'CON_STOCK') {
      where.es_fiscalizado = true;
      where.stock = { [Op.gt]: 0 };
    } else {
      where.es_fiscalizado = true;
    }

    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim();
      where[Op.and] = [
        where[Op.and] || {},
        {
          [Op.or]: [
            { nombre: { [Op.like]: `%${q}%` } },
            { codigo_barras: { [Op.like]: `%${q}%` } },
            { codigo_iqbf: { [Op.like]: `%${q}%` } },
            { marca: { [Op.like]: `%${q}%` } },
            { norma_tecnica: { [Op.like]: `%${q}%` } },
          ],
        },
      ];
    }

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'], required: false },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'ruc'], required: false },
      ],
      order: [['nombre', 'ASC']],
      limit: 200,
    });

    res.json({ success: true, productos });
  } catch (error) {
    next(error);
  }
};

export const actualizarProductoFiscalizado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { es_fiscalizado, tipo_fiscalizacion, codigo_iqbf, norma_tecnica } = req.body;

    const where = { id };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const prod = await Producto.findOne({ where });
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    await prod.update({
      es_fiscalizado: Boolean(es_fiscalizado),
      tipo_fiscalizacion: tipo_fiscalizacion || 'NINGUNO',
      codigo_iqbf: codigo_iqbf || null,
      norma_tecnica: norma_tecnica || null,
    });

    await registrarAuditoria({
      modulo: 'ferreteria',
      accion: 'ACTUALIZAR_CLASIFICACION_FISCAL',
      entidad: 'Producto',
      entidad_id: prod.id,
      detalles: { nombre: prod.nombre, tipo_fiscalizacion, codigo_iqbf },
      req,
    });

    res.json({ success: true, message: 'Clasificación fiscal actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const exportarFiscalizacion = async (req, res, next) => {
  try {
    const { formato = 'txt' } = req.query;
    const where = { es_fiscalizado: true };
    if (req.empresa_id) where.empresa_id = req.empresa_id;

    const productos = await Producto.findAll({
      where,
      order: [['codigo_iqbf', 'ASC'], ['nombre', 'ASC']],
    });

    const fechaHoy = new Date().toISOString().split('T')[0];

    if (formato === 'csv') {
      let csv = 'ID,CODIGO_IQBF,TIPO_FISCALIZACION,PRODUCTO,UNIDAD_MEDIDA,STOCK_ACTUAL,NORMA_TECNICA\n';
      productos.forEach((p) => {
        csv += `"${p.id}","${p.codigo_iqbf || ''}","${p.tipo_fiscalizacion || ''}","${(p.nombre || '').replace(/"/g, '""')}","${p.unidad_medida || 'UND'}","${p.stock}","${(p.norma_tecnica || '').replace(/"/g, '""')}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="LIBRO_BIENES_FISCALIZADOS_SUNAT_${fechaHoy}.csv"`
      );
      return res.send(csv);
    }

    // Formato TXT con separador de plecas "|" según estándar SUNAT IQBF
    let txt = '';
    productos.forEach((p) => {
      const codIqbf = p.codigo_iqbf || '000000';
      const desc = p.nombre || '';
      const uMed = p.unidad_medida || 'NIU';
      const stock = parseFloat(p.stock || 0).toFixed(3);
      txt += `${codIqbf}|${desc}|${uMed}|${stock}|${p.tipo_fiscalizacion || 'SUNAT_IQBF'}|\r\n`;
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="DECLARACION_IQBF_SUNAT_${fechaHoy}.txt"`
    );
    res.send(txt);
  } catch (error) {
    next(error);
  }
};

export default {
  getResumenFiscalizacion,
  getProductosFiscalizados,
  actualizarProductoFiscalizado,
  exportarFiscalizacion,
};

