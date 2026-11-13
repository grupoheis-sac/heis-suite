import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const ActaBaja = sequelize.define('BoticaActaBaja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  numero_acta: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.ENUM('Vencimiento', 'Deterioro', 'Rotura', 'Observacion_Sanitaria', 'Otro'),
    defaultValue: 'Vencimiento',
  },
  id_usuario_qf: {
    type: DataTypes.INTEGER,
    allowNull: true, // Químico Farmacéutico responsable
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('Borrador', 'Aprobada', 'Destruido'),
    defaultValue: 'Aprobada',
  },
}, {
  tableName: 'botica_actas_bajas',
  timestamps: true,
});

export default ActaBaja;

