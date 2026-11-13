import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CotizacionDetalle = sequelize.define('CotizacionDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_cotizacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'ferreteria_cotizacion_detalles',
  indexes: [
    { fields: ['id_cotizacion'] },
    { fields: ['id_producto'] },
  ],
});

export default CotizacionDetalle;

