import { Medicamento } from '../models/index.js';

export const getCatalogoDigemid = async (req, res) => {
  try {
    const { busqueda } = req.query;
    // Retornar medicamentos registrados en botica con formato DIGEMID
    const whereClause = {
      activo: true,
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    const meds = await Medicamento.findAll({
      where: whereClause,
      attributes: [
        'id',
        'codigo_digemid',
        'registro_sanitario',
        'nombre_comercial',
        'nombre_generico',
        'concentracion',
        'presentacion',
        'laboratorio',
        'precio_venta',
        'precio_fraccion'
      ],
      order: [['nombre_comercial', 'ASC']]
    });

    res.json({
      success: true,
      data: meds,
      total: meds.length,
      fuente: 'Observatorio DIGEMID / MINSA - Catálogo Interno Sincronizado'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

