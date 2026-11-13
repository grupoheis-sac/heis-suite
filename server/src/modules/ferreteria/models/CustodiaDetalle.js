import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CustodiaDetalle = sequelize.define('CustodiaDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_custodia: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  cantidad_entregada: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  cantidad_pendiente: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  unidad_medida: {
    type: DataTypes.STRING(50),
    defaultValue: 'Unidad',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ferreteria_custodia_detalles',
  indexes: [
    { fields: ['id_custodia'] },
    { fields: ['id_producto'] },
  ],
});

export default CustodiaDetalle;

