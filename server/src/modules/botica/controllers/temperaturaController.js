import { Op } from 'sequelize';
import { RegistroTemperatura } from '../models/index.js';
import { Usuario } from '../../../core/models/index.js';

export const getRegistros = async (req, res) => {
  try {
    const { mes, anio, fecha } = req.query;
    const whereClause = {
      ...(req.empresa_id ? { empresa_id: req.empresa_id } : {})
    };

    if (fecha) {
      whereClause.fecha = fecha;
    } else if (mes && anio) {
      const start = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const end = `${anio}-${String(mes).padStart(2, '0')}-31`;
      whereClause.fecha = { [Op.between]: [start, end] };
    }

    const registros = await RegistroTemperatura.findAll({
      where: whereClause,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['fecha', 'DESC'], ['turno', 'ASC']]
    });

    res.json({ success: true, data: registros });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const crearRegistro = async (req, res) => {
  try {
    const {
      fecha,
      turno,
      hora,
      temp_ambiente,
      humedad_relativa,
      temp_refrigeracion,
      observaciones
    } = req.body;

    const tempNum = parseFloat(temp_ambiente);
    const humNum = parseFloat(humedad_relativa);
    const alerta_generada = tempNum > 25.0 || humNum > 65.0 || (temp_refrigeracion && (parseFloat(temp_refrigeracion) < 2.0 || parseFloat(temp_refrigeracion) > 8.0));

    const nuevo = await RegistroTemperatura.create({
      empresa_id: req.empresa_id || 1,
      id_sucursal: req.sucursal_id || 1,
      id_usuario: req.user?.id || 1,
      fecha: fecha || new Date().toISOString().split('T')[0],
      turno: turno || 'Mañana',
      hora: hora || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      temp_ambiente: tempNum,
      humedad_relativa: humNum,
      temp_refrigeracion: temp_refrigeracion ? parseFloat(temp_refrigeracion) : null,
      alerta_generada,
      observaciones
    });

    res.status(201).json({ success: true, data: nuevo, message: 'Registro de temperatura guardado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

