import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const ActaBajaDetalle = sequelize.define('BoticaActaBajaDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_acta_baja: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_medicamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_lote: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  formato: {
    type: DataTypes.ENUM('Caja', 'Fraccion'),
    defaultValue: 'Caja',
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costo_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_perdida: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
}, {
  tableName: 'botica_acta_baja_detalles',
  timestamps: true,
});

export default ActaBajaDetalle;

